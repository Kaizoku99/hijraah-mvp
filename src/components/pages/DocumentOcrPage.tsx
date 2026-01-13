'use client'

import DashboardLayout from "@/components/DashboardLayout";
import { DocumentScanner } from "@/components/DocumentScanner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DocumentOcr() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isRtl ? "مسح المستندات وترجمتها" : "Document Scanning & Translation"}
          </h1>
          <p className="text-muted-foreground">
            {isRtl
              ? "قم بمسح مستنداتك ضوئياً واستخراج النص منها وترجمتها بين العربية والإنجليزية"
              : "Scan your documents, extract text using OCR, and translate between Arabic and English"}
          </p>
        </div>

        <DocumentScanner />
      </div>
    </DashboardLayout>
  );
}

