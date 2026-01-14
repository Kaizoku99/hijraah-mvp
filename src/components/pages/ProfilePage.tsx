'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, createProfile, updateProfile } from "@/actions/profile";
import { User, LogOut, Loader2, Save, CheckCircle, ArrowLeft, ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CountrySelect } from "@/components/CountrySelect";

const PROFILE_DRAFT_KEY = "hijraah_profile_draft";

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', 'get'],
    queryFn: getProfile,
  });

  const [formData, setFormData] = useState({
    dateOfBirth: "",
    nationality: "",
    sourceCountry: "",
    currentCountry: "",
    maritalStatus: "",
    educationLevel: "",
    fieldOfStudy: "",
    yearsOfExperience: "",
    currentOccupation: "",
    nocCode: "",
    englishLevel: "",
    frenchLevel: "",
    ieltsScore: "",
    tefScore: "",
    targetDestination: "canada",
    immigrationPathway: "",
  });

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Load draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !profile) {
      const saved = localStorage.getItem(PROFILE_DRAFT_KEY);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...draft }));
          toast.info(
            language === "ar"
              ? "تم استعادة المسودة المحفوظة"
              : "Draft restored from previous session"
          );
        } catch { }
      }
    }
  }, [profile, language]);

  useEffect(() => {
    if (profile) {
      setFormData({
        dateOfBirth: profile.dateOfBirth ? (profile.dateOfBirth instanceof Date ? profile.dateOfBirth.toISOString().split('T')[0] : profile.dateOfBirth) : "",
        nationality: profile.nationality || "",
        sourceCountry: profile.sourceCountry || "",
        currentCountry: profile.currentCountry || "",
        maritalStatus: profile.maritalStatus || "",
        educationLevel: profile.educationLevel || "",
        fieldOfStudy: profile.fieldOfStudy || "",
        yearsOfExperience: profile.yearsOfExperience?.toString() || "",
        currentOccupation: profile.currentOccupation || "",
        nocCode: profile.nocCode || "",
        englishLevel: profile.englishLevel || "",
        frenchLevel: profile.frenchLevel || "",
        ieltsScore: profile.ieltsScore || "",
        tefScore: profile.tefScore || "",
        targetDestination: profile.targetDestination || "canada",
        immigrationPathway: profile.immigrationPathway || "",
      });
    }
  }, [profile]);

  // Auto-save draft to localStorage on form change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasData = Object.values(formData).some(v => v !== "" && v !== "canada");
      if (hasData) {
        localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(formData));
      }
    }
  }, [formData]);

  const createProfileMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(language === "ar" ? "تم حفظ الملف الشخصي بنجاح" : "Profile saved successfully");
    },
    onError: (error: any) => {
      toast.error(language === "ar" ? "فشل حفظ الملف الشخصي" : "Failed to save profile");
      console.error(error);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(language === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
      // Clear draft on successful save
      localStorage.removeItem(PROFILE_DRAFT_KEY);
    },
    onError: (error: any) => {
      toast.error(language === "ar" ? "فشل تحديث الملف الشخصي" : "Failed to update profile");
      console.error(error);
    },
  });

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const profileData = {
      ...formData,
      yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
      maritalStatus: formData.maritalStatus as "single" | "married" | "divorced" | "widowed" | undefined,
      educationLevel: formData.educationLevel as
        | "high_school"
        | "bachelor"
        | "master"
        | "phd"
        | "other"
        | undefined,
      englishLevel: formData.englishLevel as "none" | "basic" | "intermediate" | "advanced" | "native" | undefined,
      frenchLevel: formData.frenchLevel as "none" | "basic" | "intermediate" | "advanced" | "native" | undefined,
      immigrationPathway: formData.immigrationPathway as
        | "express_entry"
        | "study_permit"
        | "family_sponsorship"
        | "other"
        | undefined,
    };

    if (profile) {
      updateProfileMutation.mutate(profileData);
    } else {
      createProfileMutation.mutate(profileData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };



  const completionPercentage = () => {
    // Weighted completion: Basic (10%), Education (30%), Work (30%), Language (30%)
    const basicFields = ['dateOfBirth', 'nationality', 'currentCountry', 'maritalStatus'];
    const educationFields = ['educationLevel', 'fieldOfStudy'];
    const workFields = ['yearsOfExperience', 'currentOccupation', 'nocCode'];
    const languageFields = ['englishLevel', 'frenchLevel', 'ieltsScore', 'tefScore'];

    const calcSectionScore = (fields: string[]) => {
      const filled = fields.filter(f => formData[f as keyof typeof formData] !== "").length;
      return fields.length > 0 ? filled / fields.length : 0;
    };

    const basicScore = calcSectionScore(basicFields) * 10;
    const eduScore = calcSectionScore(educationFields) * 30;
    const workScore = calcSectionScore(workFields) * 30;
    const langScore = calcSectionScore(languageFields) * 30;

    return Math.round(basicScore + eduScore + workScore + langScore);
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
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container max-w-4xl space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold mb-2">{t("nav.profile")}</h2>
            <p className="text-muted-foreground">
              {language === "ar"
                ? "أكمل ملفك الشخصي للحصول على توصيات مخصصة وحساب دقيق لنقاط CRS"
                : "Complete your profile to get personalized recommendations and accurate CRS score calculation"}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-8">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{language === "ar" ? `الخطوة ${step} من ${totalSteps}` : `Step ${step} of ${totalSteps}`}</span>
              <span>{completionPercentage()}% {language === "ar" ? "مكتمل" : "Complete"}</span>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>

          {profileLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Step 1: Personal Information */}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "ar" ? "المعلومات الشخصية" : "Personal Information"}</CardTitle>
                    <CardDescription>
                      {language === "ar"
                        ? "معلومات أساسية عنك"
                        : "Basic information about you"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">
                          {language === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                          <span className="text-destructive"> *</span>
                        </Label>
                        <DatePicker
                          value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                          onChange={(date) => handleChange("dateOfBirth", date ? date.toISOString().split('T')[0] : "")}
                          placeholder={language === "ar" ? "اختر التاريخ" : "Select date"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nationality">
                          {language === "ar" ? "الجنسية" : "Nationality"}
                        </Label>
                        <CountrySelect
                          value={formData.nationality}
                          onValueChange={(val) => handleChange("nationality", val)}
                          placeholder={language === "ar" ? "مثال: تونسي" : "e.g., Tunisian"}
                          language={language}
                        />
                      </div>



                      <div className="space-y-2">
                        <Label htmlFor="currentCountry">
                          {language === "ar" ? "البلد الحالي" : "Current Country"}
                        </Label>
                        <CountrySelect
                          value={formData.currentCountry}
                          onValueChange={(val) => handleChange("currentCountry", val)}
                          placeholder={language === "ar" ? "مثال: الإمارات" : "e.g., UAE"}
                          language={language}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maritalStatus">
                          {language === "ar" ? "الحالة الاجتماعية" : "Marital Status"}
                        </Label>
                        <Select
                          value={formData.maritalStatus}
                          onValueChange={(value) => handleChange("maritalStatus", value)}
                        >
                          <SelectTrigger id="maritalStatus">
                            <SelectValue
                              placeholder={language === "ar" ? "اختر الحالة الاجتماعية" : "Select marital status"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">{language === "ar" ? "أعزب" : "Single"}</SelectItem>
                            <SelectItem value="married">{language === "ar" ? "متزوج" : "Married"}</SelectItem>
                            <SelectItem value="divorced">{language === "ar" ? "مطلق" : "Divorced"}</SelectItem>
                            <SelectItem value="widowed">{language === "ar" ? "أرمل" : "Widowed"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Education */}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "ar" ? "التعليم" : "Education"}</CardTitle>
                    <CardDescription>
                      {language === "ar" ? "خلفيتك التعليمية" : "Your educational background"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label htmlFor="educationLevel" className="cursor-help flex items-center gap-1">
                                {language === "ar" ? "المستوى التعليمي" : "Education Level"}
                                <span className="text-destructive"> *</span>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[250px]">
                              <p className="text-xs">
                                {language === "ar"
                                  ? "يؤثر على نقاط CRS. تأكد من إجراء تقييم الشهادات (ECA) لشهاداتك."
                                  : "Impacts CRS score. Ensure you get an Educational Credential Assessment (ECA) for your credentials."}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Select
                          value={formData.educationLevel}
                          onValueChange={(value) => handleChange("educationLevel", value)}
                        >
                          <SelectTrigger id="educationLevel">
                            <SelectValue
                              placeholder={language === "ar" ? "اختر المستوى التعليمي" : "Select education level"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high_school">
                              {language === "ar" ? "ثانوية عامة" : "High School"}
                            </SelectItem>
                            <SelectItem value="bachelor">
                              {language === "ar" ? "بكالوريوس" : "Bachelor's Degree"}
                            </SelectItem>
                            <SelectItem value="master">
                              {language === "ar" ? "ماجستير" : "Master's Degree"}
                            </SelectItem>
                            <SelectItem value="phd">{language === "ar" ? "دكتوراه" : "PhD"}</SelectItem>
                            <SelectItem value="other">{language === "ar" ? "أخرى" : "Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fieldOfStudy">
                          {language === "ar" ? "مجال الدراسة" : "Field of Study"}
                        </Label>
                        <Input
                          id="fieldOfStudy"
                          value={formData.fieldOfStudy}
                          onChange={(e) => handleChange("fieldOfStudy", e.target.value)}
                          placeholder={language === "ar" ? "مثال: هندسة الحاسوب" : "e.g., Computer Engineering"}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Work Experience */}
              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "ar" ? "الخبرة العملية" : "Work Experience"}</CardTitle>
                    <CardDescription>
                      {language === "ar" ? "خبرتك المهنية" : "Your professional experience"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="yearsOfExperience">
                          {language === "ar" ? "سنوات الخبرة" : "Years of Experience"}
                        </Label>
                        <Input
                          id="yearsOfExperience"
                          type="number"
                          min="0"
                          value={formData.yearsOfExperience}
                          onChange={(e) => handleChange("yearsOfExperience", e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currentOccupation">
                          {language === "ar" ? "المهنة الحالية" : "Current Occupation"}
                        </Label>
                        <Input
                          id="currentOccupation"
                          value={formData.currentOccupation}
                          onChange={(e) => handleChange("currentOccupation", e.target.value)}
                          placeholder={language === "ar" ? "مثال: مهندس برمجيات" : "e.g., Software Engineer"}
                        />
                      </div>

                      <div className="space-y-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label htmlFor="nocCode" className="cursor-help flex items-center gap-1">
                                {language === "ar" ? "رمز NOC" : "NOC Code"}
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[250px]">
                              <p className="text-xs">
                                {language === "ar"
                                  ? "التصنيف المهني الوطني الكندي. ابحث عن رمز مهنتك على موقع Canada.ca."
                                  : "National Occupational Classification - find your job code at Canada.ca."}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Input
                          id="nocCode"
                          value={formData.nocCode}
                          onChange={(e) => handleChange("nocCode", e.target.value)}
                          placeholder="e.g., 21232"
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === "ar"
                            ? "رمز التصنيف المهني الوطني الكندي"
                            : "National Occupational Classification code"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Language Proficiency */}
              {step === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "ar" ? "إتقان اللغة" : "Language Proficiency"}</CardTitle>
                    <CardDescription>
                      {language === "ar" ? "مهاراتك اللغوية" : "Your language skills"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="englishLevel">
                          {language === "ar" ? "مستوى الإنجليزية" : "English Level"}
                        </Label>
                        <Select
                          value={formData.englishLevel}
                          onValueChange={(value) => handleChange("englishLevel", value)}
                        >
                          <SelectTrigger id="englishLevel">
                            <SelectValue
                              placeholder={language === "ar" ? "اختر مستوى الإنجليزية" : "Select English level"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{language === "ar" ? "لا يوجد" : "None"}</SelectItem>
                            <SelectItem value="basic">{language === "ar" ? "أساسي" : "Basic"}</SelectItem>
                            <SelectItem value="intermediate">
                              {language === "ar" ? "متوسط" : "Intermediate"}
                            </SelectItem>
                            <SelectItem value="advanced">{language === "ar" ? "متقدم" : "Advanced"}</SelectItem>
                            <SelectItem value="native">{language === "ar" ? "لغة أم" : "Native"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ieltsScore">
                          {language === "ar" ? "درجة IELTS" : "IELTS Score"}
                        </Label>
                        <Input
                          id="ieltsScore"
                          value={formData.ieltsScore}
                          onChange={(e) => handleChange("ieltsScore", e.target.value)}
                          placeholder="e.g., 7.5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="frenchLevel">
                          {language === "ar" ? "مستوى الفرنسية" : "French Level"}
                        </Label>
                        <Select
                          value={formData.frenchLevel}
                          onValueChange={(value) => handleChange("frenchLevel", value)}
                        >
                          <SelectTrigger id="frenchLevel">
                            <SelectValue
                              placeholder={language === "ar" ? "اختر مستوى الفرنسية" : "Select French level"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{language === "ar" ? "لا يوجد" : "None"}</SelectItem>
                            <SelectItem value="basic">{language === "ar" ? "أساسي" : "Basic"}</SelectItem>
                            <SelectItem value="intermediate">
                              {language === "ar" ? "متوسط" : "Intermediate"}
                            </SelectItem>
                            <SelectItem value="advanced">{language === "ar" ? "متقدم" : "Advanced"}</SelectItem>
                            <SelectItem value="native">{language === "ar" ? "لغة أم" : "Native"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tefScore">
                          {language === "ar" ? "درجة TEF" : "TEF Score"}
                        </Label>
                        <Input
                          id="tefScore"
                          value={formData.tefScore}
                          onChange={(e) => handleChange("tefScore", e.target.value)}
                          placeholder="e.g., 400"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Immigration Goals */}
              {step === 5 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "ar" ? "أهداف الهجرة" : "Immigration Goals"}</CardTitle>
                    <CardDescription>
                      {language === "ar" ? "خططك للهجرة" : "Your immigration plans"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="targetDestination">
                          {language === "ar" ? "الوجهة المستهدفة" : "Target Destination"}
                        </Label>
                        <Select
                          value={formData.targetDestination}
                          onValueChange={(value) => handleChange("targetDestination", value)}
                        >
                          <SelectTrigger id="targetDestination">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="canada">{language === "ar" ? "كندا" : "Canada"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="immigrationPathway">
                          {language === "ar" ? "مسار الهجرة" : "Immigration Pathway"}
                        </Label>
                        <Select
                          value={formData.immigrationPathway}
                          onValueChange={(value) => handleChange("immigrationPathway", value)}
                        >
                          <SelectTrigger id="immigrationPathway">
                            <SelectValue
                              placeholder={language === "ar" ? "اختر مسار الهجرة" : "Select immigration pathway"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="express_entry">
                              {language === "ar" ? "الدخول السريع" : "Express Entry"}
                            </SelectItem>
                            <SelectItem value="study_permit">
                              {language === "ar" ? "تصريح دراسة" : "Study Permit"}
                            </SelectItem>
                            <SelectItem value="family_sponsorship">
                              {language === "ar" ? "كفالة عائلية" : "Family Sponsorship"}
                            </SelectItem>
                            <SelectItem value="other">{language === "ar" ? "أخرى" : "Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation & Submit Buttons */}
              <div className="flex justify-between gap-4 pt-4">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="gap-2"
                  >
                    <ArrowLeft className={cn("h-4 w-4", language === "ar" && "rotate-180")} />
                    {language === "ar" ? "الخطوة السابقة" : "Previous Step"}
                  </Button>
                ) : (
                  <Link href="/dashboard">
                    <Button type="button" variant="ghost">
                      {language === "ar" ? "إلغاء والعودة" : "Cancel & Return"}
                    </Button>
                  </Link>
                )}

                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="gap-2"
                  >
                    {language === "ar" ? "الخطوة التالية" : "Next Step"}
                    <ArrowRight className={cn("h-4 w-4", language === "ar" && "rotate-180")} />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
                    className="gap-2"
                  >
                    {createProfileMutation.isPending || updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {language === "ar" ? "حفظ وإنهاء" : "Save & Finish"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
