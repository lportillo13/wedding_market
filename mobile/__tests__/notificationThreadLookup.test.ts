jest.mock('../src/lib/supabase',()=>({supabase:{auth:{getUser:jest.fn()},from:jest.fn()}}));
jest.mock('../src/lib/config',()=>({mobileConfig:{webApiUrl:'https://example.invalid'}}));
import {supabase} from '../src/lib/supabase';
import {loadMobileInboxThread} from '../src/lib/rfqs';

type Row=Record<string,unknown>;
type Response={data:Row[];error:null};
const mock=supabase as unknown as {auth:{getUser:jest.Mock};from:jest.Mock};
const rfq='request-one',vendor='vendor-one';
const tables:Record<string,Row[]>={
 vendors:[{id:vendor,owner_id:'vendor-owner',business_name:'Synthetic vendor'}],
 thread_vendors:[{id:vendor,business_name:'Synthetic vendor'}],
 rfqs_visible:[{id:rfq,owner_id:'client-owner',city:'San José',created_at:'2026-10-27T12:00:00Z'}],
 rfq_invites:[{rfq_id:rfq,vendor_id:vendor,status:'invited',created_at:'2026-10-27T12:00:00Z'}],
 quotes:[],quote_messages:[{id:'message-one',rfq_id:rfq,vendor_id:vendor,sender_role:'client',body:'Synthetic private message',created_at:'2026-10-27T12:01:00Z'}],
};
const writes:{table:string;value:unknown;filters:[string,unknown][]}[]=[];
beforeEach(()=>{
 writes.length=0;mock.from.mockReset();mock.auth.getUser.mockReset();
 mock.from.mockImplementation((table:string)=>{
  const filters:[string,unknown][]=[],query:Record<string,unknown>={};let update:unknown;
  for(const name of ['select','order','limit','range'])query[name]=jest.fn(()=>query);
  query.eq=jest.fn((column:string,value:unknown)=>{filters.push([column,value]);return query;});
  query.in=jest.fn((column:string,values:unknown[])=>{filters.push([column,values]);return query;});
  query.update=jest.fn((value:unknown)=>{update=value;return query;});
  const then:Promise<Response>['then']=(resolve,reject)=>{
   if(update)writes.push({table,value:update,filters:[...filters]});
   const data=(tables[table]??[]).filter(row=>filters.every(([column,value])=>Array.isArray(value)?value.includes(row[column]):row[column]===value));
   return Promise.resolve({data,error:null}).then(resolve,reject);
  };
  query.then=then;return query;
 });
});

test.each(['vendor','client'] as const)('%s opens an owned notification thread using its request/vendor pair',async role=>{
 mock.auth.getUser.mockResolvedValue({data:{user:{id:role+'-owner'}}});
 const detail=await loadMobileInboxThread(role,'en',{id:`${rfq}__${vendor}`,rfqId:rfq,vendorId:vendor});
 expect(detail?.id).toBe(`${rfq}:${vendor}`);
 expect(detail?.messages.map(item=>item.body)).toEqual(['Synthetic private message']);
 expect(writes).toEqual([{table:'rfq_invites',value:{[role+'_last_read_at']:expect.any(String)},filters:[['rfq_id',rfq],['vendor_id',vendor]]}]);
});

test('a matching display key cannot substitute a different vendor address',async()=>{
 mock.auth.getUser.mockResolvedValue({data:{user:{id:'vendor-owner'}}});
 expect(await loadMobileInboxThread('vendor','en',{id:`${rfq}:${vendor}`,rfqId:rfq,vendorId:'other-vendor'})).toBeNull();
 expect(writes).toEqual([]);
});
