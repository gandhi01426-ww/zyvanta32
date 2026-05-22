import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Gift, Globe, Instagram, LifeBuoy, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { ZyvantaLogo } from "./ZyvantaLogo";
import { fallbackFooterPages, FooterPage } from "@/data/footer-pages";
import { fallbackSiteSettings, SiteSettings } from "@/data/site-settings";
import { getFooterPages, getSiteSettings } from "@/services/api";

const activeFallback = fallbackFooterPages.filter((page) => page.is_active !== false);

function groupFooterPages(pages: FooterPage[]) {
  const groups: { title: string; pages: FooterPage[]; order: number }[] = [];
  pages
    .filter((page) => page.is_active !== false && page.section_title !== "Footer")
    .sort((a, b) => a.section_order - b.section_order || a.sort_order - b.sort_order || a.label.localeCompare(b.label))
    .forEach((page) => {
      const group = groups.find((item) => item.title === page.section_title);
      if (group) {
        group.pages.push(page);
      } else {
        groups.push({ title: page.section_title, pages: [page], order: page.section_order });
      }
    });
  return groups.sort((a, b) => a.order - b.order);
}

const externalUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "#";
  try {
    const parsed = new URL(trimmed);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "#";
  } catch {
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }
};

const Footer = () => {
  const [pages, setPages] = useState<FooterPage[]>(activeFallback);
  const [settings, setSettings] = useState<SiteSettings>(fallbackSiteSettings);

  useEffect(() => {
    let mounted = true;
    Promise.all([getFooterPages(), getSiteSettings()]).then(([nextPages, nextSettings]) => {
      if (!mounted) return;
      setPages(nextPages);
      setSettings(nextSettings);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const footerGroups = useMemo(() => groupFooterPages(pages), [pages]);
  const giftCards = pages.find((page) => page.slug === "gift-cards");
  const helpCenter = pages.find((page) => page.slug === "help-center");
  const socials = [
    { Icon: Instagram, href: externalUrl(settings.instagram_url), label: "Instagram" },
    { Icon: Facebook, href: externalUrl(settings.facebook_url), label: "Facebook" },
    { Icon: Youtube, href: externalUrl(settings.youtube_url), label: "YouTube" },
    { Icon: Twitter, href: externalUrl(settings.twitter_url), label: "Twitter / X" },
  ];
  const mapQuery = encodeURIComponent(settings.map_query || settings.office_address);
  const phoneHref = settings.phone.replace(/[^\d+]/g, "");

  return (
    <footer id="contact" className="border-t border-gold/20 mt-16">
      <div className="container py-16 grid gap-10 md:grid-cols-3 lg:grid-cols-6">
        <div className="md:col-span-3 lg:col-span-2 space-y-4">
          <ZyvantaLogo className="text-2xl" />
          <p className="text-sm text-muted-foreground max-w-sm">
            Royal essentials engineered for the future. Crafted in obsidian, finished in gold.
          </p>
          <div className="flex gap-3 pt-2">
            {socials.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full glass grid place-items-center text-gold hover:shadow-gold hover:scale-110 transition-all"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <h4 className="font-display text-gold mb-4 uppercase tracking-widest text-xs">{group.title}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {group.pages.map((page) => (
                <li key={page.slug}>
                  <Link to={`/info/${page.slug}`} className="hover:text-gold transition-colors">{page.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container pb-12 grid md:grid-cols-2 gap-8">
        <div className="glass gold-border rounded-2xl p-6 space-y-3">
          <h4 className="font-display text-gold uppercase tracking-widest text-xs inline-flex items-center gap-2">
            <Mail className="w-4 h-4" /> Mail Us
          </h4>
          <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
            <Mail className="w-4 h-4 text-gold" /> {settings.email}
          </a>
          <a href={`tel:${phoneHref}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
            <Phone className="w-4 h-4 text-gold" /> {settings.phone}
          </a>
          <a href={externalUrl(settings.instagram_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
            <Instagram className="w-4 h-4 text-gold" /> {settings.instagram_handle}
          </a>
        </div>

        <div className="glass gold-border rounded-2xl p-6 space-y-3">
          <h4 className="font-display text-gold uppercase tracking-widest text-xs inline-flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Registered Office Address
          </h4>
          <p className="text-sm text-muted-foreground">{settings.company_name}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            <MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" />
            <span>{settings.office_address}</span>
          </a>
        </div>
      </div>

      <div className="container">
        <div className="rounded-2xl overflow-hidden glass gold-border shadow-elite">
          <iframe
            title="Zyvanta location map"
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            width="100%"
            height="280"
            style={{ border: 0, pointerEvents: "none" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>

      <div className="border-t border-gold/10 mt-10">
        <div className="container py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-5 text-muted-foreground">
            <Link to={`/info/${giftCards?.slug || "gift-cards"}`} className="inline-flex items-center gap-2 hover:text-gold transition-colors">
              <Gift className="w-4 h-4 text-gold" /> Gift Cards
            </Link>
            <Link to={`/info/${helpCenter?.slug || "help-center"}`} className="inline-flex items-center gap-2 hover:text-gold transition-colors">
              <LifeBuoy className="w-4 h-4 text-gold" /> Help Center
            </Link>
            <span className="inline-flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold" /> Copyright {new Date().getFullYear()} Zyvanta
            </span>
          </div>
          <span className="uppercase tracking-widest text-muted-foreground">{settings.footer_note}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
