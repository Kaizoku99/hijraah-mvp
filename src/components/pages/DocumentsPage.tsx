'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DocumentScanner } from "@/components/DocumentScanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChecklists,
  getDocuments,
  generateDocumentChecklist,
  updateChecklistItems,
  deleteChecklist,
  uploadDocument,
} from "@/actions/documents";
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
  ScanLine,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// Proper types for checklist items
interface ChecklistItem {
  name: string;
  description?: string;
  status: 'pending' | 'uploaded' | 'verified' | 'completed';
  documentId?: number;
}

export default function Documents() {
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedPathway, setSelectedPathway] = useState<string>("");
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);

  const checklistsQuery = useQuery({
    queryKey: ['documents', 'checklists'],
    queryFn: getChecklists,
  });
  const documentsQuery = useQuery({
    queryKey: ['documents', 'list'],
    queryFn: getDocuments,
  });

  const generateChecklistMutation = useMutation({
    mutationFn: generateDocumentChecklist,
    onSuccess: (data) => {
      setSelectedChecklistId(data.checklistId);
      queryClient.invalidateQueries({ queryKey: ['documents', 'checklists'] });
      toast.success(language === "ar" ? "تم إنشاء قائمة المستندات" : "Checklist created successfully");
    },
    onError: (error: any, variables) => {
      toast.error(error.message, {
        action: {
          label: language === "ar" ? "إعادة المحاولة" : "Retry",
          onClick: () => generateChecklistMutation.mutate(variables),
        },
      });
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: updateChecklistItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'checklists'] });
      toast.success(language === "ar" ? "تم تحديث القائمة" : "Checklist updated");
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: deleteChecklist,
    onSuccess: () => {
      setSelectedChecklistId(null);
      queryClient.invalidateQueries({ queryKey: ['documents', 'checklists'] });
      toast.success(language === "ar" ? "تم حذف القائمة" : "Checklist deleted");
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(language === "ar" ? "تم رفع المستند" : "Document uploaded successfully");
    },
    onError: (error: any, variables) => {
      toast.error(error.message, {
        action: {
          label: language === "ar" ? "إعادة المحاولة" : "Retry",
          onClick: () => uploadDocumentMutation.mutate(variables),
        },
      });
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
        toast.error(language === "ar" ? "حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)" : "File too large (max 10MB)", {
          description: language === "ar" ? "يرجى اختيار ملف أصغر" : "Please select a smaller file",
        });
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
    router.push("/");
  };

  const selectedChecklist = checklistsQuery.data?.find((c) => c.id === selectedChecklistId);
  const checklistItems = selectedChecklist?.items as ChecklistItem[] || [];

  const completedCount = checklistItems.filter((item: any) => item.status === "verified").length;
  const totalCount = checklistItems.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
            <div className="hidden md:block">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  {t("nav.dashboard")}
                </Link>
              </Button>
            </div>
            <div className="hidden md:block">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/chat">
                  {t("nav.chat")}
                </Link>
              </Button>
            </div>
            <div className="hidden md:block">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/calculator">
                  {t("nav.calculator")}
                </Link>
              </Button>
            </div>
            <LanguageToggle />
            <div className="hidden md:block">
              <Button variant="ghost" size="sm" className="gap-2" asChild>
                <Link href="/profile">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("nav.profile")}</span>
                </Link>
              </Button>
            </div>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ScanLine className="h-4 w-4" />
                  {language === "ar" ? "مسح وترجمة" : "Scan & Translate"}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[600px] md:w-[800px] sm:max-w-none overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>{language === "ar" ? "المسح الضوئي والترجمة" : "Scan & Translate"}</SheetTitle>
                  <SheetDescription>
                    {language === "ar"
                      ? "استخدم الذكاء الاصطناعي لمسح المستندات واستخراج البيانات وترجمتها."
                      : "Use AI to scan documents, extract data, and translate content."}
                  </SheetDescription>
                </SheetHeader>
                <DocumentScanner />
              </SheetContent>
            </Sheet>
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
                        <SelectItem value="iran">{language === "ar" ? "إيران" : "Iran"}</SelectItem>
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
                  const items = checklist.items as ChecklistItem[];
                  const completed = items.filter((i: any) => i.status === "verified").length;
                  const total = items.length;
                  const percent = total > 0 ? (completed / total) * 100 : 0;

                  return (
                    <Card
                      key={checklist.id}
                      className={`cursor-pointer transition-colors hover:border-primary ${selectedChecklistId === checklist.id ? "border-primary" : ""
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
                            <HoverCard>
                              <HoverCardTrigger>
                                <Badge variant="outline" className="gap-1 cursor-help">
                                  <Clock className="h-3 w-3" />
                                  {language === "ar" ? "معلق" : "Pending"}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">{language === "ar" ? "قيد المراجعة" : "Under Review"}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {language === "ar"
                                      ? "مستندك قيد المراجعة حالياً. يستغرق هذا عادةً 24-48 ساعة."
                                      : "Your document is currently being reviewed. This usually takes 24-48 hours."}
                                  </p>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                          {item.status === "uploaded" && (
                            <HoverCard>
                              <HoverCardTrigger>
                                <Badge variant="secondary" className="gap-1 cursor-help">
                                  <Upload className="h-3 w-3" />
                                  {language === "ar" ? "تم الرفع" : "Uploaded"}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-60">
                                <p className="text-sm text-muted-foreground">
                                  {language === "ar"
                                    ? "تم رفع الملف بنجاح وبانتظار التحقق."
                                    : "File uploaded successfully and pending verification."}
                                </p>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                          {item.status === "verified" && (
                            <HoverCard>
                              <HoverCardTrigger>
                                <Badge variant="default" className="gap-1 bg-green-600 cursor-help">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {language === "ar" ? "تم التحقق" : "Verified"}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-60">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <p className="text-sm font-medium">
                                    {language === "ar" ? "تم قبول المستند" : "Document Accepted"}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(), "PP", { locale: language === "ar" ? ar : enUS })}
                                </p>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                          {item.status === "rejected" && (
                            <Popover>
                              <PopoverTrigger>
                                <Badge variant="destructive" className="gap-1 cursor-pointer hover:bg-destructive/90">
                                  <XCircle className="h-3 w-3" />
                                  {language === "ar" ? "مرفوض" : "Rejected"}
                                </Badge>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium text-destructive flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    {language === "ar" ? "سبب الرفض" : "Rejection Reason"}
                                  </h4>
                                  <p className="text-sm">
                                    {language === "ar"
                                      ? "الصورة غير واضحة أو منتهية الصلاحية. يرجى إعادة الرفع."
                                      : "Image is blurry or document is expired. Please re-upload."}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={() => handleFileUpload(item.documentType, selectedChecklist.id)}
                                  >
                                    <Upload className="h-3 w-3 mr-2" />
                                    {language === "ar" ? "إعادة الرفع" : "Re-upload Document"}
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        {item.status !== "uploaded" && (
                          <div className="flex items-center gap-2 mt-2">
                            {/* Placeholder to maintain spacing if needed, or remove if flex gap handles it */}
                          </div>
                        )}
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
                            {language === "ar" ? "جاهز" : "Mark as Ready"}
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
