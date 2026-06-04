/** Login page for token-based authentication flow. */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isLoginBypassEnabled } from '@/lib/config/auth'
import { loginRequestSchema, type LoginRequest } from '@/lib/schemas/auth/login'
import { loginUser } from '@/lib/services/auth'

export default function LoginPage() {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const bypassLogin = isLoginBypassEnabled()

  useEffect(() => {
    if (bypassLogin) {
      router.replace('/account')
    }
  }, [bypassLogin, router])

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const isSubmitting = form.formState.isSubmitting

  async function handleSubmit(values: LoginRequest) {
    setErrorMessage(null)

    try {
      await loginUser(values)
      router.push('/account')
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Login failed. Please try again.'
      setErrorMessage(message)
    }
  }

  if (bypassLogin) {
    return null
  }

  return (
    <>
      <CustomerNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-secondary/30 py-16">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
              <CardDescription>
                Enter your credentials to access your Discovery Town account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...form.register('password')}
                  />
                  {form.formState.errors.password ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>

                {errorMessage ? (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to sign in</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <p className="mt-4 text-sm text-muted-foreground">
                No account yet?{' '}
                <Link href="/account/register" className="font-medium text-accent hover:underline">
                  Register
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
