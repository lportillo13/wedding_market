// Persistent browser storage; Supabase still validates, refreshes and revokes sessions.
export const sessionCookieOptions={path:'/',sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',maxAge:60*60*24*400};
