import { CheckCircle2, LoaderCircle, PlugZap, Puzzle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { useCreateExtensionToken, useRevokeExtensionToken } from '@/api/extension'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { errorMessage } from '@/lib/api'
import { describeBrowser } from '@/lib/browser'
import { detectExtension, sendTokenToExtension } from '@/lib/extensionBridge'

type Status = 'checking' | 'missing' | 'ready' | 'connecting' | 'connected' | 'failed'

export function ExtensionConnectPage() {
  const [status, setStatus] = useState<Status>('checking')
  const [error, setError] = useState<string>()
  const createToken = useCreateExtensionToken()
  const revokeToken = useRevokeExtensionToken()

  const detect = () => detectExtension().then((version) => setStatus(version ? 'ready' : 'missing'))
  const check = () => {
    setStatus('checking')
    void detect()
  }
  // Initial state is already 'checking'; just start detection on mount.
  useEffect(() => {
    void detect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connect = async () => {
    setStatus('connecting')
    setError(undefined)
    try {
      const created = await createToken.mutateAsync(describeBrowser())
      if (await sendTokenToExtension(created.token)) {
        setStatus('connected')
      } else {
        // The extension didn't confirm — don't leave an unused token behind.
        revokeToken.mutate(created.id)
        setError("The extension didn't respond. Make sure it's enabled, reload this page and try again.")
        setStatus('failed')
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not connect the extension'))
      setStatus('failed')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Browser extension"
        title="Connect the Pursuit extension"
        description="Log applications straight from job pages. Connecting lets the extension save to your account."
      />
      <Card className="max-w-xl">
        <CardContent className="flex flex-col items-start gap-5">
          {status === 'checking' && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <LoaderCircle className="size-4 animate-spin" /> Looking for the extension…
            </p>
          )}

          {status === 'missing' && (
            <>
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Puzzle className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Extension not found in this browser</p>
                  <p className="text-sm text-muted">Install the Pursuit extension, then come back to this page.</p>
                </div>
              </div>
              <Button variant="secondary" onClick={check}>
                I've installed it — check again
              </Button>
            </>
          )}

          {(status === 'ready' || status === 'connecting' || status === 'failed') && (
            <>
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent">
                  <PlugZap className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Extension found</p>
                  <p className="text-sm text-muted">
                    It will be able to log and look up applications in your account — nothing else. You can disconnect it
                    anytime from your profile.
                  </p>
                </div>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button onClick={connect} loading={status === 'connecting'}>
                Connect extension
              </Button>
            </>
          )}

          {status === 'connected' && (
            <>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-8 text-success" />
                <div>
                  <p className="font-medium">Connected</p>
                  <p className="text-sm text-muted">
                    You're all set — open a job posting and click the Pursuit icon to log it. You can close this tab.
                  </p>
                </div>
              </div>
              <Button variant="secondary" asChild>
                <Link to="/profile">Manage connected extensions</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
