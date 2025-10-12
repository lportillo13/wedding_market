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
  account: {
    layout: {
      heading: "Mi cuenta",
      tabs: {
        profile: "Perfil",
        rfqs: "Mis solicitudes",
        quotes: "Cotizaciones recibidas",
        reviews: "Reseñas",
      },
    },
    profile: {
      title: "Perfil",
      loginRequired: "Inicia sesión para ver tu perfil.",
      intro: "Actualiza tu información de contacto y preferencias de boda.",
      avatar: {
        heading: "Foto de perfil",
        description: "Añade una foto para que los proveedores te reconozcan en el sitio.",
        fileLabel: "Imagen de perfil",
        helpText: "Optimizaremos la imagen para que cargue rápido.",
        submit: {
          label: "Subir foto",
          pending: "Subiendo…",
        },
      },
      form: {
        fullNameLabel: "Nombre",
        phoneLabel: "Teléfono",
        emailLabel: "Correo electrónico",
        emailHelp: "El correo electrónico se gestiona con tus credenciales de acceso.",
        countryLabel: "País",
        countryPlaceholder: "Selecciona un país",
        preferredLanguageLabel: "Idioma preferido",
        preferredLanguageHelp: "Cambia el idioma predeterminado que verás después de iniciar sesión.",
        weddingPreferencesHeading: "Preferencias de la boda",
        tentativeWeddingDateLabel: "Fecha tentativa de la boda",
        guestCountLabel: "Número estimado de invitados",
        budgetLabel: "Presupuesto (USD)",
        weddingThemeLabel: "Tema de la boda",
        weddingTheme: {
          options: {
            none: "—",
            classic: "Clásica",
            boho: "Bohemia",
            rustic: "Rústica",
            beach: "Playa",
            garden: "Jardín",
            modern: "Moderna",
            vintage: "Vintage",
          },
        },
        submit: {
          label: "Guardar perfil",
          saving: "Guardando…",
        },
      },
    },
  },
  shortlistButton: {
    add: "Agregar a favoritos",
    inList: "En favoritos",
  },
  vendorsPage: {
    title: "Proveedores",
    searchForm: {
      queryPlaceholder: "Busca proveedores (nombre, biografía)…",
      categoryPlaceholder: "Filtra por slug de categoría (ej. fotografía)",
      submit: "Buscar",
    },
    empty: "No se encontraron proveedores.",
    pagination: {
      prev: "Anterior",
      next: "Siguiente",
      pageLabel: "Página {current} / {total}",
    },
  },
  vendorProfile: {
    writeReview: "Escribir una reseña",
    galleryHeading: "Galería",
    moreComing: "¿Tienes preguntas? Ponte en contacto con el proveedor para más detalles.",
  },
  vendorDashboard: {
    heading: "Panel del proveedor",
    tabs: {
      overview: "Resumen",
      rfqs: "Solicitudes",
      quotes: "Cotizaciones",
      profile: "Perfil",
      location: "Ubicación",
      categories: "Categorías",
      publish: "Publicar",
    },
    overview: {
      welcome:
        "¡Bienvenido! Usa las pestañas superiores para gestionar tu perfil, revisar solicitudes y seguir las cotizaciones que has enviado.",
    },
    profileForm: {
      businessNameLabel: "Nombre del negocio",
      slugLabel: "Slug",
      slugPlaceholder: "mi-proveedor-increible",
      slugHelp: "Solo letras, números y guiones.",
      bioEnLabel: "Biografía (EN)",
      bioEsLabel: "Biografía (ES)",
      save: "Guardar perfil",
      saving: "Guardando…",
    },
    profileTabs: {
      details: "Detalles del perfil",
      images: "Imágenes",
    },
    profileImages: {
      heading: "Imágenes",
      help: "Sube imágenes para la portada, la miniatura y la galería. Las optimizamos automáticamente.",
      heroLabel: "Imagen principal",
      heroEmpty: "Aún no tienes una imagen principal.",
      thumbnailLabel: "Miniatura",
      thumbnailEmpty: "Aún no tienes una miniatura.",
      galleryLabel: "Galería",
      galleryHelp: "Selecciona una o varias fotos para mantener tu galería actualizada.",
      gallerySelectHelp: "Mantén presionado Shift o Command/Ctrl para elegir varios archivos a la vez.",
      galleryEmpty: "Aún no hay imágenes en la galería.",
      uploadSingle: "Subir imagen",
      uploadMultiple: "Subir imágenes",
      uploading: "Subiendo…",
      remove: "Eliminar",
      removing: "Eliminando…",
    },
    location: {
      heading: "Ubicación y zona de servicio",
      form: {
        addressLabel: "Dirección (formateada)",
        cityLabel: "Ciudad",
        stateLabel: "Estado/Región",
        countryLabel: "País",
        countryPlaceholder: "Selecciona un país",
        radiusLabel: "Radio de servicio (km)",
        save: "Guardar ubicación",
        saving: "Guardando…",
      },
      map: {
        searchLabel: "Buscar dirección",
        searchPlaceholder: "Escribe una dirección…",
      },
    },
    categories: {
      instructions: "Elige todas las opciones que apliquen",
      save: "Guardar categorías",
      saving: "Guardando…",
      success: "¡Categorías guardadas!",
    },
    publish: {
      heading: "Publicar",
      description: "Activa o desactiva si tu perfil aparece en la búsqueda pública.",
      status: {
        published: "Publicado (visible en el catálogo)",
        unpublished: "No publicado (oculto del catálogo)",
      },
      save: "Guardar",
      saving: "Guardando…",
      viewPublic: "Ver página pública",
    },
  },
  vendorInbox: {
    quoteForm: {
      amountLabel: "Cotización (USD)",
      amountPlaceholder: "ej. 2500",
      messageLabel: "Mensaje",
      messagePlaceholder: "Qué incluye, disponibilidad, próximos pasos…",
      submit: "Enviar cotización",
      submitting: "Enviando…",
      success: "Cotización enviada ✅",
    },
  },
  vendorQuotes: {
    title: "Cotizaciones enviadas",
    empty: "Aún no has enviado cotizaciones.",
    sentLabel: "Enviada",
    status: {
      sent: "ENVIADA",
    },
    contact: {
      hiddenNote: "Los datos de contacto se desbloquean automáticamente cuando tu cotización es aceptada.",
    },
  },
  vendorRfqs: {
    title: "Solicitudes recibidas",
    noProfile: {
      message: "Aún no tienes un perfil de proveedor. Créalo en",
      linkLabel: "Perfil de proveedor",
    },
    empty: "Aún no tienes invitaciones. Verás solicitudes aquí cuando los clientes te inviten.",
    rfqLabel: "Solicitud",
    eventDateTbd: "Fecha por confirmar",
    guestCountTbd: "Número de invitados por confirmar",
    guestsLabel: "invitados",
    budgetLabel: "Presupuesto",
    invitedAtLabel: "Invitado",
    expiresAtLabel: "Expira",
    status: {
      accepted: "ACEPTADA",
      responded: "RESPONDIDA",
      pending: "PENDIENTE",
      declined: "RECHAZADA",
      expired: "VENCIDA",
      unknown: "ESTADO",
    },
    contact: {
      revealed: "Contacto visible",
      hidden: "Contacto oculto",
      hiddenNote: "Se mostrará automáticamente si tu cotización es aceptada.",
      noneShared: "No se compartió información de contacto.",
    },
    latestQuote: {
      heading: "Última cotización",
    },
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
  signup: {
    page: {
      title: "Crea tu cuenta",
      description: "Regístrate para solicitar cotizaciones, seguir proveedores y dejar reseñas.",
      alreadyHave: "¿Ya tienes una cuenta?",
      loginLink: "Inicia sesión",
    },
    form: {
      emailLabel: "Correo electrónico",
      passwordLabel: "Contraseña",
      passwordHelp: "Al menos 6 caracteres.",
      submit: "Crear cuenta",
      submitting: "Registrándote…",
    },
    vendor: {
      gate: {
        title: "Conviértete en proveedor",
        description: "Inicia sesión o crea una cuenta para comenzar a construir tu perfil de proveedor.",
        loginCta: "Inicia sesión",
        newHere: "¿Eres nuevo?",
        signUpLink: "Regístrate primero",
      },
      formPage: {
        title: "Crea tu perfil de proveedor",
        description: "Cuéntanos quién eres para configurar tu panel de proveedor.",
      },
      form: {
        businessNameLabel: "Nombre del negocio",
        cityLabel: "Ciudad",
        countryLabel: "País",
        countryPlaceholder: "Selecciona un país",
        submit: "Crear perfil de proveedor",
        submitting: "Creando…",
      },
    },
  },
} as const;

export default common;
