import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import api, { getAuthHeader } from '../data/api';

vi.mock('../data/api');

const mockEmployees = [
  {
    id: 'emp-1',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'admin' as const,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'emp-2',
    name: 'Regular User',
    email: 'user@test.com',
    role: 'user' as const,
    createdAt: '2024-01-02T00:00:00Z'
  }
];

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (api.getEmployees as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmployees);
    (getAuthHeader as ReturnType<typeof vi.fn>).mockReturnValue('Basic dGVzdA==');
  });

  it('should provide initial loading state', () => {
    const TestComponent = () => {
      const { isLoading } = useAuth();
      return <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>;
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  it('should provide user from localStorage', async () => {
    const savedUser = {
      id: 'emp-1',
      email: 'admin@test.com',
      role: 'admin' as const,
      name: 'Admin User'
    };
    sessionStorage.setItem('acamed_user', JSON.stringify(savedUser));

    const TestComponent = () => {
      const { user } = useAuth();
      return <div data-testid="user">{user?.name}</div>;
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    });
  });

  it('should login user with valid credentials', async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const { login, user } = useAuth();
      return (
        <div>
          <button onClick={() => login('admin@test.com', 'password')}>Login</button>
          <div data-testid="user">{user?.name}</div>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    });
  });

  it('should throw error for invalid credentials', async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const { login } = useAuth();
      const [error, setError] = React.useState<string | null>(null);
      return (
        <div>
          <button onClick={async () => {
            try {
              await login('invalid@test.com', 'password');
            } catch (e) {
              setError((e as Error).message);
            }
          }}>Login</button>
          <div data-testid="error">{error}</div>
        </div>
      );
    };

    const React = require('react');

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('should logout user', async () => {
    const savedUser = {
      id: 'emp-1',
      email: 'admin@test.com',
      role: 'admin' as const,
      name: 'Admin User'
    };
    sessionStorage.setItem('acamed_user', JSON.stringify(savedUser));

    const user = userEvent.setup();

    const TestComponent = () => {
      const { login, logout, user } = useAuth();
      return (
        <div>
          <button onClick={() => logout()}>Logout</button>
          <div data-testid="user">{user?.name || 'null'}</div>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    });

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });

  it('should identify admin users correctly', async () => {
    const savedUser = {
      id: 'emp-1',
      email: 'admin@test.com',
      role: 'admin' as const,
      name: 'Admin User'
    };
    sessionStorage.setItem('acamed_user', JSON.stringify(savedUser));

    const TestComponent = () => {
      const { isAdmin } = useAuth();
      return <div data-testid="isAdmin">{isAdmin ? 'admin' : 'user'}</div>;
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('admin');
    });
  });
});