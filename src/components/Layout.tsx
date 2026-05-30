import React, { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  console.log('Layout rendering!');
  return (
    <>
      <Header />
      <main className="main-content">
        {children}
      </main>
    </>
  );
};

export default Layout;