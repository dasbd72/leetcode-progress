import { userColor } from '@/lib/colors';
import { cn } from '@/lib/utils';

interface UserChipsProps {
  usernames: string[];
  hidden: Set<string>;
  onToggle: (username: string) => void;
}

export function UserChips({ usernames, hidden, onToggle }: UserChipsProps) {
  return (
    <div className="mt-3.5 flex flex-wrap gap-2">
      {usernames.map((username, i) => {
        const isHidden = hidden.has(username);
        return (
          <button
            key={username}
            type="button"
            aria-pressed={!isHidden}
            onClick={() => onToggle(username)}
            className={cn(
              'border-line text-fg inline-flex cursor-pointer items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
              isHidden && 'text-muted opacity-45',
            )}
          >
            <span
              className="mr-1.5 inline-block h-2.5 w-2.5 flex-none rounded-full"
              style={{ background: userColor(i) }}
            />
            {username}
          </button>
        );
      })}
    </div>
  );
}
