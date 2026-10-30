import {z} from 'zod';
import {parseCalendarDate} from '@/shared/calendar/date';
const optionalNumber=(value:unknown)=>value===null||value===undefined||value===''?null:Number(value);
export const coupleProfileSchema=z.object({
  full_name:z.string().trim().min(1,'Name is required.').max(200),
  phone:z.string().trim().min(1,'Phone is required.').max(40),
  country:z.string().trim().min(1,'Contact country is required.').max(80),
  tentative_wedding_date:z.string().refine(value=>Boolean(parseCalendarDate(value)),'Enter a valid wedding date.'),
  guest_count:z.preprocess(optionalNumber,z.number().int().positive().max(100000).nullable()),
  wedding_budget:z.preprocess(optionalNumber,z.number().min(0).max(1000000000).nullable()),
  wedding_theme:z.enum(['classic','boho','rustic','beach','garden','modern','vintage']),
  language:z.enum(['en','es']),
});
export const coupleAccountSchema=coupleProfileSchema.extend({
  email:z.string().trim().max(254).email('Enter a valid email address.').transform(value=>value.toLowerCase()),
  password:z.string().min(8,'Password must be at least 8 characters.'),
  celebration_city:z.string().trim().max(120).optional(),celebration_region:z.string().trim().max(120).optional(),
  planning_stage:z.enum(['just-starting','venue-booked','shortlisting','ready-to-book']),
  priority_services:z.array(z.enum(['venue','photography','planner','beauty','decor','catering','music'])).min(1),
});
export function coupleProfileInput(data:FormData) {
  return Object.fromEntries(['full_name','phone','country','tentative_wedding_date','guest_count','wedding_budget','wedding_theme','language'].map(key=>[key,data.get(key)]));
}
