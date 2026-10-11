import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { NewTwitterIcon } from '@hugeicons/core-free-icons';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/_app/workspace/$workspaceId/subscription')({
  component: WorkspaceSubscriptionPage,
});

const BUDGET_USED = 4.6;
const BUDGET_TOTAL = 5;
const BUDGET_PCT = Math.round((BUDGET_USED / BUDGET_TOTAL) * 100);

function WorkspaceSubscriptionPage() {
  const [active, setActive] = useState(true);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Subscription</h1>
        <p className="text-sm text-muted-foreground">
          Manage your cloud publishing plan and X/Twitter budget.
        </p>
      </div>

      <Card>
        <CardHeader
          className="rounded-t-lg border-b border-border"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, color-mix(in srgb, var(--color-primary) 4%, transparent) 25%, color-mix(in srgb, var(--color-primary) 1%, transparent) 50%, var(--color-card) 75%)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-primary text-xs font-bold text-primary-foreground">
                  P
                </div>
                <span className="text-[15px] font-bold">Veypost Cloud</span>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Unlimited seats with monthly X publishing included. Publish to every other platform
                with no limits.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[26px] font-bold tabular-nums leading-none">9.99€</div>
              <div className="mt-1 text-xs text-muted-foreground">/ month</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  active ? 'bg-success' : 'bg-muted-foreground/40',
                )}
              />
              <span className="text-sm font-medium">
                {active ? 'Active subscription' : 'Not subscribed'}
              </span>
            </div>
            {active ? (
              <Button variant="outline" size="sm" type="button">
                Manage subscription
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" type="button">Subscribe to publish</Button>
                <Button variant="outline" size="sm" type="button">Billing portal</Button>
              </div>
            )}
          </div>

          <hr className="my-5 border-border" />

          <div>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={NewTwitterIcon} className="size-3.5 text-foreground" aria-hidden />
                <span className="text-sm font-semibold">X budget this month</span>
              </div>
              <span className="text-xs text-muted-foreground">
                ${(BUDGET_TOTAL - BUDGET_USED).toFixed(2)} remaining
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full border border-border bg-muted/50">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${BUDGET_PCT}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground/70">
              <span>${BUDGET_USED.toFixed(2)} used</span>
              <span>${BUDGET_TOTAL.toFixed(2)} / month</span>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border bg-muted/30 px-3.5 py-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Includes unlimited seats, unlimited publishes to every other platform, and{' '}
              <strong className="font-medium text-foreground">
                a ${BUDGET_TOTAL.toFixed(2)} monthly X/Twitter publishing budget
              </strong>
              . X API costs are passed through at cost.
            </p>
          </div>
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={() => setActive((v) => !v)}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Preview: toggle subscription state (currently {active ? 'active' : 'inactive'})
      </button>
    </div>
  );
}
