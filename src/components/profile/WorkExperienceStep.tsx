import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ImpactIcon } from "./ImpactIcon";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { nocList } from "@/data/nocList";
import { useState } from "react";

import { Language } from "@/contexts/LanguageContext";

interface WorkExperienceStepProps {
    formData: any;
    handleChange: (field: string, value: string) => void;
    errors: Record<string, boolean>;
    language: Language;
}

export const WorkExperienceStep = ({ formData, handleChange, errors, language }: WorkExperienceStepProps) => {
    const [openCombobox, setOpenCombobox] = useState(false);

    return (
        <Card className={cn(errors.yearsOfExperience || errors.nocCode ? "border-destructive" : "")}>
            <CardHeader>
                <CardTitle>{language === "ar" ? "الخبرة العملية" : "Work Experience"}</CardTitle>
                <CardDescription>
                    {language === "ar" ? "خبرتك المهنية" : "Your professional experience"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="yearsOfExperience" className={errors.yearsOfExperience ? "text-destructive" : ""}>
                            {language === "ar" ? "سنوات الخبرة" : "Years of Experience"}
                            <span className="text-destructive"> *</span>
                            <ImpactIcon isAustralia={formData.targetDestination === 'australia'} language={language} />
                        </Label>
                        <Input
                            id="yearsOfExperience"
                            type="number"
                            min="0"
                            value={formData.yearsOfExperience}
                            onChange={(e) => handleChange("yearsOfExperience", e.target.value)}
                            placeholder="0"
                            className={errors.yearsOfExperience ? "border-destructive" : ""}
                        />
                    </div>

                    <div className="space-y-2 flex flex-col">
                        <Label htmlFor="currentOccupation">
                            {language === "ar" ? "المهنة الحالية" : "Current Occupation"}
                        </Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="justify-between"
                                >
                                    {formData.currentOccupation
                                        ? formData.currentOccupation
                                        : (language === "ar" ? "اختر أو اكتب مهنتك..." : "Select or type occupation...")}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0" align="start">
                                <Command>
                                    <CommandInput placeholder={language === "ar" ? "ابحث عن مهنة..." : "Search occupation..."} />
                                    <CommandList>
                                        <CommandEmpty>{language === "ar" ? "لا توجد نتائج." : "No occupation found."}</CommandEmpty>
                                        <CommandGroup>
                                            {nocList.map((noc) => (
                                                <CommandItem
                                                    key={noc.code}
                                                    value={noc.title}
                                                    onSelect={(currentValue) => {
                                                        handleChange("currentOccupation", currentValue);
                                                        handleChange("nocCode", noc.code);
                                                        setOpenCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.currentOccupation === noc.title ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {noc.code} - {noc.title}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {formData.targetDestination === 'canada' && (
                        <div className="space-y-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Label htmlFor="nocCode" className={cn("cursor-help flex items-center gap-1", errors.nocCode ? "text-destructive" : "")}>
                                            {language === "ar" ? "رمز NOC" : "NOC Code"}
                                            <span className="text-destructive"> *</span>
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                        </Label>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[250px]">
                                        <p className="text-xs">
                                            {language === "ar"
                                                ? "التصنيف المهني الوطني الكندي. ابحث عن رمز مهنتك على موقع Canada.ca."
                                                : "National Occupational Classification - find your job code at Canada.ca."}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Input
                                id="nocCode"
                                value={formData.nocCode}
                                onChange={(e) => handleChange("nocCode", e.target.value)}
                                placeholder="e.g., 21232"
                                className={errors.nocCode ? "border-destructive" : ""}
                            />
                            <p className="text-xs text-muted-foreground">
                                {language === "ar"
                                    ? "رمز التصنيف المهني الوطني الكندي"
                                    : "National Occupational Classification code"}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
