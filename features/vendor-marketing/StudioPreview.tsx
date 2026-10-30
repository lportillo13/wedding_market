import Image from "next/image";
import HeaderIcon from "@/components/HeaderIcon";
import type { VendorLandingCopy } from "./copy";
import s from "./vendor-landing.module.scss";

export default function StudioPreview({ active, copy }: { active: number; copy: VendorLandingCopy }) {
  const p = copy.preview;
  return <figure className={s.preview}>
    <div className={s.previewChrome}><span aria-hidden="true"><i /><i /><i /></span><span>Wedding Market</span><span aria-hidden="true">WM</span></div>
    <div className={s.previewCanvas}>
      <div key={active} className={s.previewScreen}>
        {active === 0 && <>
          <div className={s.profilePhoto}><Image src="/images/auth-editorial-welcome.webp" alt="" fill sizes="(max-width: 767px) 90vw, 50vw" /><span>{p.profile}</span></div>
          <div className={s.profileIdentity}><span className={s.monogram} aria-hidden="true">Y</span><div><h3>{p.business}</h3><p>{p.type}</p></div><HeaderIcon name="heart" aria-hidden="true" /></div>
          <div className={s.previewMenu}><span>{p.about}</span><span>{p.gallery}</span><span>{p.services}</span></div>
          <div className={s.profileStory}><p>{p.story}</p><span className={s.fauxLine} /><span className={s.fauxLine} /><span className={s.fauxLine} /></div>
        </>}
        {active === 1 && <div className={s.inboxPreview}>
          <p className={s.previewEyebrow}>{p.inbox}</p><h3>{p.question}</h3>
          <div className={s.sampleBrief}><div><HeaderIcon name="rings" aria-hidden="true" /><strong>{p.request}</strong></div><p>{p.couple}</p><div className={s.briefMeta}><span>{p.date}</span><span>{p.guests}</span></div><p>{p.location}</p></div>
          <div className={s.bubble}>{p.brief}</div><div className={`${s.bubble} ${s.bubbleReply}`}>{p.response}</div>
          <div className={s.messageBar} aria-hidden="true"><span /><HeaderIcon name="arrow" /></div>
        </div>}
        {active === 2 && <div className={s.proposalPreview}>
          <p className={s.previewEyebrow}>{p.proposal}</p>
          <div className={s.proposalPaper}><span className={s.revision}>{p.revision}</span><span className={s.paperMark} aria-hidden="true">WM</span><h3>{p.package}</h3><p>{p.prepared}</p><div className={s.proposalRule} /><p>{p.included}</p><span className={s.fauxLine} /><span className={s.fauxLine} /><span className={s.fauxLine} /><div className={s.proposalStatus}><span />{p.status}</div></div>
          <p className={s.history}><HeaderIcon name="inbox" aria-hidden="true" />{p.history}</p>
        </div>}
        {active === 3 && <div className={s.studioPreview}>
          <p className={s.previewEyebrow}>{p.studio}</p><h3>{p.edit}</h3><span className={s.draft}>{p.draft}</span>
          <div className={s.studioRows}>{[p.details, p.photos, p.services, p.team].map((label) => <div key={label}><span>{label}</span><span>{p.saved} <span aria-hidden="true">✓</span></span></div>)}</div>
          <div className={s.calendarPreview}><HeaderIcon name="calendar" aria-hidden="true" /><div><strong>{p.calendar}</strong><p>{p.availability}</p></div><span aria-hidden="true">↗</span></div>
          <div className={s.privatePreview}><HeaderIcon name="user" aria-hidden="true" />{p.private}</div>
        </div>}
      </div>
    </div>
    <figcaption>{copy.sample}</figcaption>
  </figure>;
}
