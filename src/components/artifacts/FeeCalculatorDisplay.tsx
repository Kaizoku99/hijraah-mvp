"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { FeeCalculatorArtifact } from "@/lib/artifacts/definitions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, Receipt, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FeeItem {
  category:
    | "government"
    | "biometrics"
    | "medical"
    | "translation"
    | "attestation"
    | "courier"
    | "other";
  name: { en: string; ar: string };
  amount: number;
  currency: string;
  required: boolean;
  notes?: string;
}

interface FeeData {
  pathway: string;
  destination: string;
  items: FeeItem[];
  subtotal: number;
  totalCAD: number;
  totalUSD: number;
  disclaimer?: string;
  status: "calculating" | "complete" | "error";
}

const CATEGORY_COLORS: Record<FeeItem["category"], string> = {
  government: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  biometrics: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  medical: "bg-green-500/10 text-green-700 dark:text-green-400",
  translation: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  attestation: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  courier: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  other: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
};

const CATEGORY_LABELS: Record<FeeItem["category"], { en: string; ar: string }> =
  {
    government: { en: "Government", ar: "حكومية" },
    biometrics: { en: "Biometrics", ar: "بيومتري" },
    medical: { en: "Medical", ar: "طبية" },
    translation: { en: "Translation", ar: "ترجمة" },
    attestation: { en: "Attestation", ar: "تصديق" },
    courier: { en: "Courier", ar: "بريد" },
    other: { en: "Other", ar: "أخرى" },
  };

export function FeeCalculatorDisplay() {
  const [state] = useArtifact(FeeCalculatorArtifact);
  const { language } = useLanguage();
  const data = state.data as FeeData | null;
  const status = state.status;

  if (!data && status !== "streaming") return null;

  const isArabic = language === "ar";

  return (
    <Card className="w-full max-w-lg my-4 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-lg">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <span>{isArabic ? "تقدير الرسوم" : "Fee Estimate"}</span>
          </div>
          {status === "streaming" && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        {data?.pathway && (
          <p className="text-sm text-muted-foreground">
            {data.pathway} - {data.destination}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Fee Items */}
        <div className="space-y-2">
          {data?.items?.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge
                  variant="secondary"
                  className={`shrink-0 text-xs ${CATEGORY_COLORS[item.category]}`}
                >
                  {CATEGORY_LABELS[item.category][isArabic ? "ar" : "en"]}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {isArabic ? item.name.ar : item.name.en}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="font-medium">
                  {item.currency} {item.amount.toLocaleString()}
                </p>
                {!item.required && (
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "اختياري" : "Optional"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        {data?.totalCAD !== undefined && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {isArabic ? "الإجمالي (CAD)" : "Total (CAD)"}
              </span>
              <span className="text-xl font-bold text-primary">
                ${data.totalCAD.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span className="text-sm">
                {isArabic ? "ما يعادل (USD)" : "Equivalent (USD)"}
              </span>
              <span className="text-sm">
                ~${data.totalUSD?.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      {data?.disclaimer && (
        <CardFooter className="pt-0">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
            <p>{data.disclaimer}</p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
