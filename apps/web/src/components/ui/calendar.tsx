import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { cn } from '~/lib/utils';
import type { ComponentProps } from 'react';

type CalendarProps = ComponentProps<typeof DayPicker>;

const NAV_BTN = cn(
  'flex items-center justify-center size-7 rounded-md transition-colors',
  'text-muted-foreground hover:bg-muted hover:text-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  'disabled:pointer-events-none disabled:opacity-40',
);

function prevMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
function nextMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const label = month.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className={cn('p-1', className)}>
      <div className="flex items-center justify-between h-8 px-1 mb-3">
        <button
          type="button"
          aria-label="Go to previous month"
          onClick={() => setMonth(prevMonth(month))}
          className={NAV_BTN}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} aria-hidden />
        </button>
        <span className="text-sm font-medium">{label}</span>
        <button
          type="button"
          aria-label="Go to next month"
          onClick={() => setMonth(nextMonth(month))}
          className={NAV_BTN}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden />
        </button>
      </div>
      <DayPicker
        showOutsideDays={showOutsideDays}
        hideNavigation
        month={month}
        onMonthChange={setMonth}
        classNames={{
          months: 'flex flex-col',
          month: 'space-y-0',
          month_caption: 'hidden',
          month_grid: 'w-full border-collapse',
          weekdays: 'flex',
          weekday: 'text-muted-foreground w-8 text-[0.7rem] font-normal text-center',
          weeks: 'space-y-1 mt-1',
          week: 'flex',
          day: 'relative p-0 text-center',
          day_button: cn(
            'size-8 rounded-md text-sm font-normal transition-colors',
            'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'disabled:pointer-events-none disabled:opacity-40',
          ),
          selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
          outside: 'text-muted-foreground opacity-50',
          today: '[&>button]:font-semibold',
          ...classNames,
        }}
        formatters={{ formatWeekdayName: (d) => d.toLocaleString(undefined, { weekday: 'short' }) }}
        {...(props as ComponentProps<typeof DayPicker>)}
      />
    </div>
  );
}
