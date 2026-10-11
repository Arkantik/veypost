import { lazy, Suspense } from 'react';
import { Link } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { useFollowerGrowth } from '~/hooks/use-follower-growth';
import { PLATFORM_ICON, PLATFORM_COLOR } from '~/lib/platforms';
import type { AnalyticsRange, FollowerSeries } from '@veypost/shared';

const LazyAreaChart = lazy(() =>
  import('./analytics-area-chart').then((m) => ({ default: m.AreaChartWidget })),
);

function dateRangeLabel(range: AnalyticsRange): string {
  const days = parseInt(range);
  const end = new Date(2026, 9, 1);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
}

function GrowthCard({ acc }: { acc: FollowerSeries }) {
  const delta = acc.current - (acc.series[0] ?? acc.current);
  const positive = delta >= 0;
  const color = PLATFORM_COLOR[acc.platform];

  return (
    <Card className="p-4">
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <HugeiconsIcon
          icon={PLATFORM_ICON[acc.platform]}
          size={18}
          className="shrink-0"
          style={{ color }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{acc.handle}</span>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {acc.current.toLocaleString()}
        </span>
        <Badge tone={positive ? 'success' : 'destructive'} className="shrink-0">
          {positive ? '+' : ''}
          {delta.toLocaleString()}
        </Badge>
      </div>
      <Suspense fallback={<Skeleton className="h-18 w-full" />}>
        <LazyAreaChart series={acc.series} gradientId={`agc-${acc.accountId}`} />
      </Suspense>
    </Card>
  );
}

function GrowthSkeleton() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-4.5 w-4.5 shrink-0 rounded-sm" />
        <Skeleton className="h-4 min-w-0 flex-1" />
        <Skeleton className="h-4 w-12 shrink-0" />
        <Skeleton className="h-5 w-10 shrink-0 rounded-full" />
      </div>
      <Skeleton className="h-18 w-full" />
    </Card>
  );
}

interface Props {
  workspaceId: string;
  range: AnalyticsRange;
}

export function AnalyticsFollowerGrowth({ workspaceId, range }: Props) {
  const { data, isLoading } = useFollowerGrowth(workspaceId, range);

  if (isLoading) {
    return (
      <div>
        <p className="mb-1 text-sm font-semibold">Follower growth</p>
        <p className="mb-3 text-xs text-muted-foreground">{dateRangeLabel(range)}</p>
        <div className="grid grid-cols-1 gap-3 compact:grid-cols-2 regular:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <GrowthSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const visible = data.slice(0, 3);
  const hasMore = data.length > 3;

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">Follower growth</p>
        {hasMore && (
          <Link
            to="/workspace/$workspaceId/analytics/growth"
            params={{ workspaceId }}
            search={{ range }}
            className="pt-px text-xs font-medium text-primary hover:underline"
            aria-label="View all account growth charts"
          >
            View all
          </Link>
        )}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{dateRangeLabel(range)}</p>
      <div className="grid grid-cols-1 gap-3 compact:grid-cols-2 regular:grid-cols-3">
        {visible.map((acc) => (
          <GrowthCard key={acc.accountId} acc={acc} />
        ))}
      </div>
    </div>
  );
}
