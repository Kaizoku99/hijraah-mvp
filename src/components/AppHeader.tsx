'use client';

import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { UsageDisplay } from "@/components/UsageDisplay";
import { Logo } from "@/components/Logo";
import { User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  /**
   * Custom className for the header element
   */
  className?: string;
  /**
   * Show/hide the usage display
   * @default true
   */
  showUsage?: boolean;
  /**
   * Show/hide the language toggle
   * @default true
   */
  showLanguageToggle?: boolean;
  /**
   * Show/hide the profile button
   * @default true
   */
  showProfile?: boolean;
  /**
   * Show/hide the logout button
   * @default true
   */
  showLogout?: boolean;
  /**
   * Additional actions to render in the header (before the standard actions)
   */
  additionalActions?: ReactNode;
  /**
   * Custom actions to replace the default action buttons entirely
   * If provided, this will replace showProfile and showLogout buttons
   */
  customActions?: ReactNode;
  /**
   * Custom left section to replace the default logo
   * Useful for pages that need sidebar triggers or other left-side controls
   */
  leftSection?: ReactNode;
  /**
   * Callback when logout is clicked
   * If not provided, uses default logout behavior
   */
  onLogout?: () => void | Promise<void>;
}

/**
 * AppHeader component - A reusable header for authenticated pages
 * 
 * Features:
 * - Displays Hijraah logo (links to home)
 * - Usage display, language toggle, profile link, and logout button
 * - Fully customizable with props
 * - Consistent branding across all pages
 * - Sticky positioning with backdrop blur for modern look
 * - Responsive design with mobile-friendly spacing
 * 
 * @example
 * ```tsx
 * // Basic usage with all default features
 * <AppHeader />
 * 
 * // Hide certain elements
 * <AppHeader showUsage={false} showProfile={false} />
 * 
 * // Add custom actions before default buttons
 * <AppHeader
 *   additionalActions={
 *     <Button variant="ghost">Custom Action</Button>
 *   }
 * />
 * 
 * // Completely custom actions
 * <AppHeader
 *   customActions={
 *     <>
 *       <Button>Custom 1</Button>
 *       <Button>Custom 2</Button>
 *     </>
 *   }
 * />
 * 
 * // Custom logout handler
 * <AppHeader onLogout={async () => {
 *   // Custom logout logic
 *   await customLogout();
 *   router.push("/");
 * }} />
 * ```
 */
export function AppHeader({
  className,
  showUsage = true,
  showLanguageToggle = true,
  showProfile = true,
  showLogout = true,
  additionalActions,
  customActions,
  leftSection,
  onLogout,
}: AppHeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const { targetDestination } = useUserProfile();

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await logout();
      router.push("/");
    }
  };

  return (
    <header
      className={cn(
        "border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {leftSection ? leftSection : <Logo priority />}

        <div className="flex items-center gap-2 md:gap-4">
          {/* Additional actions (if provided) */}
          {additionalActions}

          {/* Standard actions or custom actions */}
          {customActions ? (
            customActions
          ) : (
            <>
              <Link href="/pricing" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  {t("nav.pricing")}
                </Button>
              </Link>
              {showUsage && <UsageDisplay targetDestination={targetDestination} />}
              {showLanguageToggle && <LanguageToggle />}
              {showProfile && (
                <Link href="/profile" className="hidden md:block">
                  <Button variant="ghost" size="icon-lg" aria-label="Profile">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              {showLogout && (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
