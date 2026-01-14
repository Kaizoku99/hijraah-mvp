'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createCheckout, getInvoices } from "@/actions/subscription";
import { Check, Crown, Sparkles, Star, Zap, User, LogOut, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Pricing() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  // Check for payment status in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "canceled") {
      toast.info(language === "ar" ? "تم إلغاء عملية الدفع" : "Payment was canceled");
    }
  }, [language]);

  const checkoutMutation = useMutation({
    mutationFn: createCheckout,
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSubscribe = (tierId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (tierId === "free") return;

    checkoutMutation.mutate({ tierId: tierId as "essential" | "premium" | "vip" });
  };

  const tiers = [
    {
      tierId: "free",
      name: language === "ar" ? "مجاني" : "Free",
      price: language === "ar" ? "مجاناً" : "Free",
      priceValue: 0,
      description: language === "ar"
        ? "ابدأ رحلتك مع الميزات الأساسية"
        : "Start your journey with basic features",
      icon: Sparkles,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      features: language === "ar" ? [
        "5 رسائل محادثة يومياً",
        "حساب CRS مرة واحدة",
        "قائمة مستندات أساسية",
        "الوصول للأدلة العامة",
      ] : [
        "5 chat messages per day",
        "1 CRS calculation",
        "Basic document checklist",
        "Access to public guides",
      ],
      cta: language === "ar" ? "الخطة الحالية" : "Current Plan",
      current: user?.subscriptionTier === "free" || !user?.subscriptionTier,
    },
    {
      tierId: "essential",
      name: language === "ar" ? "أساسي" : "Essential",
      price: language === "ar" ? "$19/شهر" : "$19/month",
      priceValue: 19,
      description: language === "ar"
        ? "للمتقدمين الجادين للهجرة"
        : "For serious immigration applicants",
      icon: Star,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      features: language === "ar" ? [
        "50 رسالة محادثة يومياً",
        "حسابات CRS غير محدودة",
        "قوائم مستندات مخصصة",
        "إنشاء خطاب نوايا (2/شهر)",
        "تتبع المستندات",
        "دعم بالبريد الإلكتروني",
      ] : [
        "50 chat messages per day",
        "Unlimited CRS calculations",
        "Personalized document checklists",
        "SOP generation (2/month)",
        "Document tracking",
        "Email support",
      ],
      cta: language === "ar" ? "اشترك الآن" : "Subscribe Now",
      current: user?.subscriptionTier === "essential",
      popular: true,
    },
    {
      tierId: "premium",
      name: language === "ar" ? "مميز" : "Premium",
      price: language === "ar" ? "$49/شهر" : "$49/month",
      priceValue: 49,
      description: language === "ar"
        ? "أدوات متقدمة للنجاح"
        : "Advanced tools for success",
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      features: language === "ar" ? [
        "رسائل محادثة غير محدودة",
        "حسابات CRS غير محدودة",
        "إنشاء خطاب نوايا (10/شهر)",
        "مراجعة المستندات بالذكاء الاصطناعي",
        "ترجمة المستندات",
        "معالجة OCR للمستندات",
        "دعم ذو أولوية",
      ] : [
        "Unlimited chat messages",
        "Unlimited CRS calculations",
        "SOP generation (10/month)",
        "AI document review",
        "Document translation",
        "Document OCR processing",
        "Priority support",
      ],
      cta: language === "ar" ? "اشترك الآن" : "Subscribe Now",
      current: user?.subscriptionTier === "premium",
    },
    {
      tierId: "vip",
      name: language === "ar" ? "في آي بي" : "VIP",
      price: language === "ar" ? "$99/شهر" : "$99/month",
      priceValue: 99,
      description: language === "ar"
        ? "الدعم الكامل لرحلتك"
        : "Complete support for your journey",
      icon: Zap,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      features: language === "ar" ? [
        "جميع مزايا Premium",
        "إنشاء خطاب نوايا غير محدود",
        "استشارات 1-على-1 شهرية",
        "مراجعة الطلب قبل التقديم",
        "دعم واتساب مباشر",
        "تحديثات السحوبات الفورية",
        "مدير حساب مخصص",
      ] : [
        "All Premium features",
        "Unlimited SOP generation",
        "Monthly 1-on-1 consultation",
        "Application review before submission",
        "Direct WhatsApp support",
        "Real-time draw updates",
        "Dedicated account manager",
      ],
      cta: language === "ar" ? "اشترك الآن" : "Subscribe Now",
      current: user?.subscriptionTier === "vip",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="relative h-8 w-32">
            <Image
              src="/Hijraah_logo.png"
              alt="Hijraah"
              fill
              className="object-contain object-left"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    {language === "ar" ? "لوحة التحكم" : "Dashboard"}
                  </Button>
                </Link>
                <LanguageToggle />
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <LanguageToggle />
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    {language === "ar" ? "تسجيل الدخول" : "Login"}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-7xl">
          {/* Back button */}
          {user && (
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
              <ArrowLeft className="h-4 w-4" />
              {language === "ar" ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
            </Link>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              {language === "ar" ? "اختر خطتك" : "Choose Your Plan"}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {language === "ar"
                ? "اختر الخطة المناسبة لك وابدأ رحلتك نحو كندا اليوم"
                : "Select the plan that's right for you and start your journey to Canada today"}
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isLoading = checkoutMutation.isPending && checkoutMutation.variables?.tierId === tier.tierId;
              return (
                <Card
                  key={tier.name}
                  className={cn(
                    "relative flex flex-col",
                    tier.popular && "border-2 border-primary shadow-lg scale-105",
                    tier.current && "ring-2 ring-primary/50"
                  )}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                      {language === "ar" ? "الأكثر شعبية" : "Most Popular"}
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className={cn("h-12 w-12 rounded-full mx-auto flex items-center justify-center mb-3", tier.bgColor)}>
                      <Icon className={cn("h-6 w-6", tier.color)} />
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{tier.price}</span>
                    </div>
                    <CardDescription className="mt-2">{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className={cn("h-5 w-5 flex-shrink-0 mt-0.5", tier.color)} />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6"
                      variant={tier.current ? "outline" : tier.popular ? "default" : "secondary"}
                      disabled={tier.current || isLoading}
                      onClick={() => handleSubscribe(tier.tierId)}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : tier.current ? (
                        language === "ar" ? "الخطة الحالية" : "Current Plan"
                      ) : (
                        tier.cta
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Payment History */}
          {user && (
            <div className="mt-16 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-center mb-8">
                {language === "ar" ? "سجل المدفوعات" : "Payment History"}
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 border-b bg-muted p-4 font-medium text-sm">
                      <div>{language === "ar" ? "التاريخ" : "Date"}</div>
                      <div>{language === "ar" ? "المبلغ" : "Amount"}</div>
                      <div>{language === "ar" ? "الحالة" : "Status"}</div>
                      <div className="text-right">{language === "ar" ? "الفاتورة" : "Invoice"}</div>
                    </div>
                    <PaymentHistoryList language={language} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">
              {language === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h3>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === "ar" ? "هل يمكنني تغيير خطتي لاحقاً؟" : "Can I change my plan later?"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {language === "ar"
                      ? "نعم، يمكنك الترقية أو التخفيض في أي وقت. سيتم احتساب الفرق بشكل تناسبي."
                      : "Yes, you can upgrade or downgrade at any time. The difference will be prorated."}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === "ar" ? "ما هي طرق الدفع المقبولة؟" : "What payment methods are accepted?"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {language === "ar"
                      ? "نقبل جميع بطاقات الائتمان الرئيسية، وApple Pay، وGoogle Pay."
                      : "We accept all major credit cards, Apple Pay, and Google Pay."}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === "ar" ? "هل هناك ضمان استرداد الأموال؟" : "Is there a money-back guarantee?"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {language === "ar"
                      ? "نعم، نقدم ضمان استرداد الأموال لمدة 14 يومًا على جميع الخطط المدفوعة."
                      : "Yes, we offer a 14-day money-back guarantee on all paid plans."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main >
    </div >
  );
}

function PaymentHistoryList({ language }: { language: "ar" | "en" }) {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['subscription', 'invoices'],
    queryFn: getInvoices,
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {language === "ar" ? "لا توجد مدفوعات سابقة" : "No payment history found"}
      </div>
    );
  }

  return (
    <div>
      {invoices.map((invoice) => (
        <div key={invoice.id} className="grid grid-cols-4 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors text-sm">
          <div>{new Date(invoice.date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}</div>
          <div className="font-mono">
            {(invoice.amount / 100).toLocaleString(undefined, {
              style: "currency",
              currency: invoice.currency.toUpperCase(),
            })}
          </div>
          <div>
            <span className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
              invoice.status === "paid" && "bg-green-100 text-green-700",
              invoice.status === "open" && "bg-yellow-100 text-yellow-700",
              invoice.status === "void" && "bg-gray-100 text-gray-700",
              invoice.status === "uncollectible" && "bg-red-100 text-red-700"
            )}>
              {invoice.status}
            </span>
          </div>
          <div className="text-right">
            {invoice.pdfUrl && (
              <a
                href={invoice.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {/* @ts-ignore */}
                <span className="hidden sm:inline">{language === "ar" ? "تحميل" : "Download"}</span>
                <ArrowLeft className="h-3 w-3 rotate-135" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

