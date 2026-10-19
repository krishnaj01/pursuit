import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'
import { defineConfig } from 'wxt'

import { JOB_SITE_PATTERNS } from './lib/job-sites'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: ({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'WXT_')
    const pursuitOrigin = new URL(env.WXT_PURSUIT_URL ?? 'http://localhost:5173').origin
    return {
      name: 'Pursuit — Job application tracker',
      short_name: 'Pursuit',
      description: 'Log job applications to Pursuit straight from the job page, with follow-up reminders.',
      permissions: ['storage', 'activeTab', 'scripting'],
      // Only Pursuit itself at install; job sites are opt-in (auto-prompt setting).
      host_permissions: [`${pursuitOrigin}/*`],
      optional_host_permissions: JOB_SITE_PATTERNS,
      action: { default_title: 'Log this job to Pursuit' },
    }
  },
})
