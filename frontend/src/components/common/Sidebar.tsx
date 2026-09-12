import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Icon, type IconName } from './Icon';
import logo from '../../assets/barra-logo.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const iniciais = (nome: string) =>
  nome
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { user, logout, isPatrao } = useAuth();

  if (location.pathname === '/login') {
    return null;
  }

  const isPatraoValue = isPatrao();
  const nomeUsuario = user?.nome || user?.email || '';

  const allNavItems: { path: string; label: string; icon: IconName; requiresStaff: boolean }[] = [
    { path: '/dashboard',    label: 'Dashboard',     icon: 'dashboard',     requiresStaff: false },
    { path: '/faturamento',  label: 'Faturamento',   icon: 'faturamento',   requiresStaff: true  },
    { path: '/historico-os', label: 'Histórico OS',  icon: 'historico',     requiresStaff: false },
    { path: '/clientes',     label: 'Clientes',      icon: 'clientes',      requiresStaff: false },
    { path: '/caixa',        label: 'Caixa',         icon: 'caixa',         requiresStaff: false },
    { path: '/debitos',      label: 'Débitos',       icon: 'recibo',        requiresStaff: false },
    { path: '/funcionarios', label: 'Funcionários',  icon: 'funcionarios',  requiresStaff: true  },
    { path: '/configuracoes',label: 'Configurações', icon: 'configuracoes', requiresStaff: true  },
  ];
  const navItems = allNavItems.filter(item => !item.requiresStaff || isPatraoValue);

  const handleLinkClick = () => {
    // Fechar o menu ao clicar em um link (em mobile)
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const navList = (
    <ul className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const ativo = location.pathname === item.path;
        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={handleLinkClick}
              className={`flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-sm transition-colors ${
                ativo
                  ? 'bg-tinta font-semibold text-papel'
                  : 'font-medium text-tinta-suave hover:bg-tinta/5 hover:text-tinta'
              }`}
            >
              <span className={ativo ? 'text-areia' : 'text-pedra'}>
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const rodapeUsuario = (
    <div className="flex items-center gap-2.5 border-t border-[#d4d2ca] px-2.5 pt-3">
      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-areia text-xs font-bold tracking-wide text-tinta">
        {iniciais(nomeUsuario)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13.5px] font-semibold text-tinta">{nomeUsuario}</span>
        <span className="text-xs text-pedra">{isPatraoValue ? 'Patrão' : 'Funcionário'}</span>
      </div>
      <button
        onClick={logout}
        title="Sair"
        aria-label="Sair"
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] border border-[#d4d2ca] text-pedra transition-colors hover:border-terracota/40 hover:bg-terracota-fundo hover:text-terracota"
      >
        <Icon name="sair" />
      </button>
    </div>
  );

  return (
    <>
      {/* Sidebar para desktop - sempre visível */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-7 border-r border-[#d4d2ca] bg-linho px-[18px] pb-[22px] pt-7 lg:flex">
        <Link to="/dashboard" className="flex justify-center px-1.5 pt-1">
          <img src={logo} alt="Barra Confecções" className="block h-auto w-[176px]" />
        </Link>
        <nav className="min-h-0 flex-1 overflow-y-auto">{navList}</nav>
        {rodapeUsuario}
      </aside>

      {/* Sidebar para mobile - com animação */}
      <aside
        className={`fixed left-0 top-16 z-50 flex h-[calc(100vh-4rem)] w-[272px] transform flex-col gap-6 overflow-y-auto border-r border-[#d4d2ca] bg-linho px-4 pb-5 pt-5 shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1">{navList}</nav>
        {rodapeUsuario}
      </aside>
    </>
  );
};
