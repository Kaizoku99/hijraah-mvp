import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  // Import dynamically or assume context is available if inside providers.
  // Ideally, useLanguage hook. But since this is a UI component, 
  // ensuring it's cleaner to pass dir. Or import the hook.

  // To avoid circular deps if any, we just stick to standard hook import
  const { dir } = useLanguage();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      dir={dir}
      richColors
      closeButton
      position="top-center"
      offset={16}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
