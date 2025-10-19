import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2 font-medium hover:bg-primary/10"
      aria-label="Toggle language"
    >
      <Globe size={18} className="text-primary" />
      <span className="text-sm">{language === 'vi' ? 'EN' : 'VI'}</span>
    </Button>
  );
};

export default LanguageToggle;
