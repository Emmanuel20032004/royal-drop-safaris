{/*Emmanuel wema*/}
import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { registerCustomer } from '../auth/adminAuth.js'

function UserRegister() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
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
      await registerCustomer({ name, phone, email, password })
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090725] px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-[#f6c55a]/25 bg-[#121036] p-8 shadow-2xl shadow-black/40">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#f6c55a]">Create account</p>
        <h1 className="mt-1 text-2xl font-bold">Register to request bookings</h1>
        <p className="mt-3 text-sm leading-6 text-[#d4c9ef]">An administrator must verify your account before you can submit package requests.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-[#d5e6ec]">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-[#f6c55a]/50 bg-[#0c0a2a] px-4 py-3 font-semibold text-[#f8fafc] placeholder:text-[#a196ca] outline-none transition focus:border-[#f6c55a] focus:ring-1 focus:ring-[#f6c55a]"
            />
          </label>

          <label className="block text-sm font-medium text-[#d5e6ec]">
            Phone number
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="e.g. +254 700 000 000"
              required
              className="mt-2 w-full rounded-lg border border-[#f6c55a]/50 bg-[#0c0a2a] px-4 py-3 font-semibold text-[#f8fafc] placeholder:text-[#a196ca] outline-none transition focus:border-[#f6c55a] focus:ring-1 focus:ring-[#f6c55a]"
            />
            <span className="mt-2 block text-xs text-[#a196ca]">
              This number helps our admin team confirm bookings by call or WhatsApp.
            </span>
          </label>

          <label className="block text-sm font-medium text-[#d5e6ec]">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
                autoComplete="new-password"
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
            <UserPlus size={18} />
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#a196ca]">
          Already have an account? <Link to="/login" className="font-semibold text-[#f6c55a] hover:text-white">Sign in</Link>
        </p>
      </section>
    </main>
  )
}

export default UserRegister
