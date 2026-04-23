const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const connectionString = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const seedBatch = process.env.RANDOM_VENDOR_SEED_BATCH || 'random-provider-seed-v1';
const vendorsPerCategory = Math.max(1, Number(process.env.RANDOM_VENDORS_PER_CATEGORY || 8));
const reviewClientEmail = 'client.reviews@wedding-market.local';
const reviewClientPassword = 'TestPass!3001';

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const defaultCategories = [
  { key: 'venues', slug: 'venues', label: { en: 'Venues', es: 'Lugares' } },
  { key: 'planners', slug: 'planners', label: { en: 'Planners & Coordinators', es: 'Organizadores' } },
  { key: 'photography', slug: 'photography', label: { en: 'Photography', es: 'Fotografia' } },
  { key: 'videography', slug: 'videography', label: { en: 'Videography', es: 'Videografia' } },
  { key: 'catering', slug: 'catering', label: { en: 'Catering', es: 'Catering' } },
  { key: 'cakes', slug: 'cakes', label: { en: 'Cakes & Desserts', es: 'Tortas y Postres' } },
  { key: 'bar', slug: 'bar', label: { en: 'Bar Service', es: 'Barra' } },
  { key: 'music', slug: 'music', label: { en: 'Music & Entertainment', es: 'Musica y Entretenimiento' } },
  { key: 'flowers', slug: 'flowers', label: { en: 'Flowers & Decor', es: 'Flores y Decoracion' } },
  { key: 'lighting', slug: 'lighting', label: { en: 'Lighting & AV', es: 'Iluminacion y AV' } },
  { key: 'rentals', slug: 'rentals', label: { en: 'Rentals', es: 'Alquileres' } },
  { key: 'beauty', slug: 'beauty', label: { en: 'Hair & Makeup', es: 'Belleza' } },
  { key: 'attire', slug: 'attire', label: { en: 'Attire & Accessories', es: 'Vestimenta y Accesorios' } },
  { key: 'officiants', slug: 'officiants', label: { en: 'Officiants', es: 'Oficiantes' } },
  { key: 'stationery', slug: 'stationery', label: { en: 'Stationery & Invitations', es: 'Papeleria e Invitaciones' } },
  { key: 'photobooth', slug: 'photobooth', label: { en: 'Photo Booth', es: 'Cabina de Fotos' } },
  { key: 'transport', slug: 'transport', label: { en: 'Transportation', es: 'Transporte' } },
  { key: 'accommodations', slug: 'accommodations', label: { en: 'Accommodations & Room Blocks', es: 'Alojamiento' } },
  { key: 'destination_planning', slug: 'destination-planning', label: { en: 'Destination & Travel Planning', es: 'Planificacion de Destinos' } },
];

const categoryAliases = {
  decor: 'flowers',
  destination: 'destination_planning',
  planning: 'planners',
  transportation: 'transport',
};

const categoryPresets = {
  venues: {
    nouns: ['Estate', 'Garden', 'House', 'Hall', 'Terrace', 'Club', 'Villas', 'Loft'],
    specialties: ['ceremony lawns', 'waterfront receptions', 'historic ballrooms', 'all-weekend celebrations'],
    price: [650000, 2400000],
    capacity: [80, 450],
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=82',
    ],
  },
  photography: {
    nouns: ['Lens', 'Frame', 'Studio', 'Collective', 'Light', 'Portraits', 'Films', 'Archive'],
    specialties: ['editorial portraits', 'documentary coverage', 'film-inspired galleries', 'full-day storytelling'],
    price: [220000, 850000],
    capacity: [50, 350],
    images: [
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=82',
    ],
  },
  catering: {
    nouns: ['Table', 'Kitchen', 'Harvest', 'Supper', 'Cuisine', 'Feast', 'Pantry', 'Plate'],
    specialties: ['seasonal menus', 'cocktail stations', 'family-style dinners', 'late-night bites'],
    price: [480000, 1800000],
    capacity: [60, 500],
    images: [
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=82',
    ],
  },
  beauty: {
    nouns: ['Beauty', 'Atelier', 'Glam', 'Glow', 'Brush', 'Suite', 'Luxe', 'Artists'],
    specialties: ['bridal makeup', 'hair styling', 'touch-up teams', 'skin-first beauty'],
    price: [65000, 420000],
    capacity: [10, 180],
    images: [
      'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1400&q=82',
    ],
  },
  music: {
    nouns: ['Sounds', 'Band', 'DJ Co.', 'Rhythm', 'Audio', 'Groove', 'Strings', 'Collective'],
    specialties: ['ceremony audio', 'dance-floor sets', 'live cocktail music', 'bilingual MC service'],
    price: [120000, 720000],
    capacity: [50, 600],
    images: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=82',
    ],
  },
  decor: {
    nouns: ['Florals', 'Design', 'Blooms', 'Petals', 'Studio', 'Installations', 'Tablescape', 'House'],
    specialties: ['floral installations', 'tablescape design', 'ceremony arches', 'candlelit receptions'],
    price: [180000, 1350000],
    capacity: [30, 450],
    images: [
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&w=1400&q=82',
    ],
  },
  planning: {
    nouns: ['Events', 'Planning', 'Affairs', 'Occasions', 'Details', 'Union', 'Fete', 'Moments'],
    specialties: ['full-service planning', 'month-of coordination', 'destination logistics', 'vendor management'],
    price: [280000, 1400000],
    capacity: [40, 500],
    images: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1400&q=82',
    ],
  },
  transportation: {
    nouns: ['Rides', 'Cars', 'Transit', 'Valet', 'Fleet', 'Coach', 'Routes', 'Chauffeurs'],
    specialties: ['guest shuttles', 'classic getaway cars', 'valet teams', 'airport transfers'],
    price: [95000, 650000],
    capacity: [20, 300],
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1400&q=82',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=82',
    ],
  },
};

const categoryServiceProfiles = {};

Object.assign(categoryServiceProfiles, {
  venues: {
    base: 'venues',
    capacity: [80, 450],
    specialties: ['ceremony lawns', 'waterfront receptions', 'historic ballrooms', 'all-weekend celebrations'],
    eventTypes: ['ceremony', 'reception', 'welcome party'],
    pricing: ['venue_rental', 'ceremony_site', 'reception_package', 'bar_package'],
    details: [
      ['Signature event spaces', 'Espacios principales'],
      ['Guest experience', 'Experiencia de invitados'],
    ],
    amenities: [
      ['parking', 'amenities', 'Parking', 'Estacionamiento'],
      ['bridal_suite', 'amenities', 'Getting-ready suite', 'Suite para prepararse'],
      ['outdoor_space', 'settings', 'Outdoor space', 'Espacio exterior'],
      ['indoor_space', 'settings', 'Indoor space', 'Espacio interior'],
      ['onsite_coordination', 'services', 'On-site coordination', 'Coordinacion en sitio'],
      ['setup_breakdown', 'services', 'Setup and breakdown', 'Montaje y desmontaje'],
    ],
    teamTitles: [['Venue director', 'Director del lugar'], ['Event operations lead', 'Lider de operaciones']],
    reviewTrait: 'room flow, vendor access, and guest comfort',
  },
  planners: {
    base: 'planning',
    capacity: null,
    specialties: ['full-service planning', 'month-of coordination', 'destination logistics', 'vendor management'],
    eventTypes: ['full planning', 'partial planning', 'coordination'],
    pricing: ['full_planning', 'partial_planning', 'month_of_coordination', 'destination_weekend'],
    details: [['Planning scope', 'Alcance de planificacion'], ['Wedding week management', 'Gestion de la semana']],
    amenities: [
      ['planning_budget_tracker', 'amenities', 'Budget tracking', 'Control de presupuesto'],
      ['planning_vendor_management', 'services', 'Vendor management', 'Gestion de proveedores'],
      ['planning_timeline', 'services', 'Timeline creation', 'Creacion de cronograma'],
      ['planning_design_guidance', 'settings', 'Design guidance', 'Guia de diseno'],
    ],
    teamTitles: [['Lead planner', 'Planner principal'], ['Production coordinator', 'Coordinador de produccion']],
    reviewTrait: 'clear timelines, vendor communication, and calm event management',
  },
  photography: {
    base: 'photography',
    capacity: null,
    specialties: ['editorial portraits', 'documentary coverage', 'film-inspired galleries', 'full-day storytelling'],
    eventTypes: ['weddings', 'engagement sessions', 'rehearsal dinners'],
    pricing: ['photo_coverage', 'engagement_session', 'second_shooter', 'wedding_album'],
    details: [['Coverage approach', 'Enfoque de cobertura'], ['Gallery delivery', 'Entrega de galeria']],
    amenities: [
      ['photography_digital_files', 'amenities', 'Digital files', 'Archivos digitales'],
      ['photography_print_rights', 'amenities', 'Print rights', 'Derechos de impresion'],
      ['photography_engagement', 'ceremony_types', 'Engagement sessions', 'Sesiones de compromiso'],
      ['photography_documentary', 'settings', 'Documentary style', 'Estilo documental'],
      ['photography_second_shooter', 'services', 'Second photographer', 'Segundo fotografo'],
    ],
    teamTitles: [['Lead photographer', 'Fotografo principal'], ['Gallery editor', 'Editor de galeria']],
    reviewTrait: 'portrait direction, timeline guidance, and gallery delivery',
  },
  videography: {
    base: 'photography',
    capacity: null,
    specialties: ['cinematic highlight films', 'documentary edits', 'drone footage', 'ceremony audio capture'],
    eventTypes: ['weddings', 'ceremonies', 'rehearsal dinners'],
    pricing: ['highlight_film', 'documentary_film', 'raw_footage', 'drone_addon'],
    details: [['Film coverage', 'Cobertura de video'], ['Editing workflow', 'Flujo de edicion']],
    amenities: [
      ['videography_highlight', 'amenities', 'Highlight film', 'Video resumen'],
      ['videography_raw_footage', 'amenities', 'Raw footage option', 'Opcion de material sin editar'],
      ['videography_ceremony', 'ceremony_types', 'Ceremony coverage', 'Cobertura de ceremonia'],
      ['videography_cinematic', 'settings', 'Cinematic style', 'Estilo cinematografico'],
      ['videography_drone', 'services', 'Drone footage', 'Tomas con drone'],
    ],
    teamTitles: [['Lead filmmaker', 'Filmmaker principal'], ['Editor', 'Editor']],
    reviewTrait: 'audio quality, cinematic edits, and clear delivery expectations',
  },
});

Object.assign(categoryServiceProfiles, {
  catering: {
    base: 'catering',
    capacity: [60, 500],
    specialties: ['seasonal menus', 'cocktail stations', 'family-style dinners', 'late-night bites'],
    eventTypes: ['cocktail hour', 'reception dinner', 'late-night service'],
    pricing: ['plated_dinner', 'buffet_service', 'cocktail_hour', 'late_night_snacks'],
    details: [['Menu planning', 'Plan de menu'], ['Service flow', 'Flujo de servicio']],
    amenities: [
      ['catering_tastings', 'amenities', 'Tastings', 'Degustaciones'],
      ['catering_dietary', 'amenities', 'Dietary accommodations', 'Opciones dietarias'],
      ['catering_latin', 'ceremony_types', 'Latin cuisine', 'Cocina latina'],
      ['catering_buffet', 'settings', 'Buffet service', 'Servicio buffet'],
      ['catering_staffing', 'services', 'Service staff', 'Personal de servicio'],
    ],
    teamTitles: [['Executive chef', 'Chef ejecutivo'], ['Catering manager', 'Gerente de catering']],
    reviewTrait: 'menu clarity, tasting experience, and dinner service timing',
  },
  cakes: {
    base: 'catering',
    capacity: null,
    specialties: ['tiered wedding cakes', 'dessert bars', 'custom flavors', 'delivery and setup'],
    eventTypes: ['wedding cakes', 'dessert tables', 'rehearsal desserts'],
    pricing: ['wedding_cake', 'dessert_bar', 'tasting', 'delivery_setup'],
    details: [['Design process', 'Proceso de diseno'], ['Dessert service', 'Servicio de postres']],
    amenities: [
      ['cakes_tastings', 'amenities', 'Tastings', 'Degustaciones'],
      ['cakes_gluten_free', 'amenities', 'Gluten-free options', 'Opciones sin gluten'],
      ['cakes_classic_flavors', 'ceremony_types', 'Classic flavors', 'Sabores clasicos'],
      ['cakes_modern_design', 'settings', 'Modern designs', 'Disenos modernos'],
      ['cakes_delivery', 'services', 'Delivery and setup', 'Entrega y montaje'],
    ],
    teamTitles: [['Cake designer', 'Disenador de tortas'], ['Pastry lead', 'Lider de pasteleria']],
    reviewTrait: 'flavor guidance, display planning, and on-time delivery',
  },
  bar: {
    base: 'catering',
    capacity: [50, 450],
    specialties: ['hosted bars', 'signature cocktails', 'mobile bartending', 'non-alcoholic menus'],
    eventTypes: ['cocktail hour', 'reception', 'welcome party'],
    pricing: ['hosted_bar', 'signature_cocktails', 'bartenders', 'non_alcoholic'],
    details: [['Beverage planning', 'Plan de bebidas'], ['Service setup', 'Montaje de barra']],
    amenities: [
      ['bar_mobile_bar', 'amenities', 'Mobile bar', 'Barra movil'],
      ['bar_mocktails', 'amenities', 'Mocktails', 'Mocktails'],
      ['bar_open_bar', 'ceremony_types', 'Open bar', 'Barra abierta'],
      ['bar_craft_cocktails', 'settings', 'Craft cocktails', 'Cocteles artesanales'],
      ['bar_bartenders', 'services', 'Licensed bartenders', 'Bartenders autorizados'],
    ],
    teamTitles: [['Lead bartender', 'Bartender principal'], ['Beverage manager', 'Gerente de bebidas']],
    reviewTrait: 'bar timing, responsible service, and cocktail quality',
  },
  music: {
    base: 'music',
    capacity: null,
    specialties: ['ceremony audio', 'dance-floor sets', 'live cocktail music', 'bilingual MC service'],
    eventTypes: ['ceremony', 'cocktail hour', 'reception'],
    pricing: ['dj_reception', 'ceremony_audio', 'live_music', 'lighting_addon'],
    details: [['Music planning', 'Plan musical'], ['Sound setup', 'Montaje de sonido']],
    amenities: [
      ['music_wireless_mics', 'amenities', 'Wireless mics', 'Microfonos inalambricos'],
      ['music_sound_equipment', 'amenities', 'Sound equipment', 'Equipo de sonido'],
      ['music_ceremony', 'ceremony_types', 'Ceremony music', 'Musica de ceremonia'],
      ['music_latin', 'settings', 'Latin music', 'Musica latina'],
      ['music_mc', 'services', 'MC services', 'Servicios de MC'],
    ],
    teamTitles: [['Lead DJ', 'DJ principal'], ['MC and audio tech', 'MC y tecnico de audio']],
    reviewTrait: 'playlist planning, announcements, and dance floor energy',
  },
  flowers: {
    base: 'decor',
    capacity: null,
    specialties: ['floral installations', 'tablescape design', 'ceremony arches', 'candlelit receptions'],
    eventTypes: ['ceremony flowers', 'reception decor', 'personal flowers'],
    pricing: ['bridal_party_flowers', 'ceremony_installation', 'reception_centerpieces', 'delivery_setup'],
    details: [['Floral scope', 'Alcance floral'], ['Design process', 'Proceso de diseno']],
    amenities: [
      ['flowers_bouquets', 'amenities', 'Bouquets', 'Ramos'],
      ['flowers_centerpieces', 'amenities', 'Centerpieces', 'Centros de mesa'],
      ['flowers_aisle_decor', 'ceremony_types', 'Aisle decor', 'Decoracion de pasillo'],
      ['flowers_romantic', 'settings', 'Romantic garden style', 'Estilo jardin romantico'],
      ['flowers_delivery', 'services', 'Delivery and strike', 'Entrega y desmontaje'],
    ],
    teamTitles: [['Lead floral designer', 'Disenador floral principal'], ['Installation lead', 'Lider de montaje']],
    reviewTrait: 'seasonal flower guidance, installation planning, and design polish',
  },
});

Object.assign(categoryServiceProfiles, {
  lighting: {
    base: 'music',
    capacity: null,
    specialties: ['uplighting', 'ceremony audio', 'dance floor lighting', 'AV production'],
    eventTypes: ['ceremony', 'reception', 'after party'],
    pricing: ['uplighting', 'ceremony_audio', 'av_package', 'dance_floor_lighting'],
    details: [['Production scope', 'Alcance de produccion'], ['Lighting design', 'Diseno de iluminacion']],
    amenities: [
      ['lighting_uplighting', 'amenities', 'Uplighting', 'Uplighting'],
      ['lighting_wireless_mics', 'amenities', 'Wireless mics', 'Microfonos inalambricos'],
      ['lighting_reception', 'ceremony_types', 'Reception lighting', 'Iluminacion de recepcion'],
      ['lighting_modern', 'settings', 'Modern production', 'Produccion moderna'],
      ['lighting_tech', 'services', 'On-site technician', 'Tecnico en sitio'],
    ],
    teamTitles: [['Production lead', 'Lider de produccion'], ['Audio engineer', 'Ingeniero de audio']],
    reviewTrait: 'power planning, audio support, and photo-friendly lighting',
  },
  rentals: {
    base: 'decor',
    capacity: [50, 500],
    specialties: ['tabletop rentals', 'lounge furniture', 'tent packages', 'delivery logistics'],
    eventTypes: ['ceremony rentals', 'reception rentals', 'welcome party rentals'],
    pricing: ['tabletop_rentals', 'lounge_furniture', 'tenting', 'delivery_setup'],
    details: [['Rental inventory', 'Inventario de alquiler'], ['Logistics', 'Logistica']],
    amenities: [
      ['rentals_tabletop', 'amenities', 'Tabletop rentals', 'Alquiler de mesa'],
      ['rentals_lounge', 'amenities', 'Lounge furniture', 'Mobiliario lounge'],
      ['rentals_tenting', 'ceremony_types', 'Tenting', 'Carpas'],
      ['rentals_modern', 'settings', 'Modern collections', 'Colecciones modernas'],
      ['rentals_setup', 'services', 'Delivery and pickup', 'Entrega y retiro'],
    ],
    teamTitles: [['Rental consultant', 'Consultor de alquileres'], ['Logistics lead', 'Lider logistico']],
    reviewTrait: 'inventory clarity, delivery timing, and setup coordination',
  },
  beauty: {
    base: 'beauty',
    capacity: null,
    specialties: ['bridal makeup', 'hair styling', 'touch-up teams', 'skin-first beauty'],
    eventTypes: ['bridal beauty', 'bridal party', 'touch-ups'],
    pricing: ['bridal_hair_makeup', 'trial_session', 'bridal_party_member', 'touch_up_service'],
    details: [['Beauty schedule', 'Agenda de belleza'], ['On-location setup', 'Montaje en sitio']],
    amenities: [
      ['beauty_makeup', 'amenities', 'Makeup', 'Maquillaje'],
      ['beauty_hair', 'amenities', 'Hair styling', 'Peinado'],
      ['beauty_trial', 'ceremony_types', 'Trial sessions', 'Pruebas'],
      ['beauty_on_location', 'settings', 'On-location service', 'Servicio a domicilio'],
      ['beauty_touchups', 'services', 'Touch-up service', 'Servicio de retoques'],
    ],
    teamTitles: [['Lead artist', 'Artista principal'], ['Hair stylist', 'Estilista']],
    reviewTrait: 'artist count, trial notes, and wedding morning timing',
  },
  attire: {
    base: 'beauty',
    capacity: null,
    specialties: ['bridal gowns', 'alterations', 'suits and tuxedos', 'accessory styling'],
    eventTypes: ['bridal appointments', 'alterations', 'wedding party attire'],
    pricing: ['bridal_gown', 'alterations', 'accessories', 'suit_tux'],
    details: [['Appointment flow', 'Flujo de citas'], ['Fit support', 'Soporte de ajuste']],
    amenities: [
      ['attire_bridal_gowns', 'amenities', 'Bridal gowns', 'Vestidos de novia'],
      ['attire_suiting', 'amenities', 'Suiting', 'Trajes'],
      ['attire_private_appointments', 'ceremony_types', 'Private appointments', 'Citas privadas'],
      ['attire_modern', 'settings', 'Modern style range', 'Rango moderno'],
      ['attire_alterations', 'services', 'Alterations', 'Ajustes'],
    ],
    teamTitles: [['Stylist', 'Estilista'], ['Alterations specialist', 'Especialista en ajustes']],
    reviewTrait: 'appointment care, sizing guidance, and alteration timing',
  },
  officiants: {
    base: 'planning',
    capacity: null,
    specialties: ['custom ceremonies', 'premarital sessions', 'bilingual ceremonies', 'rehearsal support'],
    eventTypes: ['ceremony', 'rehearsal', 'premarital counseling'],
    pricing: ['ceremony_officiating', 'premarital_session', 'rehearsal', 'custom_ceremony'],
    details: [['Ceremony writing', 'Escritura de ceremonia'], ['Rehearsal support', 'Soporte de ensayo']],
    amenities: [
      ['officiant_custom_script', 'amenities', 'Custom script', 'Guion personalizado'],
      ['officiant_legal_signing', 'amenities', 'Legal signing', 'Firma legal'],
      ['officiant_premarital', 'ceremony_types', 'Premarital sessions', 'Sesiones prematrimoniales'],
      ['officiant_nonreligious', 'settings', 'Nonreligious ceremonies', 'Ceremonias no religiosas'],
      ['officiant_rehearsal', 'services', 'Rehearsal support', 'Soporte de ensayo'],
    ],
    teamTitles: [['Lead officiant', 'Oficiante principal'], ['Ceremony writer', 'Redactor de ceremonia']],
    reviewTrait: 'ceremony tone, vow support, and rehearsal clarity',
  },
});

Object.assign(categoryServiceProfiles, {
  stationery: {
    base: 'planning',
    capacity: null,
    specialties: ['invitation suites', 'save the dates', 'day-of paper', 'wedding signage'],
    eventTypes: ['invitations', 'ceremony paper', 'reception signage'],
    pricing: ['invitation_suite', 'save_the_dates', 'day_of_paper', 'signage'],
    details: [['Paper suite', 'Suite de papeleria'], ['Day-of pieces', 'Piezas del dia']],
    amenities: [
      ['stationery_invitations', 'amenities', 'Invitations', 'Invitaciones'],
      ['stationery_menus', 'amenities', 'Menus', 'Menus'],
      ['stationery_day_of', 'ceremony_types', 'Day-of paper', 'Papeleria del dia'],
      ['stationery_letterpress', 'settings', 'Letterpress', 'Letterpress'],
      ['stationery_addressing', 'services', 'Envelope addressing', 'Rotulacion de sobres'],
    ],
    teamTitles: [['Stationery designer', 'Disenador de papeleria'], ['Print coordinator', 'Coordinador de impresion']],
    reviewTrait: 'wording guidance, print quality, and deadline management',
  },
  photobooth: {
    base: 'photography',
    capacity: null,
    specialties: ['open-air booths', 'instant prints', 'custom backdrops', 'digital galleries'],
    eventTypes: ['cocktail hour', 'reception', 'after party'],
    pricing: ['booth_package', 'prints_props', 'digital_gallery', 'attendant'],
    details: [['Booth experience', 'Experiencia de cabina'], ['Guest flow', 'Flujo de invitados']],
    amenities: [
      ['photobooth_prints', 'amenities', 'Instant prints', 'Impresiones instantaneas'],
      ['photobooth_props', 'amenities', 'Props', 'Props'],
      ['photobooth_reception', 'ceremony_types', 'Reception coverage', 'Cobertura de recepcion'],
      ['photobooth_glam', 'settings', 'Glam booth', 'Cabina glam'],
      ['photobooth_attendant', 'services', 'Booth attendant', 'Asistente de cabina'],
    ],
    teamTitles: [['Booth producer', 'Productor de cabina'], ['Event attendant', 'Asistente de evento']],
    reviewTrait: 'booth setup, guest line flow, and digital gallery access',
  },
  transport: {
    base: 'transportation',
    capacity: [12, 220],
    specialties: ['guest shuttles', 'classic getaway cars', 'valet teams', 'airport transfers'],
    eventTypes: ['guest transportation', 'getaway car', 'airport transfers'],
    pricing: ['getaway_car', 'guest_shuttle', 'party_bus', 'airport_transfer'],
    details: [['Fleet planning', 'Plan de flota'], ['Logistics', 'Logistica']],
    amenities: [
      ['transport_sedans', 'amenities', 'Sedans and SUVs', 'Sedanes y SUVs'],
      ['transport_shuttles', 'amenities', 'Guest shuttles', 'Shuttles de invitados'],
      ['transport_hotel_routes', 'ceremony_types', 'Hotel routes', 'Rutas de hotel'],
      ['transport_classic', 'settings', 'Classic vehicles', 'Vehiculos clasicos'],
      ['transport_dispatch', 'services', 'Dispatch coordination', 'Coordinacion de despacho'],
    ],
    teamTitles: [['Transportation coordinator', 'Coordinador de transporte'], ['Dispatch lead', 'Lider de despacho']],
    reviewTrait: 'route planning, vehicle style, and pickup timing',
  },
  accommodations: {
    base: 'venues',
    capacity: [20, 250],
    specialties: ['room blocks', 'welcome bags', 'hospitality suites', 'guest logistics'],
    eventTypes: ['room blocks', 'guest hospitality', 'wedding weekend stays'],
    pricing: ['room_block', 'welcome_bags', 'hospitality_suite', 'shuttle_coordination'],
    details: [['Room block setup', 'Configuracion de bloque'], ['Guest hospitality', 'Hospitalidad']],
    amenities: [
      ['accommodations_room_block', 'amenities', 'Room block', 'Bloque de habitaciones'],
      ['accommodations_welcome_bags', 'amenities', 'Welcome bags', 'Bolsas de bienvenida'],
      ['accommodations_group_rates', 'ceremony_types', 'Group rates', 'Tarifas grupales'],
      ['accommodations_boutique', 'settings', 'Boutique stay', 'Estadia boutique'],
      ['accommodations_guest_support', 'services', 'Guest support', 'Soporte a invitados'],
    ],
    teamTitles: [['Group rooms manager', 'Gerente de grupos'], ['Guest services lead', 'Lider de invitados']],
    reviewTrait: 'room block clarity, guest support, and hospitality details',
  },
  destination_planning: {
    base: 'planning',
    capacity: null,
    specialties: ['destination weekends', 'guest itineraries', 'travel logistics', 'remote vendor sourcing'],
    eventTypes: ['destination weddings', 'travel planning', 'wedding weekends'],
    pricing: ['travel_planning', 'guest_itinerary', 'vendor_sourcing', 'weekend_coordination'],
    details: [['Destination logistics', 'Logistica de destino'], ['Weekend itinerary', 'Itinerario del fin de semana']],
    amenities: [
      ['destination_guest_itinerary', 'amenities', 'Guest itinerary', 'Itinerario de invitados'],
      ['destination_travel_notes', 'amenities', 'Travel notes', 'Notas de viaje'],
      ['destination_welcome_events', 'ceremony_types', 'Welcome events', 'Eventos de bienvenida'],
      ['destination_tropical', 'settings', 'Tropical destinations', 'Destinos tropicales'],
      ['destination_vendor_sourcing', 'services', 'Local vendor sourcing', 'Busqueda de proveedores locales'],
    ],
    teamTitles: [['Destination planner', 'Planner de destino'], ['Travel logistics lead', 'Lider de logistica de viaje']],
    reviewTrait: 'travel communication, itinerary design, and remote vendor sourcing',
  },
});

const categoryPriceRanges = {
  venues: [650000, 2400000],
  planners: [280000, 1400000],
  photography: [220000, 850000],
  videography: [180000, 900000],
  catering: [480000, 1800000],
  cakes: [45000, 450000],
  bar: [85000, 650000],
  music: [120000, 720000],
  flowers: [180000, 1350000],
  lighting: [95000, 800000],
  rentals: [95000, 1200000],
  beauty: [65000, 420000],
  attire: [120000, 850000],
  officiants: [25000, 180000],
  stationery: [50000, 500000],
  photobooth: [65000, 420000],
  transport: [95000, 650000],
  accommodations: [15000, 250000],
  destination_planning: [320000, 1500000],
};

const adjectives = [
  'Velvet',
  'Golden',
  'Harbor',
  'Willow',
  'Ivory',
  'Opal',
  'Juniper',
  'Luna',
  'Cypress',
  'Rose',
  'Palm',
  'Ever',
  'Modern',
  'Haven',
  'Solstice',
  'Meadow',
  'Aster',
  'Vista',
  'Blue',
  'Coral',
];

const cityPool = [
  { city: 'Miami', state: 'FL', region: 'South Florida', lat: 25.7617, lng: -80.1918 },
  { city: 'Orlando', state: 'FL', region: 'Central Florida', lat: 28.5383, lng: -81.3792 },
  { city: 'Tampa', state: 'FL', region: 'Tampa Bay', lat: 27.9506, lng: -82.4572 },
  { city: 'Fort Lauderdale', state: 'FL', region: 'South Florida', lat: 26.1224, lng: -80.1373 },
  { city: 'Naples', state: 'FL', region: 'Gulf Coast', lat: 26.142, lng: -81.7948 },
  { city: 'West Palm Beach', state: 'FL', region: 'Palm Beach', lat: 26.7153, lng: -80.0534 },
  { city: 'St. Augustine', state: 'FL', region: 'Northeast Florida', lat: 29.9012, lng: -81.3124 },
  { city: 'Sarasota', state: 'FL', region: 'Gulf Coast', lat: 27.3364, lng: -82.5307 },
];

const firstNames = ['Avery', 'Jordan', 'Mia', 'Sofia', 'Nico', 'Camila', 'Elena', 'Mateo', 'Isla', 'Noah', 'Valeria', 'Leo'];
const lastNames = ['Rivera', 'Stone', 'Vega', 'Patel', 'Morgan', 'Santos', 'Bennett', 'Torres', 'Hayes', 'Cole'];
const seasons = ['spring', 'summer', 'fall', 'winter'];
const sharedAmenityRows = [
  ['bilingual_team', 'services', 'Bilingual team', 'Equipo bilingue'],
  ['travel_available', 'services', 'Travel available', 'Disponible para viajar'],
  ['custom_packages', 'services', 'Custom packages', 'Paquetes personalizados'],
  ['online_consultations', 'services', 'Online consultations', 'Consultas en linea'],
];

function makeRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

const random = makeRandom(Number(process.env.RANDOM_VENDOR_SEED || 20260416));

function pick(values) {
  return values[Math.floor(random() * values.length)];
}

function intBetween(min, max) {
  return Math.floor(min + random() * (max - min + 1));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

function moneyBetween([min, max]) {
  return Math.round(intBetween(min, max) / 5000) * 5000;
}

function localized(en, es) {
  return { en, es };
}

function mediaAsset(url, publicId, type = 'image') {
  return {
    url,
    public_id: publicId,
    type: type === 'video' ? 'video' : 'image',
    width: 1400,
    height: 900,
    format: type === 'video' ? 'mp4' : 'jpg',
  };
}

function sqlTextArray(values) {
  return `{${values.map((value) => `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
}

function normalizeCategoryKey(key) {
  const normalized = String(key || '').trim().toLowerCase().replace(/-/g, '_');
  return categoryAliases[normalized] || normalized;
}

function getServiceProfile(categoryKey) {
  return categoryServiceProfiles[normalizeCategoryKey(categoryKey)] || categoryServiceProfiles.venues;
}

function getVisualPreset(serviceProfile) {
  return categoryPresets[serviceProfile.base] || categoryPresets.venues;
}

function humanizeKey(key) {
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\bAv\b/g, 'AV')
    .replace(/\bDj\b/g, 'DJ');
}

function detailDescription(title, specialty, categoryKey) {
  return localized(
    `${title} is scoped around ${specialty}, with clear inclusions, timing, and handoff details for ${categoryKey.replace(/_/g, ' ')} clients.`,
    `${title} se ajusta a ${specialty}, con inclusiones claras, tiempos y detalles de entrega para esta categoria.`,
  );
}

function pricingNotes(itemKey, specialty) {
  const label = humanizeKey(itemKey);
  return localized(
    `${label} package tailored for ${specialty}.`,
    `Paquete ${label.toLowerCase()} ajustado para ${specialty}.`,
  );
}

function amenityRowsForLookup() {
  const rows = [...sharedAmenityRows];
  for (const profile of Object.values(categoryServiceProfiles)) {
    rows.push(...profile.amenities);
  }

  const seen = new Set();
  return rows.filter(([key]) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function ensureReviewClient(pg) {
  const existing = await pg.query('select id from auth.users where email = $1 limit 1', [reviewClientEmail]);
  let userId = existing.rows[0]?.id ?? null;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: reviewClientEmail,
      password: reviewClientPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Review Client', kind: 'client' },
    });
    if (error) throw error;
    userId = data.user.id;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: reviewClientPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Review Client', kind: 'client' },
    });
    if (error) throw error;
  }

  await pg.query(
    `
      insert into public.profiles (id, full_name, role, phone, country, language)
      values ($1, 'Review Client', 'user', '+1 305-555-3001', 'United States', 'en')
      on conflict (id) do update set
        full_name = excluded.full_name,
        role = excluded.role,
        phone = excluded.phone,
        country = excluded.country,
        language = excluded.language
    `,
    [userId],
  );

  return userId;
}

async function ensureVendorOwner(pg, { email, password, fullName, phone }) {
  const existing = await pg.query('select id from auth.users where email = $1 limit 1', [email]);
  let userId = existing.rows[0]?.id ?? null;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, kind: 'vendor' },
    });
    if (error) throw error;
    userId = data.user.id;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, kind: 'vendor' },
    });
    if (error) throw error;
  }

  await pg.query(
    `
      insert into public.profiles (id, full_name, role, phone, country, language)
      values ($1, $2, 'vendor', $3, 'United States', 'en')
      on conflict (id) do update set
        full_name = excluded.full_name,
        role = excluded.role,
        phone = excluded.phone,
        country = excluded.country,
        language = excluded.language
    `,
    [userId, fullName, phone],
  );

  return userId;
}

async function ensureCategories(pg) {
  const existing = await pg.query('select id, key, slug, label from public.categories order by id');
  if (existing.rows.length > 0) {
    return existing.rows;
  }

  for (const category of defaultCategories) {
    await pg.query(
      `
        insert into public.categories (key, slug, label)
        values ($1, $2, $3::jsonb)
        on conflict (key) do update set slug = excluded.slug, label = excluded.label
      `,
      [category.key, category.slug, JSON.stringify(category.label)],
    );
  }

  return (await pg.query('select id, key, slug, label from public.categories order by id')).rows;
}

async function ensureAmenityLookup(pg) {
  const rows = amenityRowsForLookup().map(([key, group, en, es]) => [
    key,
    group,
    localized(en, es),
  ]);

  for (const [key, group, label] of rows) {
    await pg.query(
      `
        insert into public.amenity_lookup (key, group_key, label)
        values ($1, $2, $3::jsonb)
        on conflict (key) do update set group_key = excluded.group_key, label = excluded.label
      `,
      [key, group, JSON.stringify(label)],
    );
  }
}

async function recreateVendorPublicSearchView(pg) {
  await pg.query(`
    create or replace view public.vendor_public_search as
    select
      v.id,
      v.slug,
      v.business_name,
      v.hero_image,
      v.thumbnail_image,
      v.gallery_images,
      v.rating_avg,
      v.rating_count,
      v.is_published,
      v.created_at,
      v.bio->>'en' as bio_en,
      v.bio->>'es' as bio_es,
      v.extra_info->>'en' as extra_info_en,
      v.extra_info->>'es' as extra_info_es,
      vl.city,
      vl.region,
      vl.country,
      vl.lat,
      vl.lng,
      coalesce(array_agg(c.key order by c.key) filter (where c.key is not null), '{}'::text[]) as categories
    from public.vendors v
    left join public.vendor_locations vl on vl.vendor_id = v.id
    left join public.vendor_categories vc on vc.vendor_id = v.id
    left join public.categories c on c.id = vc.category_id
    where coalesce(v.is_published, false) = true
    group by v.id, vl.city, vl.region, vl.country, vl.lat, vl.lng
  `);
}

async function cleanupPreviousSeed(pg) {
  const vendorRows = await pg.query(
    `select id, owner_id from public.vendors where extra_info->>'seed_batch' = $1`,
    [seedBatch],
  );

  if (!vendorRows.rows.length) {
    return { vendors: 0, profiles: 0 };
  }

  const vendorIds = vendorRows.rows.map((row) => row.id);
  const ownerIds = [...new Set(vendorRows.rows.map((row) => row.owner_id))];
  const rfqRows = await pg.query(
    `
      select distinct rfq_id
      from public.quotes
      where vendor_id = any($1::uuid[])
      union
      select distinct rfq_id
      from public.rfq_invites
      where vendor_id = any($1::uuid[])
      union
      select distinct rfq_id
      from public.reviews
      where vendor_id = any($1::uuid[])
    `,
    [vendorIds],
  );
  const rfqIds = rfqRows.rows.map((row) => row.rfq_id).filter(Boolean);

  if (rfqIds.length > 0) {
    await pg.query('update public.rfqs set accepted_quote_id = null, accepted_at = null where id = any($1::uuid[])', [
      rfqIds,
    ]);
    await pg.query('delete from public.reviews where rfq_id = any($1::uuid[])', [rfqIds]);
    await pg.query('delete from public.rfq_invites where rfq_id = any($1::uuid[])', [rfqIds]);
    await pg.query('delete from public.quotes where rfq_id = any($1::uuid[])', [rfqIds]);
    await pg.query('delete from public.rfqs where id = any($1::uuid[])', [rfqIds]);
  }

  await pg.query('delete from public.vendors where id = any($1::uuid[])', [vendorIds]);
  await pg.query(
    `
      delete from public.profiles
      where id = any($1::uuid[])
        and id not in (select owner_id from public.vendors)
    `,
    [ownerIds],
  );

  return { vendors: vendorIds.length, profiles: ownerIds.length };
}

async function seedVendor(pg, category, categoryIndex, vendorIndex) {
  const serviceProfile = getServiceProfile(category.key);
  const preset = getVisualPreset(serviceProfile);
  const normalizedCategoryKey = normalizeCategoryKey(category.key);
  const adjective = adjectives[(categoryIndex * 7 + vendorIndex * 3) % adjectives.length];
  const noun = preset.nouns[vendorIndex % preset.nouns.length];
  const businessName = `${adjective} ${noun} ${vendorIndex + 1}`;
  const slug = `demo-${slugify(category.key)}-${slugify(businessName)}`;
  const city = cityPool[(categoryIndex + vendorIndex) % cityPool.length];
  const specialty = pick(serviceProfile.specialties);
  const startingPrice = moneyBetween(categoryPriceRanges[normalizedCategoryKey] || preset.price);
  const typicalSpend = startingPrice + moneyBetween([50000, Math.max(100000, Math.floor(startingPrice * 0.75))]);
  const capacityMax = serviceProfile.capacity ? intBetween(serviceProfile.capacity[0], serviceProfile.capacity[1]) : null;
  const ratingAvg = Number((4.2 + random() * 0.75).toFixed(2));
  const ratingCount = intBetween(8, 96);
  const images = preset.images;
  const heroImage = mediaAsset(images[0], `${slug}-hero`);
  const thumbnailImage = mediaAsset(images[1] || images[0], `${slug}-thumb`);
  const galleryImages = images.map((url, index) => mediaAsset(url, `${slug}-gallery-${index + 1}`));
  const firstName = firstNames[(categoryIndex + vendorIndex) % firstNames.length];
  const lastName = lastNames[(categoryIndex * 2 + vendorIndex) % lastNames.length];
  const phoneSuffix = String(4000 + categoryIndex * 100 + vendorIndex).padStart(4, '0');
  const ownerEmail = `vendor.demo.${slug}@wedding-market.local`;
  const ownerPassword = `TestPass!${5000 + categoryIndex * 100 + vendorIndex}`;
  const ownerId = await ensureVendorOwner(pg, {
    email: ownerEmail,
    password: ownerPassword,
    fullName: `${firstName} ${lastName}`,
    phone: `+1 305-555-${phoneSuffix}`,
  });

  const bio = localized(
    `${businessName} specializes in ${specialty} for couples who want a polished, organized wedding experience.`,
    `${businessName} se especializa en ${specialty} para parejas que quieren una experiencia de boda cuidada y organizada.`,
  );
  const extraInfo = {
    en: `Seeded test provider for ${normalizedCategoryKey}. Best for ${specialty}, responsive planning, and clear package options.`,
    es: `Proveedor de prueba para ${normalizedCategoryKey}. Ideal para ${specialty}, planeacion agil y paquetes claros.`,
    long_description: localized(
      `${businessName} is a generated Wedding Market test provider with category-specific profile data, media, pricing, availability, team members, and reviews for QA coverage.`,
      `${businessName} es un proveedor de prueba generado con datos especificos por categoria, medios, precios, disponibilidad, equipo y resenas para pruebas.`,
    ),
    seed_batch: seedBatch,
    seed_category: normalizedCategoryKey,
  };

  const vendorResult = await pg.query(
    `
      insert into public.vendors (
        owner_id, slug, business_name, bio, rating_avg, rating_count, is_published, hero_image, thumbnail_image,
        gallery_images, extra_info, address_label, map_url, phone, website_url, logo_url, starting_price_cents,
        starting_price_currency, capacity_max, event_types, years_in_business, languages, team_size_range,
        pricing_typical_spend_cents, pricing_typical_spend_currency, pricing_peak_seasons, review_ai_summary
      ) values (
        $1,$2,$3,$4::jsonb,$5,$6,true,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13,$14,$15,$16,'USD',$17,
        $18::text[],$19,$20::text[],$21,$22,'USD',$23::text[],$24
      )
      returning id
    `,
    [
      ownerId,
      slug,
      businessName,
      JSON.stringify(bio),
      ratingAvg,
      ratingCount,
      JSON.stringify(heroImage),
      JSON.stringify(thumbnailImage),
      JSON.stringify(galleryImages),
      JSON.stringify(extraInfo),
      `${city.city}, ${city.state}`,
      `https://maps.google.com/?q=${encodeURIComponent(`${businessName} ${city.city} ${city.state}`)}`,
      `+1 305-555-${phoneSuffix}`,
      `https://${slug}.example.com`,
      `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(businessName)}`,
      startingPrice,
      capacityMax,
      sqlTextArray(serviceProfile.eventTypes),
      intBetween(2, 22),
      sqlTextArray(vendorIndex % 3 === 0 ? ['English', 'Spanish'] : ['English']),
      pick(['1-2', '2-4', '5-9', '10-20']),
      typicalSpend,
      sqlTextArray([pick(seasons), pick(seasons)]),
      `Couples mention ${businessName}'s ${serviceProfile.reviewTrait}.`,
    ],
  );

  const vendorId = vendorResult.rows[0].id;

  await pg.query(
    `
      insert into public.vendor_locations (vendor_id, country, region, city, lat, lng, address, state, service_radius_km)
      values ($1,'United States',$2,$3,$4,$5,$6,$7,$8)
      on conflict (vendor_id) do update set
        country = excluded.country,
        region = excluded.region,
        city = excluded.city,
        lat = excluded.lat,
        lng = excluded.lng,
        address = excluded.address,
        state = excluded.state,
        service_radius_km = excluded.service_radius_km
    `,
    [
      vendorId,
      city.region,
      city.city,
      city.lat + random() * 0.08 - 0.04,
      city.lng + random() * 0.08 - 0.04,
      `${intBetween(100, 999)} ${pick(['Market', 'Palm', 'Garden', 'Ocean', 'Magnolia'])} Ave`,
      city.state,
      intBetween(35, 180),
    ],
  );

  await pg.query(
    'insert into public.vendor_categories (vendor_id, category_id) values ($1, $2) on conflict do nothing',
    [vendorId, category.id],
  );

  for (const [index, image] of galleryImages.entries()) {
    await pg.query(
      `
        insert into public.vendor_media (vendor_id, kind, url, is_cover, caption, sort_order, media_type)
        values ($1, 'image', $2, $3, $4::jsonb, $5, 'photo')
      `,
      [
        vendorId,
        image.url,
        index === 0,
        JSON.stringify(localized(`${businessName} sample image ${index + 1}`, `Imagen de muestra ${index + 1}`)),
        index,
      ],
    );
  }

  for (const [index, itemKey] of serviceProfile.pricing.entries()) {
    await pg.query(
      `
        insert into public.vendor_pricing (vendor_id, item_key, price_cents, currency, contact_for_price, notes)
        values ($1,$2,$3,'USD',false,$4::jsonb)
        on conflict (vendor_id, item_key) do update set price_cents = excluded.price_cents, notes = excluded.notes
      `,
      [
        vendorId,
        itemKey,
        startingPrice + index * intBetween(35000, 160000),
        JSON.stringify(pricingNotes(itemKey, specialty)),
      ],
    );
  }

  for (const [index, detail] of serviceProfile.details.entries()) {
    const detailCapacityMax = serviceProfile.capacity ? capacityMax : null;
    const detailCapacityMin = serviceProfile.capacity ? Math.max(10, Math.floor((capacityMax ?? 0) * 0.25)) : null;
    await pg.query(
      `
        insert into public.vendor_spaces (vendor_id, name, description, capacity_min, capacity_max)
        values ($1,$2::jsonb,$3::jsonb,$4,$5)
      `,
      [
        vendorId,
        JSON.stringify(localized(detail[0], detail[1])),
        JSON.stringify(detailDescription(detail[0], specialty, normalizedCategoryKey)),
        detailCapacityMin,
        detailCapacityMax,
      ],
    );
  }

  const profileAmenityKeys = serviceProfile.amenities.map(([key]) => key);
  const sharedKeys = sharedAmenityRows.map(([key]) => key);
  const selectedAmenities = [...profileAmenityKeys, ...sharedKeys]
    .sort(() => random() - 0.5)
    .slice(0, Math.min(profileAmenityKeys.length + sharedKeys.length, intBetween(5, 8)));
  for (const amenity of selectedAmenities) {
    await pg.query('insert into public.vendor_amenities (vendor_id, amenity_key) values ($1, $2) on conflict do nothing', [
      vendorId,
      amenity,
    ]);
  }

  for (let index = 0; index < 2; index += 1) {
    const memberName = `${firstNames[(vendorIndex + index + 3) % firstNames.length]} ${lastNames[(categoryIndex + index + 4) % lastNames.length]}`;
    const title = serviceProfile.teamTitles[index] || serviceProfile.teamTitles[0];
    await pg.query(
      `
        insert into public.vendor_team (vendor_id, name, title, bio, headshot_url, responds_within_hours, sort_order)
        values ($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7)
      `,
      [
        vendorId,
        memberName,
        JSON.stringify(localized(title[0], title[1])),
        JSON.stringify(localized(`Focused on ${specialty} and client communication.`, `Enfocado en ${specialty} y comunicacion con clientes.`)),
        `https://api.dicebear.com/8.x/personas/svg?seed=${encodeURIComponent(memberName)}`,
        intBetween(2, 24),
        index + 1,
      ],
    );
  }

  const startDate = new Date('2026-05-01T00:00:00.000Z');
  for (let index = 0; index < 14; index += 1) {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index * intBetween(7, 18) + vendorIndex);
    await pg.query(
      `
        insert into public.vendor_availability (vendor_id, available_on, availability_status)
        values ($1,$2,$3)
        on conflict (vendor_id, available_on) do update set availability_status = excluded.availability_status
      `,
      [vendorId, date.toISOString().slice(0, 10), index % 5 === 0 ? 'busy' : 'available'],
    );
  }

  return {
    id: vendorId,
    ownerId,
    slug,
    businessName,
    category: category.key,
    city: city.city,
    startingPrice,
    ownerEmail,
    ownerPassword,
  };
}

async function seedReviews(pg, reviewClientId, vendors) {
  let created = 0;
  for (const vendor of vendors) {
    const reviewCount = intBetween(2, 5);
    for (let index = 0; index < reviewCount; index += 1) {
      const rfq = await pg.query(
        `
          insert into public.rfqs (
            owner_id, event_date, guest_count, budget_min, budget_max, city, state, country, language, theme, notes,
            contact_email, contact_phone, guest_first_name, guest_last_name, guest_lead_email, guest_phone
          ) values (
            $1, $2, $3, $4, $5, $6, 'FL', 'United States', 'en', $7, $8, $9, '+1 305-555-3001', 'Review', 'Client', $9, '+1 305-555-3001'
          ) returning id
        `,
        [
          reviewClientId,
          `2026-${String(intBetween(5, 12)).padStart(2, '0')}-${String(intBetween(1, 25)).padStart(2, '0')}`,
          intBetween(45, 180),
          4000,
          25000,
          vendor.city,
          pick(['Garden', 'Modern coastal', 'Classic evening', 'Black tie', 'Romantic outdoor']),
          `Random Seed: QA request for ${vendor.businessName}.`,
          reviewClientEmail,
        ],
      );

      const quote = await pg.query(
        `
          insert into public.quotes (rfq_id, vendor_id, version, amount_cents, currency, message)
          values ($1,$2,1,$3,'USD',$4)
          returning id
        `,
        [rfq.rows[0].id, vendor.id, vendor.startingPrice + intBetween(20000, 250000), `Random Seed: Quote from ${vendor.businessName}.`],
      );

      await pg.query('update public.rfqs set accepted_quote_id = $1, accepted_at = now() where id = $2', [
        quote.rows[0].id,
        rfq.rows[0].id,
      ]);

      await pg.query(
        `
          insert into public.rfq_invites (rfq_id, vendor_id, status, expires_at, reveal_email, reveal_phone)
          values ($1,$2,'accepted',now() + interval '14 day',true,true)
          on conflict (rfq_id, vendor_id) do update set status = excluded.status
        `,
        [rfq.rows[0].id, vendor.id],
      );

      await pg.query(
        `
          insert into public.reviews (rfq_id, vendor_id, author_id, stars, title, body)
          values ($1,$2,$3,$4,$5,$6)
          on conflict (author_id, vendor_id, rfq_id) do nothing
        `,
        [
          rfq.rows[0].id,
          vendor.id,
          reviewClientId,
          intBetween(4, 5),
          `Random Seed: ${pick(['Clear communication', 'Beautiful work', 'Easy planning', 'Great experience'])}`,
          `${vendor.businessName} was responsive, organized, and easy to compare during testing.`,
        ],
      );
      created += 1;
    }
  }
  return created;
}

async function main() {
  const pg = new Client({ connectionString });
  await pg.connect();

  try {
    await pg.query('begin');

    const reviewClientId = await ensureReviewClient(pg);
    const categories = await ensureCategories(pg);
    await ensureAmenityLookup(pg);
    await recreateVendorPublicSearchView(pg);
    const cleanup = await cleanupPreviousSeed(pg);

    const createdVendors = [];
    for (const [categoryIndex, category] of categories.entries()) {
      for (let vendorIndex = 0; vendorIndex < vendorsPerCategory; vendorIndex += 1) {
        createdVendors.push(await seedVendor(pg, category, categoryIndex, vendorIndex));
      }
    }

    const reviewsCreated = await seedReviews(pg, reviewClientId, createdVendors);
    await pg.query('commit');

    const summary = {
      generated_at: new Date().toISOString(),
      seed_batch: seedBatch,
      vendors_per_category: vendorsPerCategory,
      categories: categories.map((category) => category.key),
      deleted_previous_seed_vendors: cleanup.vendors,
      created_vendors: createdVendors.length,
      created_reviews: reviewsCreated,
      review_client: {
        email: reviewClientEmail,
        password: reviewClientPassword,
      },
      sample_vendors: createdVendors.slice(0, 12).map((vendor) => ({
        category: vendor.category,
        business_name: vendor.businessName,
        slug: vendor.slug,
        email: vendor.ownerEmail,
        password: vendor.ownerPassword,
      })),
      vendor_accounts: createdVendors.map((vendor) => ({
        category: vendor.category,
        business_name: vendor.businessName,
        slug: vendor.slug,
        email: vendor.ownerEmail,
        password: vendor.ownerPassword,
      })),
    };

    const outPath = path.join(process.cwd(), 'supabase', 'random-vendors.local.json');
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
    console.log(`Wrote ${outPath}`);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    await pg.query('rollback');
    throw error;
  } finally {
    await pg.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
