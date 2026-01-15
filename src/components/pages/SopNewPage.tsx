'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { generateSop } from "@/actions/sop";
import { getProfile } from "@/actions/profile";
import { FileText, User, LogOut, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

const SOP_DRAFT_KEY = "hijraah_sop_draft";
const MIN_CHAR_COUNT = 100;

export default function SopNew() {
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [generationStep, setGenerationStep] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile', 'get'],
    queryFn: getProfile,
  });

  const [formData, setFormData] = useState({
    background: "",
    education: "",
    workExperience: "",
    motivation: "",
    whyCanada: "",
    careerGoals: "",
    whyThisProgram: "",
    uniqueStrengths: "",
    challenges: "",
    targetProgram: "",
    targetInstitution: "",
  });

  const debouncedFormData = useDebounce(formData, 1000);

  // Load draft from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SOP_DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only merge if not empty to avoid overwriting state if initialized differently
          if (Object.keys(parsed).length > 0) {
            setFormData(prev => ({ ...prev, ...parsed }));
            toast.info(language === "ar" ? "تم استعادة المسودة" : "Draft restored");
          }
        } catch { }
      }
    }
  }, [language]);

  // Pre-fill from profile if fields are empty and no draft was loaded (simplified check)
  useEffect(() => {
    if (profile && !localStorage.getItem(SOP_DRAFT_KEY)) {
      setFormData(prev => {
        const newData = { ...prev };
        let changed = false;

        if (!newData.education && profile.educationLevel) {
          newData.education = language === "ar"
            ? `أحمل شهادة ${profile.educationLevel} في تخصص ${profile.fieldOfStudy || ""}...`
            : `I hold a ${profile.educationLevel} degree in ${profile.fieldOfStudy || ""}...`;
          changed = true;
        }

        if (!newData.workExperience && profile.currentOccupation) {
          newData.workExperience = language === "ar"
            ? `أعمل حالياً كـ ${profile.currentOccupation} ولدي ${profile.yearsOfExperience || 0} سنوات خبرة...`
            : `I am currently working as a ${profile.currentOccupation} with ${profile.yearsOfExperience || 0} years of experience...`;
          changed = true;
        }

        return changed ? newData : prev;
      });
    }
  }, [profile, language]);

  // Autosave
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Don't save empty state
      const hasData = Object.values(debouncedFormData).some(v => v.length > 0);
      if (hasData) {
        localStorage.setItem(SOP_DRAFT_KEY, JSON.stringify(debouncedFormData));
      }
    }
  }, [debouncedFormData]);

  const generationSteps = [
    language === "ar" ? "تحليل الخلفية..." : "Analyzing background...",
    language === "ar" ? "إنشاء المقدمة..." : "Creating introduction...",
    language === "ar" ? "كتابة المحتوى..." : "Writing body content...",
    language === "ar" ? "إضافة الخاتمة..." : "Adding conclusion...",
    language === "ar" ? "المراجعة النهائية..." : "Final review...",
  ];

  const generateMutation = useMutation({
    mutationFn: async (data: Parameters<typeof generateSop>[0]) => {
      // Simulate progress steps
      for (let i = 0; i < generationSteps.length; i++) {
        setGenerationStep(generationSteps[i]);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      setGenerationStep(null);
      return generateSop(data);
    },
    onSuccess: (data) => {
      localStorage.removeItem(SOP_DRAFT_KEY);
      toast.success(language === "ar" ? "تم إنشاء خطاب النوايا بنجاح" : "SOP generated successfully");
      router.push(`/sop/${data.sopId}`);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    const requiredFields = ['background', 'whyCanada', 'careerGoals', 'education', 'workExperience'];
    const missing = requiredFields.filter(f => !formData[f as keyof typeof formData]);

    if (missing.length > 0) {
      toast.error(
        language === "ar"
          ? "يرجى ملء جميع الحقول المطلوبة بمحتوى كافٍ"
          : "Please fill in all required fields with sufficient content"
      );
      return;
    }

    generateMutation.mutate({
      background: formData.background,
      education: formData.education,
      workExperience: formData.workExperience,
      motivation: formData.motivation,
      whyCanada: formData.whyCanada,
      careerGoals: formData.careerGoals,
      whyThisProgram: formData.whyThisProgram,
      uniqueStrengths: formData.uniqueStrengths,
      challenges: formData.challenges,
      targetProgram: formData.targetProgram,
      targetInstitution: formData.targetInstitution,
      language: language as "en" | "ar",
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const CharCount = ({ text, min = MIN_CHAR_COUNT }: { text: string, min?: number }) => {
    const count = text.length;
    return (
      <div className={cn("text-xs text-right mt-1", count < min ? "text-amber-500" : "text-green-500")}>
        {count} / {min} {language === "ar" ? "حرف (مستحسن)" : "chars (recommended)"}
      </div>
    );
  };

  // AI Prompt Suggestions based on profile
  const getSuggestions = (field: string): string[] => {
    const suggestions: Record<string, { ar: string[], en: string[] }> = {
      background: {
        ar: ["ابدأ بذكر مكان نشأتك وعائلتك", "اذكر ما شكّل شخصيتك", "صف اهتماماتك المبكرة"],
        en: ["Start with where you grew up", "Mention what shaped your character", "Describe your early interests"]
      },
      education: {
        ar: ["اذكر شهاداتك الجامعية", "صف تخصصك الأكاديمي", "اذكر أي إنجازات أكاديمية"],
        en: ["State your university degrees", "Describe your major", "Mention academic achievements"]
      },
      whyCanada: {
        ar: ["تحدث عن الفرص في كندا", "اذكر جودة المعيشة", "صف البيئة المتعددة الثقافات"],
        en: ["Discuss opportunities in Canada", "Mention quality of life", "Describe multicultural environment"]
      },
      careerGoals: {
        ar: ["حدد أهدافك على المدى القريب والبعيد", "اربط أهدافك بكندا"],
        en: ["Define short and long-term goals", "Connect your goals to Canada"]
      }
    };
    return suggestions[field]?.[language as 'ar' | 'en'] || [];
  };

  const SuggestionChips = ({ field, onClick }: { field: string, onClick: (text: string) => void }) => {
    const suggestions = getSuggestions(field);
    if (suggestions.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onClick(s)}
            className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            💡 {s}
          </button>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="background">
          {language === "ar" ? "خلفيتك الشخصية *" : "Your Background *"}
        </Label>
        <Textarea
          id="background"
          value={formData.background}
          onChange={(e) => handleChange("background", e.target.value)}
          placeholder={
            language === "ar"
              ? "اكتب عن خلفيتك الشخصية، عائلتك، وما شكّل شخصيتك..."
              : "Tell us about your personal background, family, and what shaped you..."
          }
          rows={3}
          className="mt-2 md:min-h-[120px]"
        />
        <CharCount text={formData.background} />
        <SuggestionChips field="background" onClick={(s) => handleChange("background", formData.background + " " + s)} />
      </div>

      <div>
        <Label htmlFor="education">
          {language === "ar" ? "تعليمك *" : "Your Education *"}
        </Label>
        <Textarea
          id="education"
          value={formData.education}
          onChange={(e) => handleChange("education", e.target.value)}
          placeholder={
            language === "ar"
              ? "صف مسيرتك التعليمية، تخصصك، وأي إنجازات أكاديمية..."
              : "Describe your educational journey, major, and any academic achievements..."
          }
          rows={4}
          className="mt-2"
        />
        <CharCount text={formData.education} />
        <SuggestionChips field="education" onClick={(s) => handleChange("education", formData.education + " " + s)} />
      </div>

      <div>
        <Label htmlFor="workExperience">
          {language === "ar" ? "خبرتك العملية *" : "Your Work Experience *"}
        </Label>
        <Textarea
          id="workExperience"
          value={formData.workExperience}
          onChange={(e) => handleChange("workExperience", e.target.value)}
          placeholder={
            language === "ar"
              ? "اذكر خبراتك العملية، المشاريع التي عملت عليها، والمهارات المكتسبة..."
              : "List your work experiences, projects you've worked on, and skills gained..."
          }
          rows={4}
          className="mt-2"
        />
        <CharCount text={formData.workExperience} />
      </div>

      <div>
        <Label htmlFor="motivation">
          {language === "ar" ? "دافعك للهجرة" : "Your Motivation"}
        </Label>
        <Textarea
          id="motivation"
          value={formData.motivation}
          onChange={(e) => handleChange("motivation", e.target.value)}
          placeholder={
            language === "ar"
              ? "ما الذي يدفعك للهجرة إلى كندا؟..."
              : "What motivates you to immigrate to Canada?..."
          }
          rows={3}
          className="mt-2"
        />
        <CharCount text={formData.motivation} min={50} />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="whyCanada">
          {language === "ar" ? "لماذا كندا؟ *" : "Why Canada? *"}
        </Label>
        <Textarea
          id="whyCanada"
          value={formData.whyCanada}
          onChange={(e) => handleChange("whyCanada", e.target.value)}
          placeholder={
            language === "ar"
              ? "لماذا اخترت كندا كوجهة للهجرة؟ ما الذي يجذبك؟..."
              : "Why did you choose Canada as your immigration destination? What attracts you?..."
          }
          rows={5}
          className="mt-2"
        />
        <CharCount text={formData.whyCanada} />
        <SuggestionChips field="whyCanada" onClick={(s) => handleChange("whyCanada", formData.whyCanada + " " + s)} />
      </div>

      <div>
        <Label htmlFor="careerGoals">
          {language === "ar" ? "أهدافك المهنية *" : "Your Career Goals *"}
        </Label>
        <Textarea
          id="careerGoals"
          value={formData.careerGoals}
          onChange={(e) => handleChange("careerGoals", e.target.value)}
          placeholder={
            language === "ar"
              ? "ما هي أهدافك المهنية؟ أين ترى نفسك في المستقبل؟..."
              : "What are your career goals? Where do you see yourself in the future?..."
          }
          rows={4}
          className="mt-2"
        />
        <CharCount text={formData.careerGoals} />
        <SuggestionChips field="careerGoals" onClick={(s) => handleChange("careerGoals", formData.careerGoals + " " + s)} />
      </div>

      <div>
        <Label htmlFor="targetProgram">
          {language === "ar" ? "البرنامج المستهدف" : "Target Program"}
        </Label>
        <Input
          id="targetProgram"
          value={formData.targetProgram}
          onChange={(e) => handleChange("targetProgram", e.target.value)}
          placeholder={
            language === "ar"
              ? "مثال: Express Entry - Federal Skilled Worker"
              : "e.g., Express Entry - Federal Skilled Worker"
          }
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="targetInstitution">
          {language === "ar" ? "الجامعة المستهدفة (إن وجدت)" : "Target Institution (if applicable)"}
        </Label>
        <Input
          id="targetInstitution"
          value={formData.targetInstitution}
          onChange={(e) => handleChange("targetInstitution", e.target.value)}
          placeholder={
            language === "ar"
              ? "مثال: University of Toronto"
              : "e.g., University of Toronto"
          }
          className="mt-2"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="whyThisProgram">
          {language === "ar" ? "لماذا هذا البرنامج؟" : "Why This Program?"}
        </Label>
        <Textarea
          id="whyThisProgram"
          value={formData.whyThisProgram}
          onChange={(e) => handleChange("whyThisProgram", e.target.value)}
          placeholder={
            language === "ar"
              ? "لماذا اخترت هذا البرنامج بالتحديد؟ كيف سيساعدك؟..."
              : "Why did you choose this specific program? How will it help you?..."
          }
          rows={4}
          className="mt-2"
        />
        <CharCount text={formData.whyThisProgram} min={50} />
      </div>

      <div>
        <Label htmlFor="uniqueStrengths">
          {language === "ar" ? "نقاط قوتك الفريدة" : "Your Unique Strengths"}
        </Label>
        <Textarea
          id="uniqueStrengths"
          value={formData.uniqueStrengths}
          onChange={(e) => handleChange("uniqueStrengths", e.target.value)}
          placeholder={
            language === "ar"
              ? "ما الذي يميزك عن المتقدمين الآخرين؟..."
              : "What sets you apart from other applicants?..."
          }
          rows={4}
          className="mt-2"
        />
        <CharCount text={formData.uniqueStrengths} min={50} />
      </div>

      <div>
        <Label htmlFor="challenges">
          {language === "ar" ? "التحديات التي واجهتها" : "Challenges You've Faced"}
        </Label>
        <Textarea
          id="challenges"
          value={formData.challenges}
          onChange={(e) => handleChange("challenges", e.target.value)}
          placeholder={
            language === "ar"
              ? "اذكر أي تحديات واجهتها وكيف تغلبت عليها..."
              : "Mention any challenges you've faced and how you overcame them..."
          }
          rows={4}
          className="mt-2"
        />
        <CharCount text={formData.challenges} min={50} />
      </div>
    </div>
  );

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
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {language === "ar" ? "إنشاء خطاب النوايا" : "Create Statement of Purpose"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ar"
                ? "أجب عن الأسئلة التالية لإنشاء خطاب نوايا احترافي باستخدام الذكاء الاصطناعي"
                : "Answer the following questions to create a professional SOP using AI"}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {language === "ar" ? `الخطوة ${step} من 3` : `Step ${step} of 3`}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((step / 3) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {step === 1 && (language === "ar" ? "الخلفية والخبرة" : "Background & Experience")}
                {step === 2 && (language === "ar" ? "الأهداف والبرنامج" : "Goals & Program")}
                {step === 3 && (language === "ar" ? "التميز والتحديات" : "Uniqueness & Challenges")}
              </CardTitle>
              <CardDescription>
                {step === 1 && (language === "ar" ? "أخبرنا عن خلفيتك وخبراتك" : "Tell us about your background and experiences")}
                {step === 2 && (language === "ar" ? "ما هي أهدافك والبرنامج المستهدف؟" : "What are your goals and target program?")}
                {step === 3 && (language === "ar" ? "ما الذي يميزك؟" : "What makes you stand out?")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              <div className="flex items-center justify-between mt-8">
                {step > 1 ? (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className={cn("h-4 w-4 mr-2", language === "ar" && "rotate-180")} />
                    {language === "ar" ? "السابق" : "Previous"}
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button onClick={() => setStep(step + 1)}>
                    {language === "ar" ? "التالي" : "Next"}
                    <ArrowRight className={cn("h-4 w-4 ml-2", language === "ar" && "rotate-180")} />
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {generationStep || (language === "ar" ? "جاري الإنشاء..." : "Generating...")}
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        {language === "ar" ? "إنشاء خطاب النوايا" : "Generate SOP"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main >
    </div >
  );
}
