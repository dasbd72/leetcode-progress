import { useEffect, useMemo, useState } from 'react';

import { useFollowing, useUpdateFollowing, useUserList } from '@/api/user';
import { Button } from '@/components/ui/button';

export function FollowingTab() {
  const users = useUserList();
  const following = useFollowing();
  const update = useUpdateFollowing();
  const [selected, setSelected] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (following.data) setSelected(new Set(following.data));
  }, [following.data]);

  const allUsernames = useMemo(() => (users.data ?? []).map((u) => u.username), [users.data]);

  if (users.isLoading || following.isLoading) {
    return <p className="text-muted text-sm">Loading following…</p>;
  }
  if (users.isError || following.isError || !selected) {
    return <p className="text-hard text-sm">Failed to load following.</p>;
  }

  function toggle(username: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  }

  return (
    <div className="grid max-w-md gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setSelected(new Set(allUsernames))}>
          Select all
        </Button>
        <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
          Deselect all
        </Button>
        <span className="text-muted text-sm">{selected.size} selected</span>
      </div>

      <ul className="border-line divide-line divide-y rounded-[var(--radius-DEFAULT)] border">
        {(users.data ?? []).map((user) => (
          <li key={user.username}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
              <input
                type="checkbox"
                checked={selected.has(user.username)}
                onChange={() => toggle(user.username)}
                className="size-4 accent-[var(--accent)]"
              />
              <span className="text-fg text-sm font-medium">
                {user.preferred_username || user.username}
              </span>
              {user.leetcode_username && (
                <span className="tabular text-muted text-xs">{user.leetcode_username}</span>
              )}
            </label>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <Button onClick={() => update.mutate([...selected])} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save following'}
        </Button>
        {update.isSuccess && <span className="text-accent text-sm">Saved</span>}
        {update.isError && <span className="text-hard text-sm">Save failed</span>}
      </div>
    </div>
  );
}
