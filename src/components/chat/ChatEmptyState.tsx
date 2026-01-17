'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Calculator,
  FileText,
  Globe,
  Sparkles,
  MessageSquare,
  Bot,
} from "lucide-react"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import { TargetDestination, destinationConfig } from "@/hooks/useUserProfile"

interface ConversationEmptyStateProps {
  language: string
  targetDestination?: TargetDestination
  onSuggestionClick: (suggestion: string) => void
}

// Icon mapping for suggestions
const iconMap = {
  calculator: Calculator,
  file: FileText,
  globe: Globe,
  sparkles: Sparkles,
} as const

// Sample conversations per destination
const sampleConversations: Record<TargetDestination, { ar: { user: string; assistant: string }; en: { user: string; assistant: string } }> = {
  canada: {
    ar: {
      user: "كيف يتم حساب نقاط العمر في ملف Express Entry؟",
      assistant: "في نظام التصنيف الشامل (CRS)، يتم منح نقاط للعمر كالتالي:\n\n• **20-29 سنة:** 110 نقاط (الحد الأقصى) للأعزب، أو 100 للمتزوج.\n• **30 سنة:** 105 نقاط للأعزب.\n• **45 سنة فأكثر:** 0 نقطة.\n\nتفقد النقاط تدريجياً بعد سن 29. هل تود حساب نقاطك الحالية؟"
    },
    en: {
      user: "How are age points calculated in Express Entry?",
      assistant: "In the CRS system, age points are awarded as follows:\n\n• **20-29 years:** 110 points (max) if single, or 100 if married.\n• **30 years:** 105 points if single.\n• **45+ years:** 0 points.\n\nYou start losing points gradually after age 29. Would you like to calculate your current score?"
    }
  },
  australia: {
    ar: {
      user: "كيف يعمل نظام النقاط في أستراليا؟",
      assistant: "نظام النقاط الأسترالي يتطلب 65 نقطة كحد أدنى للتأهل:\n\n• **العمر (18-24):** 25 نقطة\n• **اللغة الإنجليزية:** حتى 20 نقطة\n• **التعليم:** حتى 20 نقطة\n• **الخبرة المهنية:** حتى 20 نقطة\n\nكلما زادت نقاطك، زادت فرصك في الحصول على دعوة. هل تريد حساب نقاطك؟"
    },
    en: {
      user: "How does the Australian points system work?",
      assistant: "The Australian points system requires a minimum of 65 points to qualify:\n\n• **Age (18-24):** 25 points\n• **English proficiency:** up to 20 points\n• **Education:** up to 20 points\n• **Work experience:** up to 20 points\n\nThe higher your points, the better your chances of receiving an invitation. Would you like to calculate your score?"
    }
  },
  portugal: {
    ar: {
      user: "ما الفرق بين تأشيرات D2 و D7 و D8 البرتغالية؟",
      assistant: "تأشيرات البرتغال الرئيسية:\n\n• **D7 (الدخل السلبي):** للمتقاعدين أو من لديهم دخل ثابت (معاش، إيجارات، استثمارات). الحد الأدنى ~€820/شهر.\n• **D2 (رواد الأعمال):** لأصحاب الأعمال والمستثمرين. تتطلب خطة عمل واستثمار.\n• **D8 (الرحالة الرقمي):** للعاملين عن بُعد مع دخل €3,800/شهر أو أكثر.\n\nأي نوع يناسب وضعك؟"
    },
    en: {
      user: "What's the difference between Portugal's D2, D7, and D8 visas?",
      assistant: "Main Portugal visa types:\n\n• **D7 (Passive Income):** For retirees or those with stable income (pension, rentals, investments). Minimum ~€820/month.\n• **D2 (Entrepreneur):** For business owners and investors. Requires a business plan and investment.\n• **D8 (Digital Nomad):** For remote workers earning €3,800/month or more.\n\nWhich type suits your situation?"
    }
  },
  other: {
    ar: {
      user: "ما هي أفضل الدول للهجرة من المنطقة العربية؟",
      assistant: "هناك عدة خيارات ممتازة للهجرة:\n\n• **كندا:** نظام Express Entry الشفاف، فرص عمل جيدة\n• **أستراليا:** جودة حياة عالية، نظام نقاط واضح\n• **البرتغال:** بوابة أوروبا، تأشيرات متنوعة للدخل السلبي ورواد الأعمال\n\nيعتمد الاختيار على وضعك المالي، مهنتك، ومستوى لغتك. ما هي أولوياتك؟"
    },
    en: {
      user: "What are the best countries for immigration from the MENA region?",
      assistant: "There are several excellent immigration options:\n\n• **Canada:** Transparent Express Entry system, good job opportunities\n• **Australia:** High quality of life, clear points system\n• **Portugal:** Gateway to Europe, diverse visas for passive income and entrepreneurs\n\nThe best choice depends on your finances, profession, and language skills. What are your priorities?"
    }
  }
}

/**
 * Empty state component displayed when starting a new conversation.
 * Shows suggested prompts and a sample conversation preview.
 * Now destination-aware for smarter, contextual suggestions.
 */
export function ChatEmptyState({
  language,
  targetDestination = 'canada',
  onSuggestionClick,
}: ConversationEmptyStateProps) {
  const config = destinationConfig[targetDestination]
  
  // Get destination-specific suggestions
  const rawSuggestions = language === "ar" ? config.suggestionsAr : config.suggestionsEn
  const suggestions = rawSuggestions.map(s => ({
    icon: iconMap[s.icon as keyof typeof iconMap] || Globe,
    text: s.text,
  }))

  const [showSample, setShowSample] = useState(false)

  // Get destination-specific sample conversation
  const sampleConvo = sampleConversations[targetDestination]
  const sampleMessages = language === "ar" ? [
    { role: "user", content: sampleConvo.ar.user },
    { role: "assistant", content: sampleConvo.ar.assistant }
  ] : [
    { role: "user", content: sampleConvo.en.user },
    { role: "assistant", content: sampleConvo.en.assistant }
  ]

  if (showSample) {
    return (
      <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4 gap-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {language === "ar" ? "مثال للمحادثة" : "Conversation Preview"}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowSample(false)}>
            {language === "ar" ? "إغلاق المثال" : "Close Preview"}
          </Button>
        </div>

        {sampleMessages.map((msg, idx) => (
          // @ts-ignore - borrowing Message component logic loosely
          <Message key={idx} from={msg.role} className="group">
            {msg.role === "assistant" ? (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <MessageContent className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                  <MessageResponse>{msg.content}</MessageResponse>
                </MessageContent>
              </div>
            ) : (
              <MessageContent className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3">
                {msg.content}
              </MessageContent>
            )}
          </Message>
        ))}

        <div className="mt-4 flex justify-center">
          <Button onClick={() => onSuggestionClick(language === "ar" ? "أريد حساب نقاطي" : "I want to calculate my score")}>
            {language === "ar" ? "ابدأ محادثتك الخاصة الآن" : "Start your own chat now"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
          <Bot className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-4 border-background" />
      </div>

      <h3 className="text-2xl font-bold mb-2 text-center">
        {language === "ar" 
          ? `مرحباً! أنا مساعدك للهجرة إلى ${config.nameAr}` 
          : `Hi! I'm your ${config.nameEn} Immigration Assistant`}
      </h3>
      <p className="text-muted-foreground text-center mb-6 max-w-md">
        {language === "ar"
          ? `يمكنني مساعدتك في أسئلة الهجرة إلى ${config.nameAr}، حسابات النقاط، متطلبات الوثائق، والمزيد.`
          : `I can help you with ${config.nameEn} immigration questions, points calculations, document requirements, and more.`}
      </p>

      <Button
        variant="outline"
        size="sm"
        className="mb-8 gap-2 text-muted-foreground"
        onClick={() => setShowSample(true)}
      >
        <MessageSquare className="h-4 w-4" />
        {language === "ar" ? "شاهد مثالاً للمحادثة" : "See a sample conversation"}
      </Button>

      <div className="w-full max-w-2xl">
        <p className="text-sm text-muted-foreground mb-3 text-center">
          {language === "ar" ? "جرب أحد هذه الأسئلة:" : "Try one of these questions:"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <suggestion.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm">{suggestion.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
