import { 
  BrainCircuit, 
  MessageSquare, 
  Search, 
  Target, 
  ShieldAlert 
} from 'lucide-react';
import { ServiceItem, CountryExperience, CampaignStat, Product, SurveyPost } from './types';

export const APP_NAME = "ACCIÓN POLÍTICA";
export const TAGLINE = "Comunicación & Estrategia";

export const SOCIALS = {
  twitter: "@AccionPoliticaa",
  instagram: "@AccionPoliticaa",
  facebook: "ConsultoraAccionPolitica",
  web: "consultoraaccionpolitica@gmail.com"
};

export const ABOUT_TEXT = "Somos una firma de consultoría política dedicada a asesorar a precandidatos, candidatos, gobernantes y partidos políticos con experiencia y éxito comprobado en América Latina y El Caribe.";

export const SERVICES: ServiceItem[] = [
  {
    title: "Estrategia Integral",
    icon: BrainCircuit,
    items: [
      "Estrategia Política",
      "Estrategia Electoral",
      "Estrategia Comunicacional",
      "Estrategia Digital",
      "Estrategia de Ads",
      "Geo Marketing"
    ]
  },
  {
    title: "Investigación y Datos",
    icon: Search,
    items: [
      "Investigación Cuantitativa",
      "Investigación Cualitativa",
      "Benchmark",
      "Control Tracking",
      "Focus Groups",
      "Perception Analyzer",
      "Mapas Mentales",
      "Antropología Digital"
    ]
  },
  {
    title: "Comunicación de Alto Impacto",
    icon: MessageSquare,
    items: [
      "Comunicación Política Digital",
      "Manejo de Crisis",
      "War Room Digital",
      "Sala de Aire",
      "Mensajería Masiva",
      "Integración Aire/Tierra"
    ]
  },
  {
    title: "Posicionamiento",
    icon: Target,
    items: [
      "Imagen Pública",
      "Amplificación",
      "Activismo Digital",
      "Media Buying",
      "Dirección Creativa",
      "Campañas Premium"
    ]
  }
];

export const EXPERIENCE: CountryExperience[] = [
  {
    country: "México",
    flagCode: "MX",
    highlights: [
      "Campaña al Comité Directivo Nacional del PRI",
      "Gubernatura Michoacán",
      "Gubernatura Estado de México",
      "Gubernatura Chihuahua",
      "Gubernatura Baja California Sur",
      "Coordinación Estatal Sonora (67/102 victorias)",
      "Coordinación Estatal Campeche (26/38 victorias)",
      "+30 Campañas de Diputados"
    ]
  },
  {
    country: "Colombia",
    flagCode: "CO",
    highlights: [
      "Partido Liberal Colombiano",
      "Partido Cambio Radical",
      "Pacto Histórico",
      "Partido Centro Democrático",
      "Partido Alianza Verde",
      "Partido de la U"
    ]
  },
  {
    country: "República Dominicana",
    flagCode: "DO",
    highlights: [
      "Partido de la Liberación Dominicana",
      "Partido Revolucionario Moderno",
      "Campañas Municipales",
      "Campañas Legislativas"
    ]
  },
  {
    country: "Venezuela",
    flagCode: "VE",
    highlights: [
      "Mesa de la Unidad Democrática",
      "Partido Acción Democrática",
      "Partido Voluntad Popular",
      "Partido Vente Venezuela"
    ]
  },
  {
    country: "Ecuador",
    flagCode: "EC",
    highlights: [
      "CREO",
      "Partido Podemos",
      "Revolución Ciudadana"
    ]
  },
  {
    country: "Guatemala",
    flagCode: "GT",
    highlights: [
      "Partido Unionista",
      "Partido TODOS"
    ]
  },
  {
    country: "Paraguay",
    flagCode: "PY",
    highlights: [
      "Campañas Municipales Partido Colorado",
      "Movimiento Nueva República"
    ]
  }
];

export const PRODUCTS: Product[] = [
  {
    title: "War Room Digital",
    description: "Centro de mando para el monitoreo y respuesta inmediata en redes y medios."
  },
  {
    title: "Defensa y Contraste",
    description: "Estrategias de contención y manejo de crisis en tiempo real."
  },
  {
    title: "Producción Premium",
    description: "Dirección creativa para spots, documentales y eventos especiales de gobierno."
  },
  {
    title: "Tierra y Aire",
    description: "Integración operativa de la movilización territorial con la estrategia digital."
  }
];

export const DEFAULT_SURVEY_POSTS: SurveyPost[] = [
  {
    id: "encuesta-gestion-territorial",
    title: "Pulso ciudadano sobre gestión territorial",
    category: "Opinión pública",
    summary: "Hallazgos clave sobre percepción de cercanía, capacidad de respuesta y confianza institucional en territorios urbanos intermedios.",
    content:
      "Este informe resume patrones de opinión detectados en una medición de clima social enfocada en liderazgo local, evaluación de la gestión y expectativas frente a la comunicación pública. El análisis sugiere que la ciudadanía responde mejor a narrativas de presencia territorial, resultados verificables y vocerías consistentes.\n\nLa lectura estratégica recomienda priorizar piezas de rendición de cuentas simples, activar escucha comunitaria segmentada y reforzar la comunicación de soluciones concretas con voceros reconocibles en cada territorio.",
    imageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600&auto=format&fit=crop",
    pdfUrl: "https://drive.google.com/file/d/1-demo-pulso-territorial/view",
    publishedAt: "2026-03-24",
    createdAt: "2026-03-24T00:00:00.000Z",
    contentBlocks: [
      {
        id: "gestion-text-1",
        type: "text",
        content:
          "Este informe resume patrones de opinión detectados en una medición de clima social enfocada en liderazgo local, evaluación de la gestión y expectativas frente a la comunicación pública."
      },
      {
        id: "gestion-image-1",
        type: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1400&auto=format&fit=crop",
        caption: "Sesiones de escucha ciudadana y análisis territorial."
      },
      {
        id: "gestion-text-2",
        type: "text",
        content:
          "La lectura estratégica recomienda priorizar piezas de rendición de cuentas simples, activar escucha comunitaria segmentada y reforzar la comunicación de soluciones concretas con voceros reconocibles en cada territorio."
      }
    ]
  },
  {
    id: "encuesta-juventud-digital",
    title: "Tendencias de conversación política en audiencias jóvenes",
    category: "Comportamiento digital",
    summary: "Una lectura ejecutiva sobre los temas que movilizan a votantes jóvenes y los formatos que mejor convierten atención en afinidad política.",
    content:
      "La encuesta muestra que las audiencias jóvenes castigan los mensajes rígidos y premian la claridad, la autenticidad y la utilidad práctica. Las piezas con microhistorias, testimonios y explicaciones breves superan a los formatos institucionales tradicionales.\n\nEntre las recomendaciones destaca construir contenidos con tono humano, calendarizar respuestas rápidas a coyunturas y traducir los temas complejos a efectos concretos sobre empleo, seguridad y educación.",
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop",
    pdfUrl: "https://drive.google.com/file/d/1-demo-juventud-digital/view",
    publishedAt: "2026-02-12",
    createdAt: "2026-02-12T00:00:00.000Z",
    contentBlocks: [
      {
        id: "juventud-text-1",
        type: "text",
        content:
          "La encuesta muestra que las audiencias jóvenes castigan los mensajes rígidos y premian la claridad, la autenticidad y la utilidad práctica."
      },
      {
        id: "juventud-image-1",
        type: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1400&auto=format&fit=crop",
        caption: "Consumo digital y conversación política en entornos móviles."
      },
      {
        id: "juventud-text-2",
        type: "text",
        content:
          "Entre las recomendaciones destaca construir contenidos con tono humano, calendarizar respuestas rápidas a coyunturas y traducir los temas complejos a efectos concretos sobre empleo, seguridad y educación."
      }
    ]
  },
  {
    id: "encuesta-aprobacion-ejecutiva",
    title: "Aprobación ejecutiva y percepción de resultados",
    category: "Opinión pública",
    summary: "Lectura comparada sobre aprobación de gestión, expectativas de corto plazo y sensibilidad frente al mensaje de resultados.",
    content:
      "El estudio muestra que la ciudadanía reacciona mejor a narrativas de ejecución concreta que a mensajes generales de posicionamiento. La percepción de resultados pesa más cuando va acompañada de hitos verificables y voceros consistentes.\n\nLa conversación pública sugiere que la rendición de cuentas breve, territorial y visual puede mejorar la lectura de gestión en segmentos moderados.",
    imageUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop",
    pdfUrl: "https://drive.google.com/file/d/1-demo-aprobacion-ejecutiva/view",
    publishedAt: "2026-03-14",
    createdAt: "2026-03-14T00:00:00.000Z",
    contentBlocks: [
      {
        id: "aprobacion-text-1",
        type: "text",
        content:
          "El estudio muestra que la ciudadanía reacciona mejor a narrativas de ejecución concreta que a mensajes generales de posicionamiento."
      },
      {
        id: "aprobacion-image-1",
        type: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?q=80&w=1400&auto=format&fit=crop",
        caption: "Tableros de seguimiento y evaluación de gestión."
      }
    ]
  },
  {
    id: "encuesta-seguridad-barrial",
    title: "Percepción de seguridad barrial en ciudades intermedias",
    category: "Clima social",
    summary: "Un mapa de preocupaciones cotidianas, confianza institucional y prioridades comunicacionales alrededor de seguridad local.",
    content:
      "La seguridad barrial sigue siendo uno de los principales activadores emocionales del voto urbano. La investigación detecta diferencias claras entre preocupación, experiencia directa y evaluación del liderazgo local.\n\nLos hallazgos apuntan a mensajes de proximidad, respuesta visible y coordinación territorial como piezas de mayor eficacia narrativa.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1600&auto=format&fit=crop",
    pdfUrl: "https://drive.google.com/file/d/1-demo-seguridad-barrial/view",
    publishedAt: "2026-03-05",
    createdAt: "2026-03-05T00:00:00.000Z",
    contentBlocks: [
      {
        id: "seguridad-text-1",
        type: "text",
        content:
          "La seguridad barrial sigue siendo uno de los principales activadores emocionales del voto urbano."
      }
    ]
  },
  {
    id: "encuesta-mujeres-liderazgo-local",
    title: "Mujeres, liderazgo local y confianza pública",
    category: "Segmentación",
    summary: "Hallazgos sobre expectativas de representación, cercanía y atributos de liderazgo mejor valorados en vocerías femeninas.",
    content:
      "Las audiencias consultadas premian perfiles que combinen solvencia, escucha y firmeza. La confianza crece cuando el liderazgo se asocia con capacidad de gestión y sensibilidad social.\n\nEl lenguaje visual y testimonial tiene un peso mayor que el discurso abstracto en la construcción de empatía con estos segmentos.",
    imageUrl:
      "https://images.unsplash.com/photo-1573496799515-eebbb63814f2?q=80&w=1600&auto=format&fit=crop",
    pdfUrl: "https://drive.google.com/file/d/1-demo-mujeres-liderazgo/view",
    publishedAt: "2026-02-26",
    createdAt: "2026-02-26T00:00:00.000Z",
    contentBlocks: [
      {
        id: "mujeres-text-1",
        type: "text",
        content:
          "Las audiencias consultadas premian perfiles que combinen solvencia, escucha y firmeza."
      }
    ]
  },
  {
    id: "encuesta-narrativas-economia-familiar",
    title: "Narrativas sobre economía familiar y costo de vida",
    category: "Mensajería",
    summary: "Qué mensajes conectan mejor cuando la conversación pública gira en torno a precios, empleo e incertidumbre doméstica.",
    content:
      "La investigación confirma que los mensajes económicos funcionan mejor cuando aterrizan el impacto cotidiano y no se quedan en indicadores macro. La claridad sobre alivios, soluciones y horizonte inmediato mejora la receptividad.\n\nLos contenidos más eficaces son los que bajan la discusión económica al lenguaje de hogar, estabilidad y previsibilidad.",
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1600&auto=format&fit=crop",
    pdfUrl: "https://drive.google.com/file/d/1-demo-economia-familiar/view",
    publishedAt: "2026-02-18",
    createdAt: "2026-02-18T00:00:00.000Z",
    contentBlocks: [
      {
        id: "economia-text-1",
        type: "text",
        content:
          "La investigación confirma que los mensajes económicos funcionan mejor cuando aterrizan el impacto cotidiano y no se quedan en indicadores macro."
      }
    ]
  },
  {
    id: "encuesta-jovenes-participacion-electoral",
    title: "Participación electoral en menores de 30 años",
    category: "Comportamiento electoral",
    summary: "Una lectura sobre motivaciones de voto, apatía política y formatos de activación para públicos jóvenes en primera participación.",
    content:
      "Entre los jóvenes, la participación crece cuando el mensaje conecta con utilidad práctica, identidad y sentido de incidencia. La distancia con la política tradicional se reduce cuando aparecen voceros cercanos y agendas comprensibles.\n\nEl reto no es solo informar, sino traducir el acto electoral a una decisión con impacto personal y colectivo.",
    imageUrl:
      "https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=1600&auto=format&fit=crop",
    pdfUrl: "https://drive.google.com/file/d/1-demo-jovenes-participacion/view",
    publishedAt: "2026-02-01",
    createdAt: "2026-02-01T00:00:00.000Z",
    contentBlocks: [
      {
        id: "participacion-text-1",
        type: "text",
        content:
          "Entre los jóvenes, la participación crece cuando el mensaje conecta con utilidad práctica, identidad y sentido de incidencia."
      }
    ]
  },
  {
    id: "encuesta-conversacion-presidencial",
    title: "Conversación digital alrededor de liderazgo presidencial",
    category: "Comportamiento digital",
    summary: "Monitoreo de tono, temas dominantes y marcos narrativos que ordenan la conversación pública en escenarios de alta polarización.",
    content:
      "El ecosistema digital tiende a consolidar marcos simples y emocionales en torno al liderazgo presidencial. La investigación detecta que los picos de conversación se ordenan en torno a confrontación, expectativa y credibilidad.\n\nLa oportunidad estratégica está en fijar marcos propios antes de que la coyuntura quede capturada por relato adversario.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321310764-8d5f1b58d821?q=80&w=1600&auto=format&fit=crop",
    pdfUrl: "https://drive.google.com/file/d/1-demo-conversacion-presidencial/view",
    publishedAt: "2026-01-22",
    createdAt: "2026-01-22T00:00:00.000Z",
    contentBlocks: [
      {
        id: "presidencial-text-1",
        type: "text",
        content:
          "El ecosistema digital tiende a consolidar marcos simples y emocionales en torno al liderazgo presidencial."
      }
    ]
  }
];

export const CMS_ADMIN_USERNAME = "research-admin";
export const CMS_ADMIN_PASSWORD = "APResearch2026!";
