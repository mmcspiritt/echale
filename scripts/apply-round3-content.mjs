import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mockPath = path.join(root, "data", "mock-db.json");

const storyPatches = {
  adrian: {
    personName: "Adrián Soto",
    accountHolderName: "Adrián Soto",
    title: "Adrián Soto vuelve a Guanajuato",
    summary:
      "Adrián vino a una obra en CDMX. Su mamá se puso mal en Guanajuato y no le alcanza para el boleto de regreso.",
    story:
      "Adrián vino a CDMX a trabajar unos meses en una obra. Su mamá se puso mal en Guanajuato y la noticia lo agarró sin un peso ahorrado. Albergue Camino a Casa le dio dónde quedarse y le está ayudando a regresar. Con esto se paga su boleto en la Central del Norte y la comida del camino.",
    organizationName: "Albergue Camino a Casa I.A.P.",
    galleryImages: [
      "/stories/adrian/adrian-cover-4x5.webp",
      "/stories/adrian/adrian-gallery-2-3x2.webp",
    ],
  },
  santiago: {
    title: "Santiago necesita operarse la rodilla",
    summary: "Santiago se lastimó la rodilla jugando fut los domingos y lleva meses sin poder trabajar.",
    story:
      "Santiago trabaja por su cuenta como albañil en Puebla, sin seguro. Se rompió el ligamento de la rodilla en un partido y desde entonces anda con muleta. El ortopedista le dijo que necesita una artroscopia y luego terapia. Con esta meta paga la resonancia, la operación y las sesiones de rehabilitación para volver a la obra.",
    organizationName: "Comunidad Sana A.C.",
    galleryImages: [
      "/stories/santiago/santiago-cover-4x5.webp",
      "/stories/santiago/santiago-gallery-2-3x2.webp",
    ],
    milestones: [
      { id: "m1-santiago", label: "Resonancia y estudios", targetAmount: 6000 },
      { id: "m2-santiago", label: "Operación (artroscopia)", targetAmount: 38000 },
      { id: "m3-santiago", label: "Rehabilitación, 15 sesiones", targetAmount: 50000 },
    ],
  },
  miriam: {
    personName: "Doña Miriam",
    accountHolderName: "Doña Miriam",
    title: "Doña Miriam vuelve a tener un cuarto seguro",
    summary:
      "El sismo le cuarteó la casa en la Mixteca y desde entonces duerme bajo una lona. Con $50,000 se levanta un cuarto firme.",
    story:
      "Doña Miriam vive con su nieta en un pueblo de la Mixteca oaxaqueña. Con el sismo, los muros de adobe se cuartearon y el techo quedó a punto de caerse. La fundación ya revisó la casa con un albañil de la comunidad: primero el techo de lámina, luego muros de block con castillos, después piso y puerta, y al final una cocina sencilla.",
    organizationName: "Fundación Cuarto Firme A.C.",
    coverImage: "/stories/miriam/miriam-gallery-2-3x2.webp",
    galleryImages: [
      "/stories/miriam/miriam-gallery-2-3x2.webp",
      "/stories/miriam/miriam-cover-4x5.webp",
      "/stories/miriam/miriam-gallery-1-1x1.webp",
    ],
    milestones: [
      { id: "m1-miriam", label: "Techo de lámina", targetAmount: 10000 },
      { id: "m2-miriam", label: "Muros de block con castillos", targetAmount: 25000 },
      { id: "m3-miriam", label: "Piso y puerta", targetAmount: 40000 },
      { id: "m4-miriam", label: "Cocina sencilla", targetAmount: 50000 },
    ],
  },
};

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function exampleAmounts(target, slug) {
  let remaining = roundMoney(target);
  if (slug === "adrian") {
    const specified = [100, 50, 200, 150, 100, 70, 50];
    const sum = specified.reduce((acc, value) => acc + value, 0);
    if (roundMoney(remaining) === sum) return specified;
    specified[6] = roundMoney(specified[6] + (remaining - sum));
    if (specified[6] > 0 && specified[6] <= 500) return specified;
  }

  const amounts = [];
  const cycle = [100, 200, 150, 300, 250, 100, 200, 50, 300, 150, 400, 200, 100, 250, 300, 500, 150, 200];
  if (remaining >= 7500) {
    amounts.push(5000);
    remaining = roundMoney(remaining - 5000);
  }
  if (remaining >= 3500) {
    amounts.push(2000);
    remaining = roundMoney(remaining - 2000);
  }
  let i = 0;
  while (remaining > 500) {
    const next = cycle[i % cycle.length];
    if (next > remaining) break;
    amounts.push(next);
    remaining = roundMoney(remaining - next);
    i += 1;
  }
  if (remaining > 0) {
    if (amounts.length === 0) amounts.push(remaining);
    else if (remaining < 50) amounts[amounts.length - 1] = roundMoney(amounts[amounts.length - 1] + remaining);
    else amounts.push(remaining);
  }
  return amounts;
}

function isReal(payment) {
  return (
    payment.status === "paid" &&
    payment.method !== "mock" &&
    Boolean(payment.providerTransactionId || payment.peyApiKeyId)
  );
}

const names = [
  "Lupita", "Toño", "Fer", "Majo", "Chuy", "Vale", "Neto", "Gaby", "Paco", "Rocío",
  "Beto", "Lalo", "Sofi", "Diego", "Mari", "José", "Ana", "Iker", "Nayeli", "Paola",
  "Memo", "Citlali", "Raúl", "Yola", "Hugo", "Iris", "Omar", "Tere", "Bruno", "Caro",
];
const notes = [
  "¡Échale ganas, Santi!",
  "Fuerza, Doña Miriam",
  "De parte de los primos en LA",
  "Aquí andamos.",
  "Un abrazo.",
  "Para lo que haga falta.",
  "Cuenta con nosotros.",
  "Ánimo.",
  "De parte de la familia.",
  "Va con cariño.",
];
const adrianNames = ["Majo", "Luis", "Anónimo", "Fer", "Toño", "Vale", "Chuy"];
const adrianNotes = [
  "Buen viaje de regreso.",
  "Para el boleto.",
  null,
  "De parte de los primos en LA",
  "Aquí andamos.",
  "Ánimo, Adrián.",
  "Pa' que comas en el camino.",
];

function buildExamples(story, target) {
  const amounts = exampleAmounts(target, story.slug);
  let usedCompaneros = false;
  let usedFamilia = false;
  const base = Date.parse("2026-11-13T22:00:00.000Z");
  const offset = story.slug === "adrian" ? 0 : story.slug === "santiago" ? 200 : 400;
  return amounts.map((amount, index) => {
    const idx = index + 1;
    let donor;
    let message;
    if (amount === 5000 && !usedCompaneros) {
      donor = "Compañeros de la obra";
      message = "De parte de los compañeros de la obra.";
      usedCompaneros = true;
    } else if (amount === 2000 && !usedFamilia) {
      donor = "Familia Reyes";
      message = "De parte de toda la familia.";
      usedFamilia = true;
    } else if (story.slug === "adrian") {
      donor = adrianNames[index % adrianNames.length];
      message = adrianNotes[index % adrianNotes.length];
    } else if (idx % 6 === 0) {
      donor = "Anónimo";
      message = null;
    } else {
      donor = names[index % names.length];
      message = notes[index % notes.length];
    }
    const paidAt = new Date(base - index * 11 * 60 * 60 * 1000).toISOString();
    return {
      id: `example-r3-${story.slug}-${idx}`,
      storyId: story.id,
      reference: 940000 + offset + idx,
      peyApiKeyEnv: story.peyApiKeyEnv,
      peyApiKeyId: null,
      providerChargeId: null,
      providerTransactionId: null,
      amount,
      donorName: donor,
      message,
      phone: null,
      concept: "Aporte de ejemplo",
      method: "mock",
      status: "paid",
      qrString: "{}",
      paymentLink: null,
      paidAt,
      releasedAt: null,
      createdAt: paidAt,
      updatedAt: paidAt,
    };
  });
}

function applyMock() {
  const db = JSON.parse(readFileSync(mockPath, "utf8"));
  const summary = [];
  for (const story of db.stories) {
    const patch = storyPatches[story.slug];
    if (patch) Object.assign(story, patch);
  }
  const kept = [];
  const created = [];
  for (const story of db.stories) {
    if (!storyPatches[story.slug]) continue;
    const related = db.payments.filter((payment) => payment.storyId === story.id);
    const real = related.filter(isReal);
    const examples = related.filter((payment) => payment.status === "paid" && !isReal(payment));
    const pending = related.filter((payment) => payment.status !== "paid");
    const target = roundMoney(examples.reduce((acc, payment) => acc + Number(payment.amount), 0));
    const next = buildExamples(story, target);
    const sum = roundMoney(next.reduce((acc, payment) => acc + payment.amount, 0));
    if (sum !== target) {
      throw new Error(`example total changed for ${story.slug}`);
    }
    kept.push(...real, ...pending);
    created.push(...next);
    summary.push({ slug: story.slug, exampleTotal: target, rows: next.length, realKept: real.length });
  }
  const other = db.payments.filter((payment) => !storyPatches[payment.storyId] && !db.stories.some((story) => story.id === payment.storyId && storyPatches[story.slug]));
  db.payments = [...other, ...kept, ...created];
  for (const payment of db.payments) {
    const matt = String(payment.id).startsWith("5e4f93c2") || (Number(payment.amount) === 0.01 && isReal(payment));
    if (!matt) continue;
    payment.donorName = "Matt (equipo Échale)";
    payment.message = "Prueba real de 1 centavo con CoDi. Sí llega.";
  }
  writeFileSync(mockPath, `${JSON.stringify(db, null, 2)}\n`);
  console.log(JSON.stringify({ mock: true, stories: summary }));
}

async function applyPostgres() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set; production content was not updated.");
    process.exitCode = 2;
    return;
  }
  const postgres = (await import("postgres")).default;
  const sql = postgres(databaseUrl, { ssl: "require", prepare: false, max: 1 });
  try {
    const script = readFileSync(path.join(root, "scripts", "round3-content.sql"), "utf8");
    await sql.unsafe(script);
    const rows = await sql`
      SELECT s.slug,
             COUNT(*) FILTER (WHERE p.id LIKE 'example-r3-%') AS example_rows,
             COALESCE(SUM(p.amount) FILTER (WHERE p.id LIKE 'example-r3-%'), 0) AS example_total,
             COUNT(*) FILTER (
               WHERE p.status = 'paid'
                 AND COALESCE(p.method, '') <> 'mock'
                 AND (p.provider_transaction_id IS NOT NULL OR p.pey_api_key_id IS NOT NULL)
             ) AS real_rows
      FROM stories s
      LEFT JOIN payments p ON p.story_id = s.id
      WHERE s.slug IN ('adrian', 'santiago', 'miriam')
      GROUP BY s.slug
      ORDER BY s.slug
    `;
    console.log(JSON.stringify({ postgres: true, stories: rows }));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const mockOnly = process.argv.includes("--mock");
if (mockOnly || !process.env.DATABASE_URL?.trim()) {
  applyMock();
}
if (!mockOnly) {
  await applyPostgres();
}
