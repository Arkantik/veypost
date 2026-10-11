import {
  BarChartIcon,
  BubbleChatIcon,
  Building03Icon,
  Calendar01Icon,
  ChartUpIcon,
  Clock01Icon,
  FileEditIcon,
  Home01Icon,
  Menu01Icon,
  MessageMultiple01Icon,
  Moon02Icon,
  Notification01Icon,
  RepeatIcon,
  Search01Icon,
  Settings01Icon,
  Sun03Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { useRouterState } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { useTheme } from '~/hooks/use-theme';
import { cn } from '~/lib/utils';

interface TopBarProps {
  onMobileOpen: () => void;
  scrolled?: boolean;
}

type RouteMeta = {
  label: string;
  icon: IconSvgElement;
  parent?: string;
};

const ROUTE_META: Record<string, RouteMeta> = {
  '/dashboard': { label: 'Dashboard', icon: Home01Icon },
  '/content/posts': { label: 'Posts', icon: FileEditIcon, parent: 'Content' },
  '/content/calendar': { label: 'Calendar', icon: Calendar01Icon, parent: 'Content' },
  '/content/queue': { label: 'Queue', icon: Clock01Icon, parent: 'Content' },
  '/inbox/engagement': { label: 'Engagement', icon: MessageMultiple01Icon, parent: 'Inbox' },
  '/inbox/messages': { label: 'Messages', icon: BubbleChatIcon, parent: 'Inbox' },
  '/accounts': { label: 'Accounts', icon: UserMultiple02Icon },
  '/analytics': { label: 'Analytics', icon: BarChartIcon },
  '/sync': { label: 'Sync', icon: RepeatIcon },
  '/profile/settings': { label: 'Settings', icon: Settings01Icon, parent: 'Profile' },
};

const WORKSPACE_MGMT_LABELS: Record<string, string> = {
  overview: 'Overview',
  members: 'Members',
  'api-keys': 'API keys',
  subscription: 'Subscription',
};

const WORKSPACE_FEATURE_META: Record<
  string,
  { label: string; icon: IconSvgElement; parent?: string }
> = {
  dashboard: { label: 'Dashboard', icon: Home01Icon },
  accounts: { label: 'Accounts', icon: UserMultiple02Icon },
  analytics: { label: 'Analytics', icon: BarChartIcon },
  'analytics/growth': { label: 'Follower growth', icon: ChartUpIcon, parent: 'Analytics' },
  'content/posts': { label: 'Posts', icon: FileEditIcon, parent: 'Content' },
  'content/calendar': { label: 'Calendar', icon: Calendar01Icon, parent: 'Content' },
  'content/queue': { label: 'Queue', icon: Clock01Icon, parent: 'Content' },
  'inbox/engagement': { label: 'Engagement', icon: MessageMultiple01Icon, parent: 'Inbox' },
  'inbox/messages': { label: 'Messages', icon: BubbleChatIcon, parent: 'Inbox' },
  sync: { label: 'Sync', icon: RepeatIcon },
};

export function TopBar({ onMobileOpen, scrolled }: TopBarProps) {
  const { location } = useRouterState();
  const pathname = location.pathname;
  const { theme, toggle } = useTheme();

  const workspaceMatch = pathname.match(/^\/workspace\/([^/]+)\/(.+)$/);
  let meta: RouteMeta | undefined;
  if (workspaceMatch) {
    const sub = workspaceMatch[2];
    if (WORKSPACE_MGMT_LABELS[sub]) {
      meta = { label: WORKSPACE_MGMT_LABELS[sub], icon: Building03Icon, parent: 'Workspace' };
    } else if (WORKSPACE_FEATURE_META[sub]) {
      const fm = WORKSPACE_FEATURE_META[sub];
      meta = { label: fm.label, icon: fm.icon, parent: fm.parent };
    }
  } else {
    meta = ROUTE_META[pathname];
  }
  const isDark = theme === 'dark';

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-border bg-background px-4',
        'regular:border-b-0 regular:backdrop-blur-md regular:px-6 regular:transition-colors regular:duration-300',
        scrolled ? 'regular:bg-background/60' : 'regular:bg-transparent',
      )}
    >
      <button
        type="button"
        onClick={onMobileOpen}
        aria-label="Open navigation"
        className={cn(
          'group mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground',
          'transition-colors hover:bg-muted hover:text-foreground regular:hidden',
        )}
      >
        <span className="flex transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-6">
          <HugeiconsIcon icon={Menu01Icon} className="size-5" aria-hidden />
        </span>
      </button>

      <div className="flex-1 compact:hidden" aria-hidden />

      <nav
        className="hidden flex-1 items-center gap-1.5 text-sm compact:flex"
        aria-label="Breadcrumb"
      >
        {meta ? (
          <>
            <span className="flex shrink-0 items-center justify-center text-muted-foreground">
              <HugeiconsIcon icon={meta.icon} className="size-4" aria-hidden />
            </span>

            {meta.parent ? (
              <>
                <span className="whitespace-nowrap text-muted-foreground">{meta.parent}</span>
                <span className="select-none text-muted-foreground/40">/</span>
              </>
            ) : null}

            <span className="whitespace-nowrap font-medium text-foreground">{meta.label}</span>
          </>
        ) : (
          <span className="font-medium text-foreground">Veypost</span>
        )}
      </nav>
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="group h-8 w-8 text-muted-foreground hover:text-foreground compact:hidden"
                aria-label="Search"
              >
                <span className="flex transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-6">
                  <HugeiconsIcon icon={Search01Icon} className="size-4" aria-hidden />
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>

          <label className="group/search hidden h-8 w-44 cursor-text items-center gap-2 overflow-clip rounded-md border-[0.8px] border-border bg-card py-2 pl-2.5 pr-2 shadow-[0px_4px_14px_0px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-150 hover:border-muted-foreground/30 focus-within:border-muted-foreground/40 focus-within:shadow-[0_0_0_3px_rgba(156,163,175,0.12)] compact:flex regular:w-56">
            <HugeiconsIcon
              icon={Search01Icon}
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-none text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
              aria-label="Search"
            />
            <span
              className="flex shrink-0 items-center transition-opacity group-focus-within/search:opacity-0"
              aria-hidden
            >
              <span className="flex h-4 w-4 items-center justify-center rounded p-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                ⌘K
              </span>
            </span>
          </label>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="group h-8 w-8 text-muted-foreground hover:text-foreground regular:border-[0.8px] regular:border-border regular:bg-card regular:shadow-[0px_4px_14px_0px_rgba(0,0,0,0.04)] regular:hover:border-muted-foreground/30"
                aria-label="Notifications"
              >
                <span className="flex origin-top group-hover:animate-bell-ring">
                  <HugeiconsIcon icon={Notification01Icon} className="size-4" aria-hidden />
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="group h-8 w-8 text-muted-foreground hover:text-foreground regular:border-[0.8px] regular:border-border regular:bg-card regular:shadow-[0px_4px_14px_0px_rgba(0,0,0,0.04)] regular:hover:border-muted-foreground/30"
              >
                <span className="flex transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-6">
                  <HugeiconsIcon
                    icon={isDark ? Sun03Icon : Moon02Icon}
                    className="size-4"
                    aria-hidden
                  />
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDark ? 'Light mode' : 'Dark mode'}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </header>
  );
}
