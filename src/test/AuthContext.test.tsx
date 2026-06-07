import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import api from '../data/api';

vi.mock('../data/api');

vi.mock('@netlify/identity', () => ({
  getUser: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  onAuthChange: vi.fn(() => () => {})
}));

const { getUser, login: identityLogin } = await import('@netlify/identity');

let sharedEmployees = [
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

const mockIdentityUser = {
  id: 'identity-1',
  email: 'admin@test.com',
  name: 'Admin User',
  roles: ['admin'],
  confirmedAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sharedEmployees = [
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
    (api.getEmployees as ReturnType<typeof vi.fn>).mockImplementation(async () => [...sharedEmployees]);
    (api.syncIdentityUsers as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      return { success: true, synced: false };
    });
    (getUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockIdentityUser);
  });

  it('should provide user after auth initializes', async () => {
    const TestComponent = () => {
      const { user } = useAuth();
      return <div data-testid="user">{user?.name || 'no user'}</div>;
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

    (getUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockIdentityUser);

    const TestComponent = () => {
      const { login, user: authUser } = useAuth();
      return (
        <div>
          <button onClick={() => login('admin@test.com', 'password')}>Login</button>
          <div data-testid="user">{authUser?.name || 'no user'}</div>
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

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(identityLogin).toHaveBeenCalledWith('admin@test.com', 'password');
    });
  });

  it('should throw error for invalid credentials', async () => {
    const user = userEvent.setup();

    vi.mocked(identityLogin).mockRejectedValue(new Error('Invalid credentials'));

    const TestComponent = () => {
      const { login, user: authUser } = useAuth();
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
          <div data-testid="user">{authUser?.name || 'no user'}</div>
          <div data-testid="error">{error}</div>
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

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('should logout user', async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const { logout, user: authUser } = useAuth();
      return (
        <div>
          <button onClick={() => logout()}>Logout</button>
          <div data-testid="user">{authUser?.name || 'null'}</div>
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

  it('should resolve user when sync creates employee record on first login', async () => {
    sharedEmployees = [];
    (api.syncIdentityUsers as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      sharedEmployees.push({
        id: 'emp-1',
        name: 'New Admin',
        email: 'newadmin@test.com',
        role: 'admin' as const,
        createdAt: '2024-01-02T00:00:00Z'
      });
      return { success: true, synced: true };
    });
    const newIdentityUser = {
      id: 'identity-2',
      email: 'newadmin@test.com',
      name: 'New Admin',
      roles: ['admin'],
      confirmedAt: '2024-01-02T00:00:00Z',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    };
    (getUser as ReturnType<typeof vi.fn>).mockResolvedValue(newIdentityUser);

    const TestComponent = () => {
      const { user } = useAuth();
      return <div data-testid="user">{user?.name || 'no user'}</div>;
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('New Admin');
    });
  });

  it('should use identity roles array for admin determination even when employee has wrong role', async () => {
    const userWithRoles = {
      id: 'identity-3',
      email: 'roleadmin@test.com',
      name: 'Role Admin',
      roles: ['admin'],
      confirmedAt: '2024-01-03T00:00:00Z',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z'
    };
    const employeesWithWrongRole = [{
      id: 'emp-3',
      name: 'Role Admin',
      email: 'roleadmin@test.com',
      role: 'user' as const,
      createdAt: '2024-01-03T00:00:00Z'
    }];
    (api.getEmployees as ReturnType<typeof vi.fn>).mockResolvedValue(employeesWithWrongRole);
    (getUser as ReturnType<typeof vi.fn>).mockResolvedValue(userWithRoles);

    const TestComponent = () => {
      const { user, isAdmin } = useAuth();
      return (
        <div>
          <div data-testid="userRole">{user?.role || 'none'}</div>
          <div data-testid="isAdmin">{isAdmin ? 'admin' : 'user'}</div>
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
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('admin');
      expect(screen.getByTestId('userRole')).toHaveTextContent('admin');
    });
  });
});
