const { Client } = require("pg");

async function main() {
  const tableName = process.argv[2];

  if (!tableName) {
    throw new Error("Missing table/view name argument.");
  }

  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });

  await client.connect();

  try {
    const result = await client.query(
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position",
      [tableName]
    );

    console.log(result.rows.map((row) => row.column_name).join("\n"));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
