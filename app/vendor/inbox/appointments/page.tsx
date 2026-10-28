import AppointmentInbox from '@/features/boutiques/client/AppointmentInbox';
import { getRoles } from '@/lib/auth/roles';
export default async function Page() {const {user}=await getRoles();return <AppointmentInbox key={user?.id} vendor/>; }
