import { formatDistanceToNow, parseISO } from 'date-fns'
import { Puzzle, Unplug } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { useExtensionTokens, useRevokeExtensionToken } from '@/api/extension'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { errorMessage } from '@/lib/api'
import { formatDate } from '@/lib/utils'

import { GetExtensionButtons } from './GetExtensionButtons'

export function ExtensionCard() {
  const { data: tokens, isLoading } = useExtensionTokens()
  const revoke = useRevokeExtensionToken()

  const disconnect = (id: string, name: string) =>
    revoke.mutate(id, {
      onSuccess: () => toast.success(`${name} disconnected`),
      onError: (error) => toast.error(errorMessage(error, 'Could not disconnect')),
    })

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Browser extension</h3>
            <p className="text-sm text-muted">Log applications straight from job pages.</p>
          </div>
          <Button variant="secondary" asChild>
            <Link to="/extension/connect">
              <Puzzle /> Connect extension
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3">
          <p className="text-sm text-muted">
            Don't have it yet? Works in Chrome, Edge, Brave and Arc.
          </p>
          <GetExtensionButtons size="sm" />
        </div>

        {isLoading ? (
          <Skeleton className="h-14 w-full" />
        ) : !tokens?.length ? (
          <p className="rounded-lg border border-dashed border-border-strong px-4 py-5 text-center text-sm text-muted">
            No extensions connected yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {tokens.map((token) => (
              <li key={token.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{token.name}</p>
                  <p className="font-mono text-[11px] text-subtle">
                    {token.prefix}… · connected {formatDate(token.created_at, 'd MMM yyyy')} ·{' '}
                    {token.last_used_at
                      ? `last used ${formatDistanceToNow(parseISO(token.last_used_at), { addSuffix: true })}`
                      : 'not used yet'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-danger"
                  onClick={() => disconnect(token.id, token.name)}
                  loading={revoke.isPending && revoke.variables === token.id}
                >
                  <Unplug /> Disconnect
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
