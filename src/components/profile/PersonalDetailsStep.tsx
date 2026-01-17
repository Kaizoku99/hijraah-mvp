import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { CountrySelect } from "@/components/CountrySelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ImpactIcon } from "./ImpactIcon";
import { cn } from "@/lib/utils";

import { Language } from "@/contexts/LanguageContext";

interface PersonalDetailsStepProps {
    formData: any;
    handleChange: (field: string, value: string) => void;
    errors: Record<string, boolean>;
    language: Language;
}

export const PersonalDetailsStep = ({ formData, handleChange, errors, language }: PersonalDetailsStepProps) => {
    return (
        <Card className={cn(errors.dateOfBirth || errors.nationality || errors.currentCountry || errors.maritalStatus ? "border-destructive" : "")}>
            <CardHeader>
                <CardTitle>{language === "ar" ? "المعلومات الشخصية" : "Personal Information"}</CardTitle>
                <CardDescription>
                    {language === "ar"
                        ? "معلومات أساسية عنك"
                        : "Basic information about you"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Label htmlFor="dateOfBirth" className={errors.dateOfBirth ? "text-destructive" : ""}>
                                {language === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                                <span className="text-destructive"> *</span>
                            </Label>
                            <ImpactIcon isAustralia={formData.targetDestination === 'australia'} language={language} />
                        </div>
                        <DatePicker
                            value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                            onChange={(date) => handleChange("dateOfBirth", date ? format(date, "yyyy-MM-dd") : "")}
                            placeholder={language === "ar" ? "اختر التاريخ" : "Select date"}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nationality" className={errors.nationality ? "text-destructive" : ""}>
                            {language === "ar" ? "الجنسية" : "Nationality"}
                            <span className="text-destructive"> *</span>
                        </Label>
                        <CountrySelect
                            value={formData.nationality}
                            onValueChange={(val) => handleChange("nationality", val)}
                            placeholder={language === "ar" ? "مثال: تونسي" : "e.g., Tunisian"}
                            language={language}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currentCountry" className={errors.currentCountry ? "text-destructive" : ""}>
                            {language === "ar" ? "البلد الحالي" : "Current Country"}
                            <span className="text-destructive"> *</span>
                        </Label>
                        <CountrySelect
                            value={formData.currentCountry}
                            onValueChange={(val) => handleChange("currentCountry", val)}
                            placeholder={language === "ar" ? "مثال: الإمارات" : "e.g., UAE"}
                            language={language}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Label htmlFor="maritalStatus" className={errors.maritalStatus ? "text-destructive" : ""}>
                                {language === "ar" ? "الحالة الاجتماعية" : "Marital Status"}
                                <span className="text-destructive"> *</span>
                            </Label>
                            <ImpactIcon isAustralia={formData.targetDestination === 'australia'} language={language} />
                        </div>
                        <Select
                            value={formData.maritalStatus}
                            onValueChange={(value) => handleChange("maritalStatus", value)}
                        >
                            <SelectTrigger id="maritalStatus" className={errors.maritalStatus ? "border-destructive" : ""}>
                                <SelectValue
                                    placeholder={language === "ar" ? "اختر الحالة الاجتماعية" : "Select marital status"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">{language === "ar" ? "أعزب" : "Single"}</SelectItem>
                                <SelectItem value="married">{language === "ar" ? "متزوج" : "Married"}</SelectItem>
                                <SelectItem value="divorced">{language === "ar" ? "مطلق" : "Divorced"}</SelectItem>
                                <SelectItem value="widowed">{language === "ar" ? "أرمل" : "Widowed"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
