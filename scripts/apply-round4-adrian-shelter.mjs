import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mockPath = path.join(root, "data", "mock-db.json");
const phrase = "Casa de Paso Esperanza";
const replacement = "Albergue Camino a Casa";

function applyMock() {
  const db = JSON.parse(readFileSync(mockPath, "utf8"));
  let storiesUpdated = 0;
  for (const story of db.stories) {
    if (story.slug !== "adrian" || typeof story.story !== "string") continue;
    if (!story.story.includes(phrase)) continue;
    story.story = story.story.replaceAll(phrase, replacement);
    storiesUpdated += 1;
  }
  if (storiesUpdated > 0) {
    writeFileSync(mockPath, `${JSON.stringify(db, null, 2)}\n`);
  }
  console.log(JSON.stringify({ mock: true, storiesUpdated }));
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
    const script = readFileSync(path.join(root, "scripts", "round4-adrian-shelter.sql"), "utf8");
    await sql.unsafe(script);
    const rows = await sql`
      SELECT slug,
             (story LIKE ${"%" + replacement + "%"}) AS names_new_shelter,
             (story LIKE ${"%" + phrase + "%"}) AS still_names_old_shelter
      FROM stories
      WHERE slug = 'adrian'
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
