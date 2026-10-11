import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '~/lib/utils';
import type { ComponentProps } from 'react';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({
  className,
  align = 'center',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'border-border bg-card text-card-foreground z-50 rounded-md border p-3 shadow-lg outline-none',
          'data-[state=open]:animate-dropdown-in data-[state=closed]:animate-dropdown-out',
          'data-[side=top]:origin-bottom data-[side=bottom]:origin-top data-[side=left]:origin-right data-[side=right]:origin-left',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
