import { useState, forwardRef } from 'react';
import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { toast } from '~/components/ui/toast';
import { useConnectedAccounts } from '~/hooks/use-connected-accounts';
import { useCreatePost } from '~/hooks/use-posts';
import { PLATFORM_LIMIT } from '~/lib/platforms';
import { DestinationSelector } from './destination-selector';
import { CharCounter } from './char-counter';
import { ScheduleTray, type ScheduleTrayState } from './schedule-tray';
import { SubmitBar } from './submit-bar';

type Props = {
  workspaceId: string;
  onSuccess?: () => void;
};

const INITIAL_TRAY: ScheduleTrayState = { mode: 'now', scheduledAt: null };

export const Composer = forwardRef<HTMLTextAreaElement, Props>(function Composer(
  { workspaceId, onSuccess },
  ref,
) {
  const [content, setContent] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tray, setTray] = useState<ScheduleTrayState>(INITIAL_TRAY);

  const { data: accounts, isLoading: accountsLoading } = useConnectedAccounts(workspaceId);
  const createPost = useCreatePost(workspaceId);

  function toggleAccount(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const selectedPlatforms = (accounts ?? [])
    .filter((a) => selectedIds.has(a.id))
    .map((a) => a.platform);

  const limit =
    selectedPlatforms.length > 0
      ? Math.min(...selectedPlatforms.map((p) => PLATFORM_LIMIT[p]))
      : 280;

  const scheduledAtIsValid =
    tray.mode === 'now' ||
    (tray.scheduledAt !== null && new Date(tray.scheduledAt) > new Date());

  const canSubmit =
    content.trim().length > 0 &&
    selectedIds.size > 0 &&
    content.length <= limit &&
    scheduledAtIsValid;

  function handleSubmit() {
    if (!canSubmit) return;

    const payload =
      tray.mode === 'now'
        ? { publishNow: true as const }
        : { scheduledAt: tray.scheduledAt ?? new Date().toISOString() };

    createPost.mutate(
      { workspaceId, content, connectedAccountIds: [...selectedIds], ...payload },
      {
        onSuccess: () => {
          toast.success(tray.mode === 'now' ? 'Post sent for publishing.' : 'Post scheduled.');
          setContent('');
          setSelectedIds(new Set());
          setTray(INITIAL_TRAY);
          onSuccess?.();
        },
        onError: () => {
          toast.error('Failed to create post. Please try again.');
        },
      },
    );
  }

  if (accountsLoading) {
    return (
      <Card className="space-y-3 p-4">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-40" />
      </Card>
    );
  }

  return (
    <Card className="transition-shadow duration-200 focus-within:ring-2 focus-within:ring-primary">
      <div className="space-y-3 p-4 pb-3">
        <DestinationSelector
          accounts={accounts ?? []}
          selected={selectedIds}
          onToggle={toggleAccount}
        />
        <textarea
          ref={ref}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none lg:min-h-28"
        />
      </div>
      <div className="space-y-3 border-t border-border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ScheduleTray value={tray} onChange={setTray} />
          <CharCounter content={content} selectedIds={selectedIds} accounts={accounts ?? []} />
        </div>
        <SubmitBar
          mode={tray.mode}
          canSubmit={canSubmit}
          isPending={createPost.isPending}
          hasDraftContent={content.trim().length > 0}
          onSaveDraft={() => toast.info('Draft saving coming in a future update.')}
          onSubmit={handleSubmit}
        />
      </div>
    </Card>
  );
});
