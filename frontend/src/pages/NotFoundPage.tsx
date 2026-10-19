import { Compass } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="This page wandered off"
      description="The page you're looking for doesn't exist."
      action={
        <Button asChild>
          <Link to="/">Back to safety</Link>
        </Button>
      }
    />
  )
}
