import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon } from '@hugeicons/core-free-icons';
import { Button } from '~/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';

type Props = {
  scheduledAt: string | null;
  onConfirm: (iso: string) => void;
  onClear: () => void;
  disabled?: boolean;
  loading?: boolean;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function snapMinute(m: number): string {
  return MINUTES[Math.round(m / 15) % 4] ?? '00';
}

function toLocalParts(iso: string): { date: Date; hh: string; mm: string } {
  const d = new Date(iso);
  return { date: d, hh: String(d.getHours()).padStart(2, '0'), mm: snapMinute(d.getMinutes()) };
}

function defaultDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

const selectCls =
  'rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary';

export function SchedulePopover({ scheduledAt, onConfirm, onClear, disabled, loading }: Props) {
  const initial = scheduledAt ? toLocalParts(scheduledAt) : { date: defaultDate(), hh: '09', mm: '00' };
  const [pickedDate, setPickedDate] = useState<Date | undefined>(initial.date);
  const [pickedHH, setPickedHH] = useState(initial.hh);
  const [pickedMM, setPickedMM] = useState(initial.mm);
  const [open, setOpen] = useState(false);

  function buildDate() {
    if (!pickedDate) return null;
    const d = new Date(pickedDate);
    d.setHours(Number(pickedHH), Number(pickedMM), 0, 0);
    return d;
  }

  function handleConfirm() {
    const d = buildDate();
    if (!d || d <= new Date()) return;
    onConfirm(d.toISOString());
    setOpen(false);
  }

  const isPast = (() => {
    const d = buildDate();
    return d ? d <= new Date() : false;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          loading={loading}
        >
          <HugeiconsIcon icon={Calendar03Icon} size={14} aria-hidden />
          {scheduledAt ? 'Reschedule' : 'Schedule'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={pickedDate}
          onSelect={setPickedDate}
          disabled={{ before: new Date() }}
        />
        <div className="border-t border-border px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10">Time</span>
            <div className="flex items-center gap-1">
              <select
                value={pickedHH}
                onChange={(e) => setPickedHH(e.target.value)}
                className={selectCls}
                aria-label="Hour"
              >
                {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-xs text-muted-foreground">:</span>
              <select
                value={pickedMM}
                onChange={(e) => setPickedMM(e.target.value)}
                className={selectCls}
                aria-label="Minute"
              >
                {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {isPast && (
            <p className="text-xs text-destructive">Pick a future time.</p>
          )}
          <div className="flex justify-between gap-2">
            {scheduledAt && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { onClear(); setOpen(false); }}>
                Clear
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              disabled={!pickedDate || isPast}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
