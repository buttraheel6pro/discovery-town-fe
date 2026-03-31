import Link from "next/link";
import {
  Zap,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";

const footerLinks = {
  Facilities: [
    { label: "Football", href: "/facilities?sport=Football" },
    { label: "Swimming", href: "/facilities?sport=Swimming" },
    { label: "Gym & Fitness", href: "/facilities?sport=Gym" },
    { label: "Tennis", href: "/facilities?sport=Tennis" },
    { label: "Yoga Studio", href: "/facilities?sport=Yoga" },
  ],
  Programmes: [
    { label: "Classes", href: "/classes" },
    { label: "Events", href: "/events" },
    { label: "Junior Academy", href: "/classes?level=junior" },
    { label: "Personal Training", href: "/classes?type=pt" },
  ],
  Account: [
    { label: "Sign In", href: "/account/login" },
    { label: "Register", href: "/account/register" },
    { label: "My Bookings", href: "/account/bookings" },
    { label: "Order History", href: "/account/orders" },
  ],
  Support: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faqs" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
};

export function CustomerFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-sm flex items-center justify-center">
                <Zap
                  className="w-5 h-5 text-accent-foreground"
                  fill="currentColor"
                />
              </div>
              <span
                className="text-lg font-black tracking-tight"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                Discovery Town
              </span>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/70">
              Your premier sports complex for facilities, classes, and events.
              We exist to help you move more, compete harder, and live better.
            </p>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-accent" />
                <span>1 Apex Way, Sports Quarter, London, EC1A 1BB</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-accent" />
                <span>+44 20 7946 0000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-accent" />
                <span>hello@apexsports.com</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="w-8 h-8 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary-foreground/50">
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} Discovery Town Complex. All rights
            reserved.
          </p>
          <p className="text-xs text-primary-foreground/30">
            Built with excellence.
          </p>
        </div>
      </div>
    </footer>
  );
}
