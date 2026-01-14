import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const emptyStateVariants = cva(
    "flex flex-col items-center justify-center text-center animate-in fade-in-50 zoom-in-95 duration-500",
    {
        variants: {
            variant: {
                default: "p-8",
                outline: "border-2 border-dashed rounded-lg p-12 bg-muted/5",
                ghost: "p-4 bg-transparent",
            },
            size: {
                default: "min-h-[400px]",
                sm: "min-h-[200px]",
                lg: "min-h-[600px]",
                full: "h-full w-full",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface EmptyStateProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
    icon?: React.ElementType
    title?: string
    description?: string
    action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ className, variant, size, icon: Icon, title, description, action, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(emptyStateVariants({ variant, size, className }))}
                {...props}
            >
                <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
                    {Icon && (
                        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted/20 text-muted-foreground ring-8 ring-muted/10 mb-2">
                            <Icon className="w-10 h-10" />
                        </div>
                    )}

                    <div className="space-y-2">
                        {title && (
                            <h3 className="text-xl font-semibold tracking-tight">
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>

                    {action && (
                        <div className="pt-4">
                            {action}
                        </div>
                    )}

                    {children}
                </div>
            </div>
        )
    }
)
EmptyState.displayName = "EmptyState"

export { EmptyState, emptyStateVariants }
