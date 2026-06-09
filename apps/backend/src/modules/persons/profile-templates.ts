export const DEFAULT_PROFILE_TEMPLATES = [
  {
    description:
      "Persona con experiencia atendiendo heridas, fiebre y crisis respiratorias durante evacuaciones; mantiene la calma, organiza turnos de cuidado y prioriza pacientes graves.",
    signals: ["atencion de salud", "control de crisis", "priorizacion"],
    expectedProfession: "Medico",
  },
  {
    description:
      "Persona con entrenamiento en defensa, vigilancia nocturna y control de accesos; fisicamente resistente, disciplinada y acostumbrada a escoltar grupos bajo presion.",
    signals: ["defensa", "vigilancia", "escolta", "resistencia"],
    expectedProfession: "Guerrero",
  },
  {
    description:
      "Persona habil leyendo mapas, ubicando rutas seguras y detectando rastros en terreno abierto; prefiere moverse rapido y observar antes de actuar.",
    signals: ["orientacion", "rutas", "rastreo", "movilidad"],
    expectedProfession: "Explorador",
  },
  {
    description:
      "Persona que conoce cultivo de hortalizas, conservacion de semillas, preparacion de suelo y rotacion basica de siembras; busca estabilizar la produccion diaria.",
    signals: ["cultivo", "semillas", "suelo", "alimento"],
    expectedProfession: "Agricultor",
  },
  {
    description:
      "Persona con conocimientos de filtracion, purificacion de agua, reparacion de sistemas simples y analisis basico de contaminacion; registra resultados con precision.",
    signals: ["agua", "filtros", "reparacion", "analisis"],
    expectedProfession: "Cientifico",
  },
  {
    description:
      "Persona acostumbrada a negociar conflictos, coordinar acuerdos entre grupos y calmar discusiones; comunica condiciones con claridad y evita confrontaciones innecesarias.",
    signals: ["negociacion", "coordinacion", "comunicacion", "mediacion"],
    expectedProfession: "Diplomatico",
  },
  {
    description:
      "Persona con experiencia rastreando animales, colocando trampas, preparando carne y moviendose con silencio fuera del campamento.",
    signals: ["rastreo", "trampas", "alimento", "sigilo"],
    expectedProfession: "Cazador",
  },
  {
    description:
      "Persona con conocimientos basicos de enfermeria comunitaria, higiene, vendajes y control de infecciones, aunque no destaca en fuerza fisica ni viajes largos.",
    signals: ["enfermeria", "higiene", "vendajes", "infecciones"],
    expectedProfession: "Medico",
  },
  {
    description:
      "Persona tecnica y metodica que repara bombas manuales, revisa filtros, improvisa recipientes seguros y documenta consumo de agua por grupo.",
    signals: ["mantenimiento", "filtros", "agua", "registro"],
    expectedProfession: "Cientifico",
  },
  {
    description:
      "Persona resistente, paciente y buena observadora, capaz de seguir huellas, identificar zonas con alimento y regresar con reportes utiles para el campamento.",
    signals: ["observacion", "huellas", "alimento", "campo"],
    expectedProfession: "Explorador",
  },
] as const;
