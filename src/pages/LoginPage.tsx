import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/cn'

export function LoginPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setErr(data.error ?? 'No se pudo iniciar sesión')
        return
      }
      nav('/', { replace: true })
    } catch {
      setErr('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[var(--studio-bg,#090b0f)] px-4 py-12 text-zinc-100">
      <div className="studio-chrome w-full max-w-md rounded-xl p-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Bowtie Studio</h1>
        <p className="mt-1 text-sm text-zinc-500">Inicie sesión para acceder a su trabajo guardado.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="text-xs font-medium text-zinc-400" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-slate-500"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400" htmlFor="login-pass">
              Contraseña
            </label>
            <input
              id="login-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-slate-500"
              required
            />
          </div>
          {err && <p className="text-sm text-rose-400">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full rounded-md border border-zinc-500 bg-zinc-800 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-700',
              loading && 'opacity-60',
            )}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
