'use client'

import { useState } from 'react'
import axios from 'axios'

export default function Page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const res = await axios.post('http://localhost:3000/auth/login', {
        email,
        password,
      })

      localStorage.setItem('token', res.data.access_token)
      alert('Login success!')
    } catch (err) {
      alert('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-svh flex items-center justify-center bg-gray-800 p-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-2 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground"
              aria-hidden="true"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground text-balance">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enter your credentials to sign in
          </p>
        </header>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleLogin()
          }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-[var(--radius)] border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background transition-shadow"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-[var(--radius)] border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background transition-shadow"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-[var(--radius)] bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3" role="separator">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground select-none">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground leading-relaxed">
          {"Don't have an account? "}
          <button className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors">
            Create one
          </button>
        </p>
      </div>
    </main>
  )
}
