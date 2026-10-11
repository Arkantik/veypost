import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Edit01Icon, Tick01Icon, Cancel01Icon, Loading03Icon } from '@hugeicons/core-free-icons';
import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { EmptyState } from '~/components/ui/empty-state';
import { PlatformIcons } from '~/components/ui/platform-icons';
import { cn } from '~/lib/utils';
import type { RecentPost } from '@veypost/shared';

type Filter = 'all' | 'published' | 'failed';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_CONFIG = {
  published: { icon: Tick01Icon, label: 'Published', className: 'bg-success/10 text-success' },
  failed: { icon: Cancel01Icon, label: 'Failed', className: 'bg-destructive/10 text-destructive' },
  publishing: { icon: Loading03Icon, label: 'Publishing…', className: 'bg-muted text-muted-foreground' },
} as const;

function StatusBadge({ status }: { status: 'publishing' | 'published' | 'failed' }) {
  const { icon, label, className } = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-sm px-1.5 py-px text-[11px] font-bold', className)}>
      <HugeiconsIcon icon={icon} size={14} aria-hidden className={status === 'publishing' ? 'animate-spin' : undefined} />
      {label}
    </span>
  );
}

function PostRow({ post }: { post: RecentPost }) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-0">
      <div className="w-12 shrink-0 pt-0.5">
        <PlatformIcons platforms={post.platforms} variant="avatar" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{post.content}</p>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status={post.status} />
          <span className="text-xs text-muted-foreground">{formatRelativeTime(post.publishedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3 border-b border-border py-3 last:border-0">
          <div className="flex w-12 shrink-0 -space-x-1.5 pt-0.5">
            <Skeleton className="size-5 rounded-full ring-1 ring-card" />
            <Skeleton className="size-5 rounded-full ring-1 ring-card" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </>
  );
}

interface Props {
  posts: RecentPost[];
  isLoading: boolean;
}

export function DashboardRecentFeed({ posts, isLoading }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const visible = filter === 'all' ? posts : posts.filter((p) => p.status === filter);
  const counts: Record<Filter, number> = {
    all: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    failed: posts.filter((p) => p.status === 'failed').length,
  };

  const tabs: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Recent posts</h2>
        <Link
          to="/content/posts"
          className="pt-px text-xs font-medium text-primary hover:underline"
          aria-label="View all recent posts"
        >
          View all
        </Link>
      </div>
      <div className="flex gap-0.5 border-b border-border bg-background px-2.5 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={filter === tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              filter === tab.value && 'bg-card text-foreground shadow-sm',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                filter === tab.value ? 'bg-accent text-primary' : 'bg-border text-muted-foreground',
              )}
            >
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>
      <div className="px-4">
        {isLoading ? (
          <FeedSkeleton />
        ) : visible.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<HugeiconsIcon icon={Edit01Icon} size={18} aria-hidden />}
            title="No posts yet"
            description="Compose your first post and it will appear here."
          />
        ) : (
          visible.map((p) => <PostRow key={p.id} post={p} />)
        )}
      </div>
    </Card>
  );
}
