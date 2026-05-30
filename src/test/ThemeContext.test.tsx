import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should provide default light theme', () => {
    const TestComponent = () => {
      const { theme } = useTheme();
      return <div data-testid="theme">{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('should use dark theme when localStorage has dark', () => {
    localStorage.setItem('acamed_theme', 'dark');

    const TestComponent = () => {
      const { theme } = useTheme();
      return <div data-testid="theme">{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('should toggle theme from light to dark', async () => {
    const TestComponent = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <div data-testid="theme">{theme}</div>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');

    fireEvent.click(screen.getByText('Toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
  });

  it('should toggle theme from dark to light', async () => {
    localStorage.setItem('acamed_theme', 'dark');

    const TestComponent = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <div data-testid="theme">{theme}</div>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');

    fireEvent.click(screen.getByText('Toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });
  });

  it('should persist theme to localStorage', async () => {
    const TestComponent = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <div data-testid="theme">{theme}</div>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Toggle'));

    await waitFor(() => {
      expect(localStorage.getItem('acamed_theme')).toBe('dark');
    });
  });

  it('should apply theme to document', async () => {
    const TestComponent = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <div data-testid="theme">{theme}</div>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    fireEvent.click(screen.getByText('Toggle'));

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});