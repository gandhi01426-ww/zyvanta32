import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Mail, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fallbackFooterPages, FooterPage } from "@/data/footer-pages";
import { getFooterPages } from "@/services/api";

const activeFallback = fallbackFooterPages.filter((page) => page.is_active !== false);

function formatBody(body: string) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

const FooterInfo = () => {
  const { slug = "" } = useParams();
  const [pages, setPages] = useState<FooterPage[]>(activeFallback);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    let mounted = true;
    getFooterPages().then((nextPages) => {
      if (mounted) setPages(nextPages);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const page = useMemo(() => pages.find((item) => item.slug === slug && item.is_active !== false), [pages, slug]);
  const related = useMemo(
    () => pages
      .filter((item) => item.is_active !== false && item.section_title === page?.section_title && item.slug !== page?.slug)
      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label))
      .slice(0, 5),
    [page, pages],
  );

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute -top-36 right-0 w-[520px] h-[520px] bg-radial-gold blur-3xl pointer-events-none" />
        <div className="container relative">
          <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold hover:opacity-80 mb-8">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>

          {page ? (
            <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
              <article className="glass gold-border rounded-3xl p-6 md:p-9 shadow-elite">
                <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-gold">
                  <FileText className="w-3.5 h-3.5" /> {page.section_title}
                </div>
                <h1 className="font-display text-4xl md:text-6xl mt-3">{page.label}</h1>
                <p className="text-muted-foreground mt-4 max-w-2xl">{page.summary}</p>

                <div className="mt-8 space-y-5 text-sm md:text-base leading-7 text-muted-foreground">
                  {formatBody(page.body).map((block, index) => (
                    <p key={index} className="whitespace-pre-line">{block}</p>
                  ))}
                </div>
              </article>

              <aside className="space-y-4">
                <div className="glass gold-border rounded-2xl p-5">
                  <div className="font-display text-xl inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gold" /> Zyvanta Support
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Need help with an order, payment, delivery, or policy question?
                  </p>
                  <a href="mailto:zyvanta.co@gmail.com" className="mt-4 inline-flex items-center gap-2 text-gold text-sm hover:opacity-80">
                    <Mail className="w-4 h-4" /> zyvanta.co@gmail.com
                  </a>
                </div>

                {related.length > 0 && (
                  <div className="glass gold-border rounded-2xl p-5">
                    <div className="font-display text-xl">More {page.section_title}</div>
                    <div className="mt-4 space-y-2">
                      {related.map((item) => (
                        <Link key={item.slug} to={`/info/${item.slug}`} className="block text-sm text-muted-foreground hover:text-gold transition-colors">
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          ) : (
            <div className="glass gold-border rounded-3xl p-8 text-center max-w-2xl mx-auto">
              <div className="font-display text-3xl">Information unavailable</div>
              <p className="text-sm text-muted-foreground mt-3">This page is not active right now.</p>
              <Link to="/" className="mt-6 inline-flex bg-gradient-gold text-noir rounded-full px-6 py-3 text-xs uppercase tracking-widest font-bold">
                Return Home
              </Link>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default FooterInfo;
