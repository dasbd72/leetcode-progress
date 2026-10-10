import { useEffect, useState } from 'react';

import { type UserSettings, useUpdateUserSettings, useUserSettings } from '@/api/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function Field({
  label,
  value,
  onChange,
  readOnly,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-muted text-[11px] font-medium tracking-[0.07em] uppercase">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </label>
  );
}

export function ProfileTab() {
  const { data, isLoading, isError } = useUserSettings();
  const update = useUpdateUserSettings();
  const [form, setForm] = useState<UserSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading) return <p className="text-muted text-sm">Loading profile…</p>;
  if (isError || !form) return <p className="text-hard text-sm">Failed to load profile.</p>;

  const set = (key: keyof UserSettings) => (v: string) => setForm({ ...form, [key]: v });

  return (
    <form
      className="grid max-w-md gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate(form);
      }}
    >
      <Field label="Username" value={form.username} readOnly />
      <Field label="Email" type="email" value={form.email} onChange={set('email')} />
      <Field
        label="Display name"
        value={form.preferred_username}
        onChange={set('preferred_username')}
      />
      <Field
        label="LeetCode username"
        value={form.leetcode_username}
        onChange={set('leetcode_username')}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save profile'}
        </Button>
        {update.isSuccess && <span className="text-accent text-sm">Saved</span>}
        {update.isError && <span className="text-hard text-sm">Save failed</span>}
      </div>
    </form>
  );
}
