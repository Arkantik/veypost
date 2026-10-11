import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, FileEditIcon } from '@hugeicons/core-free-icons';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { EmptyState } from '~/components/ui/empty-state';
import { Composer } from '~/components/compose/composer';

export const Route = createFileRoute('/_app/workspace/$workspaceId/content/posts')({
  component: PostsPage,
});

function PostsPage() {
  const { workspaceId } = Route.useParams();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Posts</h1>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} size={14} aria-hidden />
          New post
        </Button>
      </div>

      <EmptyState
        icon={<HugeiconsIcon icon={FileEditIcon} />}
        title="No posts yet"
        description="All your scheduled, published, and draft posts will appear here."
        action={
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} size={14} aria-hidden />
            New post
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New post</DialogTitle>
          </DialogHeader>
          <Composer workspaceId={workspaceId} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
