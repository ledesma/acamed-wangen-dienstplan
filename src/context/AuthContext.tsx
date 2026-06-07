import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User as IdentityUser, getUser, login as identityLogin, signup as identitySignup, logout as identityLogout, onAuthChange } from '@netlify/identity';
import { User, Employee } from '../types';
import api from '../data/api';

interface AuthContextType {
  user: User | null;
  employees: Employee[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refreshEmployees: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_TIMEOUT_MS = 5000;

const isAdminFromIdentity = (identityUser: IdentityUser): boolean => {
  return identityUser.roles?.includes('admin') ?? false;
};

const mapIdentityUser = (identityUser: IdentityUser, employees: Employee[]): User | null => {
  if (!identityUser?.email) return null;

  const employee = employees.find(e => e.email === identityUser.email);
  if (!employee) return null;

  const role = isAdminFromIdentity(identityUser)
    ? 'admin'
    : (employee.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user';

  return {
    id: identityUser.id || employee.id,
    email: identityUser.email,
    role,
    name: identityUser.name || employee.name,
    avatar: employee.avatar
  };
};

const loadEmployeesAndUser = async (
  identityUser: IdentityUser | null,
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> => {
  try {
    const emps = await Promise.race([
      api.getEmployees(),
      new Promise<Employee[]>((_, reject) =>
        setTimeout(() => reject(new Error('getEmployees timeout')), ADMIN_TIMEOUT_MS)
      )
    ]);
    setEmployees(emps);

    if (identityUser) {
      const mappedUser = mapIdentityUser(identityUser, emps);
      setUser(mappedUser);
    } else {
      setUser(null);
    }
  } catch (e) {
    console.error('Failed to load employees:', e);
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};

const handleAuthChange = async (
  event: string | undefined,
  identityUser: IdentityUser | null,
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>,
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
    await loadEmployeesAndUser(identityUser, setUser, setEmployees, setIsLoading);
  } catch (e) {
    console.error('Failed to handle auth change:', e);
    setUser(null);
    setIsLoading(false);
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
        await loadEmployeesAndUser(identityUser, setUser, setEmployees, setIsLoading);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    } catch (e) {
      console.error('Login flow failed:', e);
      setUser(null);
      setIsLoading(false);
    }
  }, [setUser, setEmployees, setIsLoading]);

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
          await loadEmployeesAndUser(identityUser, setUser, setEmployees, setIsLoading);
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
      handleAuthChange(event, identityUser, setUser, setEmployees, setIsLoading);
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

  const refreshEmployees = async () => {
    try {
      const emps = await api.getEmployees();
      setEmployees(emps);
      if (user) {
        const identityUser = await getUser();
        const mappedUser = identityUser ? mapIdentityUser(identityUser, emps) : null;
        setUser(mappedUser);
      }
    } catch (e) {
      console.error('Failed to refresh employees:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employees,
        isLoading,
        login,
        logout,
        register,
        refreshEmployees,
        isAdmin: user?.role === 'admin'
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
