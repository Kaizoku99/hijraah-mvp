'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MessageSquare, Calculator, FileText, BookOpen, ArrowRight, CheckCircle, Star, Check } from "lucide-react";
import { getLoginUrl } from "@/const";
import Link from "next/link";

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

    language === "ar" ? "أسعار معقولة" : "Affordable pricing",
  ];

  const testimonials = [
    {
      name: "Ahmed S.",
      country: "Egypt",
      feedback: language === "ar"
        ? "ساعدتني هجرة في فهم نظام Express Entry وكيفية تحسين نقاطي. حصلت على الدعوة بعد 3 أشهر!"
        : "Hijraah helped me understand the Express Entry system and how to improve my score. I got my ITA in 3 months!",
      rating: 5
    },
    {
      name: "Sara K.",
      country: "Jordan",
      feedback: language === "ar"
        ? "أداة كتابة خطاب النوايا (SOP) وفرت علي ساعات من العمل. النتيجة كانت احترافية جداً."
        : "The AI SOP writer saved me hours of work. The result was extremely professional and tailored to my profile.",
      rating: 5
    },
    {
      name: "Omar M.",
      country: "Morocco",
      feedback: language === "ar"
        ? "قائمة المستندات كانت دقيقة جداً. لم أكن أعرف أنني بحاجة لترجمة بعض الأوراق قبل التقديم."
        : "The document checklist was very accurate. I didn't know I needed to translate certain papers before applying.",
      rating: 4
    }
  ];

  const pricingTiers = [
    {
      name: language === "ar" ? "مجاني" : "Free",
      price: "$0",
      description: language === "ar" ? "لبدء رحلتك" : "To start your journey",
      features: [
        language === "ar" ? "حساب نقاط CRS" : "CRS Score Calculator",
        language === "ar" ? "قائمة مستندات أساسية" : "Basic Document Checklist",
        language === "ar" ? "5 رسائل محادثة يومياً" : "5 Chat Messages/Day",
      ],
      cta: language === "ar" ? "ابدأ مجاناً" : "Start for Free",
      variant: "outline" as const
    },
    {
      name: language === "ar" ? "أساسي" : "Essential",
      price: "$29",
      description: language === "ar" ? "للمتقدمين الجادين" : "For serious applicants",
      features: [
        language === "ar" ? "كل ميزات المجاني" : "All Free features",
        language === "ar" ? "محادثة غير محدودة" : "Unlimited Chat",
        language === "ar" ? "توليد 3 خطابات نوايا" : "Generate 3 SOPs",
        language === "ar" ? "قوائم مستندات مخصصة" : "Custom Checklists",
      ],
      cta: language === "ar" ? "اختر الأساسي" : "Choose Essential",
      variant: "default" as const,
      popular: true
    },
    {
      name: language === "ar" ? "مميز" : "Premium",
      price: "$79",
      description: language === "ar" ? "الدعم الكامل" : "Full support suite",
      features: [
        language === "ar" ? "كل ميزات الأساسي" : "All Essential features",
        language === "ar" ? "مراجعة المستندات (AI)" : "AI Document Review",
        language === "ar" ? "دعم واتساب للأعمال" : "WhatsApp Business Support",
        language === "ar" ? "توليد خطابات غير محدود" : "Unlimited SOPs",
      ],
      cta: language === "ar" ? "اختر المميز" : "Choose Premium",
      variant: "outline" as const
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {language === "ar" ? "هجرة" : "Hijraah"}
            </h1>
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
      <section className="py-20 md:py-32 bg-gradient-to-b from-blue-50 to-background">
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
                    <ArrowRight className={`h-5 w-5 ${language === "ar" ? "rotate-180" : ""}`} />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" asChild className="gap-2">
                  <a href={getLoginUrl()}>
                    {t("home.hero.cta")}
                    <ArrowRight className={`h-5 w-5 ${language === "ar" ? "rotate-180" : ""}`} />
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
      <section className="py-20 bg-blue-50">
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

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              {language === "ar" ? "قصص نجاح" : "Success Stories"}
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === "ar"
                ? "انضم إلى المئات الذي حققوا حلمهم بالهجرة بمساعدة منصتنا"
                : "Join hundreds who achieved their immigration dream with our help"}
            </p>
          </div>
          <div className="flex justify-center">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-5xl"
            >
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card className="h-full">
                        <CardHeader>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                          <CardDescription>{testimonial.country}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground italic">"{testimonial.feedback}"</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-blue-50">
        <div className="container">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              {language === "ar" ? "باقات الاشتراك" : "Pricing Plans"}
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === "ar"
                ? "اختر الباقة المناسبة لاحتياجاتك وميزانيتك"
                : "Choose the plan that fits your needs and budget"}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`flex flex-col ${tier.popular ? 'border-primary shadow-lg scale-105 relative' : ''}`}>
                {tier.popular && (
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      {language === "ar" ? "موصى به" : "Recommended"}
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.price !== "$0" && <span className="text-muted-foreground">/mo</span>}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={tier.variant} asChild>
                    <a href={getLoginUrl()}>{tier.cta}</a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
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
                <ArrowRight className={`h-5 w-5 ${language === "ar" ? "rotate-180" : ""}`} />
              </Button>
            </Link>
          ) : (
            <Button size="lg" variant="secondary" asChild className="gap-2">
              <a href={getLoginUrl()}>
                {t("home.hero.cta")}
                <ArrowRight className={`h-5 w-5 ${language === "ar" ? "rotate-180" : ""}`} />
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

