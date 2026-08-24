{/*Emmanuel wema*/}
import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { adminSessionKey, loginWithApi, setSession } from '../auth/adminAuth.js'

function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await loginWithApi({ email, password, requiredRole: 'Admin' })
      setSession(adminSessionKey, user)
      const destination = location.state?.from || '/admin'
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090725] px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-[#f6c55a]/25 bg-[#121036] p-8 shadow-2xl shadow-black/40">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f6c55a] text-[#1a1644]">
            <ShieldCheck size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#f6c55a]">Restricted area</p>
            <h1 className="mt-1 text-2xl font-bold">Administrator login</h1>
          </div>
        </div>

        <p className="mb-7 text-sm leading-6 text-[#d4c9ef]">Sign in to manage safari and hotel packages, pricing, and availability.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-[#d5e6ec]">
            Administrator email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@royaldropsafaris.test"
              autoComplete="username"
              required
              className="mt-2 w-full rounded-lg border border-[#f6c55a]/50 bg-[#0c0a2a] px-4 py-3 font-semibold text-[#f8fafc] placeholder:text-[#a196ca] outline-none transition focus:border-[#f6c55a] focus:ring-1 focus:ring-[#f6c55a]"
            />
          </label>

          <label className="block text-sm font-medium text-[#d5e6ec]">
            Password
            <span className="relative mt-2 block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a196ca]" size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-[#f6c55a]/50 bg-[#0c0a2a] py-3 pl-10 pr-12 font-semibold text-[#f8fafc] placeholder:text-[#a196ca] outline-none transition focus:border-[#f6c55a] focus:ring-1 focus:ring-[#f6c55a]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f6c55a] transition hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}

          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f6c55a] px-4 py-3 font-bold text-[#1a1644] transition hover:bg-[#ffe18f] disabled:opacity-60">
            <LogIn size={18} />
            {submitting ? 'Signing in...' : 'Sign in to admin'}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-[#f6c55a]/30 bg-[#1a1644] p-4 text-sm text-[#d5e6ec]">
          <p className="font-bold text-[#f6c55a]">Administrator access</p>
          <p className="mt-2">Use the admin email saved in the system.</p>
          <p className="mt-1">Current admins: <strong className="text-white">Emmanuel Wema</strong> and <strong className="text-white">Maureen Mureithi</strong>.</p>
          <p className="mt-1">Password: <strong className="text-white">safaris@2026</strong></p>
        </div>

        <p className="mt-6 text-center text-xs text-[#a196ca]">Visitors can browse packages without logging in.</p>
      </section>
    </main>
  )
}

export default AdminLogin