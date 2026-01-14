'use client'

import { CheckCircle2, Circle, Clock, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ImmigrationJourneyProps {
    profileCompletion: number;
    hasCrsScore: boolean;
    documentsUploaded: number;
    totalDocuments: number;
}

export function ImmigrationJourney({
    profileCompletion,
    hasCrsScore,
    documentsUploaded,
    totalDocuments
}: ImmigrationJourneyProps) {
    const { language } = useLanguage();

    const steps = [
        {
            id: "profile",
            title: language === "ar" ? "إكمال الملف الشخصي" : "Complete Profile",
            description: language === "ar" ? "أضف تفاصيلك الشخصية والمهنية" : "Add your personal and professional details",
            isCompleted: profileCompletion === 100,
            isActive: profileCompletion < 100,
            link: "/profile",
            linkText: language === "ar" ? "اذهب للملف" : "Go to Profile"
        },
        {
            id: "crs",
            title: language === "ar" ? "حساب نقاط CRS" : "Calculate CRS Score",
            description: language === "ar" ? "اعرف فرصك في الهجرة" : "Know your immigration chances",
            isCompleted: hasCrsScore,
            isActive: profileCompletion === 100 && !hasCrsScore,
            link: "/calculator",
            linkText: language === "ar" ? "احسب الآن" : "Calculate Now"
        },
        {
            id: "documents",
            title: language === "ar" ? "تجهيز المستندات" : "Prepare Documents",
            description: language === "ar"
                ? `${documentsUploaded}/${totalDocuments || 0} مستند تم رفعه`
                : `${documentsUploaded}/${totalDocuments || 0} documents uploaded`,
            isCompleted: totalDocuments > 0 && documentsUploaded >= totalDocuments,
            isActive: hasCrsScore && (totalDocuments === 0 || documentsUploaded < totalDocuments),
            link: "/documents",
            linkText: language === "ar" ? "إدارة المستندات" : "Manage Documents"
        },
        {
            id: "application",
            title: language === "ar" ? "تقديم الطلب" : "Submit Application",
            description: language === "ar" ? "الخطوة النهائية (قريباً)" : "Final step (Coming Soon)",
            isCompleted: false,
            isActive: false, // Future step
            link: "#",
            linkText: language === "ar" ? "قريباً" : "Coming Soon"
        }
    ];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    {language === "ar" ? "رحلة الهجرة" : "Immigration Journey"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative space-y-0">
                    {/* Vertical Line */}
                    <div className={`absolute top-2 bottom-8 w-0.5 bg-muted ${language === "ar" ? "right-[15px]" : "left-[15px]"}`} />

                    {steps.map((step, index) => (
                        <div key={step.id} className={`relative flex gap-4 pb-8 last:pb-0 ${language === "ar" ? "flex-row-reverse text-right" : ""}`}>
                            {/* Icon/Status Bubble */}
                            <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background ring-2 ${step.isCompleted
                                    ? "ring-green-500 text-green-500"
                                    : step.isActive
                                        ? "ring-blue-500 text-blue-500"
                                        : "ring-muted text-muted-foreground"
                                }`}>
                                {step.isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : step.isActive ? (
                                    <Clock className="h-5 w-5 animate-pulse" />
                                ) : (
                                    <Circle className="h-5 w-5" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-0.5">
                                <h4 className={cn("text-sm font-semibold",
                                    step.isActive && "text-primary",
                                    step.isCompleted && "text-green-600"
                                )}>
                                    {step.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {step.description}
                                </p>
                                {step.isActive && step.link !== "#" && (
                                    <Link href={step.link}>
                                        <Button size="sm" variant="outline" className="h-7 text-xs">
                                            {step.linkText}
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
