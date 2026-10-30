"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { useVendorWorkspace } from '../VendorWorkspaceContext';
import { vendorProfileSections, vendorStudioCopy, vendorBusinessGroup, type VendorProfileSection } from '../workspace-navigation';
import ProfileEssentials from './ProfileEssentials';
import CategoriesForm from '../categories/categoriesForm';
import LocationSection from '../location/LocationSection';
import StartingPriceForm from './StartingPriceForm';

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

type TabId = VendorProfileSection;

export type VendorProfileTabsProps = {
  isPublished?: boolean;
  categoryKeys?: string[];
  allCategories?: {key:string; label?:{en?:string|null; es?:string|null}|null}[];
  locationInitial?: {address:string; city:string; state:string; country:string; lat:number|null; lng:number|null; service_radius_km:number};
  profileInitial: ProfileInitial;
  vendorName: string;
  heroImage: VendorImage | null;
  thumbnailImage: VendorImage | null;
  galleryImages: VendorImage[];
  heroPresentation?: unknown;
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
  allCategories = [],
  locationInitial = {address:'',city:'',state:'',country:'',lat:null,lng:null,service_radius_km:50},
  profileInitial,
  vendorName,
  heroImage,
  thumbnailImage,
  galleryImages,
  heroPresentation,
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
  const {activeSection: activeTab, visited, chooseSection: chooseTab, setDirtySections} = useVendorWorkspace();
  const studioLabels = vendorStudioCopy[language];
  const [dirty, setDirty] = useState<Partial<Record<TabId, boolean>>>({});
  const [saving, setSaving] = useState<Partial<Record<TabId, boolean>>>({});
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const revisions = useRef<Partial<Record<TabId, number>>>({});
  const submissions = useRef<Partial<Record<TabId, number>>>({});
  const ids = vendorProfileSections;
  const handlers = useMemo(
    () =>
      Object.fromEntries(
        ids.map((key) => {
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
    [ids],
  );

  useEffect(() => { setDirtySections(dirty); }, [dirty, setDirtySections]);
  useEffect(() => () => setDirtySections({}), [setDirtySections]);

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
        link.hasAttribute('data-studio-section') ||
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
  const help: Record<TabId, string> = es
    ? {
        'starting-price': 'Define un precio inicial, si quieres mostrarlo en tu perfil.',
        categories: 'Elige las categorías que describen tu negocio. Los campos y paquetes se adaptan a tus servicios.',
        location: 'Ubica tu negocio y define la zona en la que trabajas.',
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
        'starting-price': 'Set a starting price if you would like to show one on your profile.',
        categories: 'Choose the categories that describe your business. Fields and packages adapt to your services.',
        location: 'Locate your business and define the area you serve.',
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
  const sectionLabel = (id: TabId) => {
    switch (id) {
      case 'details': return studioLabels.details;
      case 'images': return studioLabels.images;
      case 'starting-price': return studioLabels.startingPrice;
      case 'categories': return studioLabels.categories;
      case 'location': return studioLabels.location;
      case 'contact': return studioLabels.contactDetails;
      case 'pricing': return studioLabels.pricing;
      case 'amenities': return studioLabels.amenities;
      default: return t(`vendorDashboard.profileTabs.${id}`);
    }
  };
  const group = vendorBusinessGroup(activeTab);
  const relatedSections: TabId[] = group === 'services' ? ['pricing','starting-price','amenities','categories'] : group === 'contact' ? ['contact','location'] : [];
  const renderForm = (id: TabId) => {
    switch (id) {
      case 'starting-price': return <StartingPriceForm price={contactInitial.starting_price} currency={contactInitial.starting_price_currency}/>;
      case 'categories': return <CategoriesForm allCats={allCategories} selected={categoryKeys}/>;
      case 'location': return <LocationSection initial={locationInitial}/>;
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
            heroPresentation={heroPresentation}
          />
        );
    }
  };

  return (
    <main className="wm-profile-workspace">
      <header className="wm-profile-workspace__header">
        <div>
          <p className="wm-profile-eyebrow">
            {studioLabels.business} / {sectionLabel(activeTab)}
          </p>
          <h1>
            {activeTab === 'details' ? (es ? 'Cuenta tu historia.' : 'Tell your story.') : group === 'services' ? studioLabels.services : group === 'contact' ? studioLabels.contact : activeTab === 'availability' ? studioLabels.calendar : sectionLabel(activeTab)}
          </h1>
          <p>
            {vendorName}
          </p>
        </div>
        <div className="wm-profile-workspace__actions">
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
            <Link href="/vendor/preview" target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark">
              {studioLabels.privatePreview} ↗
            </Link>
          )}
        </div>
      </header>
      {relatedSections.length > 0 && <nav className="wm-studio-subsections" aria-label={group === 'services' ? studioLabels.services : studioLabels.contact}>
        {relatedSections.map(id => <button key={id} type="button" aria-pressed={activeTab === id} onClick={() => chooseTab(id)}>{sectionLabel(id)}{dirty[id] && <span className="wm-studio-dirty" aria-label={studioLabels.changes}/>}</button>)}
      </nav>}
      <div className="wm-studio-editor-grid">
        <div className="wm-profile-panels">
          {ids.map((id) => (
            <div
              key={id}
              role="region"
              id={`profile-panel-${id}`}
              aria-labelledby={`profile-heading-${id}`}
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
                  <h2 id={`profile-heading-${id}`}>{sectionLabel(id)}</h2>
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
                value={{ ...handlers[id], dirty: Boolean(dirty[id]), changed: () => markDirty(id) }}
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
        <ProfileEssentials items={essentials}/>
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
    </main>
  );
}
