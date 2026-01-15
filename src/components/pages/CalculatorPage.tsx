'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { DrawComparison } from "@/components/DrawComparison";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getProfile } from "@/actions/profile";
import { calculateCrsScore } from "@/actions/crs";
import { calculateCRS, CrsResult } from "@/lib/crs-calculator";
import { convertToClb, LanguageTestType } from "@/lib/clb-conversion";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Calculator as CalculatorIcon,
  User,
  LogOut,
  TrendingUp,
  Award,
  Loader2,
  Save,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load AustraliaCalculator to reduce initial bundle size
const AustraliaCalculator = dynamic(() => import("../AustraliaCalculator").then(mod => mod.AustraliaCalculator), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  ),
});

// Safe parseInt helper to prevent NaN errors
const safeParseInt = (value: string, defaultValue: number, min?: number, max?: number): number => {
  const parsed = parseFloat(value); // Changed to parseFloat for IELTS scores (e.g. 7.5)
  if (isNaN(parsed)) return defaultValue;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return parsed;
};

export default function CalculatorPage() {
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isPreFilled, setIsPreFilled] = useState(false);

  // Language test state
  const [testType, setTestType] = useState<LanguageTestType | "clb">("clb");
  const [rawScores, setRawScores] = useState({
    speaking: "",
    listening: "",
    reading: "",
    writing: ""
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', 'get'],
    queryFn: getProfile,
  });

  const [formData, setFormData] = useState({
    age: 25,
    educationLevel: "bachelor" as const,
    firstLanguageTest: { speaking: 7, listening: 7, reading: 7, writing: 7 },
    secondLanguageTest: undefined as { speaking: number; listening: number; reading: number; writing: number } | undefined,
    canadianWorkExperience: 0,
    hasSpouse: false,
    spouseEducation: undefined as "none" | "high_school" | "one_year" | "two_year" | "bachelor" | "two_or_more" | "master" | "phd" | undefined,
    spouseLanguageTest: undefined as { speaking: number; listening: number; reading: number; writing: number } | undefined,
    spouseCanadianWorkExperience: undefined as number | undefined,
    foreignWorkExperience: 3,
    hasCertificateOfQualification: false,
    hasCanadianSiblings: false,
    hasFrenchLanguageSkills: false,
    hasProvincialNomination: false,
    hasValidJobOffer: false,
    jobOfferNOC: "none" as const,
    hasCanadianEducation: false,
    canadianEducationLevel: undefined as "one_two_year" | "three_year_plus" | "master_phd" | undefined,
  });

  const [result, setResult] = useState<CrsResult | null>(null);
  const debouncedFormData = useDebounce(formData, 500);

  // Auto-populate from profile
  useEffect(() => {
    if (profile && !isPreFilled) {
      const age = profile.dateOfBirth
        ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()
        : 25;

      const educationMap: Record<string, "none" | "high_school" | "bachelor" | "two_or_more" | "master" | "phd"> = {
        high_school: "high_school",
        bachelor: "bachelor",
        master: "master",
        phd: "phd",
      };

      const newFormData: any = {
        ...formData,
        age,
      };

      if (profile.educationLevel && educationMap[profile.educationLevel]) {
        newFormData.educationLevel = educationMap[profile.educationLevel];
      }

      if (profile.yearsOfExperience) {
        newFormData.foreignWorkExperience = profile.yearsOfExperience;
      }

      if (profile.ieltsScore) {
        // Assume IELTS if score is present
        setTestType("ielts");
        const score = profile.ieltsScore; // String
        setRawScores({
          speaking: score,
          listening: score,
          reading: score,
          writing: score
        });

        // Calculate CLB
        const clb = convertToClb("ielts", {
          speaking: parseFloat(score),
          listening: parseFloat(score),
          reading: parseFloat(score),
          writing: parseFloat(score)
        });

        newFormData.firstLanguageTest = clb;
      }

      if (profile.maritalStatus === "married") {
        newFormData.hasSpouse = true;
      }

      setFormData(newFormData);
      setIsPreFilled(true);
      toast.success(
        language === "ar"
          ? "تم ملء الحقول من ملفك الشخصي"
          : "Fields pre-filled from your profile"
      );
    }
  }, [profile, isPreFilled, language]);

  // Handle raw score changes
  const handleRawScoreChange = (field: keyof typeof rawScores, value: string) => {
    setRawScores(prev => {
      const newScores = { ...prev, [field]: value };

      // Convert to CLB if test type is not 'clb'
      if (testType !== "clb") {
        const numericScores = {
          speaking: parseFloat(newScores.speaking) || 0,
          listening: parseFloat(newScores.listening) || 0,
          reading: parseFloat(newScores.reading) || 0,
          writing: parseFloat(newScores.writing) || 0
        };

        const clb = convertToClb(testType, numericScores);
        setFormData(prevData => ({
          ...prevData,
          firstLanguageTest: clb
        }));
      }

      return newScores;
    });
  };

  // Handle test type change
  const handleTestTypeChange = (type: LanguageTestType | "clb") => {
    setTestType(type);
    // Reset raw scores if switching types? Maybe keep them.
    // Recalculate CLB based on current raw scores if possible
    if (type !== "clb") {
      const numericScores = {
        speaking: parseFloat(rawScores.speaking) || 0,
        listening: parseFloat(rawScores.listening) || 0,
        reading: parseFloat(rawScores.reading) || 0,
        writing: parseFloat(rawScores.writing) || 0
      };
      const clb = convertToClb(type, numericScores);
      setFormData(prev => ({ ...prev, firstLanguageTest: clb }));
    }
  };


  // Real-time calculation logic...
  useEffect(() => {
    try {
      const calcResult = calculateCRS(debouncedFormData);
      setResult(calcResult);
    } catch (e) {
      console.error("Calculation error:", e);
    }
  }, [debouncedFormData]);

  const saveMutation = useMutation({
    mutationFn: calculateCrsScore,
    onSuccess: (data) => {
      // Result is already updated by real-time calculation, but we can sync just in case
      setResult(data);
      toast.success(language === "ar" ? "تم حفظ التقييم بنجاح" : "Assessment saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      saveAssessment: true,
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">
              {language === "ar" ? "هجرة" : "Hijraah"}
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden md:block">
              <Button variant="ghost" size="sm">
                {t("nav.dashboard")}
              </Button>
            </Link>
            <Link href="/chat" className="hidden md:block">
              <Button variant="ghost" size="sm">
                {t("nav.chat")}
              </Button>
            </Link>
            <LanguageToggle />
            <Link href="/profile" className="hidden md:block">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.profile")}</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalculatorIcon className="h-8 w-8" />
              {profile?.targetDestination === 'australia' ? (language === "ar" ? "حاسبة النقاط الأسترالية" : "Australia Points Calculator") : t("calculator.title")}
            </h1>
            <p className="text-muted-foreground">
              {profile?.targetDestination === 'australia'
                ? (language === "ar" ? "تحقق من أهليتك للهجرة إلى أستراليا" : "Check your eligibility for Australian immigration")
                : t("calculator.subtitle")}
            </p>
          </div>

          {profile?.targetDestination === 'australia' ? (
            <AustraliaCalculator />
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Calculator Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "ar" ? "معلوماتك الشخصية" : "Your Information"}</CardTitle>
                    <CardDescription>
                      {language === "ar"
                        ? "أدخل معلوماتك لحساب نقاط CRS الخاصة بك"
                        : "Enter your information to calculate your CRS score"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Age */}
                    <div className="space-y-2">
                      <Label htmlFor="age">{language === "ar" ? "العمر" : "Age"}</Label>
                      <Input
                        id="age"
                        type="number"
                        min="18"
                        max="60"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: safeParseInt(e.target.value, 25, 18, 60) })}
                      />
                    </div>

                    {/* Education Level */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="education">{language === "ar" ? "المستوى التعليمي" : "Education Level"}</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{language === "ar" ? "المستوى التعليمي الأعلى يعطي نقاطاً أكثر ويزيد نقاط قابلية النقل." : "Higher education yields more points and boosts skill transferability score."}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select
                        value={formData.educationLevel}
                        onValueChange={(value: any) => setFormData({ ...formData, educationLevel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high_school">{language === "ar" ? "ثانوية عامة" : "High School"}</SelectItem>
                          <SelectItem value="one_year">{language === "ar" ? "دبلوم سنة واحدة" : "One-Year Diploma"}</SelectItem>
                          <SelectItem value="two_year">{language === "ar" ? "دبلوم سنتين" : "Two-Year Diploma"}</SelectItem>
                          <SelectItem value="bachelor">{language === "ar" ? "بكالوريوس" : "Bachelor's Degree"}</SelectItem>
                          <SelectItem value="two_or_more">{language === "ar" ? "بكالوريوسين أو أكثر" : "Two or More Degrees"}</SelectItem>
                          <SelectItem value="master">{language === "ar" ? "ماجستير" : "Master's Degree"}</SelectItem>
                          <SelectItem value="phd">{language === "ar" ? "دكتوراه" : "PhD"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* First Language Test */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-semibold">
                            {language === "ar" ? "اختبار اللغة الأولى" : "First Language Test"}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "اختر نوع الاختبار والنقاط" : "Select your test type and scores"}
                          </p>
                        </div>
                        <Select
                          value={testType}
                          onValueChange={(value: "clb" | LanguageTestType) => handleTestTypeChange(value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clb">CLB Level (0-10)</SelectItem>
                            <SelectItem value="ielts">IELTS General</SelectItem>
                            <SelectItem value="celpip">CELPIP General</SelectItem>
                            <SelectItem value="tef">TEF Canada</SelectItem>
                            <SelectItem value="tcf">TCF Canada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["listening", "reading", "writing", "speaking"].map((skill) => (
                          <div key={skill} className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="capitalize">
                                {language === "ar"
                                  ? (skill === 'listening' ? 'استماع' : skill === 'reading' ? 'قراءة' : skill === 'writing' ? 'كتابة' : 'تحدث')
                                  : skill}
                              </Label>
                              {testType === "clb" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Canadian Language Benchmark Level</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>

                            <Input
                              type="number"
                              min="0"
                              max={testType === "clb" ? 10 : testType === "ielts" ? 9 : undefined}
                              step={testType === "ielts" ? "0.5" : "1"}
                              placeholder={testType === "clb" ? "CLB" : "Score"}
                              value={
                                testType === "clb"
                                  // @ts-ignore - dynamic key access
                                  ? formData.firstLanguageTest[skill]
                                  // @ts-ignore
                                  : rawScores[skill]
                              }
                              onChange={(e) => {
                                if (testType === "clb") {
                                  setFormData({
                                    ...formData,
                                    firstLanguageTest: {
                                      ...formData.firstLanguageTest,
                                      [skill]: safeParseInt(e.target.value, 0, 0, 10)
                                    },
                                  })
                                } else {
                                  // @ts-ignore
                                  handleRawScoreChange(skill, e.target.value)
                                }
                              }}
                            />
                            {testType !== "clb" && (
                              <p className="text-xs text-muted-foreground text-right">
                                CLB:
                                {/* @ts-ignore */}
                                {formData.firstLanguageTest[skill]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar"
                          ? "سيتم تحويل نقاطك تلقائياً إلى مستوى CLB"
                          : "Your scores will be automatically converted to CLB levels"}
                      </p>
                    </div>

                    <Separator />

                    {/* Work Experience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label>{language === "ar" ? "خبرة العمل الكندية (سنوات)" : "Canadian Work Experience (years)"}</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{language === "ar" ? "سنة واحدة على الأقل مطلوبة لفئة الخبرة الكندية (CEC)." : "At least 1 year is required for Canadian Experience Class (CEC)."}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={formData.canadianWorkExperience}
                          onChange={(e) => setFormData({ ...formData, canadianWorkExperience: safeParseInt(e.target.value, 0, 0, 10) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label>{language === "ar" ? "خبرة العمل الأجنبية (سنوات)" : "Foreign Work Experience (years)"}</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{language === "ar" ? "3 سنوات أو أكثر تعطي أقصى نقاط لقابلية النقل مع مستوى لغة جيد." : "3+ years gives maximum skill transferability points when combined with good language scores."}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={formData.foreignWorkExperience}
                          onChange={(e) => setFormData({ ...formData, foreignWorkExperience: safeParseInt(e.target.value, 0, 0, 20) })}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Additional Factors */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">{language === "ar" ? "عوامل إضافية" : "Additional Factors"}</Label>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="spouse">{language === "ar" ? "لديك زوج/زوجة" : "Have a spouse"}</Label>
                        <Switch
                          id="spouse"
                          checked={formData.hasSpouse}
                          onCheckedChange={(checked) => setFormData({ ...formData, hasSpouse: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="siblings">{language === "ar" ? "لديك أشقاء في كندا" : "Have siblings in Canada"}</Label>
                        <Switch
                          id="siblings"
                          checked={formData.hasCanadianSiblings}
                          onCheckedChange={(checked) => setFormData({ ...formData, hasCanadianSiblings: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="french">{language === "ar" ? "لديك مهارات اللغة الفرنسية" : "Have French language skills"}</Label>
                        <Switch
                          id="french"
                          checked={formData.hasFrenchLanguageSkills}
                          onCheckedChange={(checked) => setFormData({ ...formData, hasFrenchLanguageSkills: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="pnp">{language === "ar" ? "لديك ترشيح إقليمي" : "Have provincial nomination"}</Label>
                        <Switch
                          id="pnp"
                          checked={formData.hasProvincialNomination}
                          onCheckedChange={(checked) => setFormData({ ...formData, hasProvincialNomination: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="joboffer">{language === "ar" ? "لديك عرض عمل صالح" : "Have valid job offer"}</Label>
                        <Switch
                          id="joboffer"
                          checked={formData.hasValidJobOffer}
                          onCheckedChange={(checked) => setFormData({ ...formData, hasValidJobOffer: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="canedu">{language === "ar" ? "لديك تعليم كندي" : "Have Canadian education"}</Label>
                        <Switch
                          id="canedu"
                          checked={formData.hasCanadianEducation}
                          onCheckedChange={(checked) => setFormData({ ...formData, hasCanadianEducation: checked })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results - Sticky Sidebar on Desktop */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  {/* Score Card */}
                  <Card className={cn("border-2 transition-colors", result && result.totalScore >= 470 ? "border-green-500" : "border-primary")}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Award className="h-5 w-5 text-primary" />
                        {t("calculator.yourScore")}
                      </CardTitle>
                      <CardDescription>
                        {language === "ar" ? "النتيجة تتحدث تلقائياً" : "Score updates automatically"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-6 bg-primary/5 rounded-lg mb-4">
                        <div className="text-5xl font-bold text-primary animate-in zoom-in duration-300 key={result?.totalScore}">
                          {result?.totalScore || 0}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {language === "ar" ? "نقاط CRS الإجمالية" : "Total CRS Points"}
                        </p>
                      </div>

                      <Button onClick={handleSave} className="w-full" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {language === "ar" ? "حفظ التقييم" : "Save Assessment"}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Breakdown Mini */}
                  {result && (
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{language === "ar" ? "العوامل الأساسية" : "Core Factors"}</span>
                          <span className="font-medium">{result.breakdown.coreHumanCapital}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{language === "ar" ? "عوامل الزوج/ة" : "Spouse Factors"}</span>
                          <span className="font-medium">{result.breakdown.spouseFactors}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{language === "ar" ? "قابلية النقل" : "Transferability"}</span>
                          <span className="font-medium">{result.breakdown.skillTransferability}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{language === "ar" ? "نقاط إضافية" : "Additional"}</span>
                          <span className="font-medium">{result.breakdown.additionalPoints}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Draw Comparison */}
                  {result && (
                    <DrawComparison score={result.totalScore} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sticky Score Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between container max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              {language === "ar" ? "النقاط الحالية" : "Current Score"}
            </span>
            <span className="text-2xl font-bold text-primary">
              {result?.totalScore || 0}
            </span>
          </div>
          <Button
            onClick={() => {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
            variant="default"
            size="sm"
          >
            {language === "ar" ? "عرض التفاصيل" : "View Details"}
          </Button>
        </div>
      </div>
    </div>
  );
}
