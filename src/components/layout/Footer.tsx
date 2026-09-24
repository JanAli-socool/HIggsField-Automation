import { Link } from "react-router-dom";
import { Sparkles, X, Camera, Music, MessageCircle, Briefcase, Mail, ArrowRight, ExternalLink } from "lucide-react";
import { Container } from "../common/Container";
import { cn } from "../../lib/utils";

const footerLinks = {
  Product: [
    { label: "AI Video", href: "/ai/video" },
    { label: "AI Image", href: "/ai/image" },
    { label: "Visual Effects", href: "/effects" },
    { label: "Cinema Studio", href: "/cinema-studio" },
    { label: "Apps", href: "/apps" },
    { label: "API", href: "/api" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Contact", href: "/contact" },
  ],
  Resources: [
    { label: "Community", href: "/community" },
    { label: "Documentation", href: "/docs" },
    { label: "Help Center", href: "/help" },
    { label: "Status", href: "/status" },
    { label: "Changelog", href: "/changelog" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Security", href: "/security" },
  ],
};

const socialLinks = [
  { icon: X, href: "https://x.com/higgsfield", label: "X" },
  { icon: Camera, href: "https://instagram.com/higgsfield.ai", label: "Instagram" },
  { icon: Music, href: "https://tiktok.com/@higgsfield.ai90", label: "TikTok" },
  { icon: MessageCircle, href: "https://discord.com/invite/higgsfield", label: "Discord" },
  { icon: Briefcase, href: "https://linkedin.com/company/higgsfield", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <Container className="py-16 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 text-xl font-display font-bold text-text-primary mb-6" aria-label="Higgsfield Home">
              <Sparkles className="w-6 h-6 text-primary" />
              <span>Higgsfield</span>
            </Link>
            <p className="text-text-secondary max-w-sm mb-6 leading-relaxed">
              AI-native creative suite for video, image, and motion design. Used by 25M+ creators worldwide.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-border transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-text-primary mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-text-secondary hover:text-text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            © {new Date().getFullYear()} Higgsfield. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <form className="flex gap-2">
              <label htmlFor="email-footer" className="sr-only">
                Email for newsletter
              </label>
              <input
                id="email-footer"
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 bg-bg border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary w-64"
              />
              <button type="submit" className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors" aria-label="Subscribe">
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </Container>
    </footer>
  );
}