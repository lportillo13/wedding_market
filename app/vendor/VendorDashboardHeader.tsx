"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import HeaderIcon, {type HeaderIconName} from '@/components/HeaderIcon';
import { useVendorWorkspace } from './VendorWorkspaceContext';
import { isVendorProfileSection, vendorBusinessGroup, vendorStudioCopy, vendorWorkspaceArea, type VendorProfileSection } from './workspace-navigation';

export default function VendorDashboardHeader() {
  const pathname = usePathname() ?? '/vendor';
  const {language} = useLanguage();
  const labels = vendorStudioCopy[language];
  const {summary, activeSection, chooseSection, dirtySections} = useVendorWorkspace();
  const area = vendorWorkspaceArea(pathname, activeSection);
  const group = vendorBusinessGroup(activeSection);
  const sectionLink = (id: VendorProfileSection, label: string, current = activeSection === id) => <Link
    key={id} href={`/vendor/profile#${id}`} prefetch={false} data-studio-section={id} aria-current={area === 'business' && current ? 'page' : undefined}
    className={current && pathname === '/vendor/profile' ? 'is-current' : undefined}
    onClick={event => { if (pathname === '/vendor/profile') { event.preventDefault(); chooseSection(id); } }}
  >{label}{Object.entries(dirtySections).some(([key,dirty]) => dirty && vendorBusinessGroup(key as VendorProfileSection) === vendorBusinessGroup(id)) && <span className="wm-studio-dirty" aria-label={labels.changes} />}</Link>;
  const primaryLink = (href: string, label: string, icon: HeaderIconName, current: boolean, section?: VendorProfileSection) => <Link href={href} prefetch={false} data-studio-section={section} className={`wm-studio-primary${current ? ' is-current' : ''}`} aria-current={current ? 'page' : undefined}
    onClick={event => {if (pathname === '/vendor/profile' && section) {event.preventDefault(); chooseSection(section);}}}>
    <HeaderIcon name={icon}/><span>{label}</span>
  </Link>;
  return <aside className="wm-studio-sidebar">
    <div className="wm-studio-identity"><span aria-hidden="true">{(summary.businessName || 'W').slice(0,1)}</span><div><strong>{summary.businessName || labels.studio}</strong><small>Wedding Market</small></div></div>
    <nav aria-label={labels.navigation}>
      {primaryLink('/vendor', labels.home, 'grid', area === 'home')}
      {primaryLink('/vendor/inbox', labels.inbox, 'inbox', area === 'inbox')}
      {primaryLink('/vendor/profile#details', labels.business, 'user', area === 'business', 'details')}
      <div className="wm-studio-business-nav">
        {sectionLink('details', labels.details)}
        {sectionLink('images', labels.images)}
        {sectionLink('pricing', labels.services, group === 'services')}
        {sectionLink('contact', labels.contact, group === 'contact')}
        <details className="wm-studio-optional" open={group === 'optional' || undefined}>
          <summary>{labels.optional}<small>{labels.optionalHint}</small></summary>
          {sectionLink('team', labels.team)}{sectionLink('reviews', labels.reviews)}
        </details>
      </div>
      {primaryLink('/vendor/profile#availability', labels.calendar, 'calendar', area === 'calendar', 'availability')}
      {summary.hasBoutique && primaryLink('/vendor/boutique', labels.boutique, 'rings', area === 'boutique')}
    </nav>
    {pathname === '/vendor/profile' && area === 'business' && <div className="wm-studio-mobile-sections"><label htmlFor="studio-section">{labels.section}</label><select id="studio-section" value={activeSection} onChange={event => {if (isVendorProfileSection(event.target.value)) chooseSection(event.target.value);}}>
      <option value="details">{labels.details}</option><option value="images">{labels.images}</option>
      <optgroup label={labels.services}><option value="pricing">{labels.pricing}</option><option value="starting-price">{labels.startingPrice}</option><option value="amenities">{labels.amenities}</option><option value="categories">{labels.categories}</option></optgroup>
      <optgroup label={labels.contact}><option value="contact">{labels.contactDetails}</option><option value="location">{labels.location}</option></optgroup>
      <optgroup label={labels.optional}><option value="team">{labels.team}</option><option value="reviews">{labels.reviews}</option></optgroup>
    </select></div>}
    <div className="wm-studio-publication"><p>{labels.publication}</p><span className={summary.isPublished ? 'is-published' : ''}><i aria-hidden="true"/>{summary.isPublished ? labels.published : labels.draft}</span><Link href="/vendor/publish" aria-current={area === 'publish' ? 'page' : undefined}>{labels.reviewPublication}<HeaderIcon name="arrow"/></Link>
      {summary.isPublished && summary.slug && <Link href={`/vendors/${summary.slug}`} target="_blank" rel="noopener noreferrer">{labels.preview} ↗</Link>}
      {!summary.isPublished && <Link href="/vendor/preview" target="_blank" rel="noopener noreferrer">{labels.privatePreview} ↗</Link>}
    </div>
  </aside>;
}
