import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, Sparkles, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { Container } from "../common/Container";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/auth/context";

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, signOut, refreshSession } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

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
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-surface animate-pulse" />
              ) : isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface transition-colors"
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                  >
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                        {getInitials(user?.name)}
                      </div>
                    )}
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  </button>
                  
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-elevated py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-medium text-text-primary">{user?.name || "User"}</p>
                          <p className="text-xs text-text-muted truncate">{user?.email}</p>
                        </div>
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link
                          to="/create"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Sparkles className="w-4 h-4" />
                          Create
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-background transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link to="/auth/signin" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                    Sign In
                  </Link>
                  <Button size="sm" asChild>
                    <Link to="/create">Get Started</Link>
                  </Button>
                </>
              )}
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
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className="px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/create" className="px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">
                      Create
                    </Link>
                    <Button className="w-full justify-center" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth/signin" className="px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">
                      Sign In
                    </Link>
                    <Button className="w-full justify-center" asChild>
                      <Link to="/create">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Container>
        </motion.div>
      )}
    </header>
  );
}