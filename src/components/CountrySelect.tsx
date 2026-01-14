'use client'

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// MENA Countries + Common Residence Countries
export const COUNTRIES = [
    // North Africa
    { value: "algeria", labelAr: "الجزائر", labelEn: "Algeria" },
    { value: "egypt", labelAr: "مصر", labelEn: "Egypt" },
    { value: "libya", labelAr: "ليبيا", labelEn: "Libya" },
    { value: "mauritania", labelAr: "موريتانيا", labelEn: "Mauritania" },
    { value: "morocco", labelAr: "المغرب", labelEn: "Morocco" },
    { value: "sudan", labelAr: "السودان", labelEn: "Sudan" },
    { value: "tunisia", labelAr: "تونس", labelEn: "Tunisia" },
    // Levant
    { value: "jordan", labelAr: "الأردن", labelEn: "Jordan" },
    { value: "lebanon", labelAr: "لبنان", labelEn: "Lebanon" },
    { value: "palestine", labelAr: "فلسطين", labelEn: "Palestine" },
    { value: "syria", labelAr: "سوريا", labelEn: "Syria" },
    // Gulf States
    { value: "bahrain", labelAr: "البحرين", labelEn: "Bahrain" },
    { value: "iraq", labelAr: "العراق", labelEn: "Iraq" },
    { value: "kuwait", labelAr: "الكويت", labelEn: "Kuwait" },
    { value: "oman", labelAr: "عُمان", labelEn: "Oman" },
    { value: "qatar", labelAr: "قطر", labelEn: "Qatar" },
    { value: "saudi_arabia", labelAr: "السعودية", labelEn: "Saudi Arabia" },
    { value: "uae", labelAr: "الإمارات", labelEn: "United Arab Emirates" },
    { value: "yemen", labelAr: "اليمن", labelEn: "Yemen" },
    // Other Arab Countries
    { value: "comoros", labelAr: "جزر القمر", labelEn: "Comoros" },
    { value: "djibouti", labelAr: "جيبوتي", labelEn: "Djibouti" },
    { value: "somalia", labelAr: "الصومال", labelEn: "Somalia" },
    // Common Destination Countries
    { value: "canada", labelAr: "كندا", labelEn: "Canada" },
    { value: "usa", labelAr: "الولايات المتحدة", labelEn: "United States" },
    { value: "uk", labelAr: "المملكة المتحدة", labelEn: "United Kingdom" },
    { value: "france", labelAr: "فرنسا", labelEn: "France" },
    { value: "germany", labelAr: "ألمانيا", labelEn: "Germany" },
    { value: "turkey", labelAr: "تركيا", labelEn: "Turkey" },
    { value: "malaysia", labelAr: "ماليزيا", labelEn: "Malaysia" },
    { value: "other", labelAr: "أخرى", labelEn: "Other" },
]

interface CountrySelectProps {
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    language?: "ar" | "en"
    className?: string
}

export function CountrySelect({
    value,
    onValueChange,
    placeholder,
    language = "en",
    className,
}: CountrySelectProps) {
    const [open, setOpen] = React.useState(false)

    const selectedCountry = COUNTRIES.find((c) => c.value === value)
    const displayLabel = selectedCountry
        ? language === "ar" ? selectedCountry.labelAr : selectedCountry.labelEn
        : null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    {displayLabel || placeholder || (language === "ar" ? "اختر البلد..." : "Select country...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={language === "ar" ? "ابحث عن بلد..." : "Search country..."}
                    />
                    <CommandList className="max-h-[300px]">
                        <CommandEmpty>
                            {language === "ar" ? "لا توجد نتائج" : "No country found."}
                        </CommandEmpty>
                        <CommandGroup>
                            {COUNTRIES.map((country) => (
                                <CommandItem
                                    key={country.value}
                                    value={`${country.labelEn} ${country.labelAr}`} // Search both languages
                                    onSelect={() => {
                                        onValueChange(country.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === country.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {language === "ar" ? country.labelAr : country.labelEn}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
