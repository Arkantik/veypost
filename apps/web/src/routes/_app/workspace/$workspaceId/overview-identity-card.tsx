import { useState, useRef } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Field } from '~/components/ui/field';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select';
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription,
} from '~/components/ui/card';
import { toast } from '~/components/ui/toast';
import { useUploadWorkspaceAvatar, useRemoveWorkspaceAvatar } from '~/hooks/use-workspaces';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney',
];

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE_MB = 2;

interface Props {
  workspaceId: string;
  initialName: string;
  initialTimezone: string;
  initialAvatarUrl: string | null;
  onSave: (name: string, timezone: string) => void;
  isSaving: boolean;
}

export function IdentityCard({ workspaceId, initialName, initialTimezone, initialAvatarUrl, onSave, isSaving }: Props) {
  const uploadAvatar = useUploadWorkspaceAvatar(workspaceId);
  const removeAvatar = useRemoveWorkspaceAvatar(workspaceId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);

  const [form, setForm] = useState({ name: initialName, timezone: initialTimezone });
  const [preview, setPreview] = useState<string | null>(null);

  const displayAvatar = preview ?? initialAvatarUrl;
  const hasAvatar = !!(preview ?? initialAvatarUrl);
  const isDirty = form.name !== initialName || form.timezone !== initialTimezone || pendingFile.current !== null;

  function patch(fields: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...fields }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) { toast.error('Only PNG, JPG, and WebP files are accepted.'); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { toast.error(`File must be under ${MAX_SIZE_MB} MB.`); return; }
    pendingFile.current = file;
    setPreview(URL.createObjectURL(file));
    e.target.value = '';
  }

  async function handleSave() {
    if (pendingFile.current) {
      await uploadAvatar.mutateAsync(pendingFile.current);
      pendingFile.current = null;
    }
    onSave(form.name, form.timezone);
  }

  async function handleRemove() {
    await removeAvatar.mutateAsync();
    pendingFile.current = null;
    setPreview(null);
  }

  function handleReset() {
    pendingFile.current = null;
    setPreview(null);
    setForm({ name: initialName, timezone: initialTimezone });
  }

  const isBusy = isSaving || uploadAvatar.isPending || removeAvatar.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity</CardTitle>
        <CardDescription>How this workspace appears across Veypost and in shared links.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4 border-b border-border pb-5">
          <div className="size-17 shrink-0">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Workspace avatar" className="size-17 rounded-lg object-cover" />
            ) : (
              <div className="flex size-17 items-center justify-center rounded-lg bg-primary text-2xl font-bold text-primary-foreground">
                {form.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()}>Upload photo</Button>
              {hasAvatar && (
                <Button variant="ghost" size="sm" type="button" className="text-muted-foreground"
                  disabled={removeAvatar.isPending} onClick={() => void handleRemove()}>
                  Remove
                </Button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">PNG, JPG or WebP Â· {MAX_SIZE_MB} MB max</span>
          </div>
        </div>
        <Field label="Workspace name" hint="Visible to all members.">
          {(props) => (
            <Input {...props} type="text" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
          )}
        </Field>
        <Field label="Default timezone" hint="Default timezone for post scheduling.">
          {({ id }) => (
            <Select value={form.timezone} onValueChange={(timezone) => patch({ timezone })}>
              <SelectTrigger id={id}><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </Field>
      </CardContent>
      <CardFooter className="gap-2 border-t border-border px-6 py-4">
        <Button type="button" disabled={!isDirty || isBusy} onClick={() => void handleSave()}>
          {isBusy ? 'Saving…' : 'Save changes'}
        </Button>
        <Button variant="ghost" type="button" onClick={handleReset}>Reset</Button>
      </CardFooter>
    </Card>
  );
}
