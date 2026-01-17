"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Calendar,
  FileX,
  ClipboardCheck,
  HeartPulse,
  Fingerprint,
  Video,
  Send,
  Flag,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DeadlineType } from "./types";
import { DEADLINE_TYPE_CONFIG } from "./types";

const deadlineSchema = z.object({
  type: z.enum([
    "document_expiry",
    "application_window",
    "test_validity",
    "medical_exam",
    "biometrics",
    "interview",
    "submission",
    "custom",
  ]),
  title: z.string().min(1, "Title is required"),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
});

type DeadlineFormData = z.infer<typeof deadlineSchema>;

interface CreateDeadlineFormProps {
  applicationId?: number;
  documentId?: number;
  onSubmit: (data: DeadlineFormData) => Promise<void>;
  onCancel?: () => void;
  defaultType?: DeadlineType;
  defaultTitle?: string;
}

const typeIcons: Record<DeadlineType, React.ComponentType<{ className?: string }>> = {
  document_expiry: FileX,
  application_window: Calendar,
  test_validity: ClipboardCheck,
  medical_exam: HeartPulse,
  biometrics: Fingerprint,
  interview: Video,
  submission: Send,
  custom: Flag,
};

// Preset durations for common document types
const DOCUMENT_PRESETS: Record<string, { months: number; labelEn: string; labelAr: string }> = {
  passport: { months: 120, labelEn: "Passport (10 years)", labelAr: "جواز السفر (10 سنوات)" },
  ielts: { months: 24, labelEn: "IELTS (2 years)", labelAr: "IELTS (سنتان)" },
  medical: { months: 12, labelEn: "Medical Exam (1 year)", labelAr: "الفحص الطبي (سنة)" },
  police_clearance: { months: 6, labelEn: "Police Clearance (6 months)", labelAr: "شهادة السجل الجنائي (6 أشهر)" },
  eca: { months: 60, labelEn: "ECA (5 years)", labelAr: "تقييم الشهادات (5 سنوات)" },
};

export function CreateDeadlineForm({
  applicationId,
  documentId,
  onSubmit,
  onCancel,
  defaultType = "custom",
  defaultTitle = "",
}: CreateDeadlineFormProps) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DeadlineFormData>({
    resolver: zodResolver(deadlineSchema),
    defaultValues: {
      type: defaultType,
      title: defaultTitle,
      titleAr: "",
      description: "",
      descriptionAr: "",
      dueDate: "",
    },
  });

  const handleSubmit = async (data: DeadlineFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPresetDate = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    form.setValue("dueDate", date.toISOString().split("T")[0]);
  };

  const selectedType = form.watch("type");
  const SelectedTypeIcon = typeIcons[selectedType as DeadlineType];

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)} 
        className={cn("space-y-6", isRtl && "rtl")}
      >
        {/* Deadline Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === "ar" ? "نوع الموعد النهائي" : "Deadline Type"}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "ar" ? "اختر النوع" : "Select type"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(DEADLINE_TYPE_CONFIG) as DeadlineType[]).map((type) => {
                    const config = DEADLINE_TYPE_CONFIG[type];
                    const Icon = typeIcons[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", config.color)} />
                          <span>
                            {language === "ar" ? config.labelAr : config.labelEn}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === "ar" ? "العنوان (الإنجليزية)" : "Title (English)"}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={language === "ar" ? "مثال: انتهاء صلاحية جواز السفر" : "e.g., Passport Expiry"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Arabic Title */}
        <FormField
          control={form.control}
          name="titleAr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === "ar" ? "العنوان (العربية)" : "Title (Arabic)"}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="مثال: انتهاء صلاحية جواز السفر"
                  dir="rtl"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {language === "ar" ? "اختياري" : "Optional"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === "ar" ? "الوصف" : "Description"}
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={
                    language === "ar" 
                      ? "أضف أي ملاحظات أو تفاصيل..." 
                      : "Add any notes or details..."
                  }
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Due Date with Presets */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === "ar" ? "تاريخ الاستحقاق" : "Due Date"}
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                {language === "ar" 
                  ? "أو اختر من الفترات الشائعة:" 
                  : "Or choose from common durations:"}
              </FormDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(DOCUMENT_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetDate(preset.months)}
                  >
                    {language === "ar" ? preset.labelAr : preset.labelEn}
                  </Button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className={cn(
          "flex items-center gap-3 pt-4",
          isRtl ? "flex-row-reverse" : ""
        )}>
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {language === "ar" ? "جاري الحفظ..." : "Saving..."}
              </>
            ) : (
              <>
                <SelectedTypeIcon className="h-4 w-4 mr-2" />
                {language === "ar" ? "إنشاء الموعد النهائي" : "Create Deadline"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
