import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  User,
  LogOut,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Documents() {
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedPathway, setSelectedPathway] = useState<string>("");
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);

  const checklistsQuery = trpc.documents.getChecklists.useQuery();
  const documentsQuery = trpc.documents.getDocuments.useQuery();

  const generateChecklistMutation = trpc.documents.generateChecklist.useMutation({
    onSuccess: (data) => {
      setSelectedChecklistId(data.checklistId);
      checklistsQuery.refetch();
      toast.success(language === "ar" ? "تم إنشاء قائمة المستندات" : "Checklist created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateChecklistMutation = trpc.documents.updateChecklist.useMutation({
    onSuccess: () => {
      checklistsQuery.refetch();
      toast.success(language === "ar" ? "تم تحديث القائمة" : "Checklist updated");
    },
  });

  const deleteChecklistMutation = trpc.documents.deleteChecklist.useMutation({
    onSuccess: () => {
      setSelectedChecklistId(null);
      checklistsQuery.refetch();
      toast.success(language === "ar" ? "تم حذف القائمة" : "Checklist deleted");
    },
  });

  const uploadDocumentMutation = trpc.documents.uploadDocument.useMutation({
    onSuccess: () => {
      documentsQuery.refetch();
      checklistsQuery.refetch();
      toast.success(language === "ar" ? "تم رفع المستند" : "Document uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleGenerateChecklist = () => {
    if (!selectedCountry || !selectedPathway) {
      toast.error(language === "ar" ? "يرجى اختيار الدولة والمسار" : "Please select country and pathway");
      return;
    }

    generateChecklistMutation.mutate({
      sourceCountry: selectedCountry as any,
      immigrationPathway: selectedPathway as any,
    });
  };

  const handleFileUpload = async (documentType: string, checklistId: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
    
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(language === "ar" ? "حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)" : "File too large (max 10MB)");
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(",")[1];
        if (!base64) return;

        uploadDocumentMutation.mutate({
          checklistId,
          documentType,
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handleUpdateChecklistItem = (checklistId: number, items: any[], itemId: string, status: string) => {
    const updatedItems = items.map((item: any) =>
      item.id === itemId ? { ...item, status } : item
    );

    updateChecklistMutation.mutate({
      checklistId,
      items: updatedItems,
    });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const selectedChecklist = checklistsQuery.data?.find((c) => c.id === selectedChecklistId);
  const checklistItems = selectedChecklist?.items as any[] || [];
  
  const completedCount = checklistItems.filter((item: any) => item.status === "verified").length;
  const totalCount = checklistItems.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {language === "ar" ? "هجرة" : "Hijraah"}
              </h1>
            </a>
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
            <Link href="/calculator">
              <Button variant="ghost" size="sm">
                {t("nav.calculator")}
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              {language === "ar" ? "إدارة المستندات" : "Document Management"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ar"
                ? "قم بإنشاء قائمة المستندات المطلوبة ورفع ملفاتك"
                : "Generate your document checklist and upload your files"}
            </p>
          </div>

          {/* Create New Checklist */}
          {(!checklistsQuery.data || checklistsQuery.data.length === 0) && (
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "إنشاء قائمة مستندات جديدة" : "Create New Checklist"}</CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "اختر بلدك المصدر ومسار الهجرة لإنشاء قائمة مخصصة"
                    : "Select your source country and immigration pathway to generate a customized checklist"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "البلد المصدر" : "Source Country"}</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ar" ? "اختر البلد" : "Select country"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tunisia">{language === "ar" ? "تونس" : "Tunisia"}</SelectItem>
                        <SelectItem value="jordan">{language === "ar" ? "الأردن" : "Jordan"}</SelectItem>
                        <SelectItem value="lebanon">{language === "ar" ? "لبنان" : "Lebanon"}</SelectItem>
                        <SelectItem value="morocco">{language === "ar" ? "المغرب" : "Morocco"}</SelectItem>
                        <SelectItem value="egypt">{language === "ar" ? "مصر" : "Egypt"}</SelectItem>
                        <SelectItem value="sudan">{language === "ar" ? "السودان" : "Sudan"}</SelectItem>
                        <SelectItem value="syria">{language === "ar" ? "سوريا" : "Syria"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ar" ? "مسار الهجرة" : "Immigration Pathway"}</Label>
                    <Select value={selectedPathway} onValueChange={setSelectedPathway}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ar" ? "اختر المسار" : "Select pathway"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="express_entry">{language === "ar" ? "Express Entry" : "Express Entry"}</SelectItem>
                        <SelectItem value="study_permit">{language === "ar" ? "تصريح دراسة" : "Study Permit"}</SelectItem>
                        <SelectItem value="work_permit">{language === "ar" ? "تصريح عمل" : "Work Permit"}</SelectItem>
                        <SelectItem value="family_sponsorship">{language === "ar" ? "كفالة عائلية" : "Family Sponsorship"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateChecklist}
                  className="w-full"
                  disabled={generateChecklistMutation.isPending || !selectedCountry || !selectedPathway}
                >
                  {generateChecklistMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === "ar" ? "جاري الإنشاء..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {language === "ar" ? "إنشاء القائمة" : "Generate Checklist"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Existing Checklists */}
          {checklistsQuery.data && checklistsQuery.data.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {language === "ar" ? "قوائم المستندات" : "Your Checklists"}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedChecklistId(null);
                    setSelectedCountry("");
                    setSelectedPathway("");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "ar" ? "قائمة جديدة" : "New Checklist"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checklistsQuery.data.map((checklist) => {
                  const items = checklist.items as any[];
                  const completed = items.filter((i: any) => i.status === "verified").length;
                  const total = items.length;
                  const percent = total > 0 ? (completed / total) * 100 : 0;

                  return (
                    <Card
                      key={checklist.id}
                      className={`cursor-pointer transition-colors hover:border-primary ${
                        selectedChecklistId === checklist.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedChecklistId(checklist.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base">
                          {checklist.sourceCountry.charAt(0).toUpperCase() + checklist.sourceCountry.slice(1)} -{" "}
                          {checklist.immigrationPathway.replace("_", " ")}
                        </CardTitle>
                        <CardDescription>
                          {completed} / {total} {language === "ar" ? "مكتمل" : "completed"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Progress value={percent} className="h-2" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Checklist Details */}
          {selectedChecklist && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {language === "ar" ? "قائمة المستندات المطلوبة" : "Required Documents"}
                    </CardTitle>
                    <CardDescription>
                      {completedCount} / {totalCount} {language === "ar" ? "مكتمل" : "completed"} ({Math.round(progress)}%)
                    </CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteChecklistMutation.mutate({ checklistId: selectedChecklist.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Progress value={progress} className="h-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checklistItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{language === "ar" ? item.titleAr : item.title}</h4>
                          {item.required && (
                            <Badge variant="destructive" className="text-xs">
                              {language === "ar" ? "مطلوب" : "Required"}
                            </Badge>
                          )}
                          {item.countrySpecific && (
                            <Badge variant="secondary" className="text-xs">
                              {language === "ar" ? "خاص بالبلد" : "Country-specific"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? item.descriptionAr : item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {item.status === "pending" && (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {language === "ar" ? "معلق" : "Pending"}
                            </Badge>
                          )}
                          {item.status === "uploaded" && (
                            <Badge variant="secondary" className="gap-1">
                              <Upload className="h-3 w-3" />
                              {language === "ar" ? "تم الرفع" : "Uploaded"}
                            </Badge>
                          )}
                          {item.status === "verified" && (
                            <Badge variant="default" className="gap-1 bg-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              {language === "ar" ? "تم التحقق" : "Verified"}
                            </Badge>
                          )}
                          {item.status === "rejected" && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              {language === "ar" ? "مرفوض" : "Rejected"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFileUpload(item.documentType, selectedChecklist.id)}
                          disabled={uploadDocumentMutation.isPending}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {language === "ar" ? "رفع" : "Upload"}
                        </Button>
                        {item.status === "uploaded" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              handleUpdateChecklistItem(selectedChecklist.id, checklistItems, item.id, "verified")
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {language === "ar" ? "تحقق" : "Verify"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
