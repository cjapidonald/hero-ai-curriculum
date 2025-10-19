import { Link } from "react-router-dom";
import { Facebook, Youtube } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-primary font-bold text-lg mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/curriculum" className="hover:text-primary transition-colors">
                  {t('nav.curriculum')}
                </Link>
              </li>
              <li>
                <Link to="/fees" className="hover:text-primary transition-colors">
                  {t('nav.fees')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-primary transition-colors">
                  {t('nav.events')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Exam Info */}
          <div>
            <h3 className="text-primary font-bold text-lg mb-4">{t('footer.cambridgeExams')}</h3>
            <ul className="space-y-2">
              <li>Pre-A1 {t('curriculum.starters')}</li>
              <li>A1 {t('curriculum.movers')}</li>
              <li>A2 {t('curriculum.flyers')}</li>
              <li className="pt-2">
                <span className="text-primary">✓ {t('footer.authorizedTestCenter')}</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-primary font-bold text-lg mb-4">{t('footer.contactUs')}</h3>
            <ul className="space-y-2">
              <li>📍 {t('footer.address')}</li>
              <li>{t('footer.district')}</li>
              <li className="pt-2">📱 0084 981646304</li>
              <li>📧 dcjapi@gmail.com</li>
              <li className="pt-2">
                <span className="text-muted-foreground text-sm">{t('footer.workingHours')}</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-primary font-bold text-lg mb-4">{t('footer.followUs')}</h3>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/Heroenglishvn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="Facebook"
              >
                <Facebook size={20} className="text-foreground" />
              </a>
              <a
                href="https://www.youtube.com/@Heroenglish-q1y"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="YouTube"
              >
                <Youtube size={20} className="text-foreground" />
              </a>
            </div>
            <div className="mt-4">
              <p className="text-sm mb-2">{t('footer.chatOnZalo')}</p>
              <a
                href="https://zalo.me/0084981646304"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-accent-teal rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t('footer.messageUs')}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright')}
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#privacy" className="hover:text-primary transition-colors">
              {t('footer.privacyPolicy')}
            </a>
            <a href="#terms" className="hover:text-primary transition-colors">
              {t('footer.termsOfService')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
