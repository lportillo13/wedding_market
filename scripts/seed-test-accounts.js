const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const connectionString = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    kind: 'client',
    email: 'client.alice@wedding-market.local',
    password: 'TestPass!1001',
    profile: {
      full_name: 'Alice Rivera',
      role: 'user',
      phone: '+1 407-555-1001',
      country: 'United States',
      tentative_wedding_date: '2026-10-18',
      guest_count: 120,
      wedding_budget: 28000,
      wedding_theme: 'Garden party',
      language: 'en',
    },
  },
  {
    kind: 'client',
    email: 'client.maya@wedding-market.local',
    password: 'TestPass!1002',
    profile: {
      full_name: 'Maya Thompson',
      role: 'user',
      phone: '+1 305-555-1002',
      country: 'United States',
      tentative_wedding_date: '2026-12-06',
      guest_count: 85,
      wedding_budget: 18000,
      wedding_theme: 'Modern beach',
      language: 'en',
    },
  },
  {
    kind: 'vendor',
    email: 'vendor.luna@wedding-market.local',
    password: 'TestPass!2001',
    profile: {
      full_name: 'Luna Lens',
      role: 'vendor',
      phone: '+1 407-555-2001',
      country: 'United States',
      language: 'en',
    },
    vendor: {
      slug: 'luna-lens-photography',
      business_name: 'Luna Lens Photography',
      bio: {
        en: 'Editorial wedding photography with a documentary eye.',
        es: 'Fotografia editorial de bodas con un enfoque documental.',
      },
      extra_info: {
        en: 'Best for full-day coverage and engagement sessions.',
        es: 'Ideal para cobertura completa y sesiones de compromiso.',
      },
      phone: '+1 407-555-2001',
      website_url: 'https://lunalens.local',
      starting_price_cents: 320000,
      capacity_max: null,
      event_types: ['weddings', 'engagements'],
      years_in_business: 9,
      languages: ['English', 'Spanish'],
      team_size_range: '2-4',
      pricing_typical_spend_cents: 480000,
      pricing_peak_seasons: ['spring', 'fall'],
      categoryKey: 'photography',
      location: {
        country: 'United States',
        region: 'Central Florida',
        city: 'Orlando',
        state: 'FL',
        lat: 28.5383,
        lng: -81.3792,
        address: 'Downtown Orlando',
        service_radius_km: 120,
      },
      team: [
        { name: 'Luna Lens', title: 'Lead Photographer', sort_order: 1 },
        { name: 'Marco Diaz', title: 'Second Shooter', sort_order: 2 },
      ],
    },
  },
  {
    kind: 'vendor',
    email: 'vendor.harbor@wedding-market.local',
    password: 'TestPass!2002',
    profile: {
      full_name: 'Harbor House Events',
      role: 'vendor',
      phone: '+1 813-555-2002',
      country: 'United States',
      language: 'en',
    },
    vendor: {
      slug: 'harbor-house-catering',
      business_name: 'Harbor House Catering',
      bio: {
        en: 'Seasonal coastal menus and polished wedding service teams.',
        es: 'Menus costeros de temporada y equipos de servicio para bodas.',
      },
      extra_info: {
        en: 'Known for family-style dinners and cocktail stations.',
        es: 'Conocidos por cenas familiares y estaciones de cocteles.',
      },
      phone: '+1 813-555-2002',
      website_url: 'https://harborhouse.local',
      starting_price_cents: 650000,
      capacity_max: 300,
      event_types: ['weddings', 'welcome dinners'],
      years_in_business: 14,
      languages: ['English'],
      team_size_range: '10-20',
      pricing_typical_spend_cents: 950000,
      pricing_peak_seasons: ['winter', 'spring'],
      categoryKey: 'catering',
      location: {
        country: 'United States',
        region: 'Tampa Bay',
        city: 'Tampa',
        state: 'FL',
        lat: 27.9506,
        lng: -82.4572,
        address: 'Harbor District',
        service_radius_km: 90,
      },
      team: [{ name: 'Nina Patel', title: 'Event Director', sort_order: 1 }],
    },
  },
  {
    kind: 'vendor',
    email: 'vendor.sunset@wedding-market.local',
    password: 'TestPass!2003',
    profile: {
      full_name: 'Sunset Sounds',
      role: 'vendor',
      phone: '+1 305-555-2003',
      country: 'United States',
      language: 'en',
    },
    vendor: {
      slug: 'sunset-sounds-dj',
      business_name: 'Sunset Sounds DJ Co.',
      bio: {
        en: 'High-energy DJ and MC team for destination weddings.',
        es: 'Equipo de DJ y maestro de ceremonias para bodas destino.',
      },
      extra_info: {
        en: 'Includes ceremony audio and custom playlists.',
        es: 'Incluye audio para ceremonia y listas personalizadas.',
      },
      phone: '+1 305-555-2003',
      website_url: 'https://sunsetsounds.local',
      starting_price_cents: 210000,
      capacity_max: null,
      event_types: ['weddings', 'after parties'],
      years_in_business: 11,
      languages: ['English', 'Spanish'],
      team_size_range: '2-3',
      pricing_typical_spend_cents: 320000,
      pricing_peak_seasons: ['summer', 'winter'],
      categoryKey: 'music',
      location: {
        country: 'United States',
        region: 'South Florida',
        city: 'Miami',
        state: 'FL',
        lat: 25.7617,
        lng: -80.1918,
        address: 'Brickell',
        service_radius_km: 150,
      },
      team: [{ name: 'Jordan Vega', title: 'Lead DJ', sort_order: 1 }],
    },
  },
];

function sqlStringArray(values) {
  const escaped = values.map((value) => `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  return `{${escaped.join(',')}}`;
}

async function ensureAuthUser(account) {
  const pg = new Client({ connectionString });
  await pg.connect();
  try {
    const existing = await pg.query('select id from auth.users where email = $1 limit 1', [account.email]);
    if (existing.rows[0]?.id) {
      const userId = existing.rows[0].id;
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.profile.full_name, kind: account.kind },
      });
      if (error) throw error;
      return userId;
    }
  } finally {
    await pg.end();
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { full_name: account.profile.full_name, kind: account.kind },
  });
  if (error) throw error;
  return data.user.id;
}

async function seed() {
  const pg = new Client({ connectionString });
  await pg.connect();

  try {
    const categoryRows = await pg.query('select id, key from public.categories');
    const categoryMap = new Map(categoryRows.rows.map((row) => [row.key, row.id]));

    const seeded = [];

    for (const account of users) {
      const userId = await ensureAuthUser(account);

      await pg.query(
        `
          insert into public.profiles (
            id, full_name, role, phone, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme, language
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          on conflict (id) do update set
            full_name = excluded.full_name,
            role = excluded.role,
            phone = excluded.phone,
            country = excluded.country,
            tentative_wedding_date = excluded.tentative_wedding_date,
            guest_count = excluded.guest_count,
            wedding_budget = excluded.wedding_budget,
            wedding_theme = excluded.wedding_theme,
            language = excluded.language
        `,
        [
          userId,
          account.profile.full_name,
          account.profile.role,
          account.profile.phone || null,
          account.profile.country || null,
          account.profile.tentative_wedding_date || null,
          account.profile.guest_count || null,
          account.profile.wedding_budget || null,
          account.profile.wedding_theme || null,
          account.profile.language || null,
        ],
      );

      if (account.kind === 'vendor') {
        const vendor = account.vendor;
        const vendorRes = await pg.query(
          `
            insert into public.vendors (
              owner_id, slug, business_name, bio, rating_avg, rating_count, is_published, extra_info, phone,
              website_url, starting_price_cents, starting_price_currency, capacity_max, event_types, years_in_business,
              languages, team_size_range, pricing_typical_spend_cents, pricing_typical_spend_currency, pricing_peak_seasons
            ) values (
              $1,$2,$3,$4::jsonb,0,0,true,$5::jsonb,$6,$7,$8,'USD',$9,$10::text[],$11,$12::text[],$13,$14,'USD',$15::text[]
            )
            on conflict (slug) do update set
              owner_id = excluded.owner_id,
              business_name = excluded.business_name,
              bio = excluded.bio,
              is_published = excluded.is_published,
              extra_info = excluded.extra_info,
              phone = excluded.phone,
              website_url = excluded.website_url,
              starting_price_cents = excluded.starting_price_cents,
              capacity_max = excluded.capacity_max,
              event_types = excluded.event_types,
              years_in_business = excluded.years_in_business,
              languages = excluded.languages,
              team_size_range = excluded.team_size_range,
              pricing_typical_spend_cents = excluded.pricing_typical_spend_cents,
              pricing_peak_seasons = excluded.pricing_peak_seasons
            returning id
          `,
          [
            userId,
            vendor.slug,
            vendor.business_name,
            JSON.stringify(vendor.bio),
            JSON.stringify(vendor.extra_info),
            vendor.phone,
            vendor.website_url,
            vendor.starting_price_cents,
            vendor.capacity_max,
            vendor.event_types,
            vendor.years_in_business,
            vendor.languages,
            vendor.team_size_range,
            vendor.pricing_typical_spend_cents,
            vendor.pricing_peak_seasons,
          ],
        );
        const vendorId = vendorRes.rows[0].id;

        await pg.query(
          `
            insert into public.vendor_locations (
              vendor_id, country, region, city, lat, lng, address, state, service_radius_km
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            on conflict (vendor_id) do update set
              country = excluded.country,
              region = excluded.region,
              city = excluded.city,
              lat = excluded.lat,
              lng = excluded.lng,
              address = excluded.address,
              state = excluded.state,
              service_radius_km = excluded.service_radius_km
          `,
          [
            vendorId,
            vendor.location.country,
            vendor.location.region,
            vendor.location.city,
            vendor.location.lat,
            vendor.location.lng,
            vendor.location.address,
            vendor.location.state,
            vendor.location.service_radius_km,
          ],
        );

        await pg.query('delete from public.vendor_categories where vendor_id = $1', [vendorId]);
        await pg.query(
          'insert into public.vendor_categories (vendor_id, category_id) values ($1, $2) on conflict do nothing',
          [vendorId, categoryMap.get(vendor.categoryKey)],
        );

        await pg.query('delete from public.vendor_team where vendor_id = $1', [vendorId]);
        for (const member of vendor.team) {
          await pg.query(
            `
              insert into public.vendor_team (
                vendor_id, name, title, bio, responds_within_hours, sort_order
              )
              values ($1,$2,$3::jsonb,$4::jsonb,$5,$6)
            `,
            [
              vendorId,
              member.name,
              JSON.stringify({ en: member.title, es: member.title }),
              JSON.stringify({ en: '', es: '' }),
              4,
              member.sort_order,
            ],
          );
        }

        seeded.push({
          email: account.email,
          password: account.password,
          role: 'vendor',
          name: account.profile.full_name,
          business_name: vendor.business_name,
          vendor_id: vendorId,
          slug: vendor.slug,
        });
      } else {
        seeded.push({
          email: account.email,
          password: account.password,
          role: 'client',
          name: account.profile.full_name,
          user_id: userId,
        });
      }
    }

    const ids = Object.fromEntries(seeded.map((entry) => [entry.email, entry]));
    const alice = ids['client.alice@wedding-market.local'];
    const maya = ids['client.maya@wedding-market.local'];
    const luna = ids['vendor.luna@wedding-market.local'];
    const harbor = ids['vendor.harbor@wedding-market.local'];
    const sunset = ids['vendor.sunset@wedding-market.local'];

    await pg.query(
      `delete from public.reviews where title like 'Test Seed:%' or title like 'Local Seed:%'`
    );
    await pg.query(`delete from public.quotes where message like 'Test Seed:%' or message like 'Local Seed:%'`);
    await pg.query(`delete from public.rfq_invites where rfq_id in (select id from public.rfqs where notes like 'Test Seed:%' or notes like 'Local Seed:%')`);
    await pg.query(`delete from public.rfqs where notes like 'Test Seed:%' or notes like 'Local Seed:%'`);

    const rfq1 = (
      await pg.query(
        `
          insert into public.rfqs (
            owner_id, event_date, guest_count, budget_min, budget_max, city, state, country, language, theme, notes,
            contact_email, contact_phone, guest_first_name, guest_last_name, guest_lead_email, guest_phone
          ) values (
            $1, '2026-10-18', 120, 12000, 18000, 'Orlando', 'FL', 'United States', 'en', 'Garden party',
            'Test Seed: Alice is looking for photography and catering for a fall wedding.',
            $2, '+1 407-555-1001', 'Alice', 'Rivera', $2, '+1 407-555-1001'
          ) returning id
        `,
        [alice.user_id, alice.email],
      )
    ).rows[0].id;

    const rfq2 = (
      await pg.query(
        `
          insert into public.rfqs (
            owner_id, event_date, guest_count, budget_min, budget_max, city, state, country, language, theme, notes,
            contact_email, contact_phone, guest_first_name, guest_last_name, guest_lead_email, guest_phone
          ) values (
            $1, '2026-12-06', 85, 5000, 9000, 'Miami', 'FL', 'United States', 'en', 'Modern beach',
            'Test Seed: Maya is sourcing music and photography for a beach wedding.',
            $2, '+1 305-555-1002', 'Maya', 'Thompson', $2, '+1 305-555-1002'
          ) returning id
        `,
        [maya.user_id, maya.email],
      )
    ).rows[0].id;

    await pg.query(
      `
        insert into public.rfq_invites (rfq_id, vendor_id, status, expires_at, reveal_email, reveal_phone)
        values
          ($1, $2, 'accepted', now() + interval '14 day', true, true),
          ($1, $3, 'viewed', now() + interval '14 day', true, false),
          ($4, $3, 'responded', now() + interval '14 day', true, true),
          ($4, $5, 'invited', now() + interval '14 day', false, false)
      `,
      [rfq1, luna.vendor_id, harbor.vendor_id, rfq2, sunset.vendor_id],
    );

    const quote1 = (
      await pg.query(
        `
          insert into public.quotes (rfq_id, vendor_id, version, amount_cents, currency, message)
          values ($1, $2, 1, 460000, 'USD', 'Test Seed: Luna Lens can cover the full wedding day plus an engagement session.')
          returning id
        `,
        [rfq1, luna.vendor_id],
      )
    ).rows[0].id;

    await pg.query(
      `
        insert into public.quotes (rfq_id, vendor_id, version, amount_cents, currency, message)
        values
          ($1, $2, 1, 910000, 'USD', 'Test Seed: Harbor House includes cocktail hour, plated dinner, and late-night snacks.'),
          ($3, $4, 1, 290000, 'USD', 'Test Seed: Sunset Sounds includes ceremony audio, DJ, MC, and dance floor lighting.')
      `,
      [rfq1, harbor.vendor_id, rfq2, sunset.vendor_id],
    );

    await pg.query(
      `
        update public.rfqs
        set accepted_quote_id = $2, accepted_at = now()
        where id = $1
      `,
      [rfq1, quote1],
    );

    await pg.query(
      `
        insert into public.reviews (rfq_id, vendor_id, author_id, stars, title, body)
        values (
          $1, $2, $3, 5,
          'Test Seed: Alice loved Luna Lens',
          'Local Seed: Communication was fast, the timeline was organized, and the gallery style matched the brief.'
        )
      `,
      [rfq1, luna.vendor_id, alice.user_id],
    );

    const credentials = {
      generated_at: new Date().toISOString(),
      app_url_examples: ['http://localhost:3000', 'http://localhost:3005'],
      accounts: seeded.map((entry) => ({
        role: entry.role,
        name: entry.name,
        email: entry.email,
        password: entry.password,
        business_name: entry.business_name || null,
        slug: entry.slug || null,
      })),
      seeded_interactions: [
        {
          client: 'client.alice@wedding-market.local',
          rfq: 'Alice fall wedding RFQ',
          invited_vendors: ['vendor.luna@wedding-market.local', 'vendor.harbor@wedding-market.local'],
          accepted_vendor: 'vendor.luna@wedding-market.local',
          review_created: true,
        },
        {
          client: 'client.maya@wedding-market.local',
          rfq: 'Maya beach wedding RFQ',
          invited_vendors: ['vendor.harbor@wedding-market.local', 'vendor.sunset@wedding-market.local'],
          accepted_vendor: null,
          review_created: false,
        },
      ],
    };

    const outPath = path.join(process.cwd(), 'supabase', 'test-accounts.local.json');
    fs.writeFileSync(outPath, JSON.stringify(credentials, null, 2));

    console.log(`Wrote ${outPath}`);
    console.log(JSON.stringify(credentials, null, 2));
  } finally {
    await pg.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
