// app/shortlist/page.tsx
import ShortlistFavorites from "@/components/shortlist/ShortlistFavorites";

export default function ShortlistPage() {
  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-3">Your favorites</h1>
      <ShortlistFavorites />
    </main>
  );
}
