import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { type Announcement, useAnnouncements } from '@/api/announcement';
import { Button } from '@/components/ui/button';

const LAST_SEEN_KEY = 'announcements:lastSeen';

function latestDate(items: Announcement[]): string {
  return items.reduce((max, a) => (a.date > max ? a.date : max), '');
}

/** Surfaces announcements in a dismissible modal. Dismissal records the latest
 *  announcement date so it won't reappear until there's something newer. */
export function Announcements() {
  const { data } = useAnnouncements();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!data?.length) return;
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY) ?? '';
    if (latestDate(data) > lastSeen) setOpen(true);
  }, [data]);

  function close() {
    if (data?.length) localStorage.setItem(LAST_SEEN_KEY, latestDate(data));
    setOpen(false);
  }

  if (!data?.length) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="border-line bg-panel text-fg fixed top-1/2 left-1/2 z-50 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-DEFAULT)] border p-5 shadow-[var(--shadow-tip)]">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-[15px] font-semibold">What's new</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close announcements">
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <ul className="grid gap-4">
            {data.map((a) => (
              <li key={`${a.date}-${a.title}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">{a.title}</h3>
                  <span className="tabular text-muted text-xs">{a.date}</span>
                </div>
                <p className="text-muted mt-1 text-sm whitespace-pre-line">{a.content}</p>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
