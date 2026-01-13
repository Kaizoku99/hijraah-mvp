import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { processOcrBase64, translateAction } from "@/actions/ocr";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OcrResult {
  pages: Array<{
    index: number;
    markdown: string;
    text: string;
  }>;
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

export function DocumentScanner() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [activeTab, setActiveTab] = useState("original");

  const processOcrMutation = useMutation({
    mutationFn: processOcrBase64,
  });
  const translateMutation = useMutation({
    mutationFn: translateAction,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOcrResult(null);
      setTranslationResult(null);
      setEditedText("");

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const processDocument = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];

        const result = await processOcrMutation.mutateAsync({
          base64Data: base64,
          mimeType: file.type,
        });

        setOcrResult(result);
        setEditedText(result.extractedText);
        toast.success(
          isRtl ? "تم معالجة المستند بنجاح" : "Document processed successfully"
        );
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR error:", error);
      toast.error(
        isRtl ? "فشل في معالجة المستند" : "Failed to process document"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const translateDocument = async () => {
    if (!ocrResult || !editedText) return;

    setIsTranslating(true);
    try {
      const targetLang = ocrResult.language === "ar" ? "en" : "ar";
      const result = await translateMutation.mutateAsync({
        text: editedText,
        sourceLanguage: ocrResult.language,
        targetLanguage: targetLang,
      });

      setTranslationResult(result);
      setActiveTab("translated");
      toast.success(
        isRtl ? "تمت الترجمة بنجاح" : "Translation completed successfully"
      );
    } catch (error) {
      console.error("Translation error:", error);
      toast.error(isRtl ? "فشل في الترجمة" : "Translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(isRtl ? "تم النسخ" : "Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className={cn("space-y-6", isRtl && "rtl")}>
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            {isRtl ? "ماسح المستندات" : "Document Scanner"}
          </CardTitle>
          <CardDescription>
            {isRtl
              ? "قم بتحميل مستند للمسح الضوئي والترجمة"
              : "Upload a document to scan and translate"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragActive
                ? isRtl
                  ? "أفلت الملف هنا"
                  : "Drop the file here"
                : isRtl
                  ? "اسحب وأفلت الملف هنا أو انقر للتحميل"
                  : "Drag and drop a file here, or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRtl
                ? "يدعم PNG، JPEG، PDF (حتى 10 ميجابايت)"
                : "Supports PNG, JPEG, PDF (up to 10MB)"}
            </p>
          </div>

          {/* File Preview */}
          {file && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={processDocument}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isRtl ? "جاري المعالجة..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      {isRtl ? "مسح المستند" : "Scan Document"}
                    </>
                  )}
                </Button>
              </div>

              {preview && (
                <div className="mt-4">
                  <img
                    src={preview}
                    alt="Document preview"
                    className="max-h-64 mx-auto rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* OCR Results Section */}
      {ocrResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {isRtl ? "النص المستخرج" : "Extracted Text"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {isRtl
                    ? `${ocrResult.totalPages} صفحة • ${getLanguageName(ocrResult.language)}`
                    : `${ocrResult.totalPages} page(s) • ${getLanguageName(ocrResult.language)}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  {isRtl ? "الثقة:" : "Confidence:"}{" "}
                  {Math.round(ocrResult.confidence * 100)}%
                </Badge>
                <Badge variant="secondary">
                  {getLanguageName(ocrResult.language)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={ocrResult.confidence * 100} className="h-2" />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="original" className="gap-2">
                  <FileText className="h-4 w-4" />
                  {isRtl ? "النص الأصلي" : "Original Text"}
                </TabsTrigger>
                <TabsTrigger
                  value="translated"
                  className="gap-2"
                  disabled={!translationResult}
                >
                  <Languages className="h-4 w-4" />
                  {isRtl ? "النص المترجم" : "Translated Text"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="original" className="space-y-4">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className={cn(
                    "min-h-[300px] font-mono text-sm",
                    ocrResult.language === "ar" && "rtl text-right"
                  )}
                  placeholder={
                    isRtl ? "النص المستخرج..." : "Extracted text..."
                  }
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(editedText)}
                      className="gap-2"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {isRtl ? "نسخ" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadText(editedText, "extracted-text.txt")
                      }
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {isRtl ? "تحميل" : "Download"}
                    </Button>
                  </div>
                  <Button
                    onClick={translateDocument}
                    disabled={isTranslating || !editedText}
                    className="gap-2"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isRtl ? "جاري الترجمة..." : "Translating..."}
                      </>
                    ) : (
                      <>
                        <Languages className="h-4 w-4" />
                        {isRtl ? "ترجمة إلى " : "Translate to "}
                        {getLanguageName(
                          ocrResult.language === "ar" ? "en" : "ar"
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="translated" className="space-y-4">
                {translationResult ? (
                  <>
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">
                          {getLanguageName(translationResult.targetLanguage)}
                        </Badge>
                      </div>
                      <p
                        className={cn(
                          "whitespace-pre-wrap text-sm leading-relaxed",
                          translationResult.targetLanguage === "ar" &&
                          "rtl text-right"
                        )}
                      >
                        {translationResult.translatedText}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(translationResult.translatedText)
                        }
                        className="gap-2"
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {isRtl ? "نسخ" : "Copy"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadText(
                            translationResult.translatedText,
                            "translated-text.txt"
                          )
                        }
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {isRtl ? "تحميل" : "Download"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mb-4" />
                    <p>
                      {isRtl
                        ? "لم تتم الترجمة بعد"
                        : "Translation not available yet"}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Page-by-page view */}
            {ocrResult.totalPages > 1 && (
              <div className="space-y-4">
                <h4 className="font-medium">
                  {isRtl ? "عرض الصفحات" : "Page View"}
                </h4>
                <div className="space-y-4">
                  {ocrResult.pages.map((page) => (
                    <div
                      key={page.index}
                      className="p-4 border rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {isRtl
                            ? `صفحة ${page.index + 1}`
                            : `Page ${page.index + 1}`}
                        </Badge>
                      </div>
                      <p
                        className={cn(
                          "text-sm whitespace-pre-wrap",
                          ocrResult.language === "ar" && "rtl text-start"
                        )}
                      >
                        {page.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
