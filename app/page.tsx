import Link from "next/link";

const highlights = [
  {
    title: "Curated vendor matches",
    description:
      "Answer a few questions and we will surface venues, photographers, florists and more who fit your style and budget.",
  },
  {
    title: "One place to compare quotes",
    description:
      "Send requests with a single click and keep every response organised so you can review availability, pricing and reviews side by side.",
  },
  {
    title: "Plan with total confidence",
    description:
      "Favourite the vendors you love, share shortlists with your partner and book with the support of our wedding planning team.",
  },
];

const categories = [
  "Venues",
  "Photography",
  "Catering",
  "Beauty",
  "Entertainment",
  "Decor",
];

export default function Home() {
  return (
    <main>
      <section className="bg-body-secondary py-5 border-bottom">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="badge bg-primary-subtle text-primary-emphasis mb-3">All-in-one wedding marketplace</span>
              <h1 className="display-4 fw-bold text-primary mb-4">
                Plan your dream wedding with less stress
              </h1>
              <p className="lead text-secondary mb-4">
                Discover trusted professionals, compare quotes instantly and book your favourites without leaving the platform.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3">
                <Link href="/rfq/new" className="btn btn-primary btn-lg px-4">
                  Get personalised quotes
                </Link>
                <Link href="/vendors" className="btn btn-outline-secondary btn-lg px-4">
                  Browse vendors
                </Link>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card shadow-sm border-0 overflow-hidden">
                <div className="card-body p-4">
                  <h2 className="h5 text-uppercase text-secondary mb-3">Why couples choose us</h2>
                  <ul className="list-unstyled mb-0">
                    {highlights.map((item, index) => (
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
            {highlights.map((item) => (
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
              <h2 className="display-6 fw-bold mb-3">Explore popular categories</h2>
              <p className="text-secondary">
                Whether you&apos;re searching for the perfect venue or putting the finishing touches on decor, our directory showcases
                vetted professionals across every category.
              </p>
            </div>
            <div className="col-lg-6">
              <div className="row g-3">
                {categories.map((category) => (
                  <div key={category} className="col-6">
                    <div className="border rounded-4 p-4 h-100 shadow-sm bg-body-tertiary">
                      <p className="fw-semibold mb-1">{category}</p>
                      <Link href={`/vendors?category=${encodeURIComponent(category.toLowerCase())}`} className="text-primary fw-semibold">
                        See vendors →
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
              <h2 className="display-6 fw-bold mb-3">Ready to start planning?</h2>
              <p className="text-secondary mb-4">
                Build a shortlist, share it with your partner and message vendors directly. Wedding Market keeps your planning journey
                organised from the first idea to the final booking.
              </p>
              <Link href="/shortlist" className="btn btn-primary btn-lg px-4">
                View your shortlist
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
