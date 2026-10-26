// Offline preparation audit. Never signs, builds, uploads, or submits an app.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const mobile = path.join(root, 'mobile');
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));

export async function inspectPng(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let visible = 0, white = true, transparent = false, clearPixels = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] < 255) transparent = true;
    if (!data[offset + 3]) { clearPixels++; continue; }
    visible++;
    if (data[offset] !== 255 || data[offset + 1] !== 255 || data[offset + 2] !== 255) white = false;
  }
  return { width: info.width, height: info.height, transparent, clearPixels, visible, white };
}

export function listingErrors(listing) {
  const errors = [];
  for (const locale of ['en', 'es']) {
    const copy = listing.locales?.[locale];
    if (!copy) { errors.push(`Missing ${locale} listing`); continue; }
    for (const [field, max] of Object.entries({ name: 30, subtitle: 30, shortDescription: 80, description: 4000, keywords: 100 })) {
      const value = copy[field];
      if (typeof value !== 'string' || !value.trim() || [...value].length > max) errors.push(`${locale}.${field} must contain 1–${max} characters`);
    }
  }
  return errors;
}

export async function auditLaunch() {
  const [app, eas, pkg, lock, listing] = await Promise.all([
    readJson(path.join(mobile, 'app.json')), readJson(path.join(mobile, 'eas.json')),
    readJson(path.join(mobile, 'package.json')), readJson(path.join(mobile, 'package-lock.json')),
    readJson(path.join(mobile, 'store/listing.json')),
  ]);
  const config = app.expo;
  const checks = [];
  const check = (id, pass, detail) => checks.push({ id, status: pass ? 'pass' : 'blocked', detail });
  const pending = (id, detail) => checks.push({ id, status: 'verification-required', detail });
  check('app-identity', config.name === listing.appName && config.ios.bundleIdentifier === listing.bundleIdentifier && config.android.package === listing.bundleIdentifier,
    'Native name and permanent identifiers must match the listing.');
  check('version-consistency', config.version === pkg.version && pkg.version === lock.version && pkg.version === lock.packages[''].version,
    `Current source version ${pkg.version}; choose the public launch version before signing.`);
  check('store-build-profile', eas.build.production.distribution === 'store' && eas.build.production.android.buildType === 'app-bundle' && eas.build.production.ios.simulator === false && eas.build.production.autoIncrement === true && eas.build.production.environment === 'production',
    'Production selects a store AAB / device IPA, remote build numbering and the production environment.');
  check('android-submit-default', eas.submit.production.android.track === 'internal' && eas.submit.production.android.releaseStatus === 'draft',
    'The default Android submit target must remain internal/draft.');
  check('ios-languages', ['en', 'es'].every(locale => config.ios.infoPlist?.CFBundleLocalizations?.includes(locale)),
    'English and Spanish must be declared for Apple.');
  check('microphone-blocked', config.android.blockedPermissions?.includes('android.permission.RECORD_AUDIO'),
    'The current image-only upload flow does not need an Android microphone permission. Verify the merged native manifest separately.');
  const copyErrors = listingErrors(listing);
  check('listing-copy-lengths', !copyErrors.length, copyErrors.length ? copyErrors.join('; ') : 'EN/ES draft names, subtitles, short/full descriptions and keywords fit store field limits.');
  check('support-destination', Boolean(listing.supportUrl && listing.supportEmail),
    'An owned support page and a monitored email address still need confirmation. /support returned 404 on October 26.');
  check('brand-selected', listing.brandApproved === true, 'Concept boards are drafts; finalize the identity and production assets before marking this approved.');

  async function inspect(file) {
    if (!file) return null;
    try { return await inspectPng(path.join(mobile, file)); } catch { return null; }
  }
  const notification = config.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-notifications')?.[1];
  const splash = config.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen')?.[1];
  const [icon, foreground, monochrome, notificationIcon] = await Promise.all([
    inspect(config.icon), inspect(config.android.adaptiveIcon?.foregroundImage),
    inspect(config.android.adaptiveIcon?.monochromeImage), inspect(notification?.icon),
  ]);
  check('app-icon-master', icon?.width === 1024 && icon?.height === 1024 && !icon?.transparent,
    { file: config.icon, measured: icon, requirement: 'A 1024×1024 opaque PNG master for the iOS/default icon; no baked rounded corners.' });
  check('adaptive-foreground', Boolean(foreground?.clearPixels && foreground?.visible && config.android.adaptiveIcon.foregroundImage !== config.icon),
    { file: config.android.adaptiveIcon?.foregroundImage, requirement: 'Separate transparent foreground; verify safe-area cropping with launcher masks.' });
  check('themed-icon', Boolean(monochrome?.clearPixels && monochrome?.visible),
    'Prepare a dedicated monochrome adaptive-icon layer for themed Android launchers. This is a brand quality gate.');
  check('notification-icon', notificationIcon?.width === 96 && notificationIcon?.height === 96 && notificationIcon?.clearPixels > 0 && notificationIcon?.white && notificationIcon?.visible > 0,
    { file: notification?.icon, measured: notificationIcon, requirement: '96×96 visible all-white symbol on genuine transparency, not the colored launcher icon.' });
  check('splash-asset', Boolean(splash?.image && splash.image !== config.icon),
    'Prepare a separate transparent splash mark; inspect a preview/production binary rather than Expo Go.');
  let archivePolicy = '';
  try { archivePolicy = await fs.readFile(path.join(root, '.easignore'), 'utf8'); } catch { /* Report a missing policy. */ }
  check('archive-policy', archivePolicy.includes('\n*\n') && archivePolicy.includes('!shared/**') && archivePolicy.includes('!mobile/src/**') && archivePolicy.includes('**/.env*') && archivePolicy.includes('**/*.p12'),
    'A source allowlist covers mobile and its sibling shared rules; actual EAS archive inspection is still required.');

  for (const [id, detail] of [
    ['publisher-and-business-model', 'Confirm legal publisher, support contact, vendor fees/access, service payments and any paid digital promotions. Do not copy DW declarations.'],
    ['self-service-deletion', 'Current account controls open an email-only request page. Implement and test authenticated account/data deletion with retention handling.'],
    ['user-content-safeguards', 'Implement and test content reporting, abusive-user blocking, filtering/moderation and support handling. Inbox archive/delete does not block users.'],
    ['production-environment', 'Verify EAS production public values against the Wedding Market Supabase project and HTTPS website. No environment secrets are read by this audit.'],
    ['native-permissions-and-privacy', 'Inspect AAB/IPA permissions, SDK privacy manifests, backup/session storage, consent, media handling and the final privacy declarations.'],
    ['dependency-advisories', 'October 26 npm audit reports five high-severity package findings from two underlying node-forge/Zod advisories through Expo tooling. Review current exposure/remediation before signing; do not force-downgrade Expo to SDK 44.'],
    ['push-credentials-and-delivery', 'Verify this app’s FCM/APNs configuration, token ownership/logout, notification icon in the binary, and real-device foreground/background/terminated delivery.'],
    ['source-archive-proof', 'Inspect the EAS archive for both platforms: include shared rules, exclude the web/server repository, secrets, reviewer credentials and signing keys; retain file hashes.'],
    ['signed-binary-proof', 'Verify signing identity, package/version, Android API 36+ and 16 KB native-library compatibility, iOS 26+ SDK, size and absence of privileged credentials.'],
    ['physical-device-acceptance', 'Test Android, iPhone and supported iPad, both roles/languages, auth callbacks/recovery, independent bookings, uploads, accessibility and slow/offline recovery with isolated records.'],
    ['screenshots-and-store-forms', 'Capture final native screens with fictional data. Complete privacy, age/content rating, app access, audience, countries and trader declarations in each console.'],
    ['store-records-and-testing', 'Verify Wedding Market app records, credentials, name availability and any account-specific closed-testing requirements. No store-console state was checked here.'],
  ]) pending(id, detail);

  const counts = Object.fromEntries(['pass', 'blocked', 'verification-required'].map(status => [status, checks.filter(item => item.status === status).length]));
  let sourceCommit = null;
  try { sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true }).trim(); } catch { /* A source archive may not contain Git. */ }
  const fingerprint = createHash('sha256').update(JSON.stringify({ app, eas, pkg, listing })).digest('hex');
  return { schemaVersion: 1, checkedAt: new Date().toISOString(), sourceCommit, configurationFingerprint: fingerprint,
    version: pkg.version, readyForSubmission: false, scope: 'Offline configuration/asset audit; no signing, native build, external-account verification, upload or publication.',
    counts, checks };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const unknown = process.argv.slice(2).filter(value => value !== '--strict');
  if (unknown.length) throw new Error(`Unknown arguments: ${unknown.join(', ')}`);
  const report = await auditLaunch();
  const output = path.join(root, '.cache/mobile-launch/readiness.json');
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ version: report.version, readyForSubmission: false, ...report.counts, report: '.cache/mobile-launch/readiness.json' }, null, 2));
  if (process.argv.includes('--strict') && (report.counts.blocked || report.counts['verification-required'])) process.exitCode = 1;
}
