import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { Language } from "@/contexts/LanguageContext";
import {
    DESTINATIONS,
    PATHWAYS,
    AUSTRALIA_PATHWAYS,
    PORTUGAL_PATHWAYS
} from "@/data/constants";

interface GoalsStepProps {
    formData: any;
    handleChange: (field: string, value: string) => void;
    errors: Record<string, boolean>;
    language: Language;
}

export const GoalsStep = ({ formData, handleChange, errors, language }: GoalsStepProps) => {
    // Determine active pathways based on selected destination
    const activePathways = formData.targetDestination === 'australia'
        ? AUSTRALIA_PATHWAYS
        : formData.targetDestination === 'portugal'
            ? PORTUGAL_PATHWAYS
            : PATHWAYS;

    return (
        <Card className={cn(errors.immigrationPathway ? "border-destructive" : "")}>
            <CardHeader>
                <CardTitle>{language === "ar" ? "أهداف الهجرة" : "Immigration Goals"}</CardTitle>
                <CardDescription>
                    {language === "ar" ? "خططك للهجرة" : "Your immigration plans"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="targetDestination">
                            {language === "ar" ? "الوجهة المستهدفة" : "Target Destination"}
                        </Label>
                        <Select
                            value={formData.targetDestination}
                            onValueChange={(value) => {
                                handleChange("targetDestination", value);
                                // Reset pathway when destination changes to avoid invalid states
                                handleChange("immigrationPathway", "");
                            }}
                        >
                            <SelectTrigger id="targetDestination">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DESTINATIONS.map((dest) => (
                                    <SelectItem key={dest.value} value={dest.value}>
                                        {language === "ar" ? dest.labelAr : dest.labelEn}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="immigrationPathway" className={errors.immigrationPathway ? "text-destructive" : ""}>
                            {language === "ar" ? "مسار الهجرة" : "Immigration Pathway"}
                            <span className="text-destructive"> *</span>
                        </Label>
                        <Select
                            value={formData.immigrationPathway}
                            onValueChange={(value) => handleChange("immigrationPathway", value)}
                        >
                            <SelectTrigger id="immigrationPathway" className={errors.immigrationPathway ? "border-destructive" : ""}>
                                <SelectValue
                                    placeholder={language === "ar" ? "اختر مسار الهجرة" : "Select immigration pathway"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {activePathways.map((pathway) => (
                                    <SelectItem key={pathway.value} value={pathway.value}>
                                        {language === "ar" ? pathway.labelAr : pathway.labelEn}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
