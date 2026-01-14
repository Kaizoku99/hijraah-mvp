import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { processOcrBase64, translateAction } from "@/actions/ocr";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  Languages,
  Copy,
  Check,
  Loader2,
  FileImage,
  AlertCircle,
  Download,
  X,
  Play,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OcrPage {
  index: number;
  markdown: string;
  text: string;
}

interface OcrResult {
  pages: OcrPage[];
  totalPages: number;
  extractedText: string;
  language: string;
  confidence: number;
}

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface ScannedDocument {
  id: string;
  file: File;
  preview: string | null;
  status: "idle" | "processing" | "completed" | "error";
  ocrResult: OcrResult | null;
  translationResult: TranslationResult | null;
  editedText: string;
  isTranslating: boolean;
  progress: number;
}

export function DocumentScanner() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("original");
  const [autoTranslate, setAutoTranslate] = useState(false);

  const processOcrMutation = useMutation({
    mutationFn: processOcrBase64,
  });
  const translateMutation = useMutation({
    mutationFn: translateAction,
  });

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      documents.forEach((doc) => {
        if (doc.preview) URL.revokeObjectURL(doc.preview);
      });
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Limit to 5 files for now (Free Tier Limit)
    const remainingSlots = 5 - documents.length;
    if (remainingSlots <= 0) {
      toast.error(isRtl ? "لقد وصلت للحد الأقصى (5 مستندات)" : "You have reached the limit (5 documents)");
      return;
    }

    const newDocs = acceptedFiles.slice(0, remainingSlots).map((file) => {
      const isImage = file.type.startsWith("image/");
      const doc: ScannedDocument = {
        id: Math.random().toString(36).substring(7),
        file,
        preview: isImage ? URL.createObjectURL(file) : null,
        status: "idle",
        ocrResult: null,
        translationResult: null,
        editedText: "",
        isTranslating: false,
        progress: 0,
      };

      return doc;
    });

    setDocuments((prev) => [...prev, ...newDocs]);
    if (!selectedDocId && newDocs.length > 0) {
      setSelectedDocId(newDocs[0].id);
    }

    if (acceptedFiles.length > remainingSlots) {
      toast.warning(
        isRtl
          ? `تم إضافة ${remainingSlots} ملفات فقط. الحد الأقصى 5.`
          : `Only added ${remainingSlots} files. Max limit is 5.`
      );
    }
  }, [selectedDocId, documents.length, isRtl]);

  const removeDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = documents.find(d => d.id === id);
    if (doc?.preview) {
      URL.revokeObjectURL(doc.preview);
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (selectedDocId === id) {
      setSelectedDocId(null);
    }
  };

  const processDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc || doc.status === "processing") return;

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "processing" } : d))
    );

    const processPromise = async () => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            const result = await processOcrMutation.mutateAsync({
              base64Data: base64,
              mimeType: doc.file.type,
            });

            setDocuments((prev) =>
              prev.map((d) =>
                d.id === docId
                  ? {
                    ...d,
                    status: "completed",
                    ocrResult: result,
                    editedText: result.extractedText,
                    progress: 100,
                  }
                  : d
              )
            );

            // Show classification result toasts
            const classification = (result as any).classification;
            if (classification) {
              if (classification.validationResult.isValid) {
                toast.success(
                  isRtl
                    ? `✓ تم التحقق من ${classification.documentType}`
                    : `✓ ${classification.documentType} verified and added to checklist`
                );
              } else {
                // Show specific validation errors
                const errors = classification.validationResult.errors || [];
                if (errors.includes("Document name does not match your profile")) {
                  toast.error(
                    isRtl
                      ? "⚠️ اسم المستند لا يتطابق مع ملفك الشخصي"
                      : "⚠️ Document name doesn't match your profile",
                    { duration: 5000 }
                  );
                } else if (errors.includes("Document has expired")) {
                  toast.error(
                    isRtl
                      ? "⚠️ انتهت صلاحية المستند"
                      : "⚠️ Document has expired",
                    { duration: 5000 }
                  );
                } else if (errors.includes("Document expires within 6 months")) {
                  toast.warning(
                    isRtl
                      ? "⚠️ المستند تنتهي صلاحيته خلال 6 أشهر"
                      : "⚠️ Document expires within 6 months",
                    { duration: 5000 }
                  );
                } else if (errors.length > 0) {
                  toast.error(errors[0], { duration: 5000 });
                }
              }
            } else {
              toast.success(isRtl ? "تمت المعالجة" : "Processed successfully");
            }

            // Auto-translate if enabled
            if (autoTranslate) {
              // We need to trigger this after a microtask to verify doc state updates, 
              // but since we just updated via setDocuments functional update, we can't see it immediately.
              // However, we can call a separate function or useEffect. 
              // Better: just trigger translateDocument with the same docId immediately.
              // Logic check: ensure translateDocument pulls fresh state or we pass data manually.
              // translateDocument uses helper `documents.find`. The state won't be updated yet here in this closure.
              // So we should defer it slightly or pass data directly.

              // Temporary workaround: setTimeout to allow state to settle
              setTimeout(() => {
                translateDocument(docId);
              }, 100);
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsDataURL(doc.file);
      });
    };

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "processing", progress: 0 } : d))
    );

    // Progress simulation
    const progressInterval = setInterval(() => {
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id === docId && d.status === "processing") {
            // Slow down as it gets closer to 90%
            const increment = d.progress < 50 ? 5 : d.progress < 80 ? 2 : 0.5;
            return { ...d, progress: Math.min(90, d.progress + increment) };
          }
          return d;
        })
      );
    }, 500);

    // Timeout logic (60 seconds)
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), 60000);
    });

    try {
      await Promise.race([processPromise(), timeoutPromise]);
    } catch (error) {
      console.error("OCR error:", error);
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "error", progress: 0 } : d))
      );
      const errorMessage = error instanceof Error ? error.message : (isRtl ? "فشل المعالجة" : "Processing failed");
      toast.error(errorMessage);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const processAll = async () => {
    const idleDocs = documents.filter((d) => d.status === "idle" || d.status === "error");
    for (const doc of idleDocs) {
      await processDocument(doc.id);
    }
  };

  const translateDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc || !doc.ocrResult || !doc.editedText) return;

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isTranslating: true } : d))
    );

    try {
      const targetLang = doc.ocrResult.language === "ar" ? "en" : "ar";
      const result = await translateMutation.mutateAsync({
        text: doc.editedText,
        sourceLanguage: doc.ocrResult.language,
        targetLanguage: targetLang,
      });

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, isTranslating: false, translationResult: result }
            : d
        )
      );
      setActiveTab("translated");
      toast.success(isRtl ? "تمت الترجمة" : "Translated successfully");
    } catch (error) {
      console.error("Translation error:", error);
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, isTranslating: false } : d))
      );
      toast.error(isRtl ? "فشل الترجمة" : "Translation failed");
    }
  };

  const handleTextEdit = (docId: string, text: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, editedText: text } : d))
    );
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(isRtl ? "تم النسخ" : "Copied to clipboard");
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLanguageName = (code: string) => {
    const names: Record<string, { en: string; ar: string }> = {
      ar: { en: "Arabic", ar: "العربية" },
      en: { en: "English", ar: "الإنجليزية" },
      fr: { en: "French", ar: "الفرنسية" },
    };
    return names[code]?.[isRtl ? "ar" : "en"] || code;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className={cn("space-y-6", isRtl && "rtl")}>
      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar / Upload Area */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between mb-2">
                <span>{isRtl ? "المستندات" : "Documents"}</span>
                <Badge variant={documents.length >= 5 ? "destructive" : "secondary"} className="font-normal">
                  {documents.length} / 5 {isRtl ? "مجاني" : "Free"}
                </Badge>
              </CardTitle>
              <Progress value={(documents.length / 5) * 100} className="h-1.5" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                  isDragActive
                    ? "border-primary bg-primary/5 scale-[0.98]"
                    : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/5"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">
                  {isRtl ? "إضافة ملفات" : "Add Files"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRtl ? "PNG, JPG, PDF (Max 10MB)" : "PNG, JPG, PDF (Max 10MB)"}
                </p>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse justify-between px-1">
                <Label htmlFor="auto-translate" className="text-sm font-medium cursor-pointer">
                  {isRtl ? "ترجمة تلقائية بعد المسح" : "Auto-translate"}
                </Label>
                <Switch
                  id="auto-translate"
                  checked={autoTranslate}
                  onCheckedChange={setAutoTranslate}
                />
              </div>

              {documents.length > 0 && (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    <AnimatePresence mode='popLayout'>
                      {documents.map((doc) => (
                        <motion.div
                          key={doc.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          onClick={() => setSelectedDocId(doc.id)}
                          className={cn(
                            "relative group p-3 rounded-lg border cursor-pointer transition-all duration-300",
                            selectedDocId === doc.id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "bg-card hover:border-primary/20 hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3 overflow-hidden">
                              {doc.preview ? (
                                <img
                                  src={doc.preview}
                                  alt="preview"
                                  className="h-10 w-10 rounded-md object-cover border bg-background shadow-sm"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md border bg-background flex items-center justify-center shadow-sm">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate leading-tight">
                                  {doc.file.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Badge
                                    variant={
                                      doc.status === "completed"
                                        ? "default"
                                        : doc.status === "processing"
                                          ? "secondary"
                                          : doc.status === "error"
                                            ? "destructive"
                                            : "outline"
                                    }
                                    className="text-[10px] h-5 px-1.5 font-normal"
                                  >
                                    {doc.status === "completed" && <Check className="h-3 w-3 mr-1" />}
                                    {doc.status === "processing" && (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    )}
                                    {doc.status === "error" && "Error"}
                                    {doc.status === "idle" && "Ready"}
                                    {doc.status === "completed" && "Done"}
                                    {doc.status === "processing" && "Processing"}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 -mr-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => removeDocument(doc.id, e)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}

              {documents.length > 0 && (
                <Button
                  className="w-full gap-2"
                  onClick={processAll}
                  disabled={documents.every((d) => d.status === "completed")}
                >
                  <Play className="h-4 w-4" />
                  {isRtl ? "معالجة الكل" : "Process All"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2">
          {selectedDoc ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        {selectedDoc.file.name}
                      </CardTitle>
                      {selectedDoc.ocrResult && (
                        <CardDescription className="mt-1">
                          {selectedDoc.ocrResult.totalPages}{" "}
                          {isRtl ? "صفحات" : "pages"} •{" "}
                          {getLanguageName(selectedDoc.ocrResult.language)}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedDoc.status === "idle" && (
                        <Button size="sm" onClick={() => processDocument(selectedDoc.id)}>
                          {isRtl ? "معالجة" : "Process"}
                        </Button>
                      )}
                      {selectedDoc.status === "processing" && (
                        <div className="flex flex-col gap-2 min-w-[150px]">
                          <Badge variant="secondary" className="gap-1.5 h-9 px-4 text-sm justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isRtl ? "جاري المعالجة..." : "Processing..."}
                          </Badge>
                          <Progress value={selectedDoc.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedDoc.status === "idle" && selectedDoc.preview && (
                    <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
                      <img
                        src={selectedDoc.preview}
                        alt="Preview"
                        className="max-h-[300px] rounded shadow-sm"
                      />
                      <p className="mt-4 text-sm text-muted-foreground">
                        {isRtl ? "جاهز للمعالجة" : "Ready to process"}
                      </p>
                    </div>
                  )}

                  {selectedDoc.status === "error" && (
                    <div className="flex flex-col items-center justify-center py-12 text-destructive">
                      <AlertCircle className="h-12 w-12 mb-4" />
                      <p>{isRtl ? "حدث خطأ أثناء المعالجة" : "Error processing document"}</p>
                      <Button variant="outline" className="mt-4" onClick={() => processDocument(selectedDoc.id)}>
                        {isRtl ? "إعادة المحاولة" : "Retry"}
                      </Button>
                    </div>
                  )}

                  {selectedDoc.ocrResult && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="original" className="gap-2">
                          <FileText className="h-4 w-4" />
                          {isRtl ? "النص الأصلي" : "Original Text"}
                        </TabsTrigger>
                        <TabsTrigger
                          value="translated"
                          className="gap-2"
                          disabled={!selectedDoc.translationResult}
                        >
                          <Languages className="h-4 w-4" />
                          {isRtl ? "الترجمة" : "Translation"}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="original" className="space-y-4 mt-4">
                        <div className="relative">
                          <Textarea
                            value={selectedDoc.editedText}
                            onChange={(e) =>
                              handleTextEdit(selectedDoc.id, e.target.value)
                            }
                            className={cn(
                              "min-h-[400px] font-mono text-sm resize-y p-4 leading-relaxed",
                              selectedDoc.ocrResult.language === "ar" && "rtl text-right"
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(selectedDoc.editedText)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              {isRtl ? "نسخ" : "Copy"}
                            </Button>
                          </div>
                          <Button
                            onClick={() => translateDocument(selectedDoc.id)}
                            disabled={selectedDoc.isTranslating}
                            className="gap-2"
                          >
                            {selectedDoc.isTranslating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Languages className="h-4 w-4" />
                            )}
                            {isRtl ? "ترجمة" : "Translate"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="translated" className="space-y-4 mt-4">
                        {selectedDoc.translationResult ? (
                          <>
                            <div className={cn(
                              "min-h-[400px] p-4 rounded-md border bg-muted/20 whitespace-pre-wrap text-sm leading-relaxed",
                              selectedDoc.translationResult.targetLanguage === "ar" && "rtl text-right"
                            )}>
                              {selectedDoc.translationResult.translatedText}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(
                                    selectedDoc.translationResult!.translatedText
                                  )
                                }
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                {isRtl ? "نسخ" : "Copy"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  downloadText(
                                    selectedDoc.translationResult!.translatedText,
                                    `translation-${selectedDoc.file.name}.txt`
                                  )
                                }
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {isRtl ? "تحميل" : "Download"}
                              </Button>
                            </div>
                          </>
                        ) : null}
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyState
              icon={FileImage}
              title={isRtl ? "لم يتم اختيار مستند" : "No Document Selected"}
              description={
                isRtl
                  ? "اختر مستنداً من القائمة أو قم برفع ملفات جديدة"
                  : "Select a document from the list or upload new files"
              }
              variant="outline"
              className="h-full min-h-[500px]"
            />
          )}
        </div>
      </div>
    </div >
  );
}
