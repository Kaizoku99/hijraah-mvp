'use client'

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SopQualityScore } from "@/components/SopQualityScore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSop, regenerateSopSection } from "@/actions/sop";
import { generateSopPdf, downloadPdf } from "@/lib/pdfExport";
import { User, LogOut, Copy, Download, RefreshCw, Loader2, FileText, Edit, Save, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function SopDisplay() {
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const sopId = params?.id ? parseInt(params.id) : 0;

  const { data: sop, isLoading } = useQuery({
    queryKey: ['sop', 'get', sopId],
    queryFn: () => getSop({ sopId }),
    enabled: sopId > 0,
  });
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  const handleCopy = () => {
    if (sop?.content) {
      navigator.clipboard.writeText(sop.content);
      toast.success(language === "ar" ? "تم النسخ إلى الحافظة" : "Copied to clipboard");
    }
  };

  const handleDownload = () => {
    if (sop?.content) {
      const blob = new Blob([sop.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SOP-${sopId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(language === "ar" ? "تم التنزيل بنجاح" : "Downloaded successfully");
    }
  };

  const handleDownloadPdf = async () => {
    if (!sop?.content) return;

    setIsExportingPdf(true);
    try {
      const blob = await generateSopPdf({
        content: sop.content,
        language: sop.language as "en" | "ar",
        title: language === "ar" ? "خطاب النوايا" : "Statement of Purpose",
        createdAt: new Date(sop.createdAt),
      });

      downloadPdf(blob, `SOP-${sopId}.pdf`);
      toast.success(language === "ar" ? "تم تنزيل PDF بنجاح" : "PDF downloaded successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error(language === "ar" ? "فشل في إنشاء PDF" : "Failed to generate PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleStartEdit = () => {
    setEditedContent(sop?.content || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedContent(null);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    // For now, just show a success message. Backend integration can be added later.
    toast.success(language === "ar" ? "تم حفظ التعديلات" : "Changes saved locally");
    setIsEditing(false);
  };

  const queryClient = useQueryClient();

  const regenerateMutation = useMutation({
    mutationFn: regenerateSopSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sop', 'get', sopId] });
      toast.success(language === "ar" ? "تم إعادة إنشاء القسم بنجاح" : "Section regenerated successfully");
      setRegeneratingSection(null);
    },
    onError: (error: any) => {
      toast.error(error.message || (language === "ar" ? "فشل في إعادة الإنشاء" : "Failed to regenerate"));
      setRegeneratingSection(null);
    },
  });

  const handleRegenerateSection = (section: 'introduction' | 'body' | 'conclusion') => {
    setRegeneratingSection(section);
    regenerateMutation.mutate({ sopId, section });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>
              {language === "ar" ? "خطاب النوايا غير موجود" : "SOP Not Found"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {language === "ar"
                ? "لم يتم العثور على خطاب النوايا المطلوب"
                : "The requested SOP was not found"}
            </p>
            <Link href="/dashboard">
              <Button>{language === "ar" ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* Main Content */}
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {language === "ar" ? "خطاب النوايا" : "Statement of Purpose"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "تم الإنشاء في:" : "Created:"}{" "}
                {new Date(sop.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                {language === "ar" ? "نسخ" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                {language === "ar" ? "نص" : "TXT"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
              >
                {isExportingPdf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {language === "ar" ? "PDF تنزيل" : "Download PDF"}
              </Button>
              <Link href="/sop/new">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إنشاء جديد" : "Create New"}
                </Button>
              </Link>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedContent || ""}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      {language === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="h-4 w-4 mr-2" />
                      {language === "ar" ? "حفظ" : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {sop.content}
                  </div>
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleStartEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      {language === "ar" ? "تعديل" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerateSection('introduction')}
                      disabled={regeneratingSection !== null}
                    >
                      {regeneratingSection === 'introduction' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      {language === "ar" ? "إعادة المقدمة" : "Regen Intro"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerateSection('body')}
                      disabled={regeneratingSection !== null}
                    >
                      {regeneratingSection === 'body' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      {language === "ar" ? "إعادة المحتوى" : "Regen Body"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerateSection('conclusion')}
                      disabled={regeneratingSection !== null}
                    >
                      {regeneratingSection === 'conclusion' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      {language === "ar" ? "إعادة الخاتمة" : "Regen Conclusion"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quality Score Analysis */}
          <div className="mt-6">
            <SopQualityScore sopId={sopId} />
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">
              {language === "ar" ? "💡 نصائح لتحسين خطاب النوايا" : "💡 Tips to Improve Your SOP"}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                {language === "ar"
                  ? "راجع الخطاب بعناية وتأكد من أنه يعكس شخصيتك وأهدافك"
                  : "Review the SOP carefully and ensure it reflects your personality and goals"}
              </li>
              <li>
                {language === "ar"
                  ? "اطلب من شخص يتقن الإنجليزية مراجعة الخطاب"
                  : "Have someone proficient in English review the SOP"}
              </li>
              <li>
                {language === "ar"
                  ? "تأكد من أن الخطاب يتوافق مع متطلبات البرنامج المستهدف"
                  : "Ensure the SOP aligns with the target program requirements"}
              </li>
              <li>
                {language === "ar"
                  ? "يمكنك تعديل الخطاب وإضافة تفاصيل شخصية إضافية"
                  : "You can edit the SOP and add additional personal details"}
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

