"use client";

import { useState, useEffect } from "react";
import { Download, X, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export function InstallPrompt() {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const { canInstall, install, isOnline, isUpdating, update } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show install prompt after user has been on site for a while
  useEffect(() => {
    if (!canInstall || dismissed) return;

    // Check if user has previously dismissed
    const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (hasDismissed) {
      const dismissedTime = parseInt(hasDismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Show prompt after 30 seconds
    const timeout = setTimeout(() => {
      setShowPrompt(true);
    }, 30000);

    return () => clearTimeout(timeout);
  }, [canInstall, dismissed]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  // Show update prompt when available
  if (isUpdating) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
        <Card className="border-primary bg-primary/5">
          <CardContent className={cn("p-4", isRtl && "rtl")}>
            <div className={cn("flex items-start gap-3", isRtl && "flex-row-reverse")}>
              <div className="shrink-0 p-2 rounded-full bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className={cn("flex-1", isRtl && "text-right")}>
                <h4 className="font-medium text-sm">
                  {language === "ar" ? "تحديث متاح" : "Update Available"}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "ar"
                    ? "تحديث جديد متاح لـ Hijraah"
                    : "A new version of Hijraah is available"}
                </p>
                <Button size="sm" onClick={update} className="mt-3 w-full">
                  {language === "ar" ? "تحديث الآن" : "Update Now"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show install prompt
  if (!showPrompt || !canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 animate-in slide-in-from-bottom-5">
      <Card className="border-primary bg-background shadow-lg">
        <CardContent className={cn("p-4", isRtl && "rtl")}>
          <button
            onClick={handleDismiss}
            className={cn(
              "absolute top-2 text-muted-foreground hover:text-foreground",
              isRtl ? "left-2" : "right-2"
            )}
          >
            <X className="h-4 w-4" />
          </button>
          <div className={cn("flex items-start gap-3", isRtl && "flex-row-reverse")}>
            <div className="shrink-0 p-2 rounded-full bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className={cn("flex-1", isRtl && "text-right")}>
              <h4 className="font-medium text-sm">
                {language === "ar" ? "تثبيت Hijraah" : "Install Hijraah"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "ar"
                  ? "أضف Hijraah إلى شاشتك الرئيسية للوصول السريع ودعم العمل بدون إنترنت"
                  : "Add Hijraah to your home screen for quick access and offline support"}
              </p>
              <div className={cn("flex gap-2 mt-3", isRtl && "flex-row-reverse")}>
                <Button size="sm" onClick={handleInstall} className="flex-1">
                  {language === "ar" ? "تثبيت" : "Install"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleDismiss}>
                  {language === "ar" ? "لاحقًا" : "Later"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Offline indicator component
export function OfflineIndicator() {
  const { language } = useLanguage();
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500 text-yellow-950 text-sm font-medium shadow-lg">
        <WifiOff className="h-4 w-4" />
        {language === "ar" ? "أنت غير متصل بالإنترنت" : "You're offline"}
      </div>
    </div>
  );
}
