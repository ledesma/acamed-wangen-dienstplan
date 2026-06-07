import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User as IdentityUser, getUser, login as identityLogin, signup as identitySignup, logout as identityLogout, onAuthChange } from '@netlify/identity';
import { User, UserRecord } from '../types';
import api from '../data/api';

interface AuthContextType {
  user: User | null;
  users: UserRecord[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_TIMEOUT_MS = 5000;

const mapIdentityUser = (identityUser: IdentityUser, users: UserRecord[]): User | null => {
  if (!identityUser?.email) return null;

  const user = users.find(u => u.email === identityUser.email);
  if (!user) return null;

  const roles = [...(identityUser.roles || [])] as ('admin' | 'employee')[];

  return {
    id: identityUser.id || user.id,
    email: identityUser.email,
    roles,
    name: identityUser.name || user.name,
    avatar: user.avatar
  };
};

 const loadUsersAndAuth = async (
    identityUser: IdentityUser | null,
    setUser: React.Dispatch<React.SetStateAction<User | null>>,
    setUsers: React.Dispatch<React.SetStateAction<UserRecord[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  ): Promise<void> => {
    try {
      const users = await Promise.race([
        api.getUsers(),
        new Promise<UserRecord[]>((_, reject) =>
          setTimeout(() => reject(new Error('getUsers timeout')), ADMIN_TIMEOUT_MS)
        )
      ]);
      setUsers(users);

    if (identityUser) {
      const mappedUser = mapIdentityUser(identityUser, users);
      setUser(mappedUser);
    } else {
      setUser(null);
    }
  } catch (e) {
    console.error('Failed to load users:', e);
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};

const handleAuthChange = async (
  event: string | undefined,
  identityUser: IdentityUser | null,
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setUsers: React.Dispatch<React.SetStateAction<UserRecord[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> => {
  if (event === 'logout' || !identityUser) {
    setUser(null);
    setIsLoading(false);
    return;
  }

  try {
    try {
      await Promise.race([
        api.syncIdentityUsers(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('sync timeout')), ADMIN_TIMEOUT_MS)
        )
      ]);
    } catch (e) {
      console.error('Sync failed, continuing:', e);
    }
await loadUsersAndAuth(identityUser, setUser, setUsers, setIsLoading);
  } catch (e) {
    console.error('Failed to handle auth change:', e);
    setUser(null);
    setIsLoading(false);
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const performLoginFlow = useCallback(async () => {
    try {
      const identityUser = await Promise.race([
        getUser(),
        new Promise<IdentityUser | null>((_, reject) =>
          setTimeout(() => reject(new Error('getUser timeout')), ADMIN_TIMEOUT_MS)
        )
      ]);

      if (identityUser) {
        try {
          await Promise.race([
            api.syncIdentityUsers(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('sync timeout')), ADMIN_TIMEOUT_MS)
            )
          ]);
        } catch (e) {
          console.error('Sync failed, continuing:', e);
        }
        await loadUsersAndAuth(identityUser, setUser, setUsers, setIsLoading);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    } catch (e) {
      console.error('Login flow failed:', e);
      setUser(null);
      setIsLoading(false);
    }
  }, [setUser, setUsers, setIsLoading]);

  useEffect(() => {
    const init = async () => {
      try {
        const identityUser = await Promise.race([
          getUser(),
          new Promise<IdentityUser | null>((_, reject) =>
            setTimeout(() => reject(new Error('getUser timeout')), ADMIN_TIMEOUT_MS)
          )
        ]);

        if (identityUser) {
          try {
            await Promise.race([
              api.syncIdentityUsers(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('sync timeout')), ADMIN_TIMEOUT_MS)
              )
            ]);
          } catch (e) {
            console.error('Sync failed, continuing:', e);
          }
   await loadUsersAndAuth(identityUser, setUser, setUsers, setIsLoading);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Init failed:', e);
        setIsLoading(false);
      }
    };

    init();

    const unsubscribe = onAuthChange((event, identityUser) => {
      handleAuthChange(event, identityUser, setUser, setUsers, setIsLoading);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await identityLogin(email, password);
    } catch (err: any) {
      throw new Error(err?.message || 'Login failed');
    }

    await performLoginFlow();
  };

  const logout = async () => {
    try {
      await identityLogout();
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
    setUser(null);
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await identitySignup(email, password, { full_name: name, user_metadata: { role: 'admin' } });
    } catch (err: any) {
      throw new Error(err?.message || 'Registration failed');
    }
  };

  const refreshUsers = async () => {
    try {
      const users = await api.getUsers();
      setUsers(users);
      if (user) {
        const identityUser = await getUser();
        const mappedUser = identityUser ? mapIdentityUser(identityUser, users) : null;
        setUser(mappedUser);
      }
    } catch (e) {
      console.error('Failed to refresh users:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isLoading,
        login,
        logout,
        register,
        refreshUsers,
        isAdmin: user?.roles?.includes('admin') ?? false
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
