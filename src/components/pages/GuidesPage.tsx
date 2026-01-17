"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Logo } from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import {
  listGuides,
  getCategories,
  searchGuidesAction,
} from "@/actions/guides";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Search,
  ArrowLeft,
  ArrowRight,
  Clock,
  Tag,
  FileText,
  GraduationCap,
  Briefcase,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  Home,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Category icons mapping
const categoryIcons: Record<string, any> = {
  express_entry: FileText,
  study_permit: GraduationCap,
  work_permit: Briefcase,
  family_sponsorship: Users,
  provincial_nominee: MapPin,
  documents: FileText,
  fees: DollarSign,
  timeline: Calendar,
  settlement: Home,
  general: HelpCircle,
};

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

export default function Guides() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch guides
  const { data: guides, isLoading } = useQuery({
    queryKey: ["guides", "list", selectedCategory],
    queryFn: () =>
      listGuides({
        category: selectedCategory || undefined,
        limit: 50,
        offset: 0,
      }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["guides", "categories"],
    queryFn: getCategories,
  });

  // Search guides
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["guides", "search", searchQuery],
    queryFn: () => searchGuidesAction({ query: searchQuery, limit: 10 }),
    enabled: searchQuery.length >= 2,
  });

  const displayedGuides = searchQuery.length >= 2 ? searchResults : guides;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Logo priority />
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link href="/login" className="hidden md:block">
              <Button variant="outline" size="sm">
                {t("nav.login")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container space-y-8">
          {/* Page Header */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {language === "ar" ? "دليل الهجرة الشامل" : "Immigration Guides"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {language === "ar"
                ? "دليلك الشامل للهجرة. اكتشف البرامج المتاحة والمتطلبات والخطوات اللازمة."
                : "Your comprehensive immigration guide. Discover available programs, requirements, and steps to take."}
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  language === "ar" ? "ابحث في الأدلة..." : "Search guides..."
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              {language === "ar" ? "الكل" : "All"}
            </Button>
            {categoriesData?.categories.map(category => {
              const count =
                categoriesData.counts.find(c => c.category === category)
                  ?.count || 0;
              const Icon = categoryIcons[category] || HelpCircle;
              const label = categoryLabels[category] || {
                en: category,
                ar: category,
              };

              return (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {language === "ar" ? label.ar : label.en}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Guides Grid */}
          {isLoading || isSearching ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayedGuides && displayedGuides.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedGuides.map(guide => {
                const Icon = categoryIcons[guide.category] || HelpCircle;
                const categoryLabel = categoryLabels[guide.category] || {
                  en: guide.category,
                  ar: guide.category,
                };

                return (
                  <Link key={guide.id} href={`/guides/${guide.slug}`}>
                    <Card className="h-full hover:border-primary transition-all hover:shadow-md cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center mb-3",
                              "bg-blue-50 text-blue-600"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge variant="outline">
                            {language === "ar"
                              ? categoryLabel.ar
                              : categoryLabel.en}
                          </Badge>
                        </div>
                        <CardTitle className="line-clamp-2">
                          {language === "ar" ? guide.titleAr : guide.titleEn}
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {language === "ar"
                            ? guide.metaDescriptionAr ||
                              guide.contentAr.substring(0, 150) + "..."
                            : guide.metaDescriptionEn ||
                              guide.contentEn.substring(0, 150) + "..."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {guide.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(guide.publishedAt), "PP", {
                                locale: language === "ar" ? ar : enUS,
                              })}
                            </span>
                          )}
                          {(() => {
                            const tags = guide.tags as string[] | null;
                            if (tags && tags.length > 0) {
                              return (
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {tags.length}{" "}
                                  {language === "ar" ? "وسم" : "tags"}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === "ar" ? "لا توجد أدلة" : "No guides found"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery.length >= 2
                  ? language === "ar"
                    ? "جرب البحث بكلمات مختلفة"
                    : "Try searching with different keywords"
                  : language === "ar"
                    ? "لم يتم نشر أي أدلة بعد"
                    : "No guides have been published yet"}
              </p>
            </div>
          )}

          {/* CTA Section */}
          <Card className="bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-3">
                {language === "ar"
                  ? "هل تحتاج مساعدة شخصية؟"
                  : "Need Personalized Help?"}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {language === "ar"
                  ? "سجل الآن للحصول على مساعد ذكي يجيب على جميع استفساراتك حول الهجرة"
                  : "Sign up now to get an AI assistant that answers all your immigration questions"}
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/login">
                  <Button size="lg">
                    {language === "ar" ? "ابدأ مجاناً" : "Get Started Free"}
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">
                    {language === "ar" ? "عرض الخطط" : "View Plans"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
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
