'use client'

import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Logo } from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import { getGuide } from "@/actions/guides";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Tag,
  BookOpen,
  Share2,
  Printer,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

// Category labels
const categoryLabels: Record<string, { en: string; ar: string }> = {
  express_entry: { en: "Express Entry", ar: "الدخول السريع" },
  study_permit: { en: "Study Permit", ar: "تصريح الدراسة" },
  work_permit: { en: "Work Permit", ar: "تصريح العمل" },
  family_sponsorship: { en: "Family Sponsorship", ar: "كفالة العائلة" },
  provincial_nominee: { en: "Provincial Nominee", ar: "برنامج المقاطعات" },
  documents: { en: "Documents", ar: "المستندات" },
  fees: { en: "Fees", ar: "الرسوم" },
  timeline: { en: "Timeline", ar: "الجدول الزمني" },
  settlement: { en: "Settlement", ar: "الاستقرار" },
  general: { en: "General", ar: "عام" },
};

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const router = useRouter();

  // Fetch guide by slug
  const { data: guide, isLoading, error } = useQuery({
    queryKey: ['guides', 'bySlug', slug],
    queryFn: () => getGuide({ slug: slug || "" }),
    enabled: !!slug,
  });

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: language === "ar" ? guide?.titleAr : guide?.titleEn,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <main className="flex-1 py-8">
          <div className="container max-w-4xl">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/guides">
              <Button variant="ghost" size="sm" className="gap-2">
                {language === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {language === "ar" ? "العودة للأدلة" : "Back to Guides"}
              </Button>
            </Link>
            <LanguageToggle />
          </div>
        </header>
        <main className="flex-1 py-8 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              {language === "ar" ? "الدليل غير موجود" : "Guide Not Found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {language === "ar"
                ? "لم نتمكن من العثور على الدليل المطلوب"
                : "We couldn't find the guide you're looking for"}
            </p>
            <Link href="/guides">
              <Button>
                {language === "ar" ? "تصفح جميع الأدلة" : "Browse All Guides"}
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const categoryLabel = categoryLabels[guide.category] || { en: guide.category, ar: guide.category };
  const title = language === "ar" ? guide.titleAr : guide.titleEn;
  const content = language === "ar" ? guide.contentAr : guide.contentEn;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50 print:hidden">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/guides" className="hidden md:block">
              <Button variant="ghost" size="sm" className="gap-2">
                {language === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {language === "ar" ? "الأدلة" : "Guides"}
              </Button>
            </Link>
            <div className="hidden sm:block">
              <Logo />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <article className="container max-w-4xl">
          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">
                {language === "ar" ? categoryLabel.ar : categoryLabel.en}
              </Badge>
              {(() => {
                const tags = guide.tags as string[] | null;
                if (tags && tags.length > 0) {
                  return tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ));
                }
                return null;
              })()}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {guide.publishedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {language === "ar" ? "نُشر في " : "Published "}
                  {format(new Date(guide.publishedAt), "PPP", {
                    locale: language === "ar" ? ar : enUS,
                  })}
                </span>
              )}
              {guide.version > 1 && (
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {language === "ar" ? `الإصدار ${guide.version}` : `Version ${guide.version}`}
                </span>
              )}
            </div>
          </header>

          {/* Article Content */}
          <div className={cn(
            "prose prose-lg dark:prose-invert max-w-none",
            language === "ar" && "prose-rtl"
          )}>
            <Streamdown
              components={{
                h1: ({ children }: { children?: React.ReactNode }) => (
                  <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>
                ),
                h2: ({ children }: { children?: React.ReactNode }) => (
                  <h2 className="text-2xl font-bold mt-8 mb-4 border-b pb-2">{children}</h2>
                ),
                h3: ({ children }: { children?: React.ReactNode }) => (
                  <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>
                ),
                a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
                  <a
                    href={href}
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    {children}
                    {href?.startsWith("http") && <ExternalLink className="h-3 w-3" />}
                  </a>
                ),
                blockquote: ({ children }: { children?: React.ReactNode }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic bg-blue-50 dark:bg-blue-950/30 py-2 my-4 rounded-r">
                    {children}
                  </blockquote>
                ),
                table: ({ children }: { children?: React.ReactNode }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full border-collapse border border-border">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }: { children?: React.ReactNode }) => (
                  <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }: { children?: React.ReactNode }) => (
                  <td className="border border-border px-4 py-2">{children}</td>
                ),
                ul: ({ children }: { children?: React.ReactNode }) => (
                  <ul className="list-disc list-inside space-y-2 my-4">{children}</ul>
                ),
                ol: ({ children }: { children?: React.ReactNode }) => (
                  <ol className="list-decimal list-inside space-y-2 my-4">{children}</ol>
                ),
                code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                      <code className={className}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </Streamdown>
          </div>

          {/* Related Actions */}
          <Card className="mt-12 print:hidden">
            <CardContent className="py-6">
              <h3 className="font-semibold mb-4">
                {language === "ar" ? "هل تحتاج مساعدة إضافية؟" : "Need More Help?"}
              </h3>
              <div className="flex flex-wrap gap-3">
                <Link href="/chat">
                  <Button>
                    {language === "ar" ? "تحدث مع المساعد الذكي" : "Chat with AI Assistant"}
                  </Button>
                </Link>
                <Link href="/calculator">
                  <Button variant="outline">
                    {language === "ar" ? "احسب نقاط CRS" : "Calculate CRS Score"}
                  </Button>
                </Link>
                <Link href="/guides">
                  <Button variant="outline">
                    {language === "ar" ? "المزيد من الأدلة" : "More Guides"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto print:hidden">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Hijraah.{" "}
            {language === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
        </div>
      </footer>
    </div>
  );
}

