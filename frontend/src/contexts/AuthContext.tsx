import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/api';
import type { User, LoginCredentials } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isPatrao: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);

          // Sempre buscar dados atualizados do servidor para garantir is_staff correto
          try {
            const { authService } = await import('../services/api');
            const userData = await authService.getMe();
            const updatedUser: User = {
              id: userData.id,
              email: userData.email,
              nome: userData.nome_completo || userData.email,
              nome_completo: userData.nome_completo,
              token: storedToken,
              is_staff: userData.is_staff || false,
              cargo: userData.cargo || '',
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          } catch (error) {
            // Se falhar, usar dados do localStorage
            if (parsedUser.is_staff === undefined) {
              parsedUser.is_staff = false;
            }
            setUser(parsedUser);
          }
        } catch (error) {
          console.error('Erro ao recuperar usuário:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        nome: response.user.nome || response.user.nome_completo || response.user.email,
        nome_completo: response.user.nome_completo,
        token: response.token || response.access,
        is_staff: response.user.is_staff || false,
        cargo: response.user.cargo || '',
      };

      // Armazenar também o refresh token se disponível
      if (response.refresh) {
        localStorage.setItem('refresh_token', response.refresh);
      }

      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      const message = error.response?.data?.detail ||
                     error.response?.data?.message ||
                     'Erro ao fazer login. Verifique suas credenciais.';
      toast.error(message);
      throw error;
    }
  };

  const isPatrao = () => {
    // Verificar se user existe e is_staff é explicitamente true
    if (!user) return false;
    // Garantir que is_staff está definido (pode ser undefined em usuários antigos)
    return user.is_staff === true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isPatrao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

