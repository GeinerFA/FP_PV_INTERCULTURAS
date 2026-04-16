export const adminPageCopy = {
  login: {
    title: "Admin login",
    description:
      "Pantalla reservada para el acceso administrativo del MVP. En una fase siguiente se conectará con Auth.js y Google OAuth.",
    sections: [
      "Mantiene separada la entrada al panel desde el sitio público.",
      "Permite anticipar estados de acceso y mensajes de seguridad.",
      "Todavía no implementa autenticación, por decisión explícita de alcance.",
    ],
  },
  dashboard: {
    title: "Admin dashboard",
    description:
      "Resumen operativo para monitorear programas, postulaciones, reportes y configuración general desde una sola base administrativa.",
    sections: [
      "Será el punto de entrada protegido del equipo interno.",
      "Puede consolidar métricas y alertas tempranas del MVP.",
      "Ya quedó conectado al layout compartido del panel.",
    ],
  },
  programs: {
    title: "Programs management",
    description:
      "Listado administrativo para crear, editar, publicar o despublicar programas según el mapa funcional definido en el documento maestro.",
    sections: [
      "Preparado para CRUD de programas.",
      "Compatible con slugs, estados y contenido bilingüe.",
      "Más adelante se conectará a modelos y servicios.",
    ],
  },
  programsNew: {
    title: "Create program",
    description:
      "Formulario futuro para registrar nuevos programas de voluntariado, pasantías o español desde el panel interno.",
    sections: [
      "Deberá incluir contenido corto, contenido extendido y SEO.",
      "Está alineado con el modelo programs del documento maestro.",
      "Todavía funciona como placeholder arquitectónico.",
    ],
  },
  programsEdit: {
    title: "Edit program",
    description:
      "Ruta dinámica preparada para actualizar un programa existente mediante su identificador interno.",
    sections: [
      "La estructura [id]/edit ya quedó definida.",
      "Servirá para edición, publicación y auditoría posterior.",
      "Es el equivalente administrativo del detalle público por slug.",
    ],
  },
  applications: {
    title: "Applications inbox",
    description:
      "Bandeja de solicitudes para revisar postulaciones, filtrarlas por estado y coordinar seguimiento interno.",
    sections: [
      "Pensada para soportar estados y trazabilidad del proceso.",
      "Se conectará a validaciones y persistencia más adelante.",
      "Es una pieza central del MVP operativo.",
    ],
  },
  applicationDetail: {
    title: "Application detail",
    description:
      "Vista individual para consultar la información de la persona postulante, su programa de interés y el historial de gestión.",
    sections: [
      "La ruta dinámica [id] ya existe.",
      "Servirá para cambiar estados y revisar consentimientos.",
      "Puede evolucionar hacia bitácora contextual y notas internas.",
    ],
  },
  reports: {
    title: "Reports",
    description:
      "Espacio destinado a reportes básicos del MVP, con futura exportación CSV y visualizaciones resumidas.",
    sections: [
      "Alineado con el requisito funcional RF-09.",
      "Será ideal para métricas de programas y postulaciones.",
      "Quedó listo para crecer sin mezclar responsabilidades.",
    ],
  },
  activity: {
    title: "Activity log",
    description:
      "Sección para registrar acciones administrativas relevantes y sostener una bitácora operativa básica.",
    sections: [
      "Responde al requisito funcional RF-10.",
      "Más adelante podrá apoyarse en activity_logs.",
      "Ayuda a dar trazabilidad al panel interno.",
    ],
  },
  settings: {
    title: "Site settings",
    description:
      "Área para branding, datos de contacto, enlaces sociales, gráfico de impacto y correos de notificación del sitio.",
    sections: [
      "Relacionada con site_settings del modelo de datos.",
      "Será útil para evitar hardcodes dispersos.",
      "La arquitectura ya separa esta responsabilidad en una ruta dedicada.",
    ],
  },
} as const;

export type AdminPageKey = keyof typeof adminPageCopy;
