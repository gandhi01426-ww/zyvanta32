import { GraduationCap, Menu, Search, ShoppingBag, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { ZyvantaLogo } from "./ZyvantaLogo";

const links = [
  { label: "Shop", href: "/#shop" },
  { label: "Why Us", href: "/#whyus" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Contact", href: "/#contact" },
];

const Navbar = () => {
  const { count, openCart } = useCart();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const closeMenu = () => setOpen(false);
  const goHome = () => {
    closeMenu();
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = searchTerm.trim();
    closeMenu();
    if (!query) {
      navigate({ pathname: "/", hash: "#shop" });
      window.setTimeout(() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }), 50);
      return;
    }
    navigate({ pathname: "/", search: `?search=${encodeURIComponent(query)}`, hash: "#shop" });
    window.setTimeout(() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("search") || "");
  }, [location.search]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass">
        <nav className="container flex items-center justify-between h-16 md:h-20 gap-3">
          <Link to="/" onClick={goHome} aria-label="Zyvanta home" className="shrink-0">
            <ZyvantaLogo className="text-xl md:text-2xl" />
          </Link>

          <ul className="hidden md:flex items-center gap-4 lg:gap-5 text-sm uppercase tracking-widest text-muted-foreground">
            <li>
              <a href="/#shop" className="hover:text-gold transition-colors">Shop</a>
            </li>
            <li>
              <form onSubmit={submitSearch} className="flex w-40 lg:w-52 xl:w-64 items-center gap-2 rounded-full border border-gold/30 bg-background/70 px-3 py-2 focus-within:border-gold normal-case tracking-normal">
                <Search className="w-4 h-4 text-gold shrink-0" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                  maxLength={80}
                  aria-label="Search products"
                />
                <button type="submit" className="text-[10px] uppercase tracking-widest text-gold font-bold">
                  Go
                </button>
              </form>
            </li>
            {links.slice(1).map((l) => (
              <li key={l.label}>
                <a href={l.href} className="hover:text-gold transition-colors">{l.label}</a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to="/courses"
              className="hidden sm:inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-gradient-gold text-noir text-[11px] uppercase tracking-[0.25em] font-bold shadow-gold hover:scale-105 transition-transform"
            >
              <GraduationCap className="w-4 h-4" /> Courses
            </Link>
            <button onClick={openCart} className="relative p-2 rounded-full glass hover:shadow-gold transition-all" aria-label="Open cart">
              <ShoppingBag className="w-5 h-5 text-gold" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] bg-gradient-gold text-noir rounded-full grid place-items-center font-bold animate-glow-pulse">
                  {count}
                </span>
              )}
            </button>
            <button onClick={() => setOpen((o) => !o)} className="md:hidden p-2 text-gold" aria-label="Menu">
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
        {open && (
          <div className="md:hidden border-t border-gold/20 glass">
            <ul className="container py-4 flex flex-col gap-3 text-sm uppercase tracking-widest">
              <li>
                <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-full border border-gold/30 px-3 py-2 normal-case tracking-normal">
                  <Search className="w-4 h-4 text-gold shrink-0" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search products"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                    maxLength={80}
                    aria-label="Search products"
                  />
                  <button type="submit" className="text-[10px] uppercase tracking-widest text-gold font-bold">
                    Search
                  </button>
                </form>
              </li>
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} onClick={closeMenu} className="block py-2 text-muted-foreground hover:text-gold">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/courses" onClick={closeMenu} className="w-full text-left py-2 text-gold inline-flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Courses
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>
  );
};
export default Navbar;
