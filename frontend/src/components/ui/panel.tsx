import { type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/** A Nordic card: panel background, hairline border, 8px radius, soft shadow. */
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'border-line bg-panel rounded-[var(--radius-DEFAULT)] border p-4 shadow-[var(--shadow)]',
        className,
      )}
      {...props}
    />
  );
}

export function PanelTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-[15px] leading-tight font-semibold', className)} {...props} />;
}
