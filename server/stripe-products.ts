/**
 * Stripe Product and Price Configuration for Hijraah
 * 
 * Subscription Tiers:
 * - Free: Basic access to chat (10 messages/month)
 * - Essential ($29/month): Unlimited chat, CRS calculator, document checklists
 * - Premium ($59/month): Everything in Essential + SOP writer, priority support
 * - VIP ($299 one-time): Everything + 1-on-1 consultation, WhatsApp support
 */

export interface SubscriptionTier {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  currency: string;
  interval: "month" | "one_time";
  stripePriceId?: string; // Will be set after creating in Stripe
  features: string[];
  featuresAr: string[];
  limits: {
    chatMessages: number | "unlimited";
    crsCalculations: number | "unlimited";
    sopGenerations: number;
    documentChecklists: number | "unlimited";
    whatsappSupport: boolean;
    prioritySupport: boolean;
    consultation: boolean;
  };
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    id: "free",
    name: "Free",
    nameAr: "مجاني",
    price: 0,
    currency: "usd",
    interval: "month",
    features: [
      "10 AI chat messages per month",
      "Basic immigration guidance",
      "Community support",
    ],
    featuresAr: [
      "10 رسائل دردشة مع الذكاء الاصطناعي شهرياً",
      "إرشادات هجرة أساسية",
      "دعم المجتمع",
    ],
    limits: {
      chatMessages: 10,
      crsCalculations: 0,
      sopGenerations: 0,
      documentChecklists: 0,
      whatsappSupport: false,
      prioritySupport: false,
      consultation: false,
    },
  },
  essential: {
    id: "essential",
    name: "Essential",
    nameAr: "أساسي",
    price: 29,
    currency: "usd",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIAL, // Set in environment
    features: [
      "Unlimited AI chat messages",
      "CRS score calculator with recommendations",
      "Country-specific document checklists",
      "Document upload and tracking",
      "Email support (48h response)",
    ],
    featuresAr: [
      "رسائل دردشة غير محدودة مع الذكاء الاصطناعي",
      "حاسبة نقاط CRS مع التوصيات",
      "قوائم المستندات الخاصة بكل بلد",
      "رفع وتتبع المستندات",
      "دعم عبر البريد الإلكتروني (استجابة خلال 48 ساعة)",
    ],
    limits: {
      chatMessages: "unlimited",
      crsCalculations: "unlimited",
      sopGenerations: 0,
      documentChecklists: "unlimited",
      whatsappSupport: false,
      prioritySupport: false,
      consultation: false,
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    nameAr: "متميز",
    price: 59,
    currency: "usd",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM, // Set in environment
    features: [
      "Everything in Essential",
      "AI-powered SOP writer (3 generations/month)",
      "SOP refinement and improvements",
      "Priority email support (24h response)",
      "WhatsApp support",
      "Document review guidance",
    ],
    featuresAr: [
      "كل ميزات الأساسي",
      "كاتب SOP بالذكاء الاصطناعي (3 إنشاءات شهرياً)",
      "تحسين وتطوير SOP",
      "دعم بريد إلكتروني ذو أولوية (استجابة خلال 24 ساعة)",
      "دعم واتساب",
      "إرشادات مراجعة المستندات",
    ],
    limits: {
      chatMessages: "unlimited",
      crsCalculations: "unlimited",
      sopGenerations: 3,
      documentChecklists: "unlimited",
      whatsappSupport: true,
      prioritySupport: true,
      consultation: false,
    },
  },
  vip: {
    id: "vip",
    name: "VIP Package",
    nameAr: "باقة VIP",
    price: 299,
    currency: "usd",
    interval: "one_time",
    stripePriceId: process.env.STRIPE_PRICE_VIP, // Set in environment
    features: [
      "Everything in Premium (3 months access)",
      "Unlimited SOP generations",
      "1-on-1 consultation with immigration expert (60 min)",
      "Personalized application strategy",
      "Document review by expert",
      "Priority WhatsApp support",
      "Application submission guidance",
    ],
    featuresAr: [
      "كل ميزات المتميز (وصول لمدة 3 أشهر)",
      "إنشاء SOP غير محدود",
      "استشارة فردية مع خبير هجرة (60 دقيقة)",
      "استراتيجية تقديم شخصية",
      "مراجعة المستندات من قبل خبير",
      "دعم واتساب ذو أولوية",
      "إرشادات تقديم الطلب",
    ],
    limits: {
      chatMessages: "unlimited",
      crsCalculations: "unlimited",
      sopGenerations: 999,
      documentChecklists: "unlimited",
      whatsappSupport: true,
      prioritySupport: true,
      consultation: true,
    },
  },
};

export function getTierById(tierId: string): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS[tierId];
}

export function canAccessFeature(
  userTier: string,
  feature: keyof SubscriptionTier["limits"]
): boolean {
  const tier = getTierById(userTier);
  if (!tier) return false;
  
  return tier.limits[feature] === true || tier.limits[feature] === "unlimited";
}

export function getRemainingUsage(
  userTier: string,
  feature: keyof SubscriptionTier["limits"],
  currentUsage: number
): number | "unlimited" {
  const tier = getTierById(userTier);
  if (!tier) return 0;
  
  const limit = tier.limits[feature];
  
  if (limit === "unlimited" || limit === true) {
    return "unlimited";
  }
  
  if (typeof limit === "number") {
    return Math.max(0, limit - currentUsage);
  }
  
  return 0;
}
