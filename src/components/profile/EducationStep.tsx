import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ImpactIcon } from "./ImpactIcon";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

import { Language } from "@/contexts/LanguageContext";

interface EducationStepProps {
    formData: any;
    handleChange: (field: string, value: string) => void;
    errors: Record<string, boolean>;
    language: Language;
}

export const EducationStep = ({ formData, handleChange, errors, language }: EducationStepProps) => {
    return (
        <Card className={cn(errors.educationLevel ? "border-destructive" : "")}>
            <CardHeader>
                <CardTitle>{language === "ar" ? "التعليم" : "Education"}</CardTitle>
                <CardDescription>
                    {language === "ar" ? "خلفيتك التعليمية" : "Your educational background"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Label htmlFor="educationLevel" className={cn("cursor-help flex items-center gap-1", errors.educationLevel ? "text-destructive" : "")}>
                                        {language === "ar" ? "المستوى التعليمي" : "Education Level"}
                                        <span className="text-destructive"> *</span>
                                        <Info className="h-3 w-3 text-muted-foreground" />
                                        <ImpactIcon isAustralia={formData.targetDestination === 'australia'} language={language} />
                                    </Label>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[250px]">
                                    <p className="text-xs">
                                        {language === "ar"
                                            ? "يؤثر على نقاط CRS. تأكد من إجراء تقييم الشهادات (ECA) لشهاداتك."
                                            : "Impacts CRS score. Ensure you get an Educational Credential Assessment (ECA) for your credentials."}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Select
                            value={formData.educationLevel}
                            onValueChange={(value) => handleChange("educationLevel", value)}
                        >
                            <SelectTrigger id="educationLevel" className={errors.educationLevel ? "border-destructive" : ""}>
                                <SelectValue
                                    placeholder={language === "ar" ? "اختر المستوى التعليمي" : "Select education level"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high_school">
                                    {language === "ar" ? "ثانوية عامة" : "High School"}
                                </SelectItem>
                                <SelectItem value="bachelor">
                                    {language === "ar" ? "بكالوريوس" : "Bachelor's Degree"}
                                </SelectItem>
                                <SelectItem value="master">
                                    {language === "ar" ? "ماجستير" : "Master's Degree"}
                                </SelectItem>
                                <SelectItem value="phd">{language === "ar" ? "دكتوراه" : "PhD"}</SelectItem>
                                <SelectItem value="other">{language === "ar" ? "أخرى" : "Other"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fieldOfStudy">
                            {language === "ar" ? "مجال الدراسة" : "Field of Study"}
                        </Label>
                        <Input
                            id="fieldOfStudy"
                            value={formData.fieldOfStudy}
                            onChange={(e) => handleChange("fieldOfStudy", e.target.value)}
                            placeholder={language === "ar" ? "مثال: هندسة الحاسوب" : "e.g., Computer Engineering"}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
