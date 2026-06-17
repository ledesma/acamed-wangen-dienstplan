import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
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

let sharedUsers = [
  {
    id: 'emp-1',
    name: 'Admin User',
    email: 'admin@test.com',
    roles: ['admin'],
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'emp-2',
    name: 'Regular User',
    email: 'user@test.com',
    roles: [],
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
    sharedUsers = [
      {
        id: 'emp-1',
        name: 'Admin User',
        email: 'admin@test.com',
        roles: ['admin'],
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'emp-2',
        name: 'Regular User',
        email: 'user@test.com',
        roles: [],
        createdAt: '2024-01-02T00:00:00Z'
      }
    ];
    (api.getUsers as ReturnType<typeof vi.fn>).mockImplementation(async () => [...sharedUsers]);
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
      <HashRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </HashRouter>
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
      <HashRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </HashRouter>
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
      <HashRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </HashRouter>
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
      <HashRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </HashRouter>
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
      <HashRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </HashRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('admin');
    });
  });

  it('should resolve user when sync creates user record on first login', async () => {
    sharedUsers = [];
    (api.syncIdentityUsers as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      sharedUsers.push({
        id: 'emp-1',
        name: 'New Admin',
        email: 'newadmin@test.com',
        roles: ['admin'],
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
      <HashRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </HashRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('New Admin');
    });
  });

  it('should use Identity roles as source of truth over user table', async () => {
    const identityUserWithAdmin = {
      id: 'identity-4',
      email: 'adminuser@test.com',
      name: 'Admin User',
      roles: ['admin'],
      confirmedAt: '2024-01-04T00:00:00Z',
      createdAt: '2024-01-04T00:00:00Z',
      updatedAt: '2024-01-04T00:00:00Z'
    };
    const userWithNoRoles = [{
      id: 'emp-4',
      name: 'Admin User',
      email: 'adminuser@test.com',
      roles: [],
      createdAt: '2024-01-04T00:00:00Z'
    }];
    (api.getUsers as ReturnType<typeof vi.fn>).mockResolvedValue(userWithNoRoles);
    (getUser as ReturnType<typeof vi.fn>).mockResolvedValue(identityUserWithAdmin);

    const TestComponent = () => {
      const { user, isAdmin } = useAuth();
      return (
        <div>
          <div data-testid="userRole">{user?.roles?.join(',') || 'none'}</div>
          <div data-testid="isAdmin">{isAdmin ? 'admin' : 'user'}</div>
        </div>
      );
    };

    render(
      <HashRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </HashRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('admin');
      expect(screen.getByTestId('userRole')).toHaveTextContent('admin');
    });
  });
});
