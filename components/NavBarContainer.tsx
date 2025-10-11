import NavBar from '@/components/NavBar';
import AuthMenu from '@/components/AuthMenu';

export default function NavBarContainer() {
  return <NavBar authMenu={<AuthMenu />} />;
}
