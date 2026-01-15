'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface OtpInputProps {
    value: string
    onChange: (value: string) => void
    length?: number
    disabled?: boolean
    className?: string
}

export function OtpInput({
    value,
    onChange,
    length = 6,
    disabled = false,
    className,
}: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
        }
    }, [])

    const handleChange = (index: number, inputValue: string) => {
        // Only allow digits
        const digit = inputValue.replace(/\D/g, '').slice(-1)

        if (digit) {
            const newValue = value.split('')
            newValue[index] = digit
            onChange(newValue.join(''))

            // Auto-focus next input
            if (index < length - 1 && inputRefs.current[index + 1]) {
                inputRefs.current[index + 1]?.focus()
            }
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            e.preventDefault()
            const newValue = value.split('')

            if (newValue[index]) {
                // Clear current digit
                newValue[index] = ''
                onChange(newValue.join(''))
            } else if (index > 0) {
                // Move to previous and clear
                newValue[index - 1] = ''
                onChange(newValue.join(''))
                inputRefs.current[index - 1]?.focus()
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
        if (pastedData) {
            onChange(pastedData.padEnd(length, ''))
            // Focus last filled input or last input
            const focusIndex = Math.min(pastedData.length, length) - 1
            inputRefs.current[focusIndex]?.focus()
        }
    }

    return (
        <div className={cn('flex gap-2 justify-center', className)} dir="ltr">
            {Array.from({ length }).map((_, index) => (
                <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={cn(
                        'w-12 h-14 text-center text-2xl font-bold',
                        'focus:ring-2 focus:ring-primary focus:border-primary'
                    )}
                    aria-label={`Digit ${index + 1}`}
                />
            ))}
        </div>
    )
}
