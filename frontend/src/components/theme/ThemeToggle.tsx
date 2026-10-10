import { Monitor, Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme/ThemeProvider';

const LABEL = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Icon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={LABEL[theme]}
      title={LABEL[theme]}
    >
      <Icon />
    </Button>
  );
}
