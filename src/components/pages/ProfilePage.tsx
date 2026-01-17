'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, createProfile, updateProfile } from "@/actions/profile";
import { User, LogOut, Loader2, Save, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const PROFILE_DRAFT_KEY = "hijraah_profile_draft";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { nocList } from "@/data/nocList";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "@/hooks/useDebounce";
import { PersonalDetailsStep } from "@/components/profile/PersonalDetailsStep";
import { EducationStep } from "@/components/profile/EducationStep";
import { WorkExperienceStep } from "@/components/profile/WorkExperienceStep";
import { LanguageStep } from "@/components/profile/LanguageStep";
import { GoalsStep } from "@/components/profile/GoalsStep";



export default function Profile() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: queryKeys.user.profile(),
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

  const debouncedFormData = useDebounce(formData, 1000);

  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [shakeStep, setShakeStep] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [openCombobox, setOpenCombobox] = useState(false);



  const [draft, setDraft] = useLocalStorage<any>(PROFILE_DRAFT_KEY, null);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!profile && draft) {
      // Check if draft has meaningful data
      const hasContent = Object.keys(draft).length > 0;
      if (hasContent) {
        setFormData(prev => ({ ...prev, ...draft }));
        toast.info(
          language === "ar"
            ? "تم استعادة المسودة المحفوظة"
            : "Draft restored from previous session"
        );
      }
    }
  }, [profile, language, draft]); // Added draft to deps, but be careful of loops if we were setting draft here (we aren't)

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

  // Auto-save draft to local storage on form change
  useEffect(() => {
    const hasData = Object.values(debouncedFormData).some(v => v !== "" && v !== "canada");
    if (hasData) {
      setDraft(debouncedFormData);
    }
  }, [debouncedFormData, setDraft]);

  const createProfileMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      toast.success(language === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
      // Clear draft on successful save
      setDraft(null);
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

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.dateOfBirth) newErrors.dateOfBirth = true;
      if (!formData.nationality) newErrors.nationality = true;
      if (!formData.currentCountry) newErrors.currentCountry = true;
      if (!formData.maritalStatus) newErrors.maritalStatus = true;
    } else if (currentStep === 2) {
      if (!formData.educationLevel) newErrors.educationLevel = true;
      // fieldOfStudy is often optional but good practice to require if education > high school
    } else if (currentStep === 3) {
      if (!formData.yearsOfExperience) newErrors.yearsOfExperience = true;
      if (formData.targetDestination === 'canada' && !formData.nocCode) newErrors.nocCode = true;
    } else if (currentStep === 4) {
      if (!formData.englishLevel) newErrors.englishLevel = true;
    } else if (currentStep === 5) {
      if (!formData.immigrationPathway) newErrors.immigrationPathway = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
      setShakeStep(true);
      setTimeout(() => setShakeStep(false), 500); // Reset shake after animation
      toast.error(language === "ar" ? "يرجى ملء الحقول المطلوبة" : "Please fill in all required fields");
    } else {
      setErrors({});
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(step)) return;

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

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field if it exists
    setErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);



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
      <AppHeader
        additionalActions={
          <Link href="/dashboard" className="hidden md:block">
            <Button variant="ghost" size="sm">
              {t("nav.dashboard")}
            </Button>
          </Link>
        }
        showUsage={false}
        showProfile={false}
      />

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
            <form onSubmit={handleSubmit} className={cn("space-y-6 transition-transform duration-100", shakeStep && "animate-shake")}>

              {/* Step 1: Personal Information */}
              {step === 1 && (
                <PersonalDetailsStep
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                  language={language}
                />
              )}

              {/* Step 2: Education */}
              {step === 2 && (
                <EducationStep
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                  language={language}
                />
              )}

              {/* Step 3: Work Experience */}
              {step === 3 && (
                <WorkExperienceStep
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                  language={language}
                />
              )}

              {/* Step 4: Language Proficiency */}
              {step === 4 && (
                <LanguageStep
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                  language={language}
                />
              )}

              {/* Step 5: Immigration Goals */}
              {step === 5 && (
                <GoalsStep
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                  language={language}
                />
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
                    onClick={() => handleNext()}
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
