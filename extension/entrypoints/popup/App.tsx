import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { ConnectView } from '@/components/ConnectView'
import { LogForm } from '@/components/LogForm'
import { Settings } from '@/components/Settings'
import { Button, Header } from '@/components/ui'
import { useActiveTabJob } from '@/hooks/useActiveTabJob'
import { NotConnectedError } from '@/lib/api'
import { PURSUIT_URL } from '@/lib/config'
import { tokenItem } from '@/lib/storage'
import type { Application } from '@/lib/types'

type View = { name: 'loading' } | { name: 'connect'; message?: string } | { name: 'form' } | { name: 'saved'; application: Application }

export default function App() {
  const [view, setView] = useState<View>({ name: 'loading' })
  const details = useActiveTabJob()

  useEffect(() => {
    void tokenItem.getValue().then((token) => setView(token ? { name: 'form' } : { name: 'connect' }))
  }, [])

  const handleError = useCallback((error: unknown) => {
    if (error instanceof NotConnectedError) setView({ name: 'connect', message: error.message })
  }, [])

  return (
    <div className="flex min-h-[200px] flex-col">
      <Header />
      {view.name === 'loading' && (
        <div className="grid flex-1 place-items-center py-10 text-muted">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      )}
      {view.name === 'connect' && <ConnectView message={view.message} />}
      {view.name === 'form' &&
        (details ? (
          <LogForm details={details} onSaved={(application) => setView({ name: 'saved', application })} onError={handleError} />
        ) : (
          <div className="grid place-items-center py-10 text-muted">
            <LoaderCircle className="size-5 animate-spin" />
          </div>
        ))}
      {view.name === 'saved' && (
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <CheckCircle2 className="size-9 text-success" />
          <div>
            <p className="font-display text-base font-semibold">Logged to Pursuit</p>
            <p className="mt-1 text-sm text-muted">
              {view.application.company_name} · {view.application.role}
            </p>
          </div>
          <Button onClick={() => void browser.tabs.create({ url: `${PURSUIT_URL}/pipeline` })}>Open pipeline</Button>
        </div>
      )}
      {(view.name === 'form' || view.name === 'saved') && <Settings onDisconnect={() => setView({ name: 'connect' })} />}
    </div>
  )
}
