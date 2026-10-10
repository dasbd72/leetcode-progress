import { FollowingTab } from '@/components/settings/FollowingTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { Panel } from '@/components/ui/panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Settings() {
  return (
    <div className="grid gap-[14px]">
      <h1 className="text-[26px] leading-none font-semibold -tracking-[0.01em]">Settings</h1>
      <Panel>
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="following">
            <FollowingTab />
          </TabsContent>
        </Tabs>
      </Panel>
    </div>
  );
}
