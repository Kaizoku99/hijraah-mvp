'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as z from "zod";

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const { signUpWithEmail, signInWithGoogle, isAuthenticated, loading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated && !loading) {
    router.push("/dashboard");
    return null;
  }

  const isRTL = language === "ar";
  
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const t = {
    title: language === "ar" ? "إنشاء حساب في هجرة" : "Create an Account",
    subtitle: language === "ar" 
      ? "ابدأ رحلتك إلى كندا اليوم" 
      : "Start your journey to Canada today",
    signIn: language === "ar" ? "تسجيل الدخول" : "Sign In",
    signUp: language === "ar" ? "إنشاء حساب" : "Sign Up",
    email: language === "ar" ? "البريد الإلكتروني" : "Email",
    password: language === "ar" ? "كلمة المرور" : "Password",
    confirmPassword: language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    continueWithGoogle: language === "ar" ? "المتابعة مع Google" : "Continue with Google",
    hasAccount: language === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?",
    or: language === "ar" ? "أو" : "or",
    checkEmail: language === "ar" 
      ? "تحقق من بريدك الإلكتروني لتأكيد حسابك" 
      : "Please check your email to confirm your account",
  };

  const onSubmit = async (data: SignUpFormValues) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await signUpWithEmail(data.email, data.password);
      setSuccess(t.checkEmail);
      form.reset();
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {t.title}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.email}</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.password}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.confirmPassword}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              {success && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
              )}

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading}
              >
                {isLoading ? "..." : t.signUp}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            <Link href="/login" className="text-emerald-600 hover:underline">
              {t.hasAccount} {t.signIn}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

