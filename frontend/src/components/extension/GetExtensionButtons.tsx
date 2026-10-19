import { CircleHelp, Download } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { CHROME_WEB_STORE_URL, detectBrowserFamily } from '@/lib/extensionStore'

import { InstallExtensionDialog } from './InstallExtensionDialog'

/** "Get the extension" (straight to the store) + "How to install" (browser-specific steps). */
export function GetExtensionButtons({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [helpOpen, setHelpOpen] = useState(false)
  const unsupported = ['firefox', 'safari'].includes(detectBrowserFamily())

  return (
    <div className="flex flex-wrap items-center gap-2">
      {unsupported ? (
        <Button size={size} onClick={() => setHelpOpen(true)}>
          <Download /> Get the extension
        </Button>
      ) : (
        <Button size={size} asChild>
          <a href={CHROME_WEB_STORE_URL} target="_blank" rel="noopener noreferrer">
            <Download /> Get the extension
          </a>
        </Button>
      )}
      <Button size={size} variant="ghost" onClick={() => setHelpOpen(true)}>
        <CircleHelp /> How to install
      </Button>
      <InstallExtensionDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  )
}
