import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-700">Barra Confecções</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Olá, {user?.nome || user?.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

