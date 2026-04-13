import { ReactFlowProvider } from '@xyflow/react'
import { FlowWorkspace } from '../components/FlowWorkspace'
import { useParams } from 'react-router-dom'

export function DemoPage() {
  const { token } = useParams<{ token: string }>()
  const t = token ?? ''

  return (
    <div className="flex min-h-full flex-col bg-[var(--studio-bg,#090b0f)] text-zinc-100">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-6">
        <h1 className="text-sm font-semibold text-zinc-200">Bowtie Studio · Demo</h1>
      </header>
      <main className="flex-1">
        <ReactFlowProvider>
          <FlowWorkspace
            user={null}
            onToast={() => {}}
            savedAt={null}
            setSavedAt={() => {}}
            shortcutsOpen={false}
            setShortcutsOpen={() => {}}
            demoToken={t}
            readOnly
          />
        </ReactFlowProvider>
      </main>
    </div>
  )
}
