import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { PLATFORM_LABEL } from '~/lib/platforms';
import type { ConnectedAccount } from '@veypost/shared';

interface Props {
  account: ConnectedAccount | null;
  isPending: boolean;
  onConfirm: (id: string) => void;
  onClose: () => void;
}

export function AccountDisconnectDialog({ account, isPending, onConfirm, onClose }: Props) {
  const platform = account ? PLATFORM_LABEL[account.platform] : '';
  const handle = account?.username ? ` @${account.username}` : '';

  return (
    <Dialog open={!!account} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect {platform}{handle}?</DialogTitle>
          <DialogDescription>
            Removing this account will also delete all post targets using it. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => account && onConfirm(account.id)}
          >
            {isPending ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
