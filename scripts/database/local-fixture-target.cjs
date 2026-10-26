const loopback=new Set(['localhost','127.0.0.1','[::1]','::1']);
function assertLocalFixtureTargets(databaseUrl,apiUrl) {
  let database,api;
  try {database=new URL(databaseUrl);api=new URL(apiUrl);} catch {throw new Error('Demo seeding requires valid local database and API URLs.');}
  if(!['postgres:','postgresql:'].includes(database.protocol)||!['http:','https:'].includes(api.protocol)||!loopback.has(database.hostname.toLowerCase())||!loopback.has(api.hostname.toLowerCase())) {
    throw new Error('Demo seeding is restricted to local disposable databases and local Supabase APIs. Remote targets are refused.');
  }
}
module.exports={assertLocalFixtureTargets};
