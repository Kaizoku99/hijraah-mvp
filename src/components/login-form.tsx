import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { useLanguage } from "@/contexts/LanguageContext"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link" // Ensure Link is imported if used, otherwise just standard imports
import Image from "next/image"
import { z } from "zod"

interface LoginFormProps extends React.ComponentProps<"div"> {
  defaultView?: "login" | "signup"
}

export function LoginForm({
  className,
  defaultView = "login",
  ...props
}: LoginFormProps) {
  const { signInWithGoogle, signInWithEmail, signInWithMagicLink, signUpWithEmail, isAuthenticated, loading } = useAuth()
  const { language } = useLanguage()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultView) // consolidated state
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Translation object directly mapped for simplicity and consolidation
  const t = {
    title: language === "ar" ? (activeTab === "login" ? "مرحباً بك في هجرة" : "إنشاء حساب") : (activeTab === "login" ? "Welcome back" : "Create an account"),
    subtitle: language === "ar"
      ? (activeTab === "login" ? "تسجيل الدخول إلى حسابك" : "أدخل بياناتك لإنشاء حساب جديد")
      : (activeTab === "login" ? "Login to your Hijraah account" : "Enter your details below to create your account"),
    email: language === "ar" ? "البريد الإلكتروني" : "Email",
    password: language === "ar" ? "كلمة المرور" : "Password",
    confirmPassword: language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    name: language === "ar" ? "الاسم" : "Name",
    submit: language === "ar" ? (activeTab === "login" ? "تسجيل الدخول" : "إنشاء حساب") : (activeTab === "login" ? "Login" : "Sign Up"),
    orContinue: language === "ar" ? "أو المتابعة مع" : "Or continue with",
    google: language === "ar" ? "المتابعة مع Google" : "Continue with Google",
    apple: language === "ar" ? "المتابعة مع Apple" : "Continue with Apple",
    toggleSignUp: language === "ar" ? "ليس لديك حساب؟" : "Don't have an account?",
    toggleLogin: language === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?",
    signUpLink: language === "ar" ? "إنشاء حساب" : "Sign up",
    loginLink: language === "ar" ? "تسجيل الدخول" : "Login",
    magicLink: language === "ar" ? "رابط سحري" : "Magic Link",
    passwordMismatch: language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords don't match",
    magicLinkSent: language === "ar" ? "تم إرسال الرابط السحري" : "Magic link sent",
    bannerTitle: language === "ar" ? "ابدأ رحلتك إلى كندا" : "Start your journey to Canada",
    bannerSubtitle: language === "ar" ? "انضم إلى آلاف الآخرين الذين يحققون أحلامهم مع هجرة." : "Join thousands of others realizing their dream with Hijraah.",
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation Schemas with Localization
    const validationMsgs = {
      email: language === "ar" ? "بريد إلكتروني غير صالح" : "Invalid email address",
      passwordMin: language === "ar" ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters",
      nameMin: language === "ar" ? "الاسم يجب أن يكون حرفين على الأقل" : "Name must be at least 2 characters",
      passwordMatch: language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords don't match",
    }

    const loginSchema = z.object({
      email: z.string().email(validationMsgs.email),
      password: z.string().min(6, validationMsgs.passwordMin),
    })

    const signupSchema = z.object({
      name: z.string().min(2, validationMsgs.nameMin),
      email: z.string().email(validationMsgs.email),
      password: z.string().min(6, validationMsgs.passwordMin),
      confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
      message: validationMsgs.passwordMatch,
      path: ["confirmPassword"],
    })

    const magicLinkSchema = z.object({
      email: z.string().email(validationMsgs.email),
    })

    // Perform Validation
    let result
    const formData = { email, password, confirmPassword, name: userName }

    if (activeTab === "signup") {
      result = signupSchema.safeParse(formData)
    } else if (useMagicLink) {
      result = magicLinkSchema.safeParse({ email })
    } else {
      result = loginSchema.safeParse({ email, password })
    }

    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setIsLoading(true)

    try {
      if (activeTab === "signup") {
        await signUpWithEmail(email, password, userName)
        // Auto-login or redirect typically handled by auth provider/listener, but we can nudge router
        // For significant UX improvement, typically we'd show a success message or separate verifying step
        router.push("/dashboard")
      } else if (useMagicLink) {
        await signInWithMagicLink(email)
        setSuccess(t.magicLinkSent)
      } else {
        await signInWithEmail(email, password)
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || "Google sign-in failed")
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-none shadow-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-2 h-16 w-16 flex items-center justify-center">
                  <Image
                    src="/Hijraah_logo.png"
                    alt="Hijraah Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
                <p className="text-balance text-muted-foreground">
                  {t.subtitle}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Name Field for Signup */}
                {activeTab === "signup" && (
                  <div className="grid gap-2">
                    <Label htmlFor="name">{t.name}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={language === 'ar' ? "اسمك" : "Your Name"}
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">{t.password}</Label>
                    {activeTab === "login" && !useMagicLink && (
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setUseMagicLink(!useMagicLink) }}
                        className="ml-auto text-sm text-primary underline-offset-2 hover:underline"
                      >
                        {useMagicLink ? "Use Password" : t.magicLink}
                      </a>
                    )}
                  </div>
                  {!useMagicLink && (
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!useMagicLink}
                      className="h-10"
                    />
                  )}
                </div>

                {/* Confirm Password for Signup */}
                {activeTab === "signup" && (
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                )}

                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                {success && <p className="text-sm text-green-600 font-medium">{success}</p>}

                <Button type="submit" className="w-full h-10 text-base" disabled={isLoading || loading}>
                  {isLoading ? "..." : t.submit}
                </Button>
              </div>

              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  {t.orContinue}
                </span>
              </div>

              <div className="grid gap-4">
                <Button variant="outline" className="w-full h-10" onClick={handleGoogleSignIn} type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  {language === 'ar' ? 'Google' : 'Google'}
                </Button>
              </div>

              <div className="text-center text-sm">
                {activeTab === "login" ? t.toggleSignUp : t.toggleLogin}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(activeTab === "login" ? "signup" : "login")
                    setError(null)
                    setSuccess(null)
                  }}
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {activeTab === "login" ? t.signUpLink : t.loginLink}
                </button>
              </div>
            </div>
          </form>

          <div className="relative hidden bg-muted md:block">
            <div className="absolute inset-0 h-full w-full bg-primary/10 dark:bg-primary/5" /> {/* Gold tint overlay */}
            <Image
              src="/Hijraahim2.png"
              alt="Hijraah Banner"
              fill
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              priority
            />
            {/* Add a nice gradient overlay or pattern to match project branding if placeholder is replaced */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-10 text-white">
              <h3 className="text-2xl font-bold mb-2">{t.bannerTitle}</h3>
              <p className="text-white/90">{t.bannerSubtitle}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
