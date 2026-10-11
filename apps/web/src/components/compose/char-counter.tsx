import { PLATFORM_LIMIT } from '~/lib/platforms';
import { cn } from '~/lib/utils';
import type { ConnectedAccount } from '@veypost/shared';

type Props = {
  content: string;
  selectedIds: Set<string>;
  accounts: ConnectedAccount[];
};

export function CharCounter({ content, selectedIds, accounts }: Props) {
  const selectedPlatforms = accounts
    .filter((a) => selectedIds.has(a.id))
    .map((a) => a.platform);

  const limit =
    selectedPlatforms.length > 0
      ? Math.min(...selectedPlatforms.map((p) => PLATFORM_LIMIT[p]))
      : 280;

  const remaining = limit - content.length;
  const pctUsed = content.length / limit;

  return (
    <span
      className={cn(
        'shrink-0 text-xs tabular-nums',
        pctUsed >= 1
          ? 'text-destructive'
          : pctUsed >= 0.8
            ? 'text-warning'
            : 'text-muted-foreground',
      )}
      aria-live="polite"
      aria-label={`${remaining} characters remaining`}
    >
      {remaining}
    </span>
  );
}
