import { useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { cn } from '~/lib/utils';
import { useCurrentUser } from '~/hooks/use-session';
import { useWorkspace } from '~/contexts/workspace-route-context';
import { useDashboardSummary } from '~/hooks/use-dashboard-summary';
import { useConnectedAccounts } from '~/hooks/use-connected-accounts';
import { usePlatformSummary } from '~/hooks/use-platform-summary';
import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { DashboardGreeting } from '~/components/dashboard/dashboard-greeting';
import { DashboardStatTiles } from '~/components/dashboard/dashboard-stat-tiles';
import { DashboardRecentFeed } from '~/components/dashboard/dashboard-recent-feed';
import { DashboardUpcoming } from '~/components/dashboard/dashboard-upcoming';
import { DashboardNoAccounts } from '~/components/dashboard/dashboard-no-accounts';
import { DashboardOnboarding } from '~/components/dashboard/dashboard-onboarding';
import { DashboardComposer } from '~/components/dashboard/dashboard-composer';
import { DashboardAccountsWidget } from '~/components/dashboard/dashboard-accounts-widget';
import { DashboardPlatformStats } from '~/components/dashboard/dashboard-platform-stats';

function AccountsWidgetSkeleton() {
  return (
    <Card className="flex items-center justify-between px-4 py-3">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-3 w-12" />
    </Card>
  );
}

export const Route = createFileRoute('/_app/workspace/$workspaceId/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { workspaceId } = Route.useParams();
  const user = useCurrentUser();
  const workspace = useWorkspace();
  const { data, isLoading } = useDashboardSummary(workspaceId);
  const { data: accounts, isLoading: accountsLoading } = useConnectedAccounts(workspaceId);
  const { data: platformData, isLoading: platformLoading } = usePlatformSummary(workspaceId);

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const hasAccounts = data?.hasConnectedAccounts ?? false;

  const hasActivity =
    (data?.recentPosts.length ?? 0) > 0 ||
    (data?.upcomingPosts.length ?? 0) > 0 ||
    (data?.postStats.scheduled ?? 0) > 0 ||
    (data?.postStats.publishedThisWeek ?? 0) > 0 ||
    (data?.postStats.failed ?? 0) > 0;

  const showOnboarding = !isLoading && hasAccounts && !hasActivity;
  const showComposer = !isLoading && hasAccounts;
  const showUpcoming = isLoading || (data?.upcomingPosts.length ?? 0) > 0;

  const onboardingSteps = [
    { id: 'accounts', label: 'Connect a social account', done: hasAccounts, href: `/workspace/${workspaceId}/accounts` },
    { id: 'timezone', label: 'Set your timezone', done: workspace.timezone !== 'UTC', href: `/workspace/${workspaceId}/overview` },
    { id: 'post', label: 'Schedule or publish your first post', done: hasActivity, onAction: () => { composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); composerRef.current?.focus(); } },
    { id: 'team', label: 'Invite a teammate', done: false, href: `/workspace/${workspaceId}/members` },
  ];

  return (
    <div className="space-y-6">
      <DashboardGreeting user={user} hasAccounts={hasAccounts} />
      <DashboardStatTiles data={data?.postStats} isLoading={isLoading} />
      {!hasAccounts && !isLoading && <DashboardNoAccounts workspaceId={workspaceId} />}
      {(hasAccounts || isLoading) && (
        accountsLoading ? (
          <AccountsWidgetSkeleton />
        ) : (
          accounts && <DashboardAccountsWidget accounts={accounts} workspaceId={workspaceId} />
        )
      )}
      {showOnboarding && <DashboardOnboarding steps={onboardingSteps} />}
      {showComposer && <DashboardComposer ref={composerRef} workspaceId={workspaceId} />}
      <div className={cn('grid gap-6', showUpcoming && 'regular:grid-cols-[1fr_360px]')}>
        <DashboardRecentFeed posts={data?.recentPosts ?? []} isLoading={isLoading} />
        {showUpcoming && (
          <DashboardUpcoming posts={data?.upcomingPosts ?? []} isLoading={isLoading} />
        )}
      </div>
      {(hasAccounts || isLoading) && (
        <DashboardPlatformStats items={platformData ?? []} isLoading={platformLoading || isLoading} />
      )}
    </div>
  );
}
