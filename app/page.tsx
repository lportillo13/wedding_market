"use client";

import Link from "next/link";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";

export default function Home() {
  const { dictionary } = useLanguage();
  const translate = useTranslation();
  const { highlights, categories } = dictionary.home;

  return (
    <main>
      <section className="bg-body-secondary py-5 border-bottom">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="badge bg-primary-subtle text-primary-emphasis mb-3">
                {translate("home.hero.badge")}
              </span>
              <h1 className="display-4 fw-bold text-primary mb-4">{translate("home.hero.title")}</h1>
              <p className="lead text-secondary mb-4">{translate("home.hero.description")}</p>
              <div className="d-flex flex-column flex-sm-row gap-3">
                <Link href="/rfq/new" className="btn btn-primary btn-lg px-4">
                  {translate("home.hero.primaryCta")}
                </Link>
                <Link href="/vendors" className="btn btn-outline-secondary btn-lg px-4">
                  {translate("home.hero.secondaryCta")}
                </Link>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card shadow-sm border-0 overflow-hidden">
                <div className="card-body p-4">
                  <h2 className="h5 text-uppercase text-secondary mb-3">{translate("home.highlights.heading")}</h2>
                  <ul className="list-unstyled mb-0">
                    {highlights.items.map((item, index) => (
                      <li key={item.title} className="d-flex gap-3 mb-3">
                        <div className="flex-shrink-0 rounded-circle bg-primary-subtle text-primary-emphasis d-inline-flex align-items-center justify-content-center" style={{ width: "2.5rem", height: "2.5rem" }}>
                          <span className="fw-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="h6 fw-semibold mb-1">{item.title}</h3>
                          <p className="text-secondary mb-0">{item.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {highlights.items.map((item) => (
              <div key={item.title} className="col-md-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-body p-4">
                    <h3 className="h5 fw-semibold mb-2">{item.title}</h3>
                    <p className="text-secondary mb-0">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-5 border-top border-bottom">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <h2 className="display-6 fw-bold mb-3">{translate("home.categories.heading")}</h2>
              <p className="text-secondary">{translate("home.categories.description")}</p>
            </div>
            <div className="col-lg-6">
              <div className="row g-3">
                {categories.items.map((category) => (
                  <div key={category.slug} className="col-6">
                    <div className="border rounded-4 p-4 h-100 shadow-sm bg-body-tertiary">
                      <p className="fw-semibold mb-1">{category.label}</p>
                      <Link href={`/vendors?category=${encodeURIComponent(category.slug)}`} className="text-primary fw-semibold">
                        {translate("home.categories.seeVendors")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <h2 className="display-6 fw-bold mb-3">{translate("home.plan.heading")}</h2>
              <p className="text-secondary mb-4">{translate("home.plan.description")}</p>
              <Link href="/shortlist" className="btn btn-primary btn-lg px-4">
                {translate("home.plan.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
