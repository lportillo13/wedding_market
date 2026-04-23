const { Client } = require("pg");

async function main() {
  const slug = process.argv[2];

  if (!slug) {
    throw new Error("Missing slug argument.");
  }

  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });

  await client.connect();

  try {
    const result = await client.query(
      "select id, slug, name, logo_url, media from public.vendor_profile_view where slug = $1",
      [slug]
    );

    console.log(JSON.stringify(result.rows[0] ?? null, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
