import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/barra-logo.png';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (error) {
      // Erro já tratado no contexto
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (erro?: string) =>
    `h-[46px] w-full rounded-[11px] border bg-white px-3.5 text-[14.5px] text-tinta placeholder:text-pedra-claro transition-shadow focus:border-tinta focus:outline-none focus:ring-4 focus:ring-areia/30 ${
      erro ? 'border-terracota' : 'border-borda'
    }`;

  return (
    <div className="grid min-h-screen bg-[#f6f5f1] lg:grid-cols-2">
      <div className="relative hidden items-center justify-center overflow-hidden bg-linho lg:flex">
        <svg
          viewBox="0 0 720 900"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          fill="none"
          stroke="#c9b79a"
          strokeWidth="1.2"
          opacity="0.55"
          aria-hidden="true"
        >
          <path d="M-20 760 C 140 640, 90 520, 230 470 S 470 520, 520 380 S 610 150, 760 120" />
        </svg>
        <img src={logo} alt="Barra Confecções" className="relative w-[min(430px,70%)]" />
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-[380px] flex-col gap-8">
          <img src={logo} alt="Barra Confecções" className="mx-auto w-56 lg:hidden" />

          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-[46px] font-medium leading-none">Entrar</h1>
            <div className="h-0.5 w-14 rounded-full bg-areia" />
            <p className="text-[14.5px] text-pedra">Sistema de Gestão de Ordens de Serviço</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-[13px] font-semibold text-tinta-suave">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({ ...errors, email: undefined });
                  }}
                  className={inputClass(errors.email)}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-terracota">{errors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-[13px] font-semibold text-tinta-suave">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({ ...errors, password: undefined });
                  }}
                  className={inputClass(errors.password)}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-sm text-terracota">{errors.password}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-[11px] bg-tinta text-[15px] font-semibold text-papel transition-colors hover:bg-black disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
