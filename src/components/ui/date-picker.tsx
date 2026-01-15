"use client"

import * as React from "react"
import { format } from "date-fns"
import { arSA, enUS } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useLanguage } from "@/contexts/LanguageContext"

interface DatePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    className,
    disabled,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const { language } = useLanguage()
    const locale = language === 'ar' ? arSA : enUS

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, "PPP", { locale }) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                        onChange?.(date)
                        setOpen(false)
                    }}
                    captionLayout="dropdown"
                    fromYear={1940}
                    toYear={new Date().getFullYear()}
                    locale={locale}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
            </PopoverContent>
        </Popover>
    )
}
