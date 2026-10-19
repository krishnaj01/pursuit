import { Download, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useDeleteAccount, useExportCsv } from '@/api/account'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { errorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export function YourDataCard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const exportCsv = useExportCsv()
  const deleteAccount = useDeleteAccount()
  const [confirming, setConfirming] = useState(false)
  const [typedEmail, setTypedEmail] = useState('')
  const matches = !!user && typedEmail.trim().toLowerCase() === user.email.toLowerCase()

  const onExport = () =>
    exportCsv.mutate(undefined, {
      onSuccess: () => toast.success('Your applications were downloaded as CSV'),
      onError: (error) => toast.error(errorMessage(error, 'Could not export your data')),
    })

  const onDelete = () =>
    deleteAccount.mutate(typedEmail, {
      onSuccess: () => {
        toast.success('Your account and all its data were deleted')
        navigate('/login', { replace: true })
      },
      onError: (error) => toast.error(errorMessage(error, 'Could not delete your account')),
    })

  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-semibold">Your data</h3>
          <p className="text-sm text-muted">It's yours — take a copy or remove it whenever you like.</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Export applications</p>
            <p className="text-xs text-muted">Every application with its stage, reminders, notes and timeline, as a CSV file.</p>
          </div>
          <Button variant="secondary" onClick={onExport} loading={exportCsv.isPending} className="self-start sm:self-auto">
            <Download /> Download CSV
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-danger">Delete account</p>
            <p className="text-xs text-muted">Permanently removes your account, applications, timelines and reminders.</p>
          </div>
          <Button variant="danger" onClick={() => setConfirming(true)} className="self-start sm:self-auto">
            <Trash2 /> Delete account
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          setConfirming(open)
          if (!open) setTypedEmail('')
        }}
        title="Delete your account?"
        description="This can't be undone. Consider downloading a CSV first."
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (matches) onDelete()
          }}
        >
          <Field
            label="Type your email to confirm"
            htmlFor="confirm-email"
            hint={<span className="font-mono">{user?.email}</span>}
          >
            <Input
              id="confirm-email"
              type="email"
              autoComplete="off"
              autoFocus
              value={typedEmail}
              onChange={(e) => setTypedEmail(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Keep my account
            </Button>
            <Button type="submit" variant="danger" disabled={!matches} loading={deleteAccount.isPending}>
              Delete everything
            </Button>
          </div>
        </form>
      </Dialog>
    </Card>
  )
}
