import { ExternalLink, Puzzle } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { type BrowserFamily, CHROME_WEB_STORE_URL, detectBrowserFamily } from '@/lib/extensionStore'

const storeLink = (label: string) => (
  <a href={CHROME_WEB_STORE_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline underline-offset-4">
    {label}
  </a>
)

const CONNECT_STEP = (
  <>
    Pursuit opens its <b>Connect</b> page. Click <b>Connect extension</b> (sign in first if asked).
  </>
)
const PIN_STEP = (
  <>
    Click the <Puzzle className="inline size-3.5 align-[-2px]" /> extensions icon in the toolbar and <b>pin</b> Pursuit so
    it's one click away.
  </>
)

type Guide = { label: string; supported: boolean; steps: ReactNode[] }

const GUIDES: Record<Exclude<BrowserFamily, 'other'>, Guide> = {
  chrome: {
    label: 'Chrome / Arc',
    supported: true,
    steps: [<>Open the {storeLink('Chrome Web Store listing')}.</>, <>Click <b>Add to Chrome</b>, then <b>Add extension</b>.</>, PIN_STEP, CONNECT_STEP],
  },
  brave: {
    label: 'Brave',
    supported: true,
    steps: [<>Open the {storeLink('Chrome Web Store listing')}.</>, <>Click <b>Add to Brave</b>, then <b>Add extension</b>.</>, PIN_STEP, CONNECT_STEP],
  },
  edge: {
    label: 'Edge',
    supported: true,
    steps: [
      <>Open the {storeLink('Chrome Web Store listing')}.</>,
      <>In the banner Edge shows, click <b>Allow extensions from other stores</b>, then <b>Allow</b>.</>,
      <>Click <b>Get</b>, then <b>Add extension</b>.</>,
      PIN_STEP,
      CONNECT_STEP,
    ],
  },
  opera: {
    label: 'Opera',
    supported: true,
    steps: [
      <>Install Opera's <b>Install Chrome Extensions</b> add-on from the Opera add-ons store.</>,
      <>Open the {storeLink('Chrome Web Store listing')} and click <b>Add to Opera</b>.</>,
      CONNECT_STEP,
    ],
  },
  firefox: {
    label: 'Firefox',
    supported: false,
    steps: [<>The extension isn't available for Firefox yet. Use Chrome, Edge, Brave or Arc to log applications from job pages. Everything else in Pursuit works in any browser.</>],
  },
  safari: {
    label: 'Safari',
    supported: false,
    steps: [<>The extension isn't available for Safari yet. Use Chrome, Edge, Brave or Arc to log applications from job pages. Everything else in Pursuit works in any browser.</>],
  },
}

const ORDER: (keyof typeof GUIDES)[] = ['chrome', 'edge', 'brave', 'opera', 'firefox', 'safari']

interface InstallExtensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Step-by-step install guide, opened on the visitor's own browser. */
export function InstallExtensionDialog({ open, onOpenChange }: InstallExtensionDialogProps) {
  const detected = detectBrowserFamily()
  const [browser, setBrowser] = useState<keyof typeof GUIDES>(detected === 'other' ? 'chrome' : detected)
  const guide = GUIDES[browser]

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Install the Pursuit extension"
      description="Free, and it only asks for access to Pursuit itself at install."
      className="max-w-lg"
    >
      <Tabs.Root value={browser} onValueChange={(value) => setBrowser(value as keyof typeof GUIDES)}>
        <Tabs.List className="mb-5 flex flex-wrap gap-1 rounded-lg bg-surface-sunken p-1" aria-label="Browser">
          {ORDER.map((key) => (
            <Tabs.Trigger
              key={key}
              value={key}
              className="rounded-md px-2.5 py-1 text-[13px] font-medium text-muted transition-colors hover:text-fg data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-sm"
            >
              {GUIDES[key].label}
              {key === detected && <span className="ml-1 text-[10px] text-accent">• yours</span>}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {ORDER.map((key) => (
          <Tabs.Content key={key} value={key} className="focus:outline-none">
            <ol className="flex flex-col gap-3">
              {GUIDES[key].steps.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm leading-relaxed text-fg">
                  {GUIDES[key].supported && (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">
                      {index + 1}
                    </span>
                  )}
                  <span className={GUIDES[key].supported ? '' : 'text-muted'}>{step}</span>
                </li>
              ))}
            </ol>
          </Tabs.Content>
        ))}
      </Tabs.Root>
      {guide.supported && (
        <div className="mt-6 flex justify-end">
          <Button asChild>
            <a href={CHROME_WEB_STORE_URL} target="_blank" rel="noopener noreferrer">
              Open the Chrome Web Store <ExternalLink />
            </a>
          </Button>
        </div>
      )}
    </Dialog>
  )
}
