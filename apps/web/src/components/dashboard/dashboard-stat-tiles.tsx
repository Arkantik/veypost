import { cn } from '~/lib/utils';
import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { useCountUp } from '~/hooks/use-count-up';
import type { DashboardPostStats } from '@veypost/shared';

interface TileProps {
  label: string;
  value: number;
  subtitle: string;
  id: string;
  valueClass?: string;
}

function StatTile({ label, value, subtitle, id, valueClass }: TileProps) {
  const count = useCountUp(value, `dash-stat-${id}`);
  return (
    <Card className="p-5">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'font-variant-numeric text-3xl font-bold tabular-nums leading-none',
          valueClass,
        )}
      >
        {count.toLocaleString()}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>
    </Card>
  );
}

function StatTileSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="mb-1.5 h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="mt-1.5 h-3 w-20" />
    </Card>
  );
}

interface Props {
  data: DashboardPostStats | undefined;
  isLoading: boolean;
}

export function DashboardStatTiles({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-3 compact:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <StatTileSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 compact:grid-cols-3">
      <StatTile label="Scheduled" value={data.scheduled} subtitle="posts in queue" id="scheduled" />
      <StatTile
        label="Published this week"
        value={data.publishedThisWeek}
        subtitle={'Mon-Sun'}
        id="published"
        valueClass="text-success"
      />
      <StatTile
        label="Failed"
        value={data.failed}
        subtitle={data.failed === 0 ? 'all clear' : 'need attention'}
        id="failed"
        valueClass={data.failed > 0 ? 'text-destructive' : undefined}
      />
    </div>
  );
}
