import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { Language } from "@/contexts/LanguageContext";

interface ImpactIconProps {
    isAustralia: boolean;
    language: Language;
}

export const ImpactIcon = ({ isAustralia, language }: ImpactIconProps) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "inline-flex items-center justify-center ml-2 h-5 w-5 rounded-full cursor-help",
                    isAustralia ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                )}>
                    <span className="text-[10px] font-bold px-1">{isAustralia ? "PR" : "CRS"}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p className="text-xs">
                    {language === "ar"
                        ? (isAustralia ? "هذا الحقل يؤثر على نقاط تأشيرة أستراليا" : "هذا الحقل يؤثر بشكل مباشر على نقاط CRS الخاصة بك")
                        : (isAustralia ? "This field impacts your Australia PR points" : "This field directly impacts your CRS score")}
                </p>
            </TooltipContent>
        </Tooltip>
    );
};
