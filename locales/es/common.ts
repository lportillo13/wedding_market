const common = {
  languageSelector: {
    label: "Idioma",
    english: "Inglés",
    spanish: "Español",
  },
  nav: {
    brand: "Mercado de Bodas",
    vendors: "Proveedores",
    myRequests: "Mis solicitudes",
    requestQuotes: "Solicitar cotizaciones",
    shortlist: "Favoritos",
    shortlistCountLabel: "guardado",
    signUp: "Regístrate",
    logIn: "Inicia sesión",
  },
  auth: {
    account: "Cuenta",
    profile: "Perfil",
    vendorRfqs: "Solicitudes para proveedores",
    createVendorProfile: "Crear perfil de proveedor",
    logOut: "Cerrar sesión",
  },
  home: {
    hero: {
      badge: "Mercado de bodas todo en uno",
      title: "Planea la boda de tus sueños con menos estrés",
      description:
        "Descubre profesionales de confianza, compara cotizaciones al instante y reserva a tus favoritos sin salir de la plataforma.",
      primaryCta: "Obtén cotizaciones personalizadas",
      secondaryCta: "Explora proveedores",
    },
    highlights: {
      heading: "Por qué las parejas nos eligen",
      items: [
        {
          title: "Recomendaciones de proveedores seleccionadas",
          description:
            "Responde unas cuantas preguntas y te mostraremos lugares, fotógrafos, floristas y más que se ajusten a tu estilo y presupuesto.",
        },
        {
          title: "Un solo lugar para comparar cotizaciones",
          description:
            "Envía solicitudes con un solo clic y mantén cada respuesta organizada para que puedas revisar disponibilidad, precios y reseñas una al lado de la otra.",
        },
        {
          title: "Planea con total confianza",
          description:
            "Guarda a tus proveedores favoritos, comparte listas con tu pareja y reserva con el apoyo de nuestro equipo de planificación de bodas.",
        },
      ],
    },
    categories: {
      heading: "Explora categorías populares",
      description:
        "Ya sea que busques el lugar perfecto o estés afinando los detalles de la decoración, nuestro directorio reúne profesionales verificados en cada categoría.",
      seeVendors: "Ver proveedores →",
      items: [
        { label: "Lugares", slug: "venues" },
        { label: "Fotografía", slug: "photography" },
        { label: "Banquetes", slug: "catering" },
        { label: "Belleza", slug: "beauty" },
        { label: "Entretenimiento", slug: "entertainment" },
        { label: "Decoración", slug: "decor" },
      ],
    },
    plan: {
      heading: "¿Listos para empezar a planear?",
      description:
        "Crea una lista de favoritos, compártela con tu pareja y envía mensajes a los proveedores directamente. Wedding Market mantiene tu proceso de planificación organizado desde la primera idea hasta la reserva final.",
      cta: "Ver tus favoritos",
    },
  },
} as const;

export default common;
