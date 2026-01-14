'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Calculator, FileText, LayoutDashboard } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, labelEn: "Home", labelAr: "الرئيسية" },
    { href: "/chat", icon: MessageSquare, labelEn: "Chat", labelAr: "محادثة" },
    { href: "/calculator", icon: Calculator, labelEn: "CRS", labelAr: "النقاط" },
    { href: "/documents", icon: FileText, labelEn: "Docs", labelAr: "المستندات" },
]

export function MobileNav() {
    const pathname = usePathname()
    const { language } = useLanguage()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t safe-area-inset-bottom">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors",
                                isActive
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                            <span>{language === "ar" ? item.labelAr : item.labelEn}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
