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
import { Calculator as CalculatorIcon, User, LogOut, TrendingUp, Award, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function CalculatorPage() {
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isPreFilled, setIsPreFilled] = useState(false);

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

  const [result, setResult] = useState<any>(null);

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
        const score = parseFloat(profile.ieltsScore);
        newFormData.firstLanguageTest = {
          speaking: score,
          listening: score,
          reading: score,
          writing: score,
        };
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

  const calculateMutation = useMutation({
    mutationFn: calculateCrsScore,
    onSuccess: (data) => {
      setResult(data);
      toast.success(language === "ar" ? "تم حساب النقاط بنجاح" : "Score calculated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleCalculate = () => {
    calculateMutation.mutate({
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {language === "ar" ? "هجرة" : "Hijraah"}
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                {t("nav.dashboard")}
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                {t("nav.chat")}
              </Button>
            </Link>
            <LanguageToggle />
            <Link href="/profile">
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalculatorIcon className="h-8 w-8" />
              {t("calculator.title")}
            </h1>
            <p className="text-muted-foreground">{t("calculator.subtitle")}</p>
          </div>

          {/* Calculator Form */}
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
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                />
              </div>

              {/* Education Level */}
              <div className="space-y-2">
                <Label htmlFor="education">{language === "ar" ? "المستوى التعليمي" : "Education Level"}</Label>
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
                <Label className="text-base font-semibold">
                  {language === "ar" ? "اختبار اللغة الأولى (IELTS/CELPIP/TEF)" : "First Language Test (IELTS/CELPIP/TEF)"}
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الاستماع" : "Listening"}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.firstLanguageTest.listening}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          firstLanguageTest: { ...formData.firstLanguageTest, listening: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "القراءة" : "Reading"}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.firstLanguageTest.reading}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          firstLanguageTest: { ...formData.firstLanguageTest, reading: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الكتابة" : "Writing"}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.firstLanguageTest.writing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          firstLanguageTest: { ...formData.firstLanguageTest, writing: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "التحدث" : "Speaking"}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.firstLanguageTest.speaking}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          firstLanguageTest: { ...formData.firstLanguageTest, speaking: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar"
                    ? "أدخل مستوى CLB (0-10). CLB 9+ يعطي أعلى النقاط"
                    : "Enter CLB level (0-10). CLB 9+ gives maximum points"}
                </p>
              </div>

              <Separator />

              {/* Work Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "خبرة العمل الكندية (سنوات)" : "Canadian Work Experience (years)"}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.canadianWorkExperience}
                    onChange={(e) => setFormData({ ...formData, canadianWorkExperience: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "خبرة العمل الأجنبية (سنوات)" : "Foreign Work Experience (years)"}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.foreignWorkExperience}
                    onChange={(e) => setFormData({ ...formData, foreignWorkExperience: parseInt(e.target.value) })}
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

              <Button onClick={handleCalculate} className="w-full" disabled={calculateMutation.isPending}>
                {calculateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "ar" ? "جاري الحساب..." : "Calculating..."}
                  </>
                ) : (
                  <>
                    <CalculatorIcon className="mr-2 h-4 w-4" />
                    {t("calculator.calculate")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-primary" />
                  {t("calculator.yourScore")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Total Score */}
                <div className="text-center p-6 bg-primary/10 rounded-lg">
                  <div className="text-6xl font-bold text-primary">{result.totalScore}</div>
                  <p className="text-muted-foreground mt-2">
                    {language === "ar" ? "نقاط CRS الإجمالية" : "Total CRS Points"}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{result.breakdown.coreHumanCapital}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === "ar" ? "العوامل الأساسية" : "Core Factors"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{result.breakdown.spouseFactors}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === "ar" ? "عوامل الزوج/ة" : "Spouse Factors"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{result.breakdown.skillTransferability}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === "ar" ? "قابلية النقل" : "Transferability"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{result.breakdown.additionalPoints}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === "ar" ? "نقاط إضافية" : "Additional"}
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t("calculator.recommendations")}
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Draw Comparison */}
          {result && (
            <DrawComparison score={result.totalScore} />
          )}
        </div>
      </main>
    </div>
  );
}
