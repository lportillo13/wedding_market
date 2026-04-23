const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const quoteMessagesSqlPath = path.join(process.cwd(), "sql", "quote-messages.sql");
  const inboxThreadsSqlPath = path.join(process.cwd(), "sql", "inbox-threads.sql");
  const quoteMessagesSql = fs.readFileSync(quoteMessagesSqlPath, "utf8");
  const inboxThreadsSql = fs.readFileSync(inboxThreadsSqlPath, "utf8");

  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();

  try {
    await client.query(quoteMessagesSql);
    await client.query(inboxThreadsSql);

    const cols = await client.query(
      [
        "select column_name, data_type",
        "from information_schema.columns",
        "where table_schema = 'public'",
        "  and table_name = 'rfq_invites'",
        "  and column_name in ('id','viewed_at','last_activity_at','client_last_read_at','vendor_last_read_at','closed_at','closed_reason')",
        "order by column_name",
      ].join("\n")
    );

    const triggers = await client.query(
      [
        "select trigger_name",
        "from information_schema.triggers",
        "where event_object_schema = 'public'",
        "  and event_object_table in ('quotes', 'quote_messages')",
        "  and trigger_name in ('quotes_touch_rfq_invite_activity', 'quote_messages_touch_rfq_invite_activity')",
        "order by trigger_name",
      ].join("\n")
    );

    console.log("Applied quote-messages.sql and inbox-threads.sql");
    console.log("COLUMNS=" + JSON.stringify(cols.rows));
    console.log("TRIGGERS=" + JSON.stringify(triggers.rows));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
