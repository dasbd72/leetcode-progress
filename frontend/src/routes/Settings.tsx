import { Panel, PanelTitle } from '@/components/ui/panel';

/** Settings shell. Profile + Following tabs (F5) land here; auth guard (F2). */
export function Settings() {
  return (
    <div className="grid gap-[14px]">
      <h1 className="text-[26px] leading-none font-semibold -tracking-[0.01em]">Settings</h1>
      <Panel>
        <PanelTitle>Profile &amp; following</PanelTitle>
        <p className="text-muted mt-2 text-sm">Settings coming soon.</p>
      </Panel>
    </div>
  );
}
