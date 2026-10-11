import { HugeiconsIcon } from '@hugeicons/react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { PLATFORM_ICON, PLATFORM_COLOR, PLATFORM_LABEL, ALL_PLATFORMS, COMING_SOON } from '~/lib/platforms';
import type { SocialPlatform } from '@veypost/shared';

interface Props {
  workspaceId: string;
  onOpenDiscord: () => void;
}

export function AddAccountSection({ workspaceId, onOpenDiscord }: Props) {
  function handleAdd(platform: SocialPlatform) {
    if (platform === 'discord') { onOpenDiscord(); return; }
    const oauthPlatform = platform === 'instagram' ? 'facebook' : platform;
    window.location.href = `/api/v1/accounts/connect/${oauthPlatform}?workspaceId=${workspaceId}`;
  }

  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-semibold">Connect an account</p>
      <div className="flex flex-wrap gap-2">
        {ALL_PLATFORMS.map((p) => {
          const soon = COMING_SOON.has(p);
          const color = p === 'x' ? '#0f0f0f' : PLATFORM_COLOR[p];
          return (
            <div key={p} className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={soon}
                onClick={() => handleAdd(p)}
              >
                <span
                  className="flex size-5 items-center justify-center rounded-full"
                  style={{ background: color }}
                  aria-hidden
                >
                  <HugeiconsIcon icon={PLATFORM_ICON[p]} size={12} className="text-white" />
                </span>
                {PLATFORM_LABEL[p]}
              </Button>
              {soon && (
                <span className="absolute -right-1 -top-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                  Soon
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
