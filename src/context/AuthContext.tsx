import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Employee } from '../types';
import api, { setCredentials, clearCredentials, getAuthHeader } from '../data/api';

interface AuthContextType {
  user: User | null;
  employees: Employee[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: 'admin' | 'user') => Promise<void>;
  refreshEmployees: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const authHeader = getAuthHeader();
      if (authHeader) {
        try {
          const emps = await api.getEmployees();
          const userStr = sessionStorage.getItem('acamed_user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
            setEmployees(emps);
            setIsLoading(false);
            return;
          }
        } catch {}
      }
      const emps = await api.getEmployees();
      setEmployees(emps);
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const emps = await api.getEmployees();
    const employee = emps.find((e: Employee) => e.email === email);
    
    if (!employee) {
      throw new Error('Invalid credentials');
    }
    
    const userData: User = {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      name: employee.name,
      avatar: employee.avatar
    };
    
    setUser(userData);
    setEmployees(emps);
    setCredentials(email, password);
    sessionStorage.setItem('acamed_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    clearCredentials();
    sessionStorage.removeItem('acamed_user');
  };

  const register = async (name: string, email: string, password: string, role: 'admin' | 'user') => {
    const emps = await api.getEmployees();
    
    if (emps.some((e: Employee) => e.email === email)) {
      throw new Error('Email already exists');
    }
    
    const newEmployee = await api.createEmployee({
      name,
      email,
      role
    });
    
    const userData: User = {
      id: newEmployee.id,
      email: newEmployee.email,
      role: newEmployee.role,
      name: newEmployee.name
    };
    
    setUser(userData);
    setCredentials(email, password);
    sessionStorage.setItem('acamed_user', JSON.stringify(userData));
    setEmployees([...emps, newEmployee]);
  };

  const refreshEmployees = async () => {
    const emps = await api.getEmployees();
    setEmployees(emps);
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