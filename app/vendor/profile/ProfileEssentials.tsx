"use client";
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorWorkspace } from '../VendorWorkspaceContext';
import { vendorStudioCopy, type VendorProfileSection } from '../workspace-navigation';

export default function ProfileEssentials({items}: {items:{id:VendorProfileSection; complete:boolean}[]}) {
  const {language} = useLanguage();
  const labels = vendorStudioCopy[language];
  const {chooseSection} = useVendorWorkspace();
  const completed = items.filter(item => item.complete).length;
  const names = {details:labels.details, images:labels.images, contact:labels.contact, pricing:labels.services};
  return <aside className="wm-studio-guidance" aria-label={labels.supportTitle}>
    <p className="wm-studio-eyebrow">Wedding Market</p><h2>{labels.supportTitle}</h2>
    <p>{labels.savedBasics.replace('{count}', String(completed))}</p>
    <progress value={completed} max={4} aria-label={labels.savedBasics.replace('{count}', String(completed))}/>
    <ul>{items.map(item => <li key={item.id}><button type="button" onClick={() => chooseSection(item.id)}><span aria-hidden="true">{item.complete ? '✓' : '○'}</span>{names[item.id as keyof typeof names]}</button></li>)}</ul>
    <p className="wm-studio-guidance__note">{labels.supportNote}</p><p className="wm-studio-guidance__note">{labels.optionalNote}</p>
  </aside>;
}
