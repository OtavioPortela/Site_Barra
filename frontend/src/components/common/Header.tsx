import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* Botão hambúrguer */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-label="Toggle menu"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {/* Logo - apenas em telas maiores */}
            <h1 className="hidden md:block text-2xl font-bold text-primary-700">Barra Confecções</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Nome do usuário - apenas em telas maiores */}
            <span className="hidden sm:block text-sm text-gray-600">Olá, {user?.nome || user?.email}</span>
            <button
              onClick={logout}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

