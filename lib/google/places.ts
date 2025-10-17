import type { VendorReviewItem } from "@/types/vendor-profile";

const PLACE_DETAILS_ENDPOINT = "https://maps.googleapis.com/maps/api/place/details/json" as const;
const FIND_PLACE_ENDPOINT = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json" as const;

type PlaceDetailsReview = {
  author_name?: string;
  author_url?: string;
  profile_photo_url?: string;
  rating?: number;
  relative_time_description?: string;
  text?: string;
  time?: number;
  translated_text?: string;
};

type PlaceDetailsResult = {
  status?: string;
  result?: {
    name?: string;
    rating?: number;
    user_ratings_total?: number;
    reviews?: PlaceDetailsReview[];
    url?: string;
  };
};

type FindPlaceResponse = {
  status?: string;
  candidates?: { place_id?: string }[];
};

type NextFetchRequestInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

export type GoogleReviewFetchResult = {
  placeId: string;
  url: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  items: VendorReviewItem[];
};

function getPlacesApiKey(): string | null {
  const serverKey = process.env.GOOGLE_PLACES_API_KEY;
  if (serverKey && serverKey.trim()) return serverKey;
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return mapsKey && mapsKey.trim() ? mapsKey : null;
}

function extractPlaceIdFromLink(link: string): string | null {
  try {
    const parsed = new URL(link);
    const placeIdParam = parsed.searchParams.get("place_id");
    if (placeIdParam) return placeIdParam;

    const query = parsed.searchParams.get("q");
    if (query) {
      const match = query.match(/place_id:([^&]+)/i);
      if (match?.[1]) {
        return match[1];
      }
    }

    const pathMatch = decodeURIComponent(parsed.pathname).match(/place\/.*?([A-Za-z0-9_-]{10,})/);
    if (pathMatch?.[1]) {
      return pathMatch[1];
    }
  } catch {
    // Ignore invalid URLs and fall back to Find Place
  }
  return null;
}

export function buildFindPlaceQuery(input: string): string {
  const candidates: string[] = [];
  const addCandidate = (value: string | null | undefined) => {
    if (!value) return;
    let candidate = value;
    try {
      candidate = decodeURIComponent(candidate);
    } catch {
      // ignore decoding errors and continue with the raw candidate
    }
    candidate = candidate
      .replace(/^place_id:/i, "")
      .replace(/[-+_]/g, " ")
      .replace(/https?:\/\//gi, "")
      .replace(/www\./gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!candidate) return;
    if (!/[A-Za-z0-9]/.test(candidate)) return;
    candidates.push(candidate);
  };

  const trimmedInput = input.trim();
  if (!trimmedInput) return "";

  try {
    const parsed = new URL(trimmedInput);
    addCandidate(parsed.searchParams.get("q"));
    addCandidate(parsed.searchParams.get("query"));
    addCandidate(parsed.searchParams.get("text"));

    const decodedPath = decodeURIComponent(parsed.pathname);
    const pathSegments = decodedPath
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    const placeIndex = pathSegments.findIndex(
      (segment) => segment.toLowerCase() === "place",
    );
    if (placeIndex !== -1 && pathSegments.length > placeIndex + 1) {
      addCandidate(pathSegments[placeIndex + 1]);
    } else if (pathSegments.length > 0) {
      addCandidate(pathSegments[pathSegments.length - 1]);
    }

    addCandidate(parsed.hostname);
  } catch {
    // If the input is not a URL we'll fall back to using it directly
  }

  addCandidate(trimmedInput);

  const uniqueCandidates = candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
  return uniqueCandidates[0] ?? "";
}

async function findPlaceIdByText(query: string, apiKey: string): Promise<string | null> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    console.warn("[google-places] findPlaceIdByText called with an empty query");
    return null;
  }
  const url = new URL(FIND_PLACE_ENDPOINT);
  url.searchParams.set("input", trimmedQuery);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id");
  url.searchParams.set("key", apiKey);

  try {
    const requestInit: NextFetchRequestInit = {
      method: "GET",
      next: { revalidate: 3600 },
    };
    const response = await fetch(url.toString(), requestInit);
    if (!response.ok) {
      console.warn("[google-places] findPlaceIdByText request failed", response.status, response.statusText);
      return null;
    }
    const data = (await response.json()) as FindPlaceResponse;
    if (data.status !== "OK") {
      console.warn("[google-places] findPlaceIdByText returned non-OK status", data.status);
      return null;
    }
    const candidate = data.candidates?.find((item) => typeof item.place_id === "string" && item.place_id.length > 0);
    if (!candidate?.place_id) {
      console.warn("[google-places] findPlaceIdByText did not return any place_id candidates");
    }
    return candidate?.place_id ?? null;
  } catch (error) {
    console.error("[google-places] findPlaceIdByText threw", error);
    return null;
  }
}

function mapReviewToVendor(review: PlaceDetailsReview, fallbackId: string): VendorReviewItem {
  const timestamp = typeof review.time === "number" ? review.time * 1000 : Date.now();
  const createdAt = new Date(timestamp).toISOString();
  return {
    id: review.author_url ?? `${fallbackId}-${timestamp}`,
    rating: typeof review.rating === "number" ? review.rating : 0,
    title: null,
    body: review.translated_text ?? review.text ?? null,
    createdAt,
    authorName: review.author_name ?? null,
    vendorReply: null,
    photos: [],
  };
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<GoogleReviewFetchResult | null> {
  const url = new URL(PLACE_DETAILS_ENDPOINT);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,rating,user_ratings_total,reviews,url");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("key", apiKey);

  try {
    const requestInit: NextFetchRequestInit = {
      method: "GET",
      next: { revalidate: 1800 },
    };
    const response = await fetch(url.toString(), requestInit);
    if (!response.ok) {
      console.warn("[google-places] fetchPlaceDetails request failed", response.status, response.statusText);
      return null;
    }
    const data = (await response.json()) as PlaceDetailsResult;
    if (data.status !== "OK" || !data.result) {
      console.warn("[google-places] fetchPlaceDetails returned no usable result", data.status);
      return null;
    }
    const { reviews, rating, user_ratings_total, url: mapsUrl } = data.result;
    const items = Array.isArray(reviews)
      ? reviews
          .filter((review): review is PlaceDetailsReview => Boolean(review))
          .map((review) => mapReviewToVendor(review, placeId))
      : [];

    return {
      placeId,
      url: mapsUrl ?? null,
      ratingAvg: typeof rating === "number" ? rating : null,
      ratingCount: typeof user_ratings_total === "number" ? user_ratings_total : items.length,
      items,
    };
  } catch (error) {
    console.error("[google-places] fetchPlaceDetails threw", error);
    return null;
  }
}

export async function fetchGoogleBusinessReviews(link: string): Promise<GoogleReviewFetchResult | null> {
  if (!link) {
    console.warn("[google-places] fetchGoogleBusinessReviews called without a link");
    return null;
  }
  const apiKey = getPlacesApiKey();
  if (!apiKey) {
    console.warn("[google-places] No Google Places API key configured");
    return null;
  }

  const directPlaceId = extractPlaceIdFromLink(link);
  if (directPlaceId) {
    console.debug("[google-places] extracted place_id from link", directPlaceId);
  } else {
    console.debug("[google-places] no place_id in link, attempting findPlaceIdByText");
  }
  const placeId =
    directPlaceId ?? (await findPlaceIdByText(buildFindPlaceQuery(link), apiKey));
  if (!placeId) {
    console.warn("[google-places] Unable to resolve a place_id for link", link);
    return null;
  }
  console.debug("[google-places] resolved place_id", placeId);

  return fetchPlaceDetails(placeId, apiKey);
}

