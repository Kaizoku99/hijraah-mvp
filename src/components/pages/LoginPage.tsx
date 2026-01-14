'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface LoginPageProps {
  defaultTab?: "login" | "signup";
}

export default function LoginPage({ defaultTab = "login" }: LoginPageProps) {
  const { signInWithGoogle, signInWithEmail, signInWithMagicLink, signUpWithEmail, isAuthenticated, loading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState("");

  // Redirect if already authenticated
  if (isAuthenticated && !loading) {
    router.push("/dashboard");
    return null;
  }

  const isRTL = language === "ar";

  const t = {
    title: language === "ar" ? "مرحباً بك في هجرة" : "Welcome to Hijraah",
    subtitle: language === "ar"
      ? "مساعدك الذكي للهجرة إلى كندا"
      : "Your AI-powered immigration assistant for Canada",
    signIn: language === "ar" ? "تسجيل الدخول" : "Sign In",
    signUp: language === "ar" ? "إنشاء حساب" : "Sign Up",
    email: language === "ar" ? "البريد الإلكتروني" : "Email",
    password: language === "ar" ? "كلمة المرور" : "Password",
    continueWithGoogle: language === "ar" ? "المتابعة مع Google" : "Continue with Google",
    continueWithEmail: language === "ar" ? "المتابعة بالبريد الإلكتروني" : "Continue with Email",
    useMagicLink: language === "ar" ? "استخدام رابط سحري" : "Use Magic Link",
    usePassword: language === "ar" ? "استخدام كلمة المرور" : "Use Password",
    noAccount: language === "ar" ? "ليس لديك حساب؟" : "Don't have an account?",
    hasAccount: language === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?",
    or: language === "ar" ? "أو" : "or",
    magicLinkSent: language === "ar"
      ? "تم إرسال رابط تسجيل الدخول إلى بريدك الإلكتروني"
      : "Magic link sent to your email",
    checkEmail: language === "ar"
      ? "تحقق من بريدك الإلكتروني للمتابعة"
      : "Check your email to continue",
    confirmPassword: language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    name: language === "ar" ? "الاسم" : "Name",
    passwordMismatch: language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords don't match",
    welcomeTitle: language === "ar" ? "مرحباً بك! 🎉" : "Welcome! 🎉",
    welcomeSubtitle: language === "ar" ? "تم إنشاء حسابك بنجاح" : "Your account has been created successfully",
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (activeTab === "signup") {
        if (password !== confirmPassword) {
          setError(t.passwordMismatch);
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, userName);
        setShowWelcome(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else if (useMagicLink) {
        await signInWithMagicLink(email);
        setSuccess(t.magicLinkSent);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {t.title}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showWelcome ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-emerald-600 mb-2">{t.welcomeTitle}</h3>
              <p className="text-muted-foreground">{t.welcomeSubtitle}</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="space-y-4">
              {/* Google Sign In */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading || isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t.continueWithGoogle}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                    {t.or}
                  </span>
                </div>
              </div>

              <TabsContent value="login" className="space-y-4 mt-0">
                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  {!useMagicLink && (
                    <div className="space-y-2">
                      <Label htmlFor="password">{t.password}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}

                  {success && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading || isLoading}
                  >
                    {isLoading ? "..." : t.signIn}
                  </Button>
                </form>

                {/* Toggle Options */}
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setUseMagicLink(!useMagicLink)}
                    className="text-emerald-600 hover:underline"
                  >
                    {useMagicLink ? t.usePassword : t.useMagicLink}
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-0">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.name}</Label>
                    <Input
                      id="name"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder={language === "ar" ? "اسمك الكامل" : "Your full name"}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t.password}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {activeTab === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}

                  {success && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading || isLoading}
                  >
                    {isLoading ? "..." : activeTab === "signup" ? t.signUp : t.signIn}
                  </Button>
                </form>
              </TabsContent>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">{t.signIn}</TabsTrigger>
                <TabsTrigger value="signup">{t.signUp}</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
