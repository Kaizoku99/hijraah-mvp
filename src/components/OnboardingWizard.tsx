'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { CountrySelect } from "@/components/CountrySelect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProfile, updateProfile } from "@/actions/profile";
import {
    Globe,
    MapPin,
    Target,
    Languages,
    Rocket,
    ArrowRight,
    ArrowLeft,
    X,
    Sparkles,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "hijraah_onboarding_complete";
const ONBOARDING_DATA_KEY = "hijraah_onboarding_data";

interface OnboardingData {
    nationality: string;
    sourceCountry: string;
    currentCountry: string;
    immigrationPathway: string;
    englishLevel: string;
    targetDestination: string;
}

interface OnboardingWizardProps {
    onComplete: () => void;
    onSkip: () => void;
    existingProfile?: any;
}

import {
    COUNTRIES,
    DESTINATIONS,
    PATHWAYS,
    AUSTRALIA_PATHWAYS,
    PORTUGAL_PATHWAYS,
    ENGLISH_LEVELS
} from "@/data/constants";

export default function OnboardingWizard({ onComplete, onSkip, existingProfile }: OnboardingWizardProps) {
    const { language, setLanguage } = useLanguage();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const totalSteps = 6;

    const [data, setData] = useState<OnboardingData>(() => {
        // Try to restore from localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(ONBOARDING_DATA_KEY);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch { }
            }
        }
        // Initialize from existing profile if available
        return {
            nationality: existingProfile?.nationality || "",
            sourceCountry: existingProfile?.sourceCountry || "",
            currentCountry: existingProfile?.currentCountry || "",
            immigrationPathway: existingProfile?.immigrationPathway || "express_entry",
            englishLevel: existingProfile?.englishLevel || "",
            targetDestination: existingProfile?.targetDestination || "canada",
        };
    });

    // Auto-save to localStorage on data change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
        }
    }, [data]);

    const createProfileMutation = useMutation({
        mutationFn: createProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });

    const handleComplete = async () => {
        try {
            const profileData = {
                nationality: data.nationality,
                sourceCountry: data.sourceCountry,
                currentCountry: data.currentCountry,
                immigrationPathway: data.immigrationPathway as "express_entry" | "study_permit" | "family_sponsorship" | "other",
                englishLevel: data.englishLevel as "none" | "basic" | "intermediate" | "advanced" | "native",
                targetDestination: data.targetDestination,
                is_onboarded: true,
            };

            if (existingProfile) {
                await updateProfileMutation.mutateAsync(profileData);
            } else {
                await createProfileMutation.mutateAsync(profileData);
            }

            // Mark onboarding as complete
            localStorage.setItem(ONBOARDING_KEY, "true");
            localStorage.removeItem(ONBOARDING_DATA_KEY);

            toast.success(
                language === "ar"
                    ? "تم حفظ معلوماتك بنجاح!"
                    : "Your information has been saved!"
            );

            onComplete();
        } catch (error) {
            toast.error(
                language === "ar"
                    ? "حدث خطأ أثناء الحفظ"
                    : "Error saving your information"
            );
        }
    };

    const handleSkip = () => {
        localStorage.setItem(ONBOARDING_KEY, "skipped");
        onSkip();
    };

    const t = {
        welcome: language === "ar" ? "مرحباً بك في هجرة" : "Welcome to Hijraah",
        welcomeDesc: language === "ar"
            ? "دعنا نساعدك في رحلة الهجرة إلى وجهتك المستهدفة"
            : "Let us help you on your immigration journey",
        step1Title: language === "ar" ? "اختر لغتك المفضلة" : "Choose Your Preferred Language",
        step2Title: language === "ar" ? "من أين أنت؟" : "Where Are You From?",
        step3Title: language === "ar" ? "إلى أين تريد الهجرة؟" : "Where Do You Want to Immigrate?",
        step4Title: language === "ar" ? "ما هو مسار الهجرة المستهدف؟" : "What's Your Immigration Goal?",
        step5Title: language === "ar" ? "ما هو مستوى لغتك الإنجليزية؟" : "What's Your English Level?",
        step6Title: language === "ar" ? "أنت جاهز للبدء!" : "You're Ready to Start!",
        nationality: language === "ar" ? "الجنسية" : "Nationality",
        sourceCountry: language === "ar" ? "بلد المنشأ" : "Country of Origin",
        currentCountry: language === "ar" ? "بلد الإقامة الحالي" : "Current Country of Residence",

        next: language === "ar" ? "التالي" : "Next",
        previous: language === "ar" ? "السابق" : "Previous",
        skip: language === "ar" ? "تخطي" : "Skip for now",
        complete: language === "ar" ? "ابدأ رحلتك" : "Start Your Journey",
        calculateCrs: language === "ar" ? "احسب نقاط CRS" : "Calculate CRS Score",
        calculatePoints: language === "ar" ? "احسب نقاطك" : "Calculate Points",
        generateChecklist: language === "ar" ? "إنشاء قائمة المستندات" : "Generate Document Checklist",
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 text-center">
                        <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                            <Sparkles className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{t.welcome}</h2>
                            <p className="text-muted-foreground mt-2">{t.welcomeDesc}</p>
                        </div>
                        <div className="pt-4">
                            <Label className="text-base font-medium">{t.step1Title}</Label>
                            <div className="flex justify-center gap-4 mt-4">
                                <Button
                                    variant={language === "en" ? "default" : "outline"}
                                    size="lg"
                                    onClick={() => setLanguage("en")}
                                    className="min-w-32"
                                >
                                    English
                                </Button>
                                <Button
                                    variant={language === "ar" ? "default" : "outline"}
                                    size="lg"
                                    onClick={() => setLanguage("ar")}
                                    className="min-w-32"
                                >
                                    العربية
                                </Button>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <MapPin className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold">{t.step2Title}</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t.nationality}</Label>
                                <CountrySelect
                                    value={data.nationality}
                                    onValueChange={(v) => setData({ ...data, nationality: v })}
                                    placeholder={language === "ar" ? "اختر الجنسية" : "Select nationality"}
                                    language={language}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t.currentCountry}</Label>
                                <CountrySelect
                                    value={data.currentCountry}
                                    onValueChange={(v) => setData({ ...data, currentCountry: v })}
                                    placeholder={language === "ar" ? "اختر بلد الإقامة" : "Select current country"}
                                    language={language}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Globe className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold">{t.step3Title}</h2>
                        </div>
                        <RadioGroup
                            value={data.targetDestination}
                            onValueChange={(v) => {
                                setData({
                                    ...data,
                                    targetDestination: v,
                                    // Reset pathway when destination changes
                                    immigrationPathway: v === 'canada' ? 'express_entry' : v === 'australia' ? 'skilled_independent' : 'd8_digital_nomad'
                                });
                            }}
                            className="grid grid-cols-1 gap-3"
                        >
                            {DESTINATIONS.map((dest) => (
                                <Label
                                    key={dest.value}
                                    htmlFor={`dest-${dest.value}`}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        data.targetDestination === dest.value
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <RadioGroupItem value={dest.value} id={`dest-${dest.value}`} className="sr-only" />
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <dest.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm leading-tight break-words">
                                            {language === "ar" ? dest.labelAr : dest.labelEn}
                                        </div>
                                        <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                                            {language === "ar" ? dest.description.ar : dest.description.en}
                                        </div>
                                    </div>
                                    {data.targetDestination === dest.value && (
                                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                    )}
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                );

            case 4:
                const activePathways = data.targetDestination === 'australia'
                    ? AUSTRALIA_PATHWAYS
                    : data.targetDestination === 'portugal'
                        ? PORTUGAL_PATHWAYS
                        : PATHWAYS;
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Target className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold">{t.step4Title}</h2>
                        </div>
                        <RadioGroup
                            value={data.immigrationPathway}
                            onValueChange={(v) => setData({ ...data, immigrationPathway: v })}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                            {activePathways.map((pathway) => (
                                <Label
                                    key={pathway.value}
                                    htmlFor={pathway.value}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        data.immigrationPathway === pathway.value
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <RadioGroupItem value={pathway.value} id={pathway.value} className="sr-only" />
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <pathway.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm leading-tight break-words">
                                            {language === "ar" ? pathway.labelAr : pathway.labelEn}
                                        </div>
                                        <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                                            {language === "ar" ? pathway.description.ar : pathway.description.en}
                                        </div>
                                    </div>
                                    {data.immigrationPathway === pathway.value && (
                                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                    )}
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Languages className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold">{t.step5Title}</h2>
                        </div>
                        <RadioGroup
                            value={data.englishLevel}
                            onValueChange={(v) => setData({ ...data, englishLevel: v })}
                            className="space-y-3"
                        >
                            {ENGLISH_LEVELS.map((level) => (
                                <Label
                                    key={level.value}
                                    htmlFor={level.value}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        data.englishLevel === level.value
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <RadioGroupItem value={level.value} id={level.value} className="sr-only" />
                                    <div className="flex-1 font-medium">
                                        {language === "ar" ? level.labelAr : level.labelEn}
                                    </div>
                                    {data.englishLevel === level.value && (
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                    )}
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-6 text-center">
                        <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{t.step6Title}</h2>
                            <p className="text-muted-foreground mt-2">
                                {language === "ar"
                                    ? "اختر خطوتك الأولى للبدء"
                                    : "Choose your first step to get started"}
                            </p>
                        </div>
                        <div className="grid gap-3 pt-4">
                            <Button
                                size="lg"
                                className="w-full gap-2"
                                onClick={handleComplete}
                                disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
                            >
                                <Rocket className="h-5 w-5" />
                                {data.targetDestination === 'australia'
                                    ? t.calculatePoints
                                    : data.targetDestination === 'portugal'
                                        ? (language === 'ar' ? 'تحقق من الأهلية' : 'Check Eligibility')
                                        : t.calculateCrs}
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full gap-2"
                                onClick={handleComplete}
                                disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
                            >
                                <Target className="h-5 w-5" />
                                {t.generateChecklist}
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg relative overflow-hidden">
                {/* Skip button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
                    onClick={handleSkip}
                >
                    <X className="h-4 w-4 mr-1" />
                    {t.skip}
                </Button>

                <CardHeader className="pt-12 pb-2">
                    {/* Progress bar */}
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{language === "ar" ? `الخطوة ${step}` : `Step ${step}`}</span>
                            <span>{language === "ar" ? `من ${totalSteps}` : `of ${totalSteps}`}</span>
                        </div>
                        <Progress value={(step / totalSteps) * 100} className="h-2" />
                    </div>
                </CardHeader>

                <CardContent className="pb-6">
                    {renderStep()}

                    {/* Navigation buttons */}
                    {step < 6 && (
                        <div className="flex items-center justify-between mt-8 pt-4 border-t">
                            {step > 1 ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(step - 1)}
                                    className="gap-2"
                                >
                                    <ArrowLeft className={cn("h-4 w-4", language === "ar" && "rotate-180")} />
                                    {t.previous}
                                </Button>
                            ) : (
                                <div />
                            )}
                            <Button
                                onClick={() => setStep(step + 1)}
                                className="gap-2"
                            >
                                {t.next}
                                <ArrowRight className={cn("h-4 w-4", language === "ar" && "rotate-180")} />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Export helper for checking onboarding status
export function isOnboardingComplete(): boolean {
    if (typeof window === 'undefined') return true;
    const status = localStorage.getItem(ONBOARDING_KEY);
    return status === "true" || status === "skipped";
}

export function resetOnboarding(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ONBOARDING_KEY);
        localStorage.removeItem(ONBOARDING_DATA_KEY);
    }
}
