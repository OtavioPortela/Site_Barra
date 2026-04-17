import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { isPatrao } = useAuth();

  if (location.pathname === '/login') {
    return null;
  }

  const isPatraoValue = isPatrao();

  const navItems = [
    { path: '/dashboard',   label: 'Dashboard',    icon: '📊', requiresStaff: false },
    { path: '/faturamento', label: 'Faturamento',  icon: '💰', requiresStaff: true  },
    { path: '/historico-os',label: 'Histórico OS', icon: '📋', requiresStaff: false },
    { path: '/clientes',    label: 'Clientes',     icon: '👥', requiresStaff: false },
    { path: '/caixa',       label: 'Caixa',        icon: '💵', requiresStaff: false },
    { path: '/debitos',     label: 'Débitos',      icon: '📝', requiresStaff: true  },
    { path: '/funcionarios',label: 'Funcionários', icon: '👔', requiresStaff: true  },
    { path: '/configuracoes',label:'Configurações',icon: '⚙️', requiresStaff: true  },
  ].filter(item => !item.requiresStaff || isPatraoValue);

  const handleLinkClick = () => {
    // Fechar o menu ao clicar em um link (em mobile)
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Sidebar para desktop - sempre visível */}
      <aside className="hidden lg:block bg-white shadow-lg w-64 border-r border-gray-200" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>

      {/* Sidebar para mobile - com animação */}
      <aside
        className={`fixed lg:hidden top-16 left-0 z-50 bg-white shadow-xl w-64 h-[calc(100vh-4rem)] border-r border-gray-200 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Botão fechar no mobile */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            aria-label="Fechar menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

