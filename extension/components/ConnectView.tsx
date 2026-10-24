import { PlugZap } from 'lucide-react'

import { PURSUIT_URL } from '@/lib/config'

import { Button } from './ui'

export function ConnectView({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <div className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
        <PlugZap className="size-5" />
      </div>
      <div>
        <p className="font-display text-base font-semibold">Connect to Pursuit</p>
        <p className="mt-1 text-sm text-muted">
          {message ?? 'Link the extension to your account once, then log applications from any job page in one click.'}
        </p>
      </div>
      <Button onClick={() => void browser.tabs.create({ url: `${PURSUIT_URL}/extension/connect` })}>Connect</Button>
    </div>
  )
}
