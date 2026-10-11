import { HugeiconsIcon } from '@hugeicons/react';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { PLATFORM_ICON, PLATFORM_BG, PLATFORM_LABEL } from '~/lib/platforms';
import { cn } from '~/lib/utils';
import type { ConnectedAccount } from '@veypost/shared';

type Props = {
  accounts: ConnectedAccount[];
  selected: Set<string>;
  onToggle: (id: string) => void;
};

export function DestinationSelector({ accounts, selected, onToggle }: Props) {
  if (accounts.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No connected accounts. Connect one to start posting.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Target accounts">
      {accounts.map((account) => {
        const active = selected.has(account.id);
        const needsAttention = account.status !== 'active';
        const initial = (account.username ?? account.platform)[0]?.toUpperCase() ?? '?';

        return (
          <button
            key={account.id}
            type="button"
            aria-pressed={active}
            aria-label={`${active ? 'Remove' : 'Add'} ${account.username ?? PLATFORM_LABEL[account.platform]}`}
            onClick={() => onToggle(account.id)}
            className={cn(
              'group relative flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground',
              needsAttention && 'border-warning/40 bg-warning/10',
            )}
          >
            <span className="relative shrink-0">
              <Avatar className="size-5">
                <AvatarImage src={account.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="text-[10px]">{initial}</AvatarFallback>
              </Avatar>
              <span
                className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full"
                style={{ background: PLATFORM_BG[account.platform] }}
                aria-hidden
              >
                <HugeiconsIcon
                  icon={PLATFORM_ICON[account.platform]}
                  size={7}
                  color="white"
                  aria-hidden
                />
              </span>
            </span>
            <span className="max-w-24 truncate">
              {account.username ?? PLATFORM_LABEL[account.platform]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
