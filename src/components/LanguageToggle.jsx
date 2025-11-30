import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2"
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">
        {language === "en" ? "हिंदी" : "English"}
      </span>
    </Button>
  );
};

export default LanguageToggle;
