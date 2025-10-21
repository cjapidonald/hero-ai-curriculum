import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "./LanguageToggle";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { to: "/", label: t('nav.home') },
    { to: "/curriculum", label: t('nav.curriculum') },
    { to: "/fees", label: t('nav.fees') },
    { to: "/about", label: t('nav.about') },
    { to: "/events", label: t('nav.events') },
    { to: "/contact", label: t('nav.contact') },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-sm shadow-md" : "bg-background"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="flex items-center bg-green-500 rounded-full w-10 h-10 md:w-12 md:h-12 justify-center transition-transform group-hover:scale-110">
              <img src="/logo.svg" alt="HeroSchool Logo" className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl md:text-2xl font-bold text-foreground">Hero</span>
              <span className="text-xl md:text-2xl font-bold text-secondary">School</span>
            </div>
          </NavLink>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `font-medium transition-all duration-300 relative py-1 ${
                    isActive
                      ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                      : "text-foreground hover:text-primary"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageToggle />
            <Button asChild variant="default" className="rounded-full">
              <NavLink to="/contact">{t('nav.bookTrial')}</NavLink>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <NavLink to="/login">{t('nav.login')}</NavLink>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-primary"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden fixed inset-0 top-16 bg-background z-40 animate-slide-in">
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `text-lg font-medium py-3 px-4 rounded-lg transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="flex flex-col gap-3 mt-4">
                <LanguageToggle />
                <Button asChild className="w-full rounded-full">
                  <NavLink to="/contact" onClick={() => setIsOpen(false)}>
                    {t('nav.bookTrial')}
                  </NavLink>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-full border-primary text-primary">
                  <NavLink to="/login" onClick={() => setIsOpen(false)}>{t('nav.login')}</NavLink>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
