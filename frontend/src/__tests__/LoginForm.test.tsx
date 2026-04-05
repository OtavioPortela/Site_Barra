import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { LoginForm } from '../components/auth/LoginForm';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza campos de email e senha', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
  });

  it('renderiza botão Entrar', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
  });

  it('não submete se campos estiverem vazios', async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(mockLogin).not.toHaveBeenCalled();
    expect(await screen.findByText('Email é obrigatório')).toBeTruthy();
  });

  it('exibe erro de senha obrigatória', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'admin@barra.com');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Senha é obrigatória')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('exibe erro de email inválido', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'emailinvalido');
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123');
    // Submete o form diretamente para contornar validação nativa do browser (type="email")
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form')!);
    expect(await screen.findByText('Email inválido')).toBeTruthy();
  });

  it('chama login com email e senha corretos ao submeter', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'admin@barra.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'admin@barra.com', password: 'senha123' });
    });
  });

  it('navega para /dashboard após login bem sucedido', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'admin@barra.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
