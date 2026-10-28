/** Owner-requested design examples. Never persisted as available vendors. */
import { parseVendorVideoUrl } from './hero';
type TextPair = { en: string; es: string };
type Example = {
  key: string; name: string; category: string; categoryLabel: TextPair;
  city: string; region: string; summary: TextPair; description: TextPair;
  photos: string[]; video?: string; price: number; typical: number; capacity?: number;
  pricing: { key: string; price: number; note: TextPair }[];
  services: TextPair[]; team: TextPair;
};
const words = (en: string, es: string): TextPair => ({ en, es });
export const exampleVendorCopy = {
  en: { badge: 'Sample vendor', title: 'Explore sample vendors', body: 'Fictional profiles for reviewing the design. Photos, prices, availability and reviews are examples. Inquiries and saving are disabled.', back: 'All sample vendors', exit: 'Exit samples', form: 'Preview inquiry', disabled: 'Sample only · sending disabled' },
  es: { badge: 'Proveedor de ejemplo', title: 'Explora proveedores de ejemplo', body: 'Perfiles ficticios para revisar el diseño. Las fotos, los precios, la disponibilidad y las reseñas son ejemplos. Los envíos y favoritos están desactivados.', back: 'Todos los ejemplos', exit: 'Salir de ejemplos', form: 'Ver formulario', disabled: 'Solo ejemplo · envío desactivado' },
};
const examples: Example[] = [
  {
    key: 'villa-brisa', name: 'Villa Brisa', category: 'venues', categoryLabel: words('Venues', 'Lugares'), city: 'Tamarindo', region: 'Guanacaste',
    summary: words('An open-air garden, a candlelit terrace and room for a whole wedding weekend.', 'Un jardín al aire libre, una terraza a la luz de las velas y espacio para todo un fin de semana de boda.'),
    description: words('Imagine exchanging vows beneath the trees before dinner on a warm, open-air terrace. This sample venue brings together a ceremony garden, a covered reception space and a quiet getting-ready suite. Explore the spaces, guest capacity and venue-specific pricing below.', 'Imagina una ceremonia bajo los árboles y una cena en una terraza al aire libre. Este lugar de ejemplo reúne un jardín para la ceremonia, un espacio cubierto para la recepción y una suite para prepararse. Explora los espacios, la capacidad y los precios propios de un lugar para bodas.'),
    photos: ['1519167758481-83f550bb49b3', '1519225421980-715cb0215aed', '1464366400600-7168b8af9bc3'], price: 450000, typical: 780000, capacity: 180,
    pricing: [{ key: 'venue_rental', price: 450000, note: words('Exclusive use of the garden and terrace.', 'Uso exclusivo del jardín y la terraza.') }, { key: 'ceremony_site', price: 80000, note: words('Ceremony setup for up to 120 guests.', 'Montaje de ceremonia para hasta 120 invitados.') }],
    services: [words('Covered reception space', 'Recepción bajo techo'), words('Getting-ready suite', 'Suite para prepararse'), words('Setup and breakdown', 'Montaje y desmontaje')], team: words('Venue coordination', 'Coordinación del lugar'),
  },
  {
    key: 'luz-de-abril', name: 'Luz de Abril', category: 'photography', categoryLabel: words('Photography', 'Fotografía'), city: 'San José', region: 'San José',
    summary: words('Honest moments, soft light and an editorial eye for the details that feel like you.', 'Momentos auténticos, luz suave y una mirada editorial para los detalles que hablan de ustedes.'),
    description: words('A sample photography studio for couples who want their day to feel unhurried. The approach combines gentle portrait direction with candid storytelling, from getting ready to the final dance. Packages show coverage hours, a second photographer and gallery delivery rather than venue capacity.', 'Un estudio de fotografía de ejemplo para parejas que quieren disfrutar su día con calma. Su enfoque combina retratos con dirección natural y momentos espontáneos, desde los preparativos hasta el último baile. Los paquetes muestran horas de cobertura, segundo fotógrafo y entrega de galería.'),
    photos: ['1520854221256-17451cc331bf', '1519741497674-611481863552', '1522673607200-164d1b6ce486'], price: 180000, typical: 290000,
    pricing: [{ key: 'photo_coverage', price: 180000, note: words('Eight hours and an edited online gallery.', 'Ocho horas y una galería digital editada.') }, { key: 'second_shooter', price: 55000, note: words('A second perspective throughout the day.', 'Una segunda perspectiva durante el día.') }],
    services: [words('Digital gallery', 'Galería digital'), words('Engagement session', 'Sesión de compromiso'), words('Second photographer', 'Segundo fotógrafo')], team: words('Lead photographer', 'Fotógrafa principal'),
  },
  {
    key: 'alma-celebraciones', name: 'Alma Celebraciones', category: 'planners', categoryLabel: words('Planning & coordination', 'Planificación y coordinación'), city: 'Escazú', region: 'San José',
    summary: words('Thoughtful planning, a clear timeline and space to enjoy every part of the celebration.', 'Una planificación cuidadosa, tiempos claros y espacio para disfrutar cada parte de la celebración.'),
    description: words('From the first moodboard to the wedding-week timeline, this sample planning team shows how a full-service profile can explain its process. Services include budget guidance, vendor coordination and a bilingual on-site team. The scope can grow from month-of coordination to a complete destination weekend.', 'Desde las primeras ideas hasta el cronograma de la semana de boda, este equipo de ejemplo muestra cómo explicar un servicio de planificación integral. Incluye orientación de presupuesto, coordinación de proveedores y un equipo bilingüe en sitio. El alcance va desde la coordinación del mes hasta un fin de semana de destino completo.'),
    photos: ['1511285560929-80b456fea0bc', '1505236858219-8359eb29e329', '1529636798458-92182e662485'], price: 220000, typical: 480000,
    pricing: [{ key: 'month_of_coordination', price: 220000, note: words('Final timeline and wedding-day coordination.', 'Cronograma final y coordinación del día.') }, { key: 'full_planning', price: 480000, note: words('Planning, supplier management and event production.', 'Planificación, gestión de proveedores y producción.') }],
    services: [words('Budget guidance', 'Guía de presupuesto'), words('Vendor coordination', 'Coordinación de proveedores'), words('Bilingual team', 'Equipo bilingüe')], team: words('Lead planner', 'Planner principal'),
  },
  {
    key: 'tallo-floral', name: 'Tallo Floral', category: 'flowers', categoryLabel: words('Flowers & decor', 'Flores y decoración'), city: 'Heredia', region: 'Heredia',
    summary: words('Seasonal flowers, sculptural arrangements and tables that invite everyone to linger.', 'Flores de temporada, arreglos con movimiento y mesas que invitan a quedarse.'),
    description: words('A sample floral design studio with a natural, garden-inspired approach. Explore ceremony installations, bridal flowers and reception tablescapes with a palette developed around the venue and season. The example pricing separates personal flowers from larger floral installations.', 'Un estudio floral de ejemplo con un estilo natural inspirado en los jardines. Explora instalaciones para ceremonia, flores personales y mesas para la recepción, con una paleta que acompaña el lugar y la temporada. Los precios separan los ramos y flores personales de las instalaciones florales.'),
    photos: ['1469371670807-013ccf25f16a', '1523438885200-e635ba2c371e', '1502635385003-ee1e6a1a742d'], price: 95000, typical: 380000,
    pricing: [{ key: 'personal_flowers', price: 95000, note: words('Bridal bouquet and coordinated personal flowers.', 'Ramo de novia y flores personales coordinadas.') }, { key: 'ceremony_florals', price: 240000, note: words('An installation designed for the ceremony setting.', 'Una instalación diseñada para el espacio de ceremonia.') }],
    services: [words('Seasonal floral design', 'Diseño floral de temporada'), words('Ceremony installations', 'Instalaciones para ceremonia'), words('Tablescape styling', 'Diseño de mesas')], team: words('Floral designer', 'Diseñadora floral'),
  },
  {
    key: 'mesa-compartida', name: 'Mesa Compartida', category: 'catering', categoryLabel: words('Catering', 'Catering'), city: 'Atenas', region: 'Alajuela',
    summary: words('Seasonal menus and generous hospitality, from cocktail hour to the last shared plate.', 'Menús de temporada y hospitalidad, desde el cóctel hasta el último plato compartido.'),
    description: words('This sample catering profile brings together a seasonal menu, attentive table service and flexible dietary options. Compare a plated dinner with a cocktail-hour menu, explore tastings and see how per-person pricing differs from other services.', 'Este catering de ejemplo reúne un menú de temporada, un servicio atento y opciones para diferentes necesidades alimentarias. Compara una cena servida con un menú de cóctel, explora las degustaciones y revisa cómo se presenta el precio por persona.'),
    photos: ['1555244162-803834f70033', '1414235077428-338989a2e8c0', '1464366400600-7168b8af9bc3'], price: 8500, typical: 12500, capacity: 250,
    pricing: [{ key: 'plated_dinner', price: 8500, note: words('Per person; three courses and table service.', 'Por persona; tres tiempos y servicio a la mesa.') }, { key: 'cocktail_hour', price: 3200, note: words('Per person; a selection of seasonal bites.', 'Por persona; selección de bocados de temporada.') }],
    services: [words('Menu tasting', 'Degustación de menú'), words('Dietary accommodations', 'Opciones alimentarias'), words('Service staff', 'Personal de servicio')], team: words('Executive chef', 'Chef ejecutivo'),
  },
  {
    key: 'ritmo-atardecer', name: 'Ritmo Atardecer', category: 'music', categoryLabel: words('Music & entertainment', 'Música y entretenimiento'), city: 'Santa Teresa', region: 'Puntarenas',
    video: 'https://www.youtube.com/watch?v=JgzkqjnsIvM',
    summary: words('An acoustic ceremony, a relaxed cocktail set and a dance floor that feels like your crowd.', 'Una ceremonia acústica, un cóctel relajado y una pista de baile con su propia energía.'),
    description: words('A sample music collective for every part of a wedding day. Start with a ceremony duo, move into a live cocktail set and finish with a DJ. The service details show sound setup, musical preferences and bilingual announcements without borrowing venue-specific fields.', 'Un colectivo musical de ejemplo para cada momento de la boda. Empieza con un dúo para la ceremonia, sigue con música en vivo para el cóctel y termina con DJ. Los servicios muestran el sonido, las preferencias musicales y las presentaciones bilingües.'),
    photos: ['1511795409834-ef04bbd61622', '1470225620780-dba8ba36b745', '1493225457124-a3eb161ffa5f'], price: 90000, typical: 210000,
    pricing: [{ key: 'ceremony_music', price: 90000, note: words('Acoustic duo and ceremony sound.', 'Dúo acústico y sonido para ceremonia.') }, { key: 'dj_package', price: 160000, note: words('Four-hour reception set with sound setup.', 'Cuatro horas de recepción con montaje de sonido.') }],
    services: [words('Live ceremony music', 'Música en vivo para ceremonia'), words('DJ reception set', 'DJ para recepción'), words('Sound setup', 'Montaje de sonido')], team: words('Music director', 'Director musical'),
  },
];

export function isExampleVendor(value: string) {
  return examples.some(example => value === `example-${example.key}`);
}

export function getExampleVendor(slug: string, language: 'en' | 'es' = 'en') {
  const example = examples.find(item => slug === `example-${item.key}`);
  if (!example) return null;
  const photos = example.photos.map((photo, index) => ({
    url: `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=1400&q=82`,
    public_id: `${slug}-photo-${index}`, width: 1400, height: 1000, format: 'jpg', type: 'image' as const,
    caption: language === 'es' ? 'Fotografía de referencia · Unsplash' : 'Reference photography · Unsplash', sort: index,
  }));
  const reviewBody = words('This is sample feedback to review the layout, typography and vendor response. It does not describe a real booking.', 'Esta reseña de ejemplo permite revisar el diseño, la tipografía y la respuesta del proveedor. No describe una contratación real.');
  return {
    id: slug, slug, is_example: true as const, business_name: example.name,
    bio_en: example.summary.en, bio_es: example.summary.es,
    extra_info_en: example.description.en, extra_info_es: example.description.es,
    created_at: '2026-10-28T12:00:00Z', categories: [example.category],
    category_details: [{ key: example.category, slug: example.category, label: example.categoryLabel[language] }],
    city: example.city, region: example.region, country: 'Costa Rica',
    location: { city: example.city, region: example.region, country: 'Costa Rica', address_label: null },
    logo_url: null, hero_image: photos[0], thumbnail_image: photos[0], gallery_images: photos, media: photos,
    hero_video: parseVendorVideoUrl(example.video),
    starting_price_cents: example.price, starting_price_currency: 'USD',
    typical_spend_cents: example.typical, typical_spend_currency: 'USD', capacity_max: example.capacity ?? null,
    phone: null, website_url: null, years_in_business: 6, languages: ['English', 'Español'], team_size_range: '2–4',
    event_types: [language === 'es' ? 'Bodas' : 'Weddings'], peak_seasons: [], review_ai_summary: null,
    spaces: example.category === 'venues' ? [
      { id: `${slug}-garden`, name: language === 'es' ? 'Jardín de ceremonia' : 'Ceremony garden', description: language === 'es' ? 'Espacio de ejemplo para una ceremonia al aire libre.' : 'An example outdoor ceremony setting.', capacity_min: 30, capacity_max: 120 },
      { id: `${slug}-terrace`, name: language === 'es' ? 'Terraza de recepción' : 'Reception terrace', description: language === 'es' ? 'Un espacio cubierto para cenar y celebrar.' : 'A covered space for dinner and celebration.', capacity_min: 50, capacity_max: 180 },
    ] : [],
    pricing: example.pricing.map(item => ({ item_key: item.key, price_cents: item.price, currency: 'USD', contact_for_price: false, notes: item.note[language] })),
    amenities: { amenities: [], ceremony_types: [], settings: [], services: example.services.map((text, index) => ({ key: `${slug}-service-${index}`, label: text[language] })) },
    team: [{ id: `${slug}-team`, name: language === 'es' ? 'Equipo de ejemplo' : 'Sample team', title: example.team[language], bio: language === 'es' ? 'Perfil ficticio para revisar la presentación del equipo.' : 'Fictional profile for reviewing the team presentation.', headshot_url: null, responds_within_hours: 24 }],
    availability: [{ id: `${slug}-date-1`, date: '2026-11-14', status: 'available' as const }, { id: `${slug}-date-2`, date: '2026-11-21', status: 'busy' as const }],
    rating_avg: 4.5, rating_count: 2,
    reviews: [5, 4].map((rating, index) => ({ id: `${slug}-review-${index}`, rating, title: language === 'es' ? 'Reseña de ejemplo' : 'Sample review', body: reviewBody[language], created_at: '2026-10-01T12:00:00Z' })),
    review_distribution: [5, 4, 3, 2, 1].map(rating => ({ rating, count: rating >= 4 ? 1 : 0 })),
  };
}

export function searchExampleVendors(params: { q?: string; category?: string; page?: number; pageSize?: number; language?: 'en' | 'es' } = {}) {
  const page = Number.isInteger(params.page) && params.page! > 0 ? Math.min(params.page!, 1000) : 1;
  const pageSize = Number.isInteger(params.pageSize) && params.pageSize! > 0 ? Math.min(params.pageSize!, 50) : 12;
  const query = (params.q ?? '').trim().slice(0, 100).toLocaleLowerCase();
  const category = (params.category ?? '').trim().toLowerCase();
  const items = examples.filter(item => (!category || item.category === category) && (!query ||
    [item.name, item.city, item.region, item.summary.en, item.summary.es, item.category, item.categoryLabel.en, item.categoryLabel.es].join(' ').toLocaleLowerCase().includes(query)))
    .map(item => getExampleVendor(`example-${item.key}`, params.language)!);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
}
