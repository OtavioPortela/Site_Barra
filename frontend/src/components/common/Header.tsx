import { useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import logo from '../../assets/barra-logo.png';

interface HeaderProps {
  onMenuClick: () => void;
}

// No desktop a marca, o usuário e o "Sair" ficam no menu lateral; o cabeçalho só existe no mobile.
export const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#d4d2ca] bg-linho lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-[10px] text-tinta-suave hover:bg-tinta/5 focus:outline-none focus:ring-2 focus:ring-areia"
          aria-label="Toggle menu"
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
        <img src={logo} alt="Barra Confecções" className="h-10 w-auto" />
        <div className="w-10" />
      </div>
    </header>
  );
};
