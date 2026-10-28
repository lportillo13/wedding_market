import BoutiqueManager from '@/features/boutiques/client/BoutiqueManager';
import { getRoles } from '@/lib/auth/roles';
export default async function Page() { const {user}=await getRoles();return <BoutiqueManager key={user?.id}/>; }
