import { lazy, Suspense } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useWorkspace } from '~/contexts/workspace-route-context';
import { Segmented } from '~/components/ui/segmented';
import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { useFollowerGrowth } from '~/hooks/use-follower-growth';
import { AccountCard } from './growth-account-card';
import { GrowthStatTiles } from './growth-stat-tiles';
import type { AnalyticsRange } from '@veypost/shared';

const VALID_RANGES = ['7d', '14d', '30d', '90d'] as const;

export const Route = createFileRoute('/_app/workspace/$workspaceId/analytics_/growth')({
  validateSearch: (search: Record<string, unknown>) => ({
    range: (VALID_RANGES.includes(search.range as AnalyticsRange)
      ? search.range
      : '30d') as AnalyticsRange,
  }),
  component: FollowerGrowthPage,
});

const LazyMultiChart = lazy(() =>
  import('./growth-multi-chart').then((m) => ({ default: m.MultiAreaChart })),
);

const RANGE_OPTIONS = [
  { value: '7d' as const, label: '7d' },
  { value: '14d' as const, label: '14d' },
  { value: '30d' as const, label: '30d' },
  { value: '90d' as const, label: '90d' },
];

function dateLabel(range: AnalyticsRange): string {
  const days = parseInt(range);
  const end = new Date(2026, 9, 1);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
}

function FollowerGrowthPage() {
  const workspace = useWorkspace();
  const { range } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  function setRange(newRange: AnalyticsRange) {
    navigate({ search: { range: newRange }, replace: true });
  }

  const { data, isLoading } = useFollowerGrowth(workspace.id, range);

  const total = data.reduce((s, a) => s + a.current, 0);
  const totalNew = data.reduce((s, a) => s + (a.current - (a.series[0] ?? a.current)), 0);
  const best =
    data.length > 0
      ? data.reduce((b, a) =>
          a.current - (a.series[0] ?? a.current) > b.current - (b.series[0] ?? b.current) ? a : b,
        )
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Follower growth</h1>
          <p className="text-sm text-muted-foreground">{dateLabel(range)}</p>
        </div>
        <Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} label="Time range" />
      </div>

      <GrowthStatTiles
        workspaceId={workspace.id}
        total={total}
        totalNew={totalNew}
        best={best}
        accountCount={data.length}
        isLoading={isLoading}
      />

      <div>
        <p className="mb-1 text-sm font-semibold">All accounts</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Combined growth for the selected period
        </p>
        <Card className="overflow-hidden p-4">
          {isLoading ? (
            <Skeleton className="h-45 w-full" />
          ) : (
            <Suspense fallback={<Skeleton className="h-45 w-full" />}>
              <LazyMultiChart data={data} range={range} />
            </Suspense>
          )}
        </Card>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold">By account</p>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 compact:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden p-0">
                <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                  <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12 shrink-0" />
                  <Skeleton className="h-5 w-10 shrink-0 rounded-full" />
                </div>
                <div className="px-1 pb-2 pt-3">
                  <Skeleton className="mx-3 h-18 w-full" />
                </div>
                <div className="flex border-t border-border">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className={`flex-1 px-4 py-2.5 text-center ${j < 2 ? 'border-r border-border' : ''}`}
                    >
                      <Skeleton className="mx-auto mb-1 h-2 w-10" />
                      <Skeleton className="mx-auto h-3.5 w-12" />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 compact:grid-cols-2">
            {data.map((acc) => (
              <AccountCard key={acc.accountId} acc={acc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
