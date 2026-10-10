import { NavLink } from 'react-router-dom';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-[var(--radius-DEFAULT)] px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-accent text-on-accent' : 'text-muted hover:text-fg',
  );
}

export function Navbar() {
  return (
    <header className="border-line border-b">
      <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-4 px-4 py-3">
        <NavLink to="/" className="flex items-baseline gap-2">
          <span className="text-fg text-base font-semibold tracking-tight">LeetCode Progress</span>
        </NavLink>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/settings" className={navClass}>
            Settings
          </NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
