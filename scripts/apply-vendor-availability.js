const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const connectionString =
  process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

async function main() {
  const sqlPath = path.join(process.cwd(), "sql", "vendor-availability.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const client = new Client({ connectionString });

  await client.connect();
  try {
    await client.query(sql);

    const tableResult = await client.query(`
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'vendor_availability'
      ) as exists
    `);

    const viewColumnsResult = await client.query(`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'vendor_profile_view'
      order by ordinal_position
    `);

    console.log(
      JSON.stringify(
        {
          vendorAvailabilityTable: Boolean(tableResult.rows[0]?.exists),
          vendorProfileViewColumns: viewColumnsResult.rows.map((row) => row.column_name),
        },
        null,
        2
      )
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
