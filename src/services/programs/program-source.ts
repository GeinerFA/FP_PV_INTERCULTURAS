import { parseProgramCatalog } from "@/validators/program";

const rawProgramCatalog = [
  {
    id: "prog-volunteer-community-learning",
    slug: "community-learning-volunteer",
    category: "volunteer",
    status: "published",
    featured: true,
    coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    location: {
      es: "San Ramòn, Costa Rica",
    },
    duration: {
      es: "2 a 12 semanas",
    },
    availability: {
      es: "Disponible todo el año",
    },
    translations: {
      es: {
        title: "Voluntariado en apoyo educativo comunitario",
        shortDescription:
          "Acompañá iniciativas de refuerzo escolar, actividades creativas y convivencia intercultural con niñez y adolescencia local.",
        fullDescription:
          "Este programa está pensado para personas que desean colaborar de manera cercana con procesos educativos comunitarios. Las actividades pueden incluir apoyo en inglés básico, lectura guiada, dinámicas recreativas, acompañamiento a talleres y coordinación de pequeños proyectos con el equipo local.",
        requirements: [
          "Nivel intermedio de inglés o español para comunicarse con el equipo.",
          "Disposición para trabajar con niñez y adolescencia en contextos comunitarios.",
          "Actitud proactiva, respetuosa y abierta al intercambio cultural.",
        ],
        included: [
          "Inducción inicial sobre la organización y el contexto local.",
          "Acompañamiento operativo por parte del equipo coordinador.",
          "Orientación cultural y apoyo básico para adaptación en la zona.",
        ],
      },
    },
    seo: {
      es: {
        title: "Voluntariado educativo en Costa Rica",
        description:
          "Descubrí un programa de voluntariado comunitario con apoyo educativo, intercambio cultural y acompañamiento local en Costa Rica.",
      },
    },
    createdBy: "seed-system",
    updatedBy: "seed-system",
    createdAt: "2026-04-01T09:00:00.000Z",
    updatedAt: "2026-04-08T16:30:00.000Z",
  },
  {
    id: "prog-internship-social-impact-operations",
    slug: "social-impact-operations-internship",
    category: "internships",
    status: "published",
    featured: false,
    coverImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
    location: {
      es: "San Isidro de El General, Costa Rica",
    },
    duration: {
      es: "4 a 16 semanas",
    },
    availability: {
      es: "Convocatoria trimestral",
    },
    translations: {
      es: {
        title: "Pasantía en operaciones de impacto social",
        shortDescription:
          "Ideal para estudiantes que desean fortalecer experiencia en coordinación de programas, documentación y mejora operativa de una organización social.",
        fullDescription:
          "La pasantía ofrece una experiencia práctica dentro de la operación diaria de Pura Vida Interculturas. La persona participante puede colaborar en levantamiento de información, apoyo administrativo, seguimiento de procesos, sistematización de aprendizajes y propuestas de mejora alineadas con el MVP institucional.",
        requirements: [
          "Ser estudiante activo o recién graduado en áreas afines.",
          "Capacidad para trabajar con documentación, hojas de cálculo o investigación aplicada.",
          "Interés genuino en organizaciones sociales y mejora de procesos.",
        ],
        included: [
          "Mentoría básica sobre operación institucional.",
          "Espacio para desarrollar entregables o proyectos académicos vinculados.",
          "Carta de participación al completar la pasantía.",
        ],
      },
    },
    seo: {
      es: {
        title: "Pasantía en impacto social",
        description:
          "Conocé una pasantía orientada a operaciones, documentación y mejora continua dentro de una organización con enfoque intercultural.",
      },
    },
    createdBy: "seed-system",
    updatedBy: "seed-system",
    createdAt: "2026-04-02T11:15:00.000Z",
    updatedAt: "2026-04-09T14:10:00.000Z",
  },
  {
    id: "prog-spanish-cultural-immersion",
    slug: "spanish-cultural-immersion",
    category: "spanish-classes",
    status: "published",
    featured: true,
    coverImage: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80",
    location: {
      es: "Modalidad presencial en Pérez Zeledón",
    },
    duration: {
      es: "1 a 8 semanas",
    },
    availability: {
      es: "Inicio flexible según nivel",
    },
    translations: {
      es: {
        title: "Clases de español e inmersión cultural",
        shortDescription:
          "Programa para aprender español práctico mientras vivís experiencias culturales y conexión directa con la comunidad local.",
        fullDescription:
          "Las clases combinan aprendizaje conversacional, contexto cultural y acompañamiento cercano para personas que quieren mejorar su español en un entorno real. Puede integrarse con actividades comunitarias, recorridos locales y objetivos personales de viaje, estudio o voluntariado.",
        requirements: [
          "No se requiere nivel previo; se adapta desde principiante hasta intermedio.",
          "Interés en participar activamente en experiencias culturales guiadas.",
          "Compromiso con la asistencia y práctica constante.",
        ],
        included: [
          "Diagnóstico inicial de nivel.",
          "Plan de aprendizaje adaptado al ritmo y objetivos del participante.",
          "Actividades de inmersión cultural coordinadas con el equipo local.",
        ],
      },
    },
    seo: {
      es: {
        title: "Clases de español en Costa Rica",
        description:
          "Aprendé español con acompañamiento local e inmersión cultural dentro del entorno de Pura Vida Interculturas.",
      },
    },
    createdBy: "seed-system",
    updatedBy: "seed-system",
    createdAt: "2026-04-03T08:45:00.000Z",
    updatedAt: "2026-04-10T10:20:00.000Z",
  },
  {
    id: "prog-volunteer-family-support",
    slug: "family-support-volunteer",
    category: "volunteer",
    status: "draft",
    featured: false,
    coverImage: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80",
    location: {
      es: "Comunidades rurales del sur de Costa Rica",
    },
    duration: {
      es: "3 a 10 semanas",
    },
    availability: {
      es: "Próxima apertura de cupos",
    },
    translations: {
      es: {
        title: "Voluntariado de acompañamiento familiar",
        shortDescription:
          "Programa en preparación para fortalecer actividades de apoyo comunitario, acompañamiento y talleres familiares.",
        fullDescription:
          "Esta propuesta se mantiene en borrador mientras el equipo termina de definir calendario, alianzas y alcance operativo. La intención es crear una experiencia de voluntariado centrada en acompañamiento familiar, actividades socioeducativas y coordinación con actores comunitarios de la zona.",
        requirements: [
          "Sensibilidad para trabajar con familias y contextos comunitarios diversos.",
          "Disponibilidad para adaptarse a cronogramas definidos por la coordinación local.",
          "Respeto por procesos comunitarios y comunicación responsable.",
        ],
        included: [
          "Inducción contextual una vez se publique la convocatoria.",
          "Seguimiento operativo del equipo coordinador.",
          "Definición final de inclusiones en la siguiente iteración administrativa.",
        ],
      },
    },
    seo: {
      es: {
        title: "Voluntariado de acompañamiento familiar",
        description:
          "Programa en borrador para apoyo familiar y trabajo comunitario dentro de futuras convocatorias de Pura Vida Interculturas.",
      },
    },
    createdBy: "seed-system",
    updatedBy: "seed-system",
    createdAt: "2026-04-05T13:00:00.000Z",
    updatedAt: "2026-04-12T09:40:00.000Z",
  },
] as const;

export const programCatalog = parseProgramCatalog(rawProgramCatalog);
