export const vendorProfileSections = ['details', 'images', 'pricing', 'starting-price', 'amenities', 'categories', 'contact', 'location', 'team', 'reviews', 'availability'] as const;
export type VendorProfileSection = typeof vendorProfileSections[number];
export type VendorWorkspaceArea = 'home' | 'inbox' | 'business' | 'calendar' | 'publish' | 'boutique' | 'notifications';
export type VendorWorkspaceSummary = { businessName: string; slug: string; isPublished: boolean; hasBoutique: boolean };

export function isVendorProfileSection(value: string): value is VendorProfileSection {
  return vendorProfileSections.some(section => section === value);
}
export function vendorWorkspaceArea(pathname: string, section: VendorProfileSection): VendorWorkspaceArea {
  const within = (path:string) => pathname === path || pathname.startsWith(path+'/');
  if (within('/vendor/inbox')) return 'inbox';
  if (within('/vendor/publish')) return 'publish';
  if (within('/vendor/boutique')) return 'boutique';
  if (within('/vendor/notifications')) return 'notifications';
  if (within('/vendor/preview')) return 'business';
  if (within('/vendor/profile')) return section === 'availability' ? 'calendar' : 'business';
  if (within('/vendor/categories') || within('/vendor/location')) return 'business';
  return 'home';
}
export function vendorBusinessGroup(section: VendorProfileSection) {
  if (section === 'pricing' || section === 'starting-price' || section === 'amenities' || section === 'categories') return 'services';
  if (section === 'contact' || section === 'location') return 'contact';
  if (section === 'team' || section === 'reviews') return 'optional';
  return section;
}
export const vendorStudioCopy = {
  en: {
    studio: 'Your business studio', home: 'Home', inbox: 'Inbox', business: 'My business', calendar: 'Calendar',
    details: 'Presentation', images: 'Photos & video', services: 'Services & prices', contact: 'Contact & location',
    optional: 'More details', optionalHint: 'Optional', team: 'Team', reviews: 'Reviews', pricing: 'Packages & prices',
    amenities: 'What you offer', categories: 'Service categories', startingPrice: 'Starting price', contactDetails: 'Contact details', location: 'Location & coverage',
    publication: 'Your listing', published: 'Published', draft: 'Private draft', reviewPublication: 'Review listing',
    preview: 'View public profile', privatePreview: 'Preview saved details', previewNote: 'Only you can see this preview. It shows your saved business details.', edit: 'Back to editing', boutique: 'Boutique collection', navigation: 'Vendor workspace', section: 'Business section',
    supportTitle: 'A more complete profile.', supportNote: 'Recommended basics, based on saved information.',
    optionalNote: 'Team and reviews are optional. Build your profile at your own pace.',
    savedBasics: '{count} of 4 recommended basics', moreBusiness: 'More business details',
    morePresentation: 'Profile address & additional information', translation: 'Description in another language',
    homeTitle: 'A clear view of your business.', homeIntro: 'Pick your next task. Everything you need is close at hand.',
    inboxTitle: 'Keep the conversation going.', inboxBody: 'Questions, proposals and follow-ups stay together in your inbox.',
    editTitle: 'Make your business feel like you.', editBody: 'Update your story, photos, services and prices in one place.',
    calendarTitle: 'Keep your dates up to date.', calendarBody: 'Manage availability so couples can plan with you.',
    openInbox: 'Open inbox', editProfile: 'Edit business', openCalendar: 'Manage availability',
    publicationTitle: 'Ready for couples to find you?', publicationBody: 'Review the listing requirements and choose when to publish.',
    changes: 'Unsaved changes',
  },
  es: {
    studio: 'El estudio de tu negocio', home: 'Inicio', inbox: 'Bandeja', business: 'Mi negocio', calendar: 'Agenda',
    details: 'Presentación', images: 'Fotos y video', services: 'Servicios y precios', contact: 'Contacto y ubicación',
    optional: 'Más detalles', optionalHint: 'Opcional', team: 'Equipo', reviews: 'Reseñas', pricing: 'Paquetes y precios',
    amenities: 'Lo que ofreces', categories: 'Categorías de servicio', startingPrice: 'Precio inicial', contactDetails: 'Datos de contacto', location: 'Ubicación y cobertura',
    publication: 'Tu publicación', published: 'Publicado', draft: 'Borrador privado', reviewPublication: 'Revisar publicación',
    preview: 'Ver perfil público', privatePreview: 'Ver datos guardados', previewNote: 'Solo tú puedes ver esta vista previa. Muestra los datos guardados de tu negocio.', edit: 'Volver al editor', boutique: 'Colección de la boutique', navigation: 'Espacio del proveedor', section: 'Sección del negocio',
    supportTitle: 'Un perfil más completo.', supportNote: 'Básicos recomendados, según la información guardada.',
    optionalNote: 'Equipo y reseñas son opcionales. Completa tu perfil a tu ritmo.',
    savedBasics: '{count} de 4 básicos recomendados', moreBusiness: 'Más detalles del negocio',
    morePresentation: 'Dirección del perfil e información adicional', translation: 'Descripción en otro idioma',
    homeTitle: 'Tu negocio, con más claridad.', homeIntro: 'Elige tu próxima tarea. Todo lo que necesitas está a mano.',
    inboxTitle: 'Que siga la conversación.', inboxBody: 'Preguntas, propuestas y seguimiento, juntos en tu bandeja.',
    editTitle: 'Un negocio con tu esencia.', editBody: 'Actualiza tu historia, fotos, servicios y precios en un solo lugar.',
    calendarTitle: 'Tu agenda al día.', calendarBody: 'Actualiza tu disponibilidad para que las parejas puedan planear contigo.',
    openInbox: 'Abrir bandeja', editProfile: 'Editar mi negocio', openCalendar: 'Gestionar disponibilidad',
    publicationTitle: '¿Listo para que te encuentren?', publicationBody: 'Revisa los requisitos y decide cuándo publicar tu negocio.',
    changes: 'Cambios sin guardar',
  },
};
