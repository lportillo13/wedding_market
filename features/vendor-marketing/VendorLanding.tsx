"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import HeaderIcon, { type HeaderIconName } from "@/components/HeaderIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { vendorLandingCopy } from "./copy";
import StudioPreview from "./StudioPreview";
import { useVendorMotion } from "./useVendorMotion";
import s from "./vendor-landing.module.scss";

function Arrow() { return <span className={s.arrow} aria-hidden="true"><HeaderIcon name="arrow" /></span>; }

export default function VendorLanding() {
  const { language } = useLanguage();
  const copy = vendorLandingCopy[language];
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(true);
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const feature = copy.features[active];
  useVendorMotion(root, paused);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frame = requestAnimationFrame(() => setPaused(motion.matches));
    const onChange = (event: MediaQueryListEvent) => setPaused(event.matches);
    motion.addEventListener("change", onChange);
    return () => { cancelAnimationFrame(frame); motion.removeEventListener("change", onChange); };
  }, []);

  function explore(event: MouseEvent<HTMLAnchorElement>) {
    const destination = document.getElementById("vendor-possibilities");
    if (!destination) return;
    event.preventDefault();
    destination.focus({ preventScroll: true });
    destination.scrollIntoView({ behavior: paused ? "instant" : "smooth", block: "start" });
  }

  return <main ref={root} className={`wm-vendor-landing ${s.page}`} data-motion={paused ? "paused" : "active"}>
    <section className={s.hero} aria-labelledby="vendor-hero-title">
      <div className={s.heroImage}><Image src="/images/auth-editorial-welcome.webp" alt="" fill sizes="100vw" priority /></div>
      <div className={s.heroShade} />
      <div className={s.heroCopy}>
        <p className={s.eyebrow}>{copy.eyebrow}</p>
        <h1 id="vendor-hero-title"><span>{copy.title}</span><em>{copy.titleAccent}</em></h1>
        <p className={s.heroDescription}>{copy.description}</p>
        <Link href="/signup/vendor" className={`${s.cta} ${s.ctaLight}`}>{copy.join}<Arrow /></Link>
        <p className={s.heroNote}>{copy.free}</p>
      </div>
      <div className={s.heroBottom}><span className={s.heroLocation}>Costa Rica <span aria-hidden="true">—</span> Wedding Market</span><a className={s.explore} href="#vendor-possibilities" onClick={explore}><span>{copy.explore}</span><span className={s.scrollArrow} aria-hidden="true">↓</span></a><button type="button" className={s.motion} onClick={() => setPaused((value) => !value)} aria-label={paused ? copy.play : copy.pause} aria-pressed={!paused}><HeaderIcon name={paused ? "play" : "pause"} /><span>{paused ? copy.play : copy.pause}</span></button></div>
    </section>

    <section id="vendor-possibilities" tabIndex={-1} className={`${s.section} ${s.intro}`} aria-labelledby="vendor-intro-title">
      <div className={s.sectionHeading} data-vendor-reveal><div><p className={s.eyebrow}>{copy.introLabel}</p><h2 id="vendor-intro-title">{copy.introTitle}<em>{copy.introAccent}</em></h2></div><p className={s.lead}>{copy.introBody}</p></div>
      <div className={s.benefits}>{copy.benefits.map((benefit, index) => <article key={index} className={s.benefit} data-vendor-reveal>
        <Image src={benefit.image} alt={benefit.alt} fill sizes="(max-width: 767px) 88vw, 33vw" />
        <div className={s.benefitShade} /><span className={s.benefitNumber}>0{index + 1}</span><div className={s.benefitCopy}><h3>{benefit.title}</h3><p>{benefit.body}</p></div>
      </article>)}</div>
    </section>

    <section className={`${s.section} ${s.studioSection}`} aria-labelledby="vendor-studio-title">
      <div className={s.studioHeading} data-vendor-reveal><p className={s.eyebrow}>{copy.studioLabel}</p><h2 id="vendor-studio-title">{copy.studioTitle}<em>{copy.studioAccent}</em></h2><p className={s.lead}>{copy.studioBody}</p></div>
      <div className={s.studioLayout} data-vendor-reveal>
        <div className={s.featureControls}>
          <div className={s.tabs} role="tablist" aria-label={copy.tabsLabel}>{copy.features.map((item, index) => <button key={index} ref={(element) => { tabs.current[index] = element; }} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onFocus={() => setActive(index)} onKeyDown={(event) => {
            const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? (index + 1) % copy.features.length : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (index + copy.features.length - 1) % copy.features.length : event.key === "Home" ? 0 : event.key === "End" ? copy.features.length - 1 : null;
            if (next !== null) { event.preventDefault(); tabs.current[next]?.focus(); }
          }}><span>0{index + 1}</span>{item.tab}</button>)}</div>
          <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} tabIndex={0} className={s.featurePanel}>
            <div key={`${language}-${active}`} className={s.featureCopy}><span className={s.chapter} aria-hidden="true">0{active + 1}.</span><h3>{feature.title}</h3><p>{feature.body}</p><ul>{feature.points.map((point) => <li key={point}><span aria-hidden="true">✓</span>{point}</li>)}</ul><Link href="/signup/vendor" className={s.textLink}>{copy.join}<HeaderIcon name="arrow" aria-hidden="true" /></Link></div>
          </div>
        </div>
        <div role="region" aria-label={`${feature.tab} — ${copy.sample}`} className={s.previewWrap}><StudioPreview active={active} copy={copy} /></div>
      </div>
    </section>

    <section className={s.interlude} aria-labelledby="vendor-interlude-title">
      <Image src="https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1800&q=85" alt="" fill sizes="100vw" />
      <div className={s.interludeShade} /><div className={s.interludeCopy} data-vendor-reveal><p className={s.eyebrow}>{copy.interludeLabel}</p><h2 id="vendor-interlude-title">{copy.interludeTitle}<em>{copy.interludeAccent}</em></h2><p>{copy.interludeBody}</p></div>
    </section>

    <section className={`${s.section} ${s.includedSection}`} aria-labelledby="vendor-included-title">
      <div className={s.includedHeading} data-vendor-reveal><p className={s.eyebrow}>{copy.includedLabel}</p><h2 id="vendor-included-title">{copy.includedTitle}<em>{copy.includedAccent}</em></h2></div>
      <div className={s.included}>{copy.included.map((item) => <article key={item.icon} data-vendor-reveal><HeaderIcon name={item.icon as HeaderIconName} aria-hidden="true" /><div><h3>{item.title}</h3><p>{item.body}</p></div></article>)}</div>
    </section>

    <section className={`${s.section} ${s.stepsSection}`} aria-labelledby="vendor-steps-title">
      <div className={s.stepsHeading} data-vendor-reveal><p className={s.eyebrow}>{copy.stepsLabel}</p><h2 id="vendor-steps-title">{copy.stepsTitle}<em>{copy.stepsAccent}</em></h2><Link href="/signup/vendor" className={s.cta}>{copy.join}<Arrow /></Link></div>
      <ol className={s.steps}>{copy.steps.map((step, index) => <li key={index} data-vendor-reveal><span className={s.stepNumber} aria-hidden="true">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
    </section>

    <section className={`${s.section} ${s.faqSection}`} aria-labelledby="vendor-faq-title"><div data-vendor-reveal><p className={s.eyebrow}>{copy.faqLabel}</p><h2 id="vendor-faq-title">{copy.faqTitle}</h2><Link href="/support" className={s.textLink}>{copy.help}<HeaderIcon name="arrow" aria-hidden="true" /></Link></div><div className={s.faqs} data-vendor-reveal>{copy.questions.map((item, index) => <details key={index}><summary>{item.q}<span aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></section>

    <section className={s.closing} aria-labelledby="vendor-closing-title"><div data-vendor-reveal><p className={s.eyebrow}>{copy.closingLabel}</p><h2 id="vendor-closing-title">{copy.closingTitle}<em>{copy.closingAccent}</em></h2><p>{copy.closingBody}</p><Link href="/signup/vendor" className={`${s.cta} ${s.ctaLight}`}>{copy.join}<Arrow /></Link><p className={s.closingNote}>{copy.free}</p><Link href="/login?next=%2Fvendor" className={s.login}>{copy.login}</Link></div><span className={s.closingMark} aria-hidden="true">WM</span></section>
  </main>;
}
