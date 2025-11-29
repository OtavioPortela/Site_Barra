import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const { isPatrao } = useAuth();

  if (location.pathname === '/login') {
    return null;
  }

  const isPatraoValue = isPatrao();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', requiresStaff: false },
    { path: '/faturamento', label: 'Faturamento', icon: '💰', requiresStaff: true },
    { path: '/historico-os', label: 'Histórico OS', icon: '📋', requiresStaff: true },
    { path: '/clientes', label: 'Clientes', icon: '👥', requiresStaff: false },
    { path: '/funcionarios', label: 'Funcionários', icon: '👔', requiresStaff: true },
  ].filter(item => !item.requiresStaff || isPatraoValue);

  return (
    <aside className="bg-white shadow-lg w-64 min-h-screen border-r border-gray-200">
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
  );
};

