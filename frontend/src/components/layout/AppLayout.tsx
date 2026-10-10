import { Outlet } from 'react-router-dom';

import { Navbar } from '@/components/layout/Navbar';

export function AppLayout() {
  return (
    <div className="bg-bg text-fg min-h-dvh">
      <Navbar />
      <main className="mx-auto w-full max-w-[1080px] px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
