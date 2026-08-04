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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
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
  });
});
