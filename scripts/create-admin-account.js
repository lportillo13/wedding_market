const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { Client } = require("pg");

function loadEnvFile() {
  const filePath = path.join(process.cwd(), ".env.local");
  const env = {};

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    env[line.slice(0, separator)] = line.slice(separator + 1);
  }

  return env;
}

async function main() {
  const env = loadEnvFile();
  const email = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || "Admin User";

  if (!email || !password) {
    throw new Error("Usage: node scripts/create-admin-account.js <email> <password> [fullName]");
  }

  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const connectionString =
    env.SUPABASE_DB_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const pg = new Client({ connectionString });
  await pg.connect();

  try {
    const existing = await pg.query("select id from auth.users where email = $1 limit 1", [email]);

    let userId = existing.rows[0]?.id;

    if (userId) {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, kind: "admin" },
      });

      if (error) throw error;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, kind: "admin" },
      });

      if (error) throw error;
      userId = data.user.id;
    }

    await pg.query(
      `insert into public.profiles (id, full_name, role, language, country)
       values ($1, $2, 'admin', 'en', 'United States')
       on conflict (id) do update set
         full_name = excluded.full_name,
         role = excluded.role,
         language = excluded.language,
         country = excluded.country`,
      [userId, fullName]
    );

    const profile = await pg.query(
      "select id, full_name, role, language, country from public.profiles where id = $1",
      [userId]
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          email,
          user: profile.rows[0] ?? null,
        },
        null,
        2
      )
    );
  } finally {
    await pg.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
