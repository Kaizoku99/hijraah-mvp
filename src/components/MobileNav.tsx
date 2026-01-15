'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Calculator, FileText, LayoutDashboard, User, MoreHorizontal } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, labelEn: "Home", labelAr: "الرئيسية" },
    { href: "/chat", icon: MessageSquare, labelEn: "Chat", labelAr: "محادثة" },
    { href: "/calculator", icon: Calculator, labelEn: "CRS", labelAr: "النقاط" },
    { href: "/documents", icon: FileText, labelEn: "Docs", labelAr: "المستندات" },
    { href: "/profile", icon: User, labelEn: "Profile", labelAr: "الملف" },
]

export function MobileNav() {
    const pathname = usePathname()
    const { language } = useLanguage()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t safe-area-inset-bottom">
            <div className="flex justify-around items-center h-16 w-full">
                {navItems.slice(0, 4).map((item) => {
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

                {/* More Menu for 5th item and beyond, or just show 5th if exactly 5 */}
                {navItems.length === 5 ? (
                    (() => {
                        const item = navItems[4];
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
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
                    })()
                ) : navItems.length > 5 ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <MoreHorizontal className="h-5 w-5" />
                                <span>{language === "ar" ? "المزيد" : "More"}</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                            {navItems.slice(4).map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                                return (
                                    <DropdownMenuItem key={item.href} asChild>
                                        <Link href={item.href} className={cn("flex items-center gap-2 cursor-pointer", isActive && "bg-accent text-accent-foreground")}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{language === "ar" ? item.labelAr : item.labelEn}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </div>
        </nav>
    )
}
