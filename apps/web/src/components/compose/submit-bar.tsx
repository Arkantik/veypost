import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon, SendHorizontalIcon } from '@hugeicons/core-free-icons';
import { Button } from '~/components/ui/button';
import type { ScheduleMode } from './schedule-tray';

type Props = {
  mode: ScheduleMode;
  canSubmit: boolean;
  isPending: boolean;
  hasDraftContent: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
};

export function SubmitBar({ mode, canSubmit, isPending, hasDraftContent, onSaveDraft, onSubmit }: Props) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="ghost-outline"
        size="sm"
        disabled={!hasDraftContent || isPending}
        onClick={onSaveDraft}
      >
        Save draft
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={!canSubmit || isPending}
        loading={isPending}
        onClick={onSubmit}
      >
        {mode === 'now' ? (
          <>
            <HugeiconsIcon icon={SendHorizontalIcon} size={14} aria-hidden />
            Publish now
          </>
        ) : (
          <>
            <HugeiconsIcon icon={Calendar03Icon} size={14} aria-hidden />
            Schedule
          </>
        )}
      </Button>
    </div>
  );
}
