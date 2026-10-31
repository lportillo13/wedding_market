import { restoreMobileAuthState,createSessionFromMobileAuthUrl } from '../src/lib/auth';
import { COMMUNITY_TERMS_VERSION } from '../../shared/safety/copy';

const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockFrom = jest.fn();
const mockExchange=jest.fn();
jest.mock('../src/lib/supabase', () => ({ supabase: {
  auth: { getUser: () => mockGetUser(), updateUser: (data: unknown) => mockUpdateUser(data),exchangeCodeForSession:(code:string)=>mockExchange(code) },
  from: (table: string) => mockFrom(table),
} }));

function fixture(role: 'vendor' | 'client' = 'vendor') {
  const pending = { version: 1, role, fullName: 'Review fixture', language: 'en',
    businessName: 'Private review draft', category: 'photography', city: 'San José', country: 'Costa Rica' };
  const user = { id: 'isolated-account', email: 'review@example.invalid', user_metadata: {
    full_name: 'Review fixture', role: role === 'vendor' ? 'vendor' : 'user', wedding_market_signup: pending as unknown,
  } };
  const state = {
    profile: { id: user.id, role: 'user', full_name: 'Review fixture', language: 'en',
      suspended_at: null as string | null, community_terms_version: null as string | null },
    vendor: null as Record<string, unknown> | null,
    location: null as Record<string, unknown> | null,
    vendorWrites: 0, profileWrites: 0, failLocationOnce: false,
  };
  mockGetUser.mockImplementation(async () => ({ data: { user }, error: null }));
  mockUpdateUser.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    Object.assign(user.user_metadata, data); return { error: null };
  });
  mockFrom.mockImplementation((table: string) => {
    let operation = 'select';
    let values: Record<string, unknown> = {};
    let options: { ignoreDuplicates?: boolean } = {};
    let slugLookup = false;
    const execute = async () => {
      if (table === 'profiles') {
        if (operation === 'upsert') { state.profileWrites++; Object.assign(state.profile, values); }
        return { data: { ...state.profile }, error: null };
      }
      if (table === 'vendors') {
        if (operation === 'insert') {
          state.vendorWrites++;
          if (state.profile.community_terms_version !== COMMUNITY_TERMS_VERSION) {
            return { data: null, error: { message: 'Accept the Terms and Community Guidelines before posting.' } };
          }
          state.vendor = { id: 'private-vendor', ...values };
        }
        return { data: slugLookup ? null : state.vendor, error: null };
      }
      if (table === 'vendor_locations') {
        if (state.failLocationOnce) { state.failLocationOnce = false; return { error: { message: 'Temporary network error' } }; }
        if (!state.location || !options.ignoreDuplicates) state.location = values;
        return { error: null };
      }
      if (table === 'categories') return { data: { id: 'photo-category' }, error: null };
      if (table === 'vendor_categories') return { error: null };
      throw Error('Unexpected table: ' + table);
    };
    const query = {
      select: () => query,
      eq: (key: string) => { if (key === 'slug') slugLookup = true; return query; },
      neq: () => query,
      upsert: (data: Record<string, unknown>, config?: typeof options) => {
        operation = 'upsert'; values = data; options = config ?? {}; return query;
      },
      insert: (data: Record<string, unknown>) => { operation = 'insert'; values = data; return query; },
      maybeSingle: execute, single: execute,
      then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => execute().then(resolve, reject),
    };
    return query;
  });
  return { state, user, pending };
}

beforeEach(() => jest.clearAllMocks());

test('a new vendor signs in before consent without attempting a prohibited content write', async () => {
  const { state, user, pending } = fixture();
  const result = await restoreMobileAuthState();
  expect(result.profile).toMatchObject({ userId: user.id, role: 'vendor', communityTermsVersion: null });
  expect(state.profileWrites).toBe(1);
  expect(state.vendorWrites).toBe(0);
  expect(user.user_metadata.wedding_market_signup).toEqual(pending);
  expect(mockUpdateUser).not.toHaveBeenCalled();
  await restoreMobileAuthState();
  expect(state.profileWrites).toBe(1);
  expect(state.vendorWrites).toBe(0);
});

test('explicit recorded consent resumes one unpublished draft and completes signup', async () => {
  const { state, user } = fixture();
  await restoreMobileAuthState();
  state.profile.community_terms_version = COMMUNITY_TERMS_VERSION;
  state.profile.language = 'es';
  const result = await restoreMobileAuthState();
  expect(result.profile).toMatchObject({ role: 'vendor', language: 'es', communityTermsVersion: COMMUNITY_TERMS_VERSION });
  expect(state.vendor).toMatchObject({ owner_id: user.id, is_published: false });
  expect(state.vendorWrites).toBe(1);
  expect(state.profileWrites).toBe(1);
  expect(user.user_metadata.wedding_market_signup).toBeNull();
  await restoreMobileAuthState();
  expect(state.vendorWrites).toBe(1);
});

test('a retry after partial draft setup preserves profile and existing location edits', async () => {
  const { state, user, pending } = fixture();
  await restoreMobileAuthState();
  state.profile.community_terms_version = COMMUNITY_TERMS_VERSION;
  state.failLocationOnce = true;
  await expect(restoreMobileAuthState()).rejects.toThrow('Temporary network error');
  expect(user.user_metadata.wedding_market_signup).toEqual(pending);
  state.location = { vendor_id: 'private-vendor', city: 'Edited location' };
  state.profile.language = 'es';
  await restoreMobileAuthState();
  expect(state.vendorWrites).toBe(1);
  expect(state.location.city).toBe('Edited location');
  expect(state.profile.language).toBe('es');
});

test('a suspended vendor with pending metadata is never provisioned', async () => {
  const { state, user, pending } = fixture();
  state.profile.role = 'vendor'; state.profile.suspended_at = '2026-10-27T00:00:00Z';
  await restoreMobileAuthState();
  expect(state.profileWrites).toBe(0); expect(state.vendorWrites).toBe(0);
  expect(user.user_metadata.wedding_market_signup).toEqual(pending);
});

test('couple signup still provisions planning data without creating a vendor', async () => {
  const { state, user } = fixture('client');
  const result = await restoreMobileAuthState();
  expect(result.profile).toMatchObject({ role: 'client', userId: user.id });
  expect(state.vendorWrites).toBe(0);
  expect(user.user_metadata.wedding_market_signup).toBeNull();
});

test('PKCE recovery is identified from the verifier metadata even without a recovery URL parameter',async()=>{
  const {user,state}=fixture('client');user.user_metadata.wedding_market_signup=null;
  mockExchange.mockResolvedValue({data:{user,redirectType:'recovery'},error:null});
  const result=await createSessionFromMobileAuthUrl('theweddingmarket://auth/callback?code=recovery-fixture');
  expect(result?.event).toBe('password_recovery');expect(state.profileWrites).toBe(0);
});

test('simultaneous browser and Android link callbacks exchange a one-use code once',async()=>{
  const {user}=fixture('client');user.user_metadata.wedding_market_signup=null;
  let finish!:(value:unknown)=>void;mockExchange.mockReturnValue(new Promise(resolve=>{finish=resolve;}));
  const first=createSessionFromMobileAuthUrl('theweddingmarket://auth/callback?code=social-fixture');
  const second=createSessionFromMobileAuthUrl('theweddingmarket://auth/callback?code=social-fixture');
  finish({data:{user,redirectType:null},error:null});
  expect(await first).toEqual(await second);expect(mockExchange).toHaveBeenCalledTimes(1);
  await createSessionFromMobileAuthUrl('theweddingmarket://auth/callback?code=social-fixture');
  expect(mockExchange).toHaveBeenCalledTimes(1);
});
