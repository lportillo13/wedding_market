// Run only in the isolated EAS macOS simulator build; no review credentials are required.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const output = path.resolve('native-store-screenshots');
fs.mkdirSync(output, {recursive: true});
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function run(command, args, timeout = 180000) {
  const result = spawnSync(command, args, {encoding: 'utf8', timeout, maxBuffer: 4 * 1024 * 1024});
  if (result.status !== 0) {
    const message = String(result.stderr || result.stdout || result.error?.message || 'Capture command failed');
    throw Error(message.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[redacted token]').slice(-5000));
  }
  return result.stdout;
}
function findApps(folder) {
  return fs.readdirSync(folder, {withFileTypes: true}).flatMap(entry => {
    if (!entry.isDirectory()) return [];
    const file = path.join(folder, entry.name);
    return entry.name.endsWith('.app') ? [file] : findApps(file);
  });
}
function findPngs(folder) {
  return fs.readdirSync(folder, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? findPngs(file) : entry.name.endsWith('.png') ? [file] : [];
  });
}
const provenance = {
  startedAt: new Date().toISOString(),
  buildId: process.env.EAS_BUILD_ID,
  sourceCommit: process.env.EAS_BUILD_GIT_COMMIT_HASH,
  bundleIdentifier: 'com.theweddingmarket.app',
  nativeSimulatorCaptures: true,
  productionBackend: 'https://thewedmarket.com',
  signedProductionCandidateSource: '803b7a67b7b0e928e6f72a10e36a3f1219732e9a',
  realCustomerData: false,
  reviewerCredentialsIncluded: false,
  applicationDataWritten: false,
  pushDeliveryVerified: false,
  devices: [],
  captures: [],
  passed: false,
};
function save() { fs.writeFileSync(path.join(output, 'provenance.json'), JSON.stringify(provenance, null, 2) + '\n'); }
async function main() {
  if (process.platform !== 'darwin' || process.env.EAS_BUILD_PLATFORM !== 'ios') throw Error('Use the isolated EAS iOS capture profile.');
  const products = 'ios/build/Build/Products';
  const apps = fs.readdirSync(products).filter(name => name.endsWith('simulator')).flatMap(name => findApps(path.join(products, name)));
  if (apps.length !== 1) throw Error('Expected exactly one simulator app.');
  const app = path.resolve(apps[0]);
  const plist = key => run('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, path.join(app, 'Info.plist')]).trim();
  if (plist('CFBundleIdentifier') !== provenance.bundleIdentifier || plist('DTPlatformName') !== 'iphonesimulator') throw Error('Unexpected simulator application identity.');
  provenance.version = plist('CFBundleShortVersionString');
  provenance.buildNumber = plist('CFBundleVersion');
  const bundle = path.join(app, 'main.jsbundle');
  if (fs.existsSync(bundle)) provenance.javascriptBundleSha256 = hash(bundle);
  const devices = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'available', '--json']));
  const available = Object.entries(devices.devices).flatMap(([runtime, items]) => items.map(device => ({...device, runtime})));
  let iphone = available.find(device => device.name === 'iPhone 16 Pro Max');
  let ipad = available.filter(device => /iPad Pro.*13-inch/.test(device.name)).sort((a, b) => b.name.localeCompare(a.name, undefined, {numeric: true}))[0];
  if (!iphone || !ipad) {
    const types = JSON.parse(run('xcrun', ['simctl', 'list', 'devicetypes', '--json'])).devicetypes;
    const runtime = available.find(device => /iPhone/.test(device.name))?.runtime;
    function create(kind, type) {
      if (!type || !runtime) return null;
      return {name: type.name, runtime, udid: run('xcrun', ['simctl', 'create', `WM Store ${kind}`, type.identifier, runtime]).trim(), state: 'Shutdown'};
    }
    iphone ||= create('iPhone', types.find(type => type.name === 'iPhone 16 Pro Max'));
    ipad ||= create('iPad', types.filter(type => /iPad Pro.*13-inch/.test(type.name)).sort((a, b) => b.name.localeCompare(a.name, undefined, {numeric: true}))[0]);
  }
  if (!iphone || !ipad) throw Error('The required 6.9-inch iPhone and 13-inch iPad simulators are unavailable.');
  provenance.maestroVersion = run(path.join(process.env.HOME, '.maestro/bin/maestro'), ['--version']).trim();
  for (const [kind, device] of [['iphone', iphone], ['ipad', ipad]]) {
    let booted = false;
    try {
      if (device.state !== 'Booted') run('xcrun', ['simctl', 'boot', device.udid]);
      booted = true;
      run('xcrun', ['simctl', 'bootstatus', device.udid, '-b'], 240000);
      run('xcrun', ['simctl', 'status_bar', device.udid, 'override', '--time', '9:41', '--batteryState', 'charged', '--batteryLevel', '100']);
      run('xcrun', ['simctl', 'install', device.udid, app]);
      run(path.join(process.env.HOME, '.maestro/bin/maestro'), ['--device', device.udid, 'test', '--test-output-dir', path.join(output, kind), '-e', `CAPTURE_PREFIX=${kind}`, 'e2e/store-capture.yml'], 240000);
      const captures = findPngs(path.join(output, kind));
      for (const language of ['en', 'es']) for (const screen of ['home', 'categories']) {
        const name = `${kind}-${language}-${screen}.png`;
        const matches = captures.filter(file => path.basename(file) === name);
        if (matches.length !== 1) throw Error(`Missing or ambiguous native capture ${name}.`);
        const destination = path.join(output, name);
        fs.copyFileSync(matches[0], destination);
        const bytes = fs.readFileSync(destination);
        const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
        const expected = kind === 'iphone' ? [1320, 2868] : [2064, 2752];
        if (width !== expected[0] || height !== expected[1]) throw Error(`Unexpected native resolution for ${name}.`);
        provenance.captures.push({file: name, kind, language, screen, width, height, bytes: bytes.length, sha256: hash(destination)});
      }
      provenance.devices.push({kind, name: device.name, runtime: device.runtime, spanishPreferenceSurvivedColdStart: true});
      save();
    } catch (error) {
      provenance.failedDevice = {kind, name: device.name, runtime: device.runtime};
      try { run('xcrun', ['simctl', 'io', device.udid, 'screenshot', path.join(output, `${kind}-failure.png`)], 30000); } catch {}
      try {
        const hierarchy = run(path.join(process.env.HOME, '.maestro/bin/maestro'), ['--device', device.udid, 'hierarchy'], 30000);
        fs.writeFileSync(path.join(output, `${kind}-hierarchy.json`), hierarchy);
      } catch {}
      save();
      throw error;
    } finally {
      if (booted) run('xcrun', ['simctl', 'shutdown', device.udid]);
    }
  }
  provenance.completedAt = new Date().toISOString();
  provenance.passed = provenance.captures.length === 8;
  save();
  console.log(JSON.stringify({passed: provenance.passed, nativeCaptures: provenance.captures.length, devices: provenance.devices}));
}
main().catch(error => { provenance.error = error.message; save(); console.error(error.message); process.exitCode = 1; });
