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
import { OtpInput } from "@/components/ui/OtpInput"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface LoginFormProps extends React.ComponentProps<"div"> {
  defaultView?: "login" | "signup"
}

export function LoginForm({
  className,
  defaultView = "login",
  ...props
}: LoginFormProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, verifyOtp, resendOtp, isAuthenticated, loading } = useAuth()
  const { language, t } = useLanguage()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultView) // consolidated state

  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  // OTP verification state
  const [showOtpVerification, setShowOtpVerification] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Translation object removed in favor of direct t() usage


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validation Schemas with Localization
    const validationMsgs = {
      email: t("val.email"),
      passwordMin: t("val.passwordMin"),
      nameMin: t("val.nameMin"),
      passwordMatch: t("val.passwordMatch"),
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

    // Perform Validation
    let result
    const formData = { email, password, confirmPassword, name: userName }

    if (activeTab === "signup") {
      result = signupSchema.safeParse(formData)
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
        const result = await signUpWithEmail(email, password, userName)
        if (result.needsVerification) {
          // Show OTP verification step
          setPendingEmail(email)
          setShowOtpVerification(true)
          setSuccess(t("otp.sent"))
          return
        }
        router.push("/dashboard")
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

  // Handle OTP verification
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) {
      setError(t("otp.errorLength"))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await verifyOtp(pendingEmail, otpCode)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return

    setIsLoading(true)
    setError(null)

    try {
      await resendOtp(pendingEmail)
      setSuccess(t("otp.newCodeSent"))
      // Start 60 second cooldown
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Failed to resend code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-none shadow-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* OTP Verification Step */}
          {showOtpVerification ? (
            <form onSubmit={handleOtpVerify} className="p-6 md:p-8 flex flex-col justify-center bg-background/50 backdrop-blur-sm">
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
                  <h1 className="text-2xl font-bold text-foreground">{t("otp.title")}</h1>
                  <p className="text-balance text-muted-foreground">
                    {t("otp.subtitle")} <span className="font-medium text-foreground">{pendingEmail}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <OtpInput
                    value={otpCode}
                    onChange={setOtpCode}
                    length={6}
                    disabled={isLoading}
                  />

                  {error && <p className="text-sm text-destructive font-medium text-center">{error}</p>}
                  {success && <p className="text-sm text-green-600 font-medium text-center">{success}</p>}

                  <Button type="submit" className="w-full h-10 text-base" disabled={isLoading || otpCode.length !== 6}>
                    {isLoading ? "..." : t("otp.verify")}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isLoading}
                      className={cn(
                        "text-sm font-medium underline underline-offset-4",
                        resendCooldown > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:text-primary/80"
                      )}
                    >
                      {resendCooldown > 0 ? `${t("otp.resendIn")} ${resendCooldown}s` : t("otp.resend")}
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpVerification(false)
                        setOtpCode('')
                        setError(null)
                        setSuccess(null)
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      {language === "ar" ? (
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" />
                          <span>{t("auth.goBack")}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ArrowLeft className="h-4 w-4" />
                          <span>{t("auth.goBack")}</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
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
                  <h1 className="text-2xl font-bold text-foreground">{activeTab === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}</h1>
                  <p className="text-balance text-muted-foreground">
                    {activeTab === "login" ? t("auth.loginSubtitle") : t("auth.signupSubtitle")}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Name Field for Signup */}
                  {activeTab === "signup" && (
                    <div className="grid gap-2">
                      <Label htmlFor="name">{t("auth.name")}</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder={language === 'ar' ? "اسمك الكامل" : "Your Full Name"}
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                        className="h-10"
                      />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      dir="ltr"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={activeTab === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>

                  {/* Confirm Password for Signup */}
                  {activeTab === "signup" && (
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
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
                    {isLoading ? "..." : (activeTab === "login" ? t("auth.submitLogin") : t("auth.submitSignup"))}
                  </Button>
                </div>

                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span className="relative z-10 bg-background px-2 text-muted-foreground">
                    {t("auth.orContinue")}
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
                    {t("auth.continueGoogle")}
                  </Button>
                </div>

                <div className="text-center text-sm">
                  {activeTab === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(activeTab === "login" ? "signup" : "login")
                      setError(null)
                      setSuccess(null)
                    }}
                    className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    {activeTab === "login" ? t("auth.signUpLink") : t("auth.loginLink")}
                  </button>
                </div>
              </div>
            </form>
          )}

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
              <h3 className="text-2xl font-bold mb-2">{t("auth.bannerTitle")}</h3>
              <p className="text-white/90">{t("auth.bannerSubtitle")}</p>
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
