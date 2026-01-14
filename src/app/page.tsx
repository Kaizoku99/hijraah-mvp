'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MessageSquare, Calculator, FileText, BookOpen, ArrowRight, CheckCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import Link from "next/link";
import Image from "next/image";
import CountUp from "react-countup";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  const features = [
    {
      icon: MessageSquare,
      titleKey: "features.chat.title",
      descriptionKey: "features.chat.description",
    },
    {
      icon: Calculator,
      titleKey: "features.calculator.title",
      descriptionKey: "features.calculator.description",
    },
    {
      icon: FileText,
      titleKey: "features.documents.title",
      descriptionKey: "features.documents.description",
    },
    {
      icon: BookOpen,
      titleKey: "features.sop.title",
      descriptionKey: "features.sop.description",
    },
  ];

  const benefits = [
    language === "ar" ? "إرشادات مخصصة باللغة العربية" : "Personalized guidance in Arabic",
    language === "ar" ? "حاسبة نقاط CRS دقيقة" : "Accurate CRS score calculator",
    language === "ar" ? "قوائم مستندات خاصة ببلدك" : "Country-specific document checklists",
    language === "ar" ? "كتابة خطاب النوايا بالذكاء الاصطناعي" : "AI-powered SOP writing",
    language === "ar" ? "دعم على مدار الساعة" : "24/7 support",
    language === "ar" ? "أسعار معقولة" : "Affordable pricing",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="relative h-10 w-40">
              <Image
                src="/Hijraah_logo.png"
                alt="Hijraah"
                fill
                className="object-contain object-left"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>{t("nav.dashboard")}</Button>
              </Link>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>{t("nav.login")}</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="main-content" className="py-20 md:py-32 bg-gradient-to-b from-secondary/50 to-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              {t("home.hero.title")}
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              {t("home.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2">
                    {t("nav.dashboard")}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" asChild className="gap-2">
                  <a href={getLoginUrl()}>
                    {t("home.hero.cta")}
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </Button>
              )}
              <Link href="/guides">
                <Button size="lg" variant="outline">
                  {t("home.hero.secondary")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 border-y bg-muted/20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center text-center">
            {/* User Counter */}
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary flex justify-center items-center gap-1">
                <CountUp end={150} duration={3} />
                <span>+</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {language === "ar" ? "مستخدم يثق بنا" : "Users Trust Us"}
              </p>
            </div>

            {/* Country Counter */}
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary flex justify-center items-center gap-1">
                <CountUp end={12} duration={3} />
                <span>+</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {language === "ar" ? "دولة مدعومة" : "Countries Supported"}
              </p>
            </div>

            {/* Immigration Programs */}
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary flex justify-center items-center gap-1">
                <CountUp end={60} duration={3} />
                <span>+</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {language === "ar" ? "برنامج هجرة" : "Immigration Programs"}
              </p>
            </div>

            {/* Flags Display */}
            <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center space-y-2">
              <div className="flex gap-2 text-2xl animate-pulse">
                <span>🇨🇦</span>
                <span>🇦🇪</span>
                <span>🇸🇦</span>
                <span>🇮🇳</span>
                <span>🇳🇬</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {language === "ar" ? "نخدم المتقدمين من" : "Serving Applicants From"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              {language === "ar" ? "ميزات المنصة" : "Platform Features"}
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === "ar"
                ? "كل ما تحتاجه للهجرة إلى كندا في مكان واحد"
                : "Everything you need to immigrate to Canada in one place"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{t(feature.titleKey)}</CardTitle>
                    <CardDescription>{t(feature.descriptionKey)}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              {language === "ar" ? "لماذا تختار هجرة؟" : "Why Choose Hijraah?"}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-chart-3 text-primary-foreground">
        <div className="container text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            {language === "ar" ? "ابدأ رحلتك اليوم" : "Start Your Journey Today"}
          </h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {language === "ar"
              ? "انضم إلى آلاف المستخدمين الذين يثقون في هجرة لتحقيق أحلامهم في الهجرة"
              : "Join thousands of users who trust Hijraah to achieve their immigration dreams"}
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="gap-2">
                {t("nav.dashboard")}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" variant="secondary" asChild className="gap-2">
              <a href={getLoginUrl()}>
                {t("home.hero.cta")}
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-start">
              <h4 className="text-xl font-bold mb-2">
                {language === "ar" ? "هجرة" : "Hijraah"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {language === "ar"
                  ? "شريكك الموثوق في رحلة الهجرة"
                  : "Your trusted immigration partner"}
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/guides" className="hover:text-foreground transition-colors">
                {t("nav.guides")}
              </Link>
              <Link href="/support" className="hover:text-foreground transition-colors">
                {t("nav.support")}
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2026 Hijraah. {language === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
