"use client";

import { useMemo } from "react";
import ShortlistButton from "@/components/shortlist/ShortlistButton";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorListItem } from "./types";

type VendorsPageContentProps = {
  items: VendorListItem[];
  page: number;
  totalPages: number;
  searchParams: Record<string, string>;
};

function buildPageHref(searchParams: Record<string, string>, page: number) {
  const params = new URLSearchParams({ ...searchParams, page: String(page) });
  if (page <= 1) {
    params.delete("page");
  }
  const query = params.toString();
  return query ? `/vendors?${query}` : "/vendors";
}

export default function VendorsPageContent({ items, page, totalPages, searchParams }: VendorsPageContentProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorsPage;

  const pageLabel = useMemo(
    () => labels.pagination.pageLabel.replace("{current}", String(page)).replace("{total}", String(Math.max(1, totalPages))),
    [labels.pagination.pageLabel, page, totalPages],
  );

  return (
    <main className="container py-4">
      <h1 className="mb-3">{labels.title}</h1>

      <form className="row g-2 mb-4" action="/vendors" method="get">
        <div className="col-md-6">
          <input
            className="form-control"
            name="q"
            placeholder={labels.searchForm.queryPlaceholder}
            defaultValue={searchParams.q || ""}
          />
        </div>
        <div className="col-md-4">
          <input
            className="form-control"
            name="category"
            placeholder={labels.searchForm.categoryPlaceholder}
            defaultValue={searchParams.category || ""}
          />
        </div>
        <div className="col-md-2 d-grid">
          <button className="btn btn-primary" type="submit">
            {labels.searchForm.submit}
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="alert alert-warning">{labels.empty}</div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
          {items.map((v) => {
            const bio = language === "es" ? v.bio_es || v.bio_en || "" : v.bio_en || v.bio_es || "";
            const preview = bio.length > 140 ? `${bio.slice(0, 140)}…` : bio;

            return (
              <div className="col" key={v.id}>
                <div className="card h-100">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title mb-1">
                      <a href={`/vendors/${v.slug}`} className="stretched-link text-decoration-none">
                        {v.business_name}
                      </a>
                    </h5>
                    {v.categories?.length > 0 ? (
                      <div className="mb-2 small text-secondary">{v.categories.join(" • ")}</div>
                    ) : null}
                    {bio ? <p className="card-text flex-grow-1">{preview}</p> : <div className="flex-grow-1" />}
                    <div className="d-flex align-items-center justify-content-between mt-2">
                      <div className="small text-secondary">
                        ⭐ {Number(v.rating_avg || 0).toFixed(1)} ({v.rating_count || 0})
                      </div>
                      <ShortlistButton vendorId={v.id} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <nav className="mt-4" aria-label="Page navigation">
        <ul className="pagination">
          <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
            <a className="page-link" href={buildPageHref(searchParams, Math.max(1, page - 1))}>
              {labels.pagination.prev}
            </a>
          </li>
          <li className="page-item disabled">
            <span className="page-link">{pageLabel}</span>
          </li>
          <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
            <a className="page-link" href={buildPageHref(searchParams, Math.min(totalPages, page + 1))}>
              {labels.pagination.next}
            </a>
          </li>
        </ul>
      </nav>
    </main>
  );
}
