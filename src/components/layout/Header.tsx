import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { Container } from "../common/Container";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/effects", label: "Effects" },
  { href: "/create", label: "Create" },
  { href: "/cinema-studio", label: "Cinema Studio" },
  { href: "/apps", label: "Apps" },
  { href: "/community", label: "Community" },
  { href: "/pricing", label: "Pricing" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled ? "bg-bg/90 backdrop-blur-md border-b border-border" : "bg-transparent"
      )}
    >
      <Container>
        <nav className="flex items-center justify-between h-16 lg:h-20" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-2 text-xl font-display font-bold text-text-primary z-10" aria-label="Higgsfield Home">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>Higgsfield</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors relative py-2",
                  location.pathname === link.href
                    ? "text-primary"
                    : "text-text-secondary hover:text-text-primary"
                )}
                aria-current={location.pathname === link.href ? "page" : undefined}
              >
                {link.label}
                {location.pathname === link.href && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Sign In
              </Link>
              <Button size="sm" asChild>
                <Link to="/create">Get Started</Link>
              </Button>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </Container>

      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden bg-bg/95 backdrop-blur-md border-b border-border overflow-hidden"
        >
          <Container className="py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link to="/pricing" className="px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">
                  Pricing
                </Link>
                <Link to="/login" className="px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">
                  Sign In
                </Link>
                <Button className="w-full justify-center" asChild>
                  <Link to="/create">Get Started</Link>
                </Button>
              </div>
            </div>
          </Container>
        </motion.div>
      )}
    </header>
  );
}