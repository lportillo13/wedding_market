"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { ProfileSectionContext } from "./ProfileEditorContext";
import { getVendorServiceProfile } from "@/lib/vendorServiceProfile";
import { getProfileEssentials } from "@/shared/vendors/profile-progress";
import ProfileForm from "./profileForm";
import ImagesForm from "./ImagesForm";
import ContactForm from "./contactForm";
import PricingForm from "./pricingForm";
import AmenitiesForm from "./amenitiesForm";
import TeamForm from "./teamForm";
import AvailabilityForm from "./availabilityForm";
import ReviewsForm from "./reviewsForm";
import type { VendorImage } from "@/types/vendor";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";

type ProfileInitial = {
  slug: string;
  business_name: string;
  bio_en: string;
  bio_es: string;
  extra_info_en: string;
  extra_info_es: string;
};

type ContactInitial = {
  logo_url: string;
  phone: string;
  website_url: string;
  map_url: string;
  address_label: string;
  starting_price: string;
  starting_price_currency: string;
  event_types: string;
  years_in_business: string;
  languages: string;
  team_size_range: string;
};

type PricingItemInitial = {
  itemKey: string;
  currency?: string;
  price: string;
  contactForPrice: boolean;
  notesEn: string;
  notesEs: string;
};

type PricingInitial = {
  items: PricingItemInitial[];
  typicalSpend: string;
  typicalSpendCurrency: string;
  peakSeasons: string;
};

type AmenityOption = {
  key: string;
  group_key: string;
  label: Record<string, unknown> | null;
};

type AmenitiesInitial = {
  selectedKeys: string[];
  capacityMax: string;
};

type TeamMemberInitial = {
  id: string;
  name: string;
  title: string;
  titleEs?: string;
  bio: string;
  bioEs?: string;
  headshotUrl: string;
  respondsWithinHours: string;
};

type AvailabilityInitial = {
  dates: { date: string; status: "available" | "busy" }[];
};

type ReviewsInitial = {
  summary: string;
  googleBusinessProfileUrl: string;
};

type TabId =
  | "details"
  | "contact"
  | "pricing"
  | "amenities"
  | "team"
  | "availability"
  | "reviews"
  | "images";

export type VendorProfileTabsProps = {
  isPublished?: boolean;
  categoryKeys?: string[];
  profileInitial: ProfileInitial;
  vendorName: string;
  heroImage: VendorImage | null;
  thumbnailImage: VendorImage | null;
  galleryImages: VendorImage[];
  contactInitial: ContactInitial;
  pricingInitial: PricingInitial;
  amenitiesInitial: AmenitiesInitial;
  amenityOptions: AmenityOption[];
  teamInitial: TeamMemberInitial[];
  availabilityInitial: AvailabilityInitial;
  reviewsInitial: ReviewsInitial;
};

export default function VendorProfileTabs({
  isPublished = false,
  categoryKeys = [],
  profileInitial,
  vendorName,
  heroImage,
  thumbnailImage,
  galleryImages,
  contactInitial,
  pricingInitial,
  amenitiesInitial,
  amenityOptions,
  teamInitial,
  availabilityInitial,
  reviewsInitial,
}: VendorProfileTabsProps) {
  const t = useTranslation();
  const { language } = useLanguage();
  const es = language === "es";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [visited, setVisited] = useState<TabId[]>(["details"]);
  const [dirty, setDirty] = useState<Partial<Record<TabId, boolean>>>({});
  const [saving, setSaving] = useState<Partial<Record<TabId, boolean>>>({});
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const revisions = useRef<Partial<Record<TabId, number>>>({});
  const submissions = useRef<Partial<Record<TabId, number>>>({});
  const tabButtons = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>(
    {},
  );
  const ids: TabId[] = [
    "details",
    "images",
    "contact",
    "pricing",
    "amenities",
    "team",
    "availability",
    "reviews",
  ];
  const handlers = useMemo(
    () =>
      Object.fromEntries(
        [
          "details",
          "images",
          "contact",
          "pricing",
          "amenities",
          "team",
          "availability",
          "reviews",
        ].map((key) => {
          const id = key as TabId;
          return [
            id,
            {
              saved: () => {
                if (submissions.current[id] === revisions.current[id])
                  setDirty((current) => ({ ...current, [id]: false }));
              },
              pending: (value: boolean) =>
                setSaving((current) =>
                  current[id] === value ? current : { ...current, [id]: value },
                ),
            },
          ];
        }),
      ) as Record<
        TabId,
        { saved: () => void; pending: (value: boolean) => void }
      >,
    [],
  );

  function chooseTab(id: TabId, focus = false) {
    setActiveTab(id);
    setVisited((current) =>
      current.includes(id) ? current : [...current, id],
    );
    window.history.replaceState(window.history.state, "", `#${id}`);
    if (focus) tabButtons.current[id]?.focus();
  }

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.slice(1) as TabId;
      if (
        [
          "details",
          "images",
          "contact",
          "pricing",
          "amenities",
          "team",
          "availability",
          "reviews",
        ].includes(hash)
      ) {
        setActiveTab(hash);
        setVisited((current) =>
          current.includes(hash) ? current : [...current, hash],
        );
      }
    };
    const frame = requestAnimationFrame(applyHash);
    window.addEventListener("hashchange", applyHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", applyHash);
    };
  }, []);

  const hasDirty = Object.values(dirty).some(Boolean);
  useEffect(() => {
    if (leaveHref && !leaveDialog.current?.open)
      leaveDialog.current?.showModal();
    if (!leaveHref && leaveDialog.current?.open) leaveDialog.current.close();
  }, [leaveHref]);
  useEffect(() => {
    if (!hasDirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === "_blank" ||
        link.hasAttribute("download")
      )
        return;
      const url = new URL(link.href);
      if (
        url.origin !== window.location.origin ||
        (url.pathname === window.location.pathname &&
          url.search === window.location.search)
      )
        return;
      event.preventDefault();
      setLeaveHref(url.pathname + url.search + url.hash);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", beforeLink, true);
    };
  }, [hasDirty]);

  function markDirty(id: TabId) {
    if (id === "images") return;
    revisions.current[id] = (revisions.current[id] ?? 0) + 1;
    setDirty((current) => (current[id] ? current : { ...current, [id]: true }));
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight")
      next = (index + 1) % ids.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
      next = (index + ids.length - 1) % ids.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ids.length - 1;
    else return;
    event.preventDefault();
    chooseTab(ids[next], true);
  }

  const essentials = getProfileEssentials({
    name: profileInitial.business_name,
    description: profileInitial.bio_en || profileInitial.bio_es,
    hasPhoto: Boolean(heroImage || thumbnailImage || galleryImages.length),
    hasContact: Boolean(contactInitial.phone || contactInitial.website_url),
    hasPricing: Boolean(
      contactInitial.starting_price ||
        pricingInitial.typicalSpend ||
        pricingInitial.items.some((item) => item.price || item.contactForPrice),
    ),
  });
  const completed = essentials.filter((item) => item.complete).length;
  const nextSection = essentials.find((item) => !item.complete)?.id as
    | TabId
    | undefined;
  const help: Record<TabId, string> = es
    ? {
        details:
          "Presenta tu negocio con tus propias palabras. Cuenta qué hace especial trabajar contigo.",
        images:
          "Da vida a tu perfil. Elige una portada, una foto para el directorio y tus mejores trabajos.",
        contact:
          "Facilita que las parejas conozcan tu negocio y sepan cómo encontrarte.",
        pricing:
          "Añade tus servicios o paquetes. Puedes mostrar un precio o invitar a pedir una cotización.",
        amenities:
          "Selecciona lo que ofreces. Solo añade detalles que correspondan a tu servicio.",
        team: "Presenta a las personas detrás de tu negocio. Puedes empezar con una sola persona.",
        availability:
          "Ayuda a las parejas a encontrar una fecha. Actualiza tu calendario cuando cambie tu agenda.",
        reviews:
          "Conecta tus reseñas y aporta confianza a las parejas que están comparando opciones.",
      }
    : {
        details:
          "Introduce your business in your own words. Tell couples what makes working with you special.",
        images:
          "Bring your profile to life. Choose a cover, a directory image and your best work.",
        contact:
          "Help couples get to know your business and find the right way to reach you.",
        pricing:
          "Add your services or packages. Show a price or invite couples to request a quote.",
        amenities:
          "Choose what you offer. Add the details that make sense for your service.",
        team: "Introduce the people behind your business. Starting with one person is welcome.",
        availability:
          "Help couples find a date. Keep your calendar current as your schedule changes.",
        reviews:
          "Connect your reviews and help couples feel confident about their choice.",
      };
  const sectionLabel = (id: TabId) => t(`vendorDashboard.profileTabs.${id}`);
  const renderForm = (id: TabId) => {
    switch (id) {
      case "details":
        return <ProfileForm initial={profileInitial} />;
      case "contact":
        return <ContactForm initial={contactInitial} />;
      case "pricing":
        return (
          <PricingForm initial={pricingInitial} categoryKeys={categoryKeys} />
        );
      case "amenities":
        return (
          <AmenitiesForm
            initial={amenitiesInitial}
            options={amenityOptions}
            supportsGuestCapacity={
              getVendorServiceProfile(categoryKeys).supportsGuestCapacity
            }
          />
        );
      case "team":
        return <TeamForm initial={teamInitial} />;
      case "availability":
        return <AvailabilityForm initial={availabilityInitial} />;
      case "reviews":
        return <ReviewsForm initial={reviewsInitial} />;
      case "images":
        return (
          <ImagesForm
            vendorName={vendorName}
            heroImage={heroImage}
            thumbnailImage={thumbnailImage}
            galleryImages={galleryImages}
          />
        );
    }
  };

  return (
    <section className="wm-profile-workspace">
      <header className="wm-profile-workspace__header">
        <div>
          <p className="wm-profile-eyebrow">
            {es ? "TU PERFIL DE PROVEEDOR" : "YOUR VENDOR PROFILE"}
          </p>
          <h1>
            {vendorName ||
              (es ? "Tu negocio, a tu manera" : "Your business, your way")}
          </h1>
          <p>
            {es
              ? "Un espacio para mostrar lo que haces y conectar con las parejas adecuadas."
              : "A place to show what you do and connect with the right couples."}
          </p>
        </div>
        <div className="wm-profile-workspace__actions">
          <span
            className={`wm-profile-status ${isPublished ? "is-published" : ""}`}
          >
            <span aria-hidden="true">●</span>{" "}
            {isPublished
              ? es
                ? "Publicado"
                : "Published"
              : es
                ? "Borrador privado"
                : "Private draft"}
          </span>
          {isPublished ? (
            <Link
              href={`/vendors/${profileInitial.slug}`}
              target="_blank"
              className="btn btn-outline-dark"
              rel="noopener noreferrer"
            >
              {es ? "Ver perfil público ↗︎" : "View public profile ↗︎"}
            </Link>
          ) : (
            <Link href="/vendor/publish" className="btn btn-outline-dark">
              {es ? "Revisar publicación ↗︎" : "Review publishing ↗︎"}
            </Link>
          )}
        </div>
      </header>
      <div className="wm-profile-essentials">
        <div className="wm-profile-essentials__intro">
          <div className="wm-profile-essentials__number">
            {completed}
            <span>/4</span>
          </div>
          <div>
            <h2>
              {completed === 4
                ? es
                  ? "Los básicos están listos"
                  : "Your essentials are in place"
                : es
                  ? "Empieza por lo esencial"
                  : "Start with the essentials"}
            </h2>
            <p>
              {es
                ? "Según la información guardada. Añade más detalles a tu ritmo."
                : "Based on saved information. Add more details at your own pace."}
            </p>
          </div>
        </div>
        <div className="wm-profile-essentials__steps">
          {essentials.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => chooseTab(step.id as TabId)}
              className={step.complete ? "is-complete" : ""}
            >
              <span aria-hidden="true">{step.complete ? "✓" : "+"}</span>
              {sectionLabel(step.id as TabId)}
            </button>
          ))}
        </div>
        {nextSection ? (
          <button
            type="button"
            className="wm-profile-next"
            onClick={() => chooseTab(nextSection)}
          >
            {es ? "Siguiente" : "Up next"}: {sectionLabel(nextSection)}{" "}
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>
      <div className="wm-profile-workspace__body">
        <aside className="wm-profile-sidebar">
          <div
            role="tablist"
            aria-label={es ? "Secciones de tu perfil" : "Profile sections"}
          >
            {ids.map((id, index) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`profile-trigger-${id}`}
                aria-controls={`profile-panel-${id}`}
                aria-selected={activeTab === id}
                tabIndex={activeTab === id ? 0 : -1}
                ref={(node) => {
                  tabButtons.current[id] = node;
                }}
                onClick={() => chooseTab(id)}
                onKeyDown={(event) => onTabKey(event, index)}
                className={`wm-profile-section-link ${activeTab === id ? "is-active" : ""}`}
              >
                <span
                  className="wm-profile-section-link__index"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{sectionLabel(id)}</span>
                {dirty[id] ? (
                  <span
                    className="wm-profile-dirty-dot"
                    aria-label={es ? "Cambios sin guardar" : "Unsaved changes"}
                  />
                ) : null}
              </button>
            ))}
          </div>
          <p className="wm-profile-sidebar__note">
            {es
              ? "Puedes cambiar de sección sin perder lo que estás escribiendo. Guarda antes de salir."
              : "Switch sections without losing what you’re writing. Save before leaving."}
          </p>
          <Link href="/vendor/categories">
            {es ? "Editar mis servicios →" : "Edit my services →"}
          </Link>
        </aside>
        <div className="wm-profile-panels">
          {ids.map((id) => (
            <div
              key={id}
              role="tabpanel"
              id={`profile-panel-${id}`}
              aria-labelledby={`profile-trigger-${id}`}
              hidden={activeTab !== id}
              onInputCapture={(event) => {
                if (
                  !(event.target instanceof Element) ||
                  !event.target.closest("[data-profile-ignore]")
                )
                  markDirty(id);
              }}
              onChangeCapture={(event) => {
                if (
                  !(event.target instanceof Element) ||
                  !event.target.closest("[data-profile-ignore]")
                )
                  markDirty(id);
              }}
              onClickCapture={(event) => {
                if (
                  event.target instanceof Element &&
                  event.target.closest("[data-profile-change]")
                )
                  markDirty(id);
              }}
              onSubmitCapture={(event) => {
                if (
                  event.target instanceof HTMLFormElement &&
                  event.target.hasAttribute("data-profile-save")
                )
                  submissions.current[id] = revisions.current[id];
              }}
            >
              <div className="wm-profile-panel-heading">
                <div>
                  <p className="wm-profile-eyebrow">
                    {String(ids.indexOf(id) + 1).padStart(2, "0")} /{" "}
                    {String(ids.length).padStart(2, "0")}
                  </p>
                  <h2>{sectionLabel(id)}</h2>
                  <p>{help[id]}</p>
                </div>
                {id === "images" ? (
                  <span className="wm-profile-autosave">
                    {es
                      ? "Las imágenes se guardan al subirlas"
                      : "Images save when uploaded"}
                  </span>
                ) : null}
              </div>
              <ProfileSectionContext.Provider
                value={{ ...handlers[id], dirty: Boolean(dirty[id]) }}
              >
                <fieldset
                  className="wm-profile-fieldset"
                  disabled={Boolean(saving[id])}
                >
                  {visited.includes(id) ? renderForm(id) : null}
                </fieldset>
              </ProfileSectionContext.Provider>
            </div>
          ))}
        </div>
      </div>
      <dialog
        ref={leaveDialog}
        aria-labelledby="profile-leave-title"
        className="wm-profile-leave-dialog"
        onCancel={() => setLeaveHref(null)}
      >
        <h2 id="profile-leave-title">
          {es ? "¿Salir sin guardar?" : "Leave without saving?"}
        </h2>
        <p>
          {es
            ? "Tus cambios todavía no están guardados. Puedes seguir editando o salir y descartarlos."
            : "Your edits haven’t been saved yet. Keep editing, or leave and discard them."}
        </p>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setLeaveHref(null)}
          >
            {es ? "Seguir editando" : "Keep editing"}
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => {
              if (!leaveHref) return;
              const href = leaveHref;
              setLeaveHref(null);
              setDirty({});
              router.push(href);
            }}
          >
            {es ? "Salir y descartar" : "Leave and discard"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
