import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--page-bg)] transition-colors">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">{children}</main>
    </div>
  );
}
