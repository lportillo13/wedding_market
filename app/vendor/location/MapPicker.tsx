"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/contexts/LanguageContext";

declare global {
  interface Window {
    google: typeof google;
  }
}

type Coords = {
  lat: number | null; lng: number | null;
  address?: string; city?: string; state?: string; country?: string;
};

type Props = {
  apiKey: string;               // script is loaded globally in layout; we still depend on it being set
  lat: number | null;
  lng: number | null;
  radiusKm: number;             // NEW: draw coverage circle
  onChange: (v: Coords) => void;
};

function parseComponents(place: google.maps.places.PlaceResult) {
  const comps = place.address_components ?? [];
  const pick = (t: string) => comps.find((c) => c.types?.includes(t))?.long_name ?? "";
  const city = pick("locality") || pick("postal_town") || pick("administrative_area_level_2");
  const state = pick("administrative_area_level_1");
  const country = pick("country");
  return { city, state, country };
}

function waitForGoogle(timeoutMs = 10000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (window.google?.maps?.places) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error("Google Maps not available"));
      setTimeout(tick, 50);
    };
    tick();
  });
}

export default function MapPicker({ apiKey, lat, lng, radiusKm, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const t = useTranslation();

  const mapInst = useRef<google.maps.Map | null>(null);
  const markerInst = useRef<google.maps.Marker | null>(null);
  const circleInst = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    let clickListener: google.maps.MapsEventListener | undefined;
    let dragListener: google.maps.MapsEventListener | undefined;
    let acListener: google.maps.MapsEventListener | undefined;

    waitForGoogle().then(() => {
      const center = (lat != null && lng != null)
        ? { lat, lng }
        : { lat: 40.4168, lng: -3.7038 }; // default: Madrid

      // Map
      mapInst.current = new window.google.maps.Map(mapRef.current!, {
        center,
        zoom: (lat != null && lng != null) ? 13 : 4,
        mapTypeControl: false,
        streetViewControl: false,
      });

      // Marker
      markerInst.current = new window.google.maps.Marker({
        position: (lat != null && lng != null) ? center : undefined,
        map: mapInst.current,
        draggable: true,
      });

      // Circle
      circleInst.current = new window.google.maps.Circle({
        map: mapInst.current,
        center,
        radius: (radiusKm || 0) * 1000,
        strokeOpacity: 0.25,
        strokeWeight: 1,
        fillOpacity: 0.08,
      });

      // Click on map
      clickListener = mapInst.current.addListener("click", (e: google.maps.MapMouseEvent) => {
        const latLng = e.latLng;
        if (!latLng) return;
        const pos = { lat: latLng.lat(), lng: latLng.lng() };
        markerInst.current?.setPosition(pos);
        markerInst.current?.setMap(mapInst.current);
        circleInst.current?.setCenter(pos);
        onChange({ lat: pos.lat, lng: pos.lng });
      });

      // Drag marker
      dragListener = markerInst.current?.addListener("dragend", () => {
        const pos = markerInst.current?.getPosition();
        if (!pos) return;
        const next = { lat: pos.lat(), lng: pos.lng() };
        circleInst.current?.setCenter(next);
        onChange(next);
      });

      // Places autocomplete
      const ac = new window.google.maps.places.Autocomplete(inputRef.current!, { types: ["geocode"] });
      acListener = ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const g = place.geometry;
        if (!g || !g.location) return;
        const pos = { lat: g.location.lat(), lng: g.location.lng() };
        mapInst.current?.panTo(pos);
        mapInst.current?.setZoom(14);
        markerInst.current?.setPosition(pos);
        markerInst.current?.setMap(mapInst.current);
        circleInst.current?.setCenter(pos);

        const { city, state, country } = parseComponents(place);
        onChange({
          lat: pos.lat,
          lng: pos.lng,
          address: place.formatted_address ?? "",
          city,
          state,
          country,
        });
      });
    }).catch(() => { /* ignore */ });

    return () => {
      try {
        if (clickListener) window.google?.maps?.event?.removeListener(clickListener);
        if (dragListener) window.google?.maps?.event?.removeListener(dragListener);
        if (acListener) window.google?.maps?.event?.removeListener(acListener);
        circleInst.current?.setMap(null);
        markerInst.current?.setMap(null);
      } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // When radius changes, update circle size
  useEffect(() => {
    if (circleInst.current && window.google?.maps) {
      circleInst.current.setRadius((radiusKm || 0) * 1000);
    }
  }, [radiusKm]);

  // When initial coordinates change (first render), keep map centered
  useEffect(() => {
    if (mapInst.current && (lat != null && lng != null)) {
      const center = { lat, lng };
      mapInst.current.setCenter(center);
      markerInst.current?.setPosition(center);
      circleInst.current?.setCenter(center);
    }
  }, [lat, lng]);

  return (
    <div>
      <label className="form-label" htmlFor="map-picker-search">
        {t("vendorDashboard.location.map.searchLabel")}
      </label>
      <input
        id="map-picker-search"
        ref={inputRef}
        className="form-control mb-2"
        placeholder={t("vendorDashboard.location.map.searchPlaceholder")}
        suppressHydrationWarning
      />
      <div ref={mapRef} style={{ width: "100%", height: 320, borderRadius: 8 }} />
    </div>
  );
}
