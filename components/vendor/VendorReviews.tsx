"use client";

import Image from "next/image";
import clsx from "clsx";
import { useMemo, useState, type ChangeEvent } from "react";
import AutocompleteInput from "@/components/search/AutocompleteInput";
import { buildAutocompleteSuggestions } from "@/lib/search/autocomplete";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorProfileDTO, VendorReviewItem } from "@/types/vendor-profile";

type VendorReviewsProps = {
  reviews: VendorProfileDTO["reviews"];
};

const PAGE_SIZE = 5;

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function matchesSearch(review: VendorReviewItem, term: string): boolean {
  if (!term) return true;
  const normalized = term.toLowerCase();
  const titleMatch = review.title?.toLowerCase().includes(normalized) ?? false;
  const bodyMatch = review.body?.toLowerCase().includes(normalized) ?? false;
  const authorMatch = review.authorName?.toLowerCase().includes(normalized) ?? false;
  return titleMatch || bodyMatch || authorMatch;
}

function sortReviews(items: VendorReviewItem[], sortOrder: string): VendorReviewItem[] {
  const sorted = [...items];
  switch (sortOrder) {
    case "highest":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "lowest":
      return sorted.sort((a, b) => a.rating - b.rating);
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export default function VendorReviews({ reviews }: VendorReviewsProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic.reviews;
  const photoAlt = dictionary.vendorPublic.gallery.reviewPhotoAlt;
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const isGoogleSource = reviews.source === "google";
  const externalLink = reviews.externalUrl;

  const filteredReviews = useMemo(() => {
    const filtered = reviews.items.filter((review) => {
      const matchesRating = ratingFilter === "all" ? true : Math.round(review.rating) === ratingFilter;
      return matchesRating && matchesSearch(review, searchTerm);
    });
    return sortReviews(filtered, sortOrder);
  }, [ratingFilter, reviews.items, searchTerm, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredReviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const maxDistribution = Math.max(...reviews.summary.distribution.map((item) => item.count), 1);
  const reviewSuffix = reviews.summary.ratingCount === 1 ? "" : "s";

  const locale = language === "es" ? "es-ES" : "en-US";
  const searchSuggestions = useMemo(
    () => buildAutocompleteSuggestions(reviews.items.flatMap((review) => [review.title, review.authorName, review.body]), 20),
    [reviews.items],
  );

  return (
    <div>
      <div className="d-flex flex-column flex-lg-row gap-4">
        <div className="flex-grow-1">
          <h2 className="h3 mb-3">{labels.heading}</h2>
          <div className="d-flex align-items-baseline gap-3 mb-3">
            <div className="display-5 fw-semibold">{reviews.summary.ratingAvg?.toFixed(1) ?? "--"}</div>
            <div className="text-muted">{fill(labels.basedOn, { count: reviews.summary.ratingCount, suffix: reviewSuffix })}</div>
          </div>
          {reviews.summary.aiSummary ? <div className="alert alert-secondary" role="status">{reviews.summary.aiSummary}</div> : null}

          {isGoogleSource ? (
            <div className="alert alert-light border d-flex flex-column flex-md-row align-items-md-center gap-3" role="note">
              <span className="flex-grow-1">{labels.googleSource}</span>
              {externalLink ? (
                <a href={externalLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary align-self-start align-self-md-center">
                  {labels.viewOnGoogle}
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="mb-4">
            <label htmlFor="review-search" className="form-label">{labels.searchLabel}</label>
            <AutocompleteInput
              id="review-search"
              className="form-control"
              placeholder={labels.searchPlaceholder}
              value={searchTerm}
              onValueChange={(value) => {
                setSearchTerm(value);
                setPage(1);
              }}
              ariaLabel={labels.searchLabel}
              suggestions={searchSuggestions}
            />
          </div>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div className="btn-group" role="group" aria-label={labels.filterAria}>
              <button type="button" className={clsx("btn btn-outline-secondary", { active: ratingFilter === "all" })} onClick={() => { setRatingFilter("all"); setPage(1); }}>
                {labels.all}
              </button>
              {[5, 4, 3, 2, 1].map((value) => (
                <button key={value} type="button" className={clsx("btn btn-outline-secondary", { active: ratingFilter === value })} onClick={() => { setRatingFilter(value); setPage(1); }}>
                  {value}★
                </button>
              ))}
            </div>
            <div className="ms-auto">
              <label htmlFor="review-sort" className="form-label me-2 mb-0">{labels.sortBy}</label>
              <select id="review-sort" className="form-select d-inline-block w-auto" value={sortOrder} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSortOrder(event.target.value)}>
                <option value="newest">{labels.newest}</option>
                <option value="highest">{labels.highest}</option>
                <option value="lowest">{labels.lowest}</option>
              </select>
            </div>
          </div>

          {paginated.length ? (
            <ul className="list-unstyled">
              {paginated.map((review) => (
                <li key={review.id} className="border rounded p-4 mb-3">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-2">
                    <div>
                      <strong>{review.authorName ?? labels.verifiedCouple}</strong>
                      <div className="text-warning">{"★".repeat(Math.round(review.rating))}</div>
                    </div>
                    <time dateTime={review.createdAt} className="text-muted small">
                      {new Date(review.createdAt).toLocaleDateString(locale)}
                    </time>
                  </div>
                  {review.title ? <h3 className="h5">{review.title}</h3> : null}
                  {review.body ? <p>{review.body}</p> : null}
                  {review.vendorReply ? <div className="alert alert-light border mt-3"><strong>{labels.vendorReply}</strong> {review.vendorReply}</div> : null}
                  {review.photos.length ? (
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      {review.photos.map((photo, index) => (
                        <figure key={`${review.id}-photo-${index}`} className="ratio ratio-1x1" style={{ width: "100px" }}>
                          <Image src={photo.url} alt={photo.alt ?? photoAlt} fill sizes="100px" className="img-thumbnail w-100 h-100 object-fit-cover" />
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">{labels.noMatches}</p>
          )}

          {totalPages > 1 ? (
            <nav aria-label={labels.pagination} className="mt-4">
              <ul className="pagination">
                <li className={clsx("page-item", { disabled: currentPage === 1 })}>
                  <button type="button" className="page-link" onClick={() => setPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}>{labels.previous}</button>
                </li>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <li key={pageNumber} className={clsx("page-item", { active: pageNumber === currentPage })}>
                    <button type="button" className="page-link" onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                  </li>
                ))}
                <li className={clsx("page-item", { disabled: currentPage === totalPages })}>
                  <button type="button" className="page-link" onClick={() => setPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}>{labels.next}</button>
                </li>
              </ul>
            </nav>
          ) : null}
        </div>

        <aside className="flex-shrink-0" aria-label={labels.breakdownAria} style={{ minWidth: "240px" }}>
          <h3 className="h5">{labels.distribution}</h3>
          <ul className="list-unstyled mb-4">
            {reviews.summary.distribution.map((bucket) => (
              <li key={bucket.rating} className="mb-2">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span>{fill(labels.stars, { count: bucket.rating })}</span>
                  <span className="text-muted small">{bucket.count}</span>
                </div>
                <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={maxDistribution} aria-valuenow={bucket.count}>
                  <div className="progress-bar bg-warning" style={{ width: `${(bucket.count / maxDistribution) * 100}%` }} aria-label={fill(labels.distributionAria, { count: bucket.count, stars: bucket.rating })} />
                </div>
              </li>
            ))}
          </ul>
          {reviews.summary.distribution.length === 0 ? <p className="text-muted small">{labels.noReviews}</p> : null}
        </aside>
      </div>
    </div>
  );
}
