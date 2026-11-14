export interface OrgProfile {
  slug: string;
  name: string;
  aliases: string[];
  caseworker: string;
  role: string;
  checks: string[];
  log: string[];
}

export const orgProfiles: OrgProfile[] = [
  {
    slug: "camino-a-casa",
    name: "Albergue Camino a Casa I.A.P.",
    aliases: ["Albergue Camino a Casa I.A.P.", "Casa de Paso Esperanza I.A.P."],
    caseworker: "Laura Méndez",
    role: "Trabajadora social",
    checks: [
      "12 nov · Vimos su INE en persona (no se publica)",
      "Hablamos con su familia en Guanajuato",
      "Cotizamos el boleto en la Central del Norte: $650",
    ],
    log: ["13 nov · Se juntó el boleto ($650). El albergue lo guarda hasta que él viaje."],
  },
  {
    slug: "comunidad-sana",
    name: "Comunidad Sana A.C.",
    aliases: ["Comunidad Sana A.C.", "Comunidad Sana A.B.P."],
    caseworker: "Dr. Emilio Ríos",
    role: "Enlace clínico",
    checks: [
      "9 nov · Vimos su identificación y la orden de cirugía (no se publican)",
      "La clínica confirmó el costo de la rehabilitación",
      "Hablamos con su mamá, que lo acompaña a las sesiones",
    ],
    log: ["10 nov · La clínica apartó la primera semana de terapia."],
  },
  {
    slug: "cuarto-firme",
    name: "Fundación Cuarto Firme A.C.",
    aliases: ["Fundación Cuarto Firme A.C.", "Fundación Techo Solidario A.C."],
    caseworker: "Rosa Aguilar",
    role: "Promotora de obra",
    checks: [
      "6 nov · Visitamos el cuarto y vimos su INE (no se publica)",
      "El albañil cotizó lámina, block y piso",
      "Hablamos con su vecina, que la acompaña en la obra",
    ],
    log: ["8 nov · El albañil dejó la cotización del techo."],
  },
];

export function orgForName(name: string) {
  return orgProfiles.find((org) => org.aliases.includes(name) || org.name === name) ?? null;
}

export function orgBySlug(slug: string) {
  return orgProfiles.find((org) => org.slug === slug) ?? null;
}

export function storyBelongsToOrg(organizationName: string, org: OrgProfile) {
  return org.aliases.includes(organizationName) || org.name === organizationName;
}
