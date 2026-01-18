"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { SOPGeneratorArtifact } from "@/lib/artifacts/definitions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, Lightbulb, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface SOPSection {
  title: string;
  content: string;
  wordCount: number;
  suggestions?: string[];
}

interface SOPData {
  pathway: string;
  destination: string;
  sections: SOPSection[];
  totalWordCount: number;
  targetWordCount: number;
  completionPercentage: number;
  status: "drafting" | "complete" | "error";
  tips?: string[];
}

export function SOPGeneratorDisplay() {
  const [state] = useArtifact(SOPGeneratorArtifact);
  const { language } = useLanguage();
  const data = state.data as SOPData | null;
  const status = state.status;
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));

  if (!data && status !== "streaming") return null;

  const isArabic = language === "ar";

  const toggleSection = (index: number) => {
    const newSet = new Set(openSections);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setOpenSections(newSet);
  };

  return (
    <Card className="w-full max-w-lg my-4 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>{isArabic ? "هيكل خطاب النوايا" : "SOP Structure"}</span>
          </div>
          {status === "streaming" && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        {data?.pathway && (
          <p className="text-sm text-muted-foreground">
            {data.pathway} - {data.destination}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {data?.targetWordCount && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isArabic ? "الكلمات المستهدفة" : "Target Words"}
              </span>
              <span className="font-medium">
                {data.totalWordCount || 0} / {data.targetWordCount}
              </span>
            </div>
            <Progress
              value={((data.totalWordCount || 0) / data.targetWordCount) * 100}
              className="h-2"
            />
          </div>
        )}

        {/* Sections */}
        <div className="space-y-2">
          {data?.sections?.map((section, index) => (
            <Collapsible
              key={index}
              open={openSections.has(index)}
              onOpenChange={() => toggleSection(index)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-6 w-6 p-0 flex items-center justify-center"
                  >
                    {index + 1}
                  </Badge>
                  <span className="font-medium text-sm">{section.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    ~{section.wordCount} {isArabic ? "كلمة" : "words"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openSections.has(index) ? "rotate-180" : ""}`}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pt-2 pb-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
                {section.suggestions && section.suggestions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-medium text-primary mb-1">
                      {isArabic ? "اقتراحات:" : "Suggestions:"}
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {section.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* Tips */}
        {data?.tips && data.tips.length > 0 && (
          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {isArabic ? "نصائح للكتابة" : "Writing Tips"}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {data.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
