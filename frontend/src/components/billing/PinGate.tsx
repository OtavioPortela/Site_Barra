import { useEffect, useRef, useState } from 'react';
import { configuracaoEmpresaService } from '../../services/api';

const SESSION_KEY = 'billing_pin_ok';

interface PinGateProps {
  children: React.ReactNode;
}

export const PinGate = ({ children }: PinGateProps) => {
  const [status, setStatus] = useState<'loading' | 'unlocked' | 'locked'>('loading');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = async () => {
      if (sessionStorage.getItem(SESSION_KEY) === '1') {
        setStatus('unlocked');
        return;
      }
      try {
        const config = await configuracaoEmpresaService.get();
        setStatus(config.tem_pin ? 'locked' : 'unlocked');
      } catch {
        setStatus('unlocked');
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (status === 'locked') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setVerificando(true);
    setErro('');
    try {
      const { valido } = await configuracaoEmpresaService.verificarPin(pin);
      if (valido) {
        sessionStorage.setItem(SESSION_KEY, '1');
        setStatus('unlocked');
      } else {
        setErro('PIN incorreto');
        setPin('');
        inputRef.current?.focus();
      }
    } catch {
      setErro('PIN incorreto');
      setPin('');
      inputRef.current?.focus();
    } finally {
      setVerificando(false);
    }
  };

  if (status === 'loading') return null;
  if (status === 'unlocked') return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Área restrita</h2>
        <p className="text-sm text-gray-500 mb-6">Digite o PIN para acessar o Faturamento</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setErro(''); }}
            placeholder="••••"
            className={`w-full text-center text-2xl tracking-widest px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              erro ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button
            type="submit"
            disabled={verificando || !pin}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verificando ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
