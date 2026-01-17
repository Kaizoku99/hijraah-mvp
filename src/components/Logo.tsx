import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  /**
   * Custom className for the container div
   */
  className?: string;
  /**
   * Whether to wrap the logo in a Link component
   * @default true
   */
  linkToHome?: boolean;
  /**
   * Width of the logo container in pixels
   * @default 160
   */
  width?: number;
  /**
   * Height of the logo container in pixels
   * @default 40
   */
  height?: number;
  /**
   * Priority loading for above-the-fold images
   * @default false
   */
  priority?: boolean;
}

/**
 * Logo component that displays the Hijraah brand logo using Next.js Image optimization
 * 
 * Features:
 * - Uses Next.js Image component for automatic optimization
 * - Optionally wraps in a Link to home page
 * - Configurable dimensions and priority loading
 * - Follows accessibility best practices
 * 
 * @example
 * ```tsx
 * // Basic usage (links to home)
 * <Logo />
 * 
 * // Without link
 * <Logo linkToHome={false} />
 * 
 * // With priority loading for above-the-fold placement
 * <Logo priority />
 * 
 * // Custom size
 * <Logo width={200} height={50} />
 * ```
 */
export function Logo({
  className,
  linkToHome = true,
  width = 160,
  height = 40,
  priority = false,
}: LogoProps) {
  const logoImage = (
    <div className={cn("relative", className)} style={{ width, height }}>
      <Image
        src="/Hijraah_logo.png"
        alt="Hijraah"
        fill
        className="object-contain object-left"
        priority={priority}
      />
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="flex items-center">
        {logoImage}
      </Link>
    );
  }

  return logoImage;
}
