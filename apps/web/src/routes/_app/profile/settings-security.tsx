import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Field } from '~/components/ui/field';
import { PasswordInput } from '~/components/ui/password-input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '~/components/ui/dialog';
import { passwordSchema } from '@veypost/shared';
import { useChangePassword } from '~/hooks/use-profile';
import { isApiError } from '~/lib/api-client';

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

const EMPTY: PasswordForm = { current: '', next: '', confirm: '' };

export function SecurityPanel() {
  const changePassword = useChangePassword();
  const [form, setForm] = useState<PasswordForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({});
  const [tfaOpen, setTfaOpen] = useState(false);

  function patch(fields: Partial<PasswordForm>) {
    setForm((prev) => ({ ...prev, ...fields }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(fields) as (keyof PasswordForm)[]) delete next[k];
      return next;
    });
  }

  async function handleSubmit() {
    const errs: typeof errors = {};
    const parsed = passwordSchema.safeParse(form.next);
    if (!parsed.success) errs.next = parsed.error.issues[0]?.message ?? 'Password does not meet requirements.';
    if (form.next !== form.confirm) errs.confirm = 'Passwords do not match.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      await changePassword.mutateAsync({ currentPassword: form.current, newPassword: form.next });
      setForm(EMPTY);
    } catch (e) {
      if (isApiError(e) && e.code === 'VALIDATION_ERROR') {
        setErrors({ next: e.message });
      } else {
        setErrors({ current: 'Current password may be incorrect.' });
      }
    }
  }

  const canSubmit = form.current.length > 0 && form.next.length > 0 && form.confirm.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Use a strong password you don't use elsewhere.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Current password" error={errors.current}>
            {(props) => (
              <PasswordInput {...props} value={form.current} onChange={(e) => patch({ current: e.target.value })} autoComplete="current-password" />
            )}
          </Field>
          <Field label="New password" error={errors.next}>
            {(props) => (
              <PasswordInput {...props} value={form.next} onChange={(e) => patch({ next: e.target.value })} autoComplete="new-password" />
            )}
          </Field>
          <Field label="Confirm new password" error={errors.confirm}>
            {(props) => (
              <PasswordInput {...props} value={form.confirm} onChange={(e) => patch({ confirm: e.target.value })} autoComplete="new-password" />
            )}
          </Field>
        </CardContent>
        <CardFooter className="border-t border-border px-6 py-4">
          <Button type="button" disabled={!canSubmit || changePassword.isPending} onClick={() => void handleSubmit()}>
            {changePassword.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>Add a second layer of protection to your account.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-muted-foreground/40 shrink-0" aria-hidden />
            <p className="text-sm text-muted-foreground">Not enabled. Your account is protected by password only.</p>
          </div>
          <Button variant="outline" size="sm" type="button" className="shrink-0" onClick={() => setTfaOpen(true)}>
            Enable 2FA
          </Button>
        </CardContent>
      </Card>

      <Dialog open={tfaOpen} onOpenChange={setTfaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Two-factor authentication</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            2FA is not yet available. When it ships, you will be able to use an authenticator app to secure your account.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
