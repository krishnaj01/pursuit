import { Ellipsis, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useDeleteApplication } from '@/api/applications'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/Menu'
import { errorMessage } from '@/lib/api'
import type { Application } from '@/types'

import { EditApplicationDialog } from './EditApplicationDialog'

export function RowActions({ application }: { application: Application }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const remove = useDeleteApplication()

  const onDelete = () =>
    remove.mutateAsync(application.id).then(
      () => {
        toast.success(`${application.company_name} removed`)
        setConfirming(false)
      },
      (error) => toast.error(errorMessage(error, 'Could not delete')),
    )

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`More actions for ${application.company_name}`}>
            <Ellipsis />
          </Button>
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Edit & timeline
          </MenuItem>
          <MenuItem onSelect={() => setConfirming(true)} className="text-danger [&_svg]:text-danger">
            <Trash2 /> Delete
          </MenuItem>
        </MenuContent>
      </Menu>

      {editing && <EditApplicationDialog application={application} open={editing} onOpenChange={setEditing} />}

      <Dialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete application?"
        description={`${application.company_name} · ${application.role} and its timeline will be removed for good.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Keep it
          </Button>
          <Button variant="danger" onClick={onDelete} loading={remove.isPending}>
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  )
}
