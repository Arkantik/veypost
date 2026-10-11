import { HugeiconsIcon } from '@hugeicons/react';
import { HeartIcon, GithubIcon } from '@hugeicons/core-free-icons';
import { useTranslation } from 'react-i18next';
import { APP_GITHUB_SPONSORS_URL } from '@veypost/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';

export function SponsorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('sponsor.title')}</DialogTitle>
          <DialogDescription>{t('sponsor.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <a
            href={APP_GITHUB_SPONSORS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:bg-muted"
          >
            <HugeiconsIcon icon={GithubIcon} className="size-5 text-foreground" aria-hidden />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium leading-none">{t('sponsor.github')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('sponsor.githubDesc')}</p>
            </div>
            <span className="mt-auto text-xs font-medium text-primary">
              {t('sponsor.githubCta')}
            </span>
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:bg-muted"
          >
            <HugeiconsIcon icon={HeartIcon} className="size-5 text-rose-500" aria-hidden />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium leading-none">{t('sponsor.stripe')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('sponsor.stripeDesc')}</p>
            </div>
            <span className="mt-auto text-xs font-medium text-primary">
              {t('sponsor.stripeCta')}
            </span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
