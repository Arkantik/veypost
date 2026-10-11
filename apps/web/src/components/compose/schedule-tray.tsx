import { HugeiconsIcon } from '@hugeicons/react';
import { Clock01Icon, FlashIcon } from '@hugeicons/core-free-icons';
import { Segmented } from '~/components/ui/segmented';

export type ScheduleMode = 'now' | 'schedule';

export type ScheduleTrayState = {
  mode: ScheduleMode;
  scheduledAt: string | null;
};

type Props = {
  value: ScheduleTrayState;
  onChange: (value: ScheduleTrayState) => void;
};

const OPTIONS = [
  {
    value: 'now' as ScheduleMode,
    label: (
      <span className="flex items-center gap-1.5">
        <HugeiconsIcon icon={FlashIcon} size={12} aria-hidden />
        Post now
      </span>
    ),
  },
  {
    value: 'schedule' as ScheduleMode,
    label: (
      <span className="flex items-center gap-1.5">
        <HugeiconsIcon icon={Clock01Icon} size={12} aria-hidden />
        Schedule
      </span>
    ),
  },
] as const;

function minDateTime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 1);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

export function ScheduleTray({ value, onChange }: Props) {
  function handleModeChange(mode: ScheduleMode) {
    if (mode === 'now') {
      onChange({ mode: 'now', scheduledAt: null });
    } else {
      onChange({ mode: 'schedule', scheduledAt: value.scheduledAt ?? minDateTime() });
    }
  }

  function handleDateChange(raw: string) {
    onChange({ mode: 'schedule', scheduledAt: raw ? new Date(raw).toISOString() : null });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented
        options={OPTIONS}
        value={value.mode}
        onChange={handleModeChange}
        label="When to publish"
      />
      {value.mode === 'schedule' && (
        <input
          type="datetime-local"
          min={minDateTime()}
          value={value.scheduledAt ? value.scheduledAt.slice(0, 16) : ''}
          onChange={(e) => handleDateChange(e.target.value)}
          className="rounded-md border border-border bg-transparent px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Scheduled date and time"
        />
      )}
    </div>
  );
}
