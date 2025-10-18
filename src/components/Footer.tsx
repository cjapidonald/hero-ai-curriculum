import { Link } from "react-router-dom";
import { Facebook, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-primary font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/curriculum" className="hover:text-primary transition-colors">
                  Curriculum
                </Link>
              </li>
              <li>
                <Link to="/fees" className="hover:text-primary transition-colors">
                  Tuition Fees
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-primary transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Exam Info */}
          <div>
            <h3 className="text-primary font-bold text-lg mb-4">Cambridge Exams</h3>
            <ul className="space-y-2">
              <li>Pre-A1 Starters</li>
              <li>A1 Movers</li>
              <li>A2 Flyers</li>
              <li className="pt-2">
                <span className="text-primary">✓ Authorized Test Center</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-primary font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li>📍 Smart City, i4 Building Imperia</li>
              <li>Nam Từ Liêm, Hanoi</li>
              <li className="pt-2">📱 0084 981646304</li>
              <li>📧 dcjapi@gmail.com</li>
              <li className="pt-2">
                <span className="text-muted-foreground text-sm">Mon-Fri: 8:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-primary font-bold text-lg mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61552900374349"
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
              <p className="text-sm mb-2">Chat on Zalo:</p>
              <a
                href="https://zalo.me/0084981646304"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-accent-teal rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Message Us
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 HeroSchool English Center. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
