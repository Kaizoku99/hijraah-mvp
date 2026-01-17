import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ImpactIcon } from "./ImpactIcon";
import { cn } from "@/lib/utils";

import { Language } from "@/contexts/LanguageContext";

interface LanguageStepProps {
    formData: any;
    handleChange: (field: string, value: string) => void;
    errors: Record<string, boolean>;
    language: Language;
}

export const LanguageStep = ({ formData, handleChange, errors, language }: LanguageStepProps) => {
    return (
        <Card className={cn(errors.englishLevel ? "border-destructive" : "")}>
            <CardHeader>
                <CardTitle>{language === "ar" ? "إتقان اللغة" : "Language Proficiency"}</CardTitle>
                <CardDescription>
                    {language === "ar" ? "مهاراتك اللغوية" : "Your language skills"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="englishLevel" className={errors.englishLevel ? "text-destructive" : ""}>
                            {language === "ar" ? "مستوى الإنجليزية" : "English Level"}
                            <span className="text-destructive"> *</span>
                            <ImpactIcon isAustralia={formData.targetDestination === 'australia'} language={language} />
                        </Label>
                        <Select
                            value={formData.englishLevel}
                            onValueChange={(value) => handleChange("englishLevel", value)}
                        >
                            <SelectTrigger id="englishLevel" className={errors.englishLevel ? "border-destructive" : ""}>
                                <SelectValue
                                    placeholder={language === "ar" ? "اختر مستوى الإنجليزية" : "Select English level"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{language === "ar" ? "لا يوجد" : "None"}</SelectItem>
                                <SelectItem value="basic">{language === "ar" ? "أساسي" : "Basic"}</SelectItem>
                                <SelectItem value="intermediate">
                                    {language === "ar" ? "متوسط" : "Intermediate"}
                                </SelectItem>
                                <SelectItem value="advanced">{language === "ar" ? "متقدم" : "Advanced"}</SelectItem>
                                <SelectItem value="native">{language === "ar" ? "لغة أم" : "Native"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ieltsScore">
                            {language === "ar" ? "درجة IELTS" : "IELTS Score"}
                            <ImpactIcon isAustralia={formData.targetDestination === 'australia'} language={language} />
                        </Label>
                        <Input
                            id="ieltsScore"
                            value={formData.ieltsScore}
                            onChange={(e) => handleChange("ieltsScore", e.target.value)}
                            placeholder="e.g., 7.5"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="frenchLevel">
                            {language === "ar" ? "مستوى الفرنسية" : "French Level"}
                        </Label>
                        <Select
                            value={formData.frenchLevel}
                            onValueChange={(value) => handleChange("frenchLevel", value)}
                        >
                            <SelectTrigger id="frenchLevel">
                                <SelectValue
                                    placeholder={language === "ar" ? "اختر مستوى الفرنسية" : "Select French level"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{language === "ar" ? "لا يوجد" : "None"}</SelectItem>
                                <SelectItem value="basic">{language === "ar" ? "أساسي" : "Basic"}</SelectItem>
                                <SelectItem value="intermediate">
                                    {language === "ar" ? "متوسط" : "Intermediate"}
                                </SelectItem>
                                <SelectItem value="advanced">{language === "ar" ? "متقدم" : "Advanced"}</SelectItem>
                                <SelectItem value="native">{language === "ar" ? "لغة أم" : "Native"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tefScore">
                            {language === "ar" ? "درجة TEF" : "TEF Score"}
                        </Label>
                        <Input
                            id="tefScore"
                            value={formData.tefScore}
                            onChange={(e) => handleChange("tefScore", e.target.value)}
                            placeholder="e.g., 400"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
