type GoogleWindow = typeof window & { google?: typeof google };

let promise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // Already loaded?
  if ((window as GoogleWindow).google?.maps?.places) return Promise.resolve();
  // Already loading?
  if (promise) return promise;

  promise = new Promise<void>((resolve, reject) => {
    // If another component injected the tag, just wait for it
    const existing = document.querySelector<HTMLScriptElement>('script[data-gmaps-loader="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")));
      return;
    }

    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    s.async = true;
    s.defer = true;
    s.setAttribute("data-gmaps-loader", "1");
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });

  return promise;
}
