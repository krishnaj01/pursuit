import { Check, ChevronDown } from 'lucide-react'
import { Select } from 'radix-ui'
import { type CSSProperties, useState } from 'react'
import { toast } from 'sonner'

import { useUpdateStage } from '@/api/applications'
import { StagePill } from '@/components/ui/StagePill'
import { errorMessage } from '@/lib/api'
import { STAGE_ORDER, STAGES, UNDATED_STAGES } from '@/lib/constants'
import type { Application, Stage } from '@/types'

import { StageDateDialog } from './StageDateDialog'

export function StageSelect({ application }: { application: Application }) {
  const updateStage = useUpdateStage()
  const [pendingStage, setPendingStage] = useState<Stage | null>(null)

  const commit = (stage: Stage, extra: { event_date?: string; custom_stage_label?: string } = {}) =>
    updateStage.mutateAsync({ id: application.id, stage, ...extra }).then(
      (updated) => {
        toast.success(`${updated.company_name} moved to ${STAGES[stage].label.replace('…', '')}`)
        setPendingStage(null)
      },
      (error) => toast.error(errorMessage(error, 'Could not update the stage')),
    )

  const onValueChange = (value: string) => {
    const stage = value as Stage
    if (UNDATED_STAGES.has(stage)) void commit(stage)
    else setPendingStage(stage)
  }

  return (
    <>
      <Select.Root value={application.stage === 'custom' ? '' : application.stage} onValueChange={onValueChange}>
        <Select.Trigger
          className="group inline-flex items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Stage for ${application.company_name}`}
        >
          <StagePill stage={application.stage} customLabel={application.custom_stage_label} />
          <ChevronDown className="size-3.5 text-subtle transition-transform group-data-[state=open]:rotate-180" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={6}
            className="z-50 min-w-48 overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-lg data-[state=open]:animate-pop-in"
          >
            <Select.Viewport>
              {STAGE_ORDER.map((stage) => (
                <Select.Item
                  key={stage}
                  value={stage}
                  style={{ '--stage': STAGES[stage].color } as CSSProperties}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[highlighted]:bg-surface-sunken"
                >
                  <span className="stage-dot size-2 rounded-full" />
                  <Select.ItemText>{STAGES[stage].label}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto">
                    <Check className="size-3.5 text-accent" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {pendingStage && (
        <StageDateDialog
          stage={pendingStage}
          companyName={application.company_name}
          pending={updateStage.isPending}
          onCancel={() => setPendingStage(null)}
          onConfirm={(values) => commit(pendingStage, values)}
        />
      )}
    </>
  )
}
