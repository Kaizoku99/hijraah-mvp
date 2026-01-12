import { useAuth } from "@/_core/hooks/useAuth";
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
import { trpc } from "@/lib/trpc";
import { User, LogOut, Loader2, Save, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery();

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

  const createProfile = trpc.profile.create.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم حفظ الملف الشخصي بنجاح" : "Profile saved successfully");
    },
    onError: (error) => {
      toast.error(language === "ar" ? "فشل حفظ الملف الشخصي" : "Failed to save profile");
      console.error(error);
    },
  });

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
    },
    onError: (error) => {
      toast.error(language === "ar" ? "فشل تحديث الملف الشخصي" : "Failed to update profile");
      console.error(error);
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
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
      updateProfile.mutate(profileData);
    } else {
      createProfile.mutate(profileData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const sourceCountries = [
    { value: "tunisia", label: language === "ar" ? "تونس" : "Tunisia" },
    { value: "jordan", label: language === "ar" ? "الأردن" : "Jordan" },
    { value: "lebanon", label: language === "ar" ? "لبنان" : "Lebanon" },
    { value: "morocco", label: language === "ar" ? "المغرب" : "Morocco" },
    { value: "egypt", label: language === "ar" ? "مصر" : "Egypt" },
    { value: "sudan", label: language === "ar" ? "السودان" : "Sudan" },
    { value: "syria", label: language === "ar" ? "سوريا" : "Syria" },
  ];

  const completionPercentage = () => {
    const fields = Object.values(formData).filter((v) => v !== "");
    return Math.round((fields.length / Object.keys(formData).length) * 100);
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

          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {language === "ar" ? "اكتمال الملف الشخصي" : "Profile Completion"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{completionPercentage()}%</span>
                  <span className="text-muted-foreground">
                    {language === "ar" ? "مكتمل" : "Complete"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${completionPercentage()}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {profileLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
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
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality">
                        {language === "ar" ? "الجنسية" : "Nationality"}
                      </Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => handleChange("nationality", e.target.value)}
                        placeholder={language === "ar" ? "مثال: تونسي" : "e.g., Tunisian"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sourceCountry">
                        {language === "ar" ? "بلد المنشأ" : "Source Country"}
                      </Label>
                      <Select
                        value={formData.sourceCountry}
                        onValueChange={(value) => handleChange("sourceCountry", value)}
                      >
                        <SelectTrigger id="sourceCountry">
                          <SelectValue
                            placeholder={language === "ar" ? "اختر بلد المنشأ" : "Select source country"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceCountries.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentCountry">
                        {language === "ar" ? "البلد الحالي" : "Current Country"}
                      </Label>
                      <Input
                        id="currentCountry"
                        value={formData.currentCountry}
                        onChange={(e) => handleChange("currentCountry", e.target.value)}
                        placeholder={language === "ar" ? "مثال: الإمارات" : "e.g., UAE"}
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

              {/* Education */}
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
                      <Label htmlFor="educationLevel">
                        {language === "ar" ? "المستوى التعليمي" : "Education Level"}
                      </Label>
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

              {/* Work Experience */}
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
                      <Label htmlFor="nocCode">
                        {language === "ar" ? "رمز NOC" : "NOC Code"}
                      </Label>
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

              {/* Language Proficiency */}
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

              {/* Immigration Goals */}
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

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Link href="/dashboard">
                  <Button type="button" variant="outline">
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createProfile.isPending || updateProfile.isPending}
                  className="gap-2"
                >
                  {createProfile.isPending || updateProfile.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {language === "ar" ? "حفظ الملف الشخصي" : "Save Profile"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
