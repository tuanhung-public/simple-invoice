import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { App, ConfigProvider } from 'antd';
import LoginPage from '@/app/login/page';
import { login } from '@/lib/api';
import { setToken } from '@/lib/auth';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  login: vi.fn(),
}));

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return {
    ...actual,
    setToken: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderLogin() {
  return render(
    <ConfigProvider>
      <App>
        <LoginPage />
      </App>
    </ConfigProvider>,
  );
}

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    renderLogin();
    expect(
      screen.getByPlaceholderText(/reviewer@101digital.io/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows client-side validation when submitting empty form', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    expect(login).not.toHaveBeenCalled();
  });

  it('stores token and navigates on successful login', async () => {
    vi.mocked(login).mockResolvedValue({
      accessToken: 'token-abc',
      user: {
        id: 'u1',
        email: 'reviewer@101digital.io',
        fullname: 'Reviewer',
      },
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/reviewer@101digital.io/i), {
      target: { value: 'reviewer@101digital.io' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(
        'reviewer@101digital.io',
        'Password123!',
      );
      expect(setToken).toHaveBeenCalledWith('token-abc');
      expect(replace).toHaveBeenCalledWith('/invoices');
    });
  });

  it('shows API error when credentials are rejected', async () => {
    vi.mocked(login).mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/reviewer@101digital.io/i), {
      target: { value: 'reviewer@101digital.io' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(
        screen.getByText(/invalid email or password/i),
      ).toBeInTheDocument();
    });
    expect(setToken).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
