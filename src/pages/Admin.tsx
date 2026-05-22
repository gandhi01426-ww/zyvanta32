import { FormEvent, useCallback, useEffect, useState } from "react";
import { BadgePercent, BookOpen, Building2, Database, Facebook, FileText, Hash, ImagePlus, Instagram, LogOut, Mail, MapPin, Package, PauseCircle, Phone, PlayCircle, Plus, Save, Settings, ShieldAlert, ShoppingBag, Sparkles, Star, Trash2, Twitter, Youtube } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Course, Product, ProductReview, fallbackCrownWants } from "@/data/catalog";
import { Coupon, Policy, adminRequest, fallbackPolicies, getHomepageSections, getPolicies, getSiteSettings } from "@/services/api";
import { FooterPage, fallbackFooterPages } from "@/data/footer-pages";
import { SiteSettings, fallbackSiteSettings } from "@/data/site-settings";
import { supabase, supabaseEnabled } from "@/services/supabase";
import { inr, toInrAmount } from "@/lib/currency";
import type { Session } from "@supabase/supabase-js";

type Tab = "products" | "courses" | "coupons" | "orders" | "reviews" | "homepage" | "site" | "footer" | "policies";
type Order = {
  id: string;
  order_code?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  coupon_code?: string | null;
  coupon_discount_percent?: number | null;
  payment_method: string;
  payment_status: string;
  order_status: string;
  razorpay_payment_id?: string;
  order_items?: { name: string; qty: number; unit_price: number; item_code?: string; item_type?: "product" | "course"; item_id?: string }[];
};

const productEmpty: Product = {
  id: "",
  code: "",
  name: "",
  price: 0,
  category: "Earbuds",
  tag: "New",
  image: "",
  gallery: [],
  tagline: "",
  description: "",
  features: [],
  rating: 5,
  review_count: 0,
  stock: 0,
  is_featured: false,
  is_active: true,
  allow_pay_now: true,
  allow_cod: true,
};

const courseEmpty: Course = {
  id: "",
  code: "",
  name: "",
  title: "",
  description: "",
  price: 0,
  duration: "",
  image: "",
  gallery: [],
  rating: 5,
  review_count: 0,
  is_active: true,
  allow_pay_now: true,
  allow_cod: false,
  sort_order: 100,
};

const reviewEmpty: ProductReview = { item_code: "", name: "", role: "", avatar: "", rating: 5, comment: "", photo: "", is_featured: true };
const couponEmpty: Coupon = {
  code: "",
  discount_percent: 10,
  min_order: 0,
  expires_at: "",
  is_active: true,
};
const footerPageEmpty: FooterPage = {
  slug: "",
  section_title: "About",
  section_order: 10,
  label: "",
  summary: "",
  body: "",
  sort_order: 100,
  is_active: true,
};

const inputCls = "w-full bg-transparent border border-gold/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold";
const tabs: { id: Tab; Icon: typeof Package; label: string }[] = [
  { id: "products", Icon: Package, label: "Products" },
  { id: "courses", Icon: BookOpen, label: "Courses" },
  { id: "coupons", Icon: BadgePercent, label: "Coupons" },
  { id: "orders", Icon: ShoppingBag, label: "Orders" },
  { id: "reviews", Icon: Star, label: "Reviews" },
  { id: "homepage", Icon: Sparkles, label: "Homepage" },
  { id: "site", Icon: Settings, label: "Site Info" },
  { id: "footer", Icon: FileText, label: "Footer Links" },
  { id: "policies", Icon: ShieldAlert, label: "Policies" },
];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const maxUploadBytes = 3 * 1024 * 1024;
const allowedUploadTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const withProductPaymentDefaults = (product: Product): Product => ({
  ...product,
  allow_pay_now: product.allow_pay_now !== false,
  allow_cod: product.allow_cod !== false,
});
const withCoursePaymentDefaults = (course: Course): Course => ({
  ...course,
  allow_pay_now: course.allow_pay_now !== false,
  allow_cod: course.allow_cod === true,
});
const paymentText = (item: { allow_pay_now?: boolean; allow_cod?: boolean }) => [
  item.allow_pay_now !== false ? "Pay Now" : "",
  item.allow_cod ? "COD" : "",
].filter(Boolean).join(" + ") || "No payment method";

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });

const cleanTextList = (items: string[] = []) => items.map((item) => item.trim()).filter(Boolean);

const uploadButtonCls =
  "cursor-pointer border border-gold/30 rounded-xl px-3 py-2 text-sm inline-flex items-center justify-center gap-2 text-gold hover:border-gold";

const UploadButton = ({
  label,
  uploading,
  onFile,
  className = uploadButtonCls,
}: {
  label: string;
  uploading: boolean;
  onFile: (file: File | undefined) => void;
  className?: string;
}) => (
  <label className={className}>
    <ImagePlus className="w-4 h-4" /> {uploading ? "Uploading..." : label}
    <input
      type="file"
      accept="image/*"
      className="hidden"
      disabled={uploading}
      onChange={(event) => {
        onFile(event.currentTarget.files?.[0]);
        event.currentTarget.value = "";
      }}
    />
  </label>
);

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesSellingEnabled, setCoursesSellingEnabled] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [policies, setPolicies] = useState<Policy[]>(fallbackPolicies);
  const [footerPages, setFooterPages] = useState<FooterPage[]>(fallbackFooterPages);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(fallbackSiteSettings);
  const [crownWants, setCrownWants] = useState(fallbackCrownWants.join("\n"));
  const [productDraft, setProductDraft] = useState<Product>(productEmpty);
  const [editingProductId, setEditingProductId] = useState("");
  const [courseDraft, setCourseDraft] = useState<Course>(courseEmpty);
  const [editingCourseId, setEditingCourseId] = useState("");
  const [couponDraft, setCouponDraft] = useState<Coupon>(couponEmpty);
  const [editingCouponCode, setEditingCouponCode] = useState("");
  const [reviewDraft, setReviewDraft] = useState<ProductReview>(reviewEmpty);
  const [footerDraft, setFooterDraft] = useState<FooterPage>(footerPageEmpty);
  const [editingFooterSlug, setEditingFooterSlug] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const token = session?.access_token || "";

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [productData, nextPolicies, homepage, nextSiteSettings] = await Promise.all([
        adminRequest<{ products: Product[] }>("/api/products?admin=true", token),
        getPolicies(),
        getHomepageSections(),
        getSiteSettings(),
      ]);
      setProducts((productData.products || []).map(withProductPaymentDefaults));
      setSiteSettings(nextSiteSettings);
      try {
        const courseData = await adminRequest<{ courses: Course[]; selling_enabled: boolean }>("/api/courses?admin=true", token);
        setCourses((courseData.courses || []).map(withCoursePaymentDefaults));
        setCoursesSellingEnabled(courseData.selling_enabled !== false);
      } catch {
        setCourses([]);
      }
      setPolicies(nextPolicies);
      setCrownWants(homepage.crownWants.join("\n"));
      if (token) {
        const orderData = await adminRequest<{ orders: Order[] }>("/api/orders", token);
        const reviewData = await adminRequest<{ reviews: ProductReview[] }>("/api/reviews", token);
        setOrders(orderData.orders || []);
        setReviews(reviewData.reviews || []);
        try {
          const couponData = await adminRequest<{ coupons: Coupon[] }>("/api/coupons", token);
          setCoupons(couponData.coupons || []);
        } catch {
          setCoupons([]);
        }
        try {
          const footerData = await adminRequest<{ pages: FooterPage[] }>("/api/site?resource=footer&admin=true", token);
          setFooterPages(footerData.pages?.length ? footerData.pages : fallbackFooterPages);
        } catch {
          setFooterPages(fallbackFooterPages);
        }
      }
    } catch (error) {
      toast({ title: "Load failed", description: error instanceof Error ? error.message : "Check Supabase admin access." });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabaseEnabled || !supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast({ title: "Sign in failed", description: error.message });
  };

  const signOut = async () => {
    if (!supabaseEnabled || !supabase) return;
    await supabase.auth.signOut();
  };

  const uploadAdminImage = async (file: File | undefined, folder: "products" | "courses" | "reviews", baseName: string) => {
    if (!file) return "";
    if (!token) {
      toast({ title: "Upload failed", description: "Please sign in as an admin again." });
      return "";
    }
    if (!allowedUploadTypes.has(file.type)) {
      toast({ title: "Upload failed", description: "Only JPG, PNG, WEBP and GIF images are allowed." });
      return "";
    }
    if (file.size > maxUploadBytes) {
      toast({ title: "Upload failed", description: "Image must be 3MB or smaller." });
      return "";
    }
    setUploadingImage(true);
    try {
      const base64 = await readFileAsBase64(file);
      const data = await adminRequest<{ publicUrl: string }>("/api/uploads", token, {
        method: "POST",
        body: JSON.stringify({
          folder,
          baseName: slugify(baseName || file.name.replace(/\.[^.]+$/, "")),
          fileName: file.name,
          contentType: file.type,
          base64,
        }),
      });
      return data.publicUrl;
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Check admin access and storage settings." });
      return "";
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadCatalogImage = async (file: File | undefined, mode: "main" | "gallery", kind: "product" | "course") => {
    const draft = kind === "product" ? productDraft : courseDraft;
    const publicUrl = await uploadAdminImage(file, kind === "product" ? "products" : "courses", draft.id || draft.name || kind);
    if (!publicUrl) return;
    try {
      const updateDraft = (prev: Product | Course) => {
        const gallery = mode === "gallery" ? [...(prev.gallery || []), publicUrl] : prev.gallery?.length ? prev.gallery : [publicUrl];
        return {
          ...prev,
          image: mode === "main" ? publicUrl : prev.image || publicUrl,
          gallery,
        };
      };
      if (kind === "product") {
        setProductDraft((prev) => updateDraft(prev) as Product);
      } else {
        setCourseDraft((prev) => updateDraft(prev) as Course);
      }
      toast({ title: mode === "main" ? `${kind === "product" ? "Product" : "Course"} image uploaded` : "Gallery image uploaded" });
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Unable to update form." });
    }
  };

  const uploadReviewAvatar = async (file: File | undefined) => {
    const publicUrl = await uploadAdminImage(file, "reviews", reviewDraft.name || reviewDraft.item_code || "review");
    if (!publicUrl) return;
    try {
      setReviewDraft((prev) => ({ ...prev, avatar: publicUrl }));
      toast({ title: "Review avatar uploaded" });
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Unable to update review form." });
    }
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (productDraft.allow_pay_now === false && productDraft.allow_cod === false) {
        toast({ title: "Payment method required", description: "Turn on Pay Now or Cash on Delivery for this product." });
        return;
      }
      const slug = productDraft.id || slugify(productDraft.name);
      const body = {
        ...productDraft,
        code: productDraft.code?.trim() || "",
        category: String(productDraft.category || "").trim() || "General",
        price: toInrAmount(productDraft.price),
        features: cleanTextList(productDraft.features),
        gallery: cleanTextList(productDraft.gallery),
        allow_pay_now: productDraft.allow_pay_now !== false,
        allow_cod: productDraft.allow_cod !== false,
        id: slug,
      };
      if (editingProductId) {
        await adminRequest(`/api/products?id=${encodeURIComponent(editingProductId)}`, token, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminRequest("/api/products", token, { method: "POST", body: JSON.stringify(body) });
      }
      setProductDraft(productEmpty);
      setEditingProductId("");
      toast({ title: "Product saved" });
      refresh();
    } catch (error) {
      toast({ title: "Save failed", description: error instanceof Error ? error.message : "Unable to save product." });
    }
  };

  const saveCourse = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (courseDraft.allow_pay_now === false && courseDraft.allow_cod !== true) {
        toast({ title: "Payment method required", description: "Turn on Pay Now or Cash on Delivery for this course." });
        return;
      }
      const slug = courseDraft.id || slugify(courseDraft.name);
      const gallery = cleanTextList(courseDraft.gallery);
      const body = {
        ...courseDraft,
        id: slug,
        code: courseDraft.code?.trim() || "",
        name: courseDraft.name.trim(),
        title: courseDraft.title.trim(),
        description: courseDraft.description.trim(),
        duration: courseDraft.duration.trim(),
        image: courseDraft.image?.trim() || gallery[0] || "",
        gallery,
        price: toInrAmount(courseDraft.price),
        rating: Math.min(5, Math.max(1, Number(courseDraft.rating) || 5)),
        review_count: Math.max(0, Math.round(Number(courseDraft.review_count) || 0)),
        sort_order: Math.round(Number(courseDraft.sort_order) || 100),
        is_active: courseDraft.is_active !== false,
        allow_pay_now: courseDraft.allow_pay_now !== false,
        allow_cod: courseDraft.allow_cod === true,
      };
      if (editingCourseId) {
        await adminRequest(`/api/courses?id=${encodeURIComponent(editingCourseId)}`, token, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminRequest("/api/courses", token, { method: "POST", body: JSON.stringify(body) });
      }
      setCourseDraft(courseEmpty);
      setEditingCourseId("");
      toast({ title: "Course saved" });
      refresh();
    } catch (error) {
      toast({ title: "Save failed", description: error instanceof Error ? error.message : "Unable to save course." });
    }
  };

  const saveCoursesSelling = async (selling_enabled: boolean) => {
    setCoursesSellingEnabled(selling_enabled);
    try {
      await adminRequest("/api/courses?settings=true", token, {
        method: "PUT",
        body: JSON.stringify({ selling_enabled }),
      });
      toast({ title: selling_enabled ? "Course selling enabled" : "Course selling paused" });
    } catch (error) {
      setCoursesSellingEnabled(!selling_enabled);
      toast({ title: "Setting failed", description: error instanceof Error ? error.message : "Unable to update courses setting." });
    }
  };

  const saveReview = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const body = { ...reviewDraft, item_code: reviewDraft.item_code?.trim().toUpperCase() || "" };
      if (reviewDraft.id) {
        await adminRequest(`/api/reviews?id=${encodeURIComponent(reviewDraft.id)}`, token, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminRequest("/api/reviews", token, { method: "POST", body: JSON.stringify(body) });
      }
      setReviewDraft(reviewEmpty);
      toast({ title: "Review saved" });
      refresh();
    } catch (error) {
      toast({ title: "Save failed", description: error instanceof Error ? error.message : "Unable to save review." });
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Remove this product from live selling? You can resume it later.")) return;
    await adminRequest(`/api/products?id=${encodeURIComponent(id)}`, token, { method: "DELETE" });
    refresh();
  };

  const resumeProduct = async (product: Product) => {
    await adminRequest(`/api/products?id=${encodeURIComponent(product.id)}`, token, {
      method: "PUT",
      body: JSON.stringify({ ...product, is_active: true }),
    });
    toast({ title: "Product resumed" });
    refresh();
  };

  const setCourseActive = async (course: Course, is_active: boolean) => {
    if (!is_active && !confirm("Remove this course from live selling? You can resume it later.")) return;
    await adminRequest(`/api/courses?id=${encodeURIComponent(course.id)}`, token, {
      method: is_active ? "PUT" : "DELETE",
      body: is_active ? JSON.stringify({ ...course, is_active: true }) : undefined,
    });
    toast({ title: is_active ? "Course resumed" : "Course removed" });
    refresh();
  };

  const clearCouponDraft = () => {
    setCouponDraft(couponEmpty);
    setEditingCouponCode("");
  };

  const saveCoupon = async (event: FormEvent) => {
    event.preventDefault();
    const code = (editingCouponCode || couponDraft.code).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const discount = Math.round(Number(couponDraft.discount_percent) || 0);
    if (!code) {
      toast({ title: "Coupon code is required" });
      return;
    }
    if (discount < 1 || discount > 100) {
      toast({ title: "Discount must be between 1% and 100%" });
      return;
    }
    const body = {
      code,
      discount_percent: discount,
      min_order: Math.max(0, Math.round(Number(couponDraft.min_order) || 0)),
      expires_at: couponDraft.expires_at || null,
      is_active: couponDraft.is_active !== false,
    };
    if (editingCouponCode) {
      await adminRequest(`/api/coupons?code=${encodeURIComponent(editingCouponCode)}`, token, { method: "PUT", body: JSON.stringify(body) });
    } else {
      await adminRequest("/api/coupons", token, { method: "POST", body: JSON.stringify(body) });
    }
    toast({ title: "Coupon saved" });
    clearCouponDraft();
    refresh();
  };

  const deleteCoupon = async (code: string) => {
    if (!confirm("Delete this coupon?")) return;
    await adminRequest(`/api/coupons?code=${encodeURIComponent(code)}`, token, { method: "DELETE" });
    toast({ title: "Coupon deleted" });
    if (editingCouponCode === code) clearCouponDraft();
    refresh();
  };

  const deleteReview = async (id?: string) => {
    if (!id || !confirm("Delete this review?")) return;
    await adminRequest(`/api/reviews?id=${encodeURIComponent(id)}`, token, { method: "DELETE" });
    refresh();
  };

  const saveHomepage = async () => {
    await adminRequest("/api/site?resource=homepage&key=crown_wants", token, {
      method: "PUT",
      body: JSON.stringify({ content: { items: cleanTextList(crownWants.split("\n")) } }),
    });
    toast({ title: "Homepage updated" });
  };

  const saveSiteSettings = async (event: FormEvent) => {
    event.preventDefault();
    const body: SiteSettings = {
      email: siteSettings.email.trim(),
      phone: siteSettings.phone.trim(),
      instagram_handle: siteSettings.instagram_handle.trim(),
      instagram_url: siteSettings.instagram_url.trim(),
      facebook_url: siteSettings.facebook_url.trim(),
      youtube_url: siteSettings.youtube_url.trim(),
      twitter_url: siteSettings.twitter_url.trim(),
      company_name: siteSettings.company_name.trim(),
      office_address: siteSettings.office_address.trim(),
      map_query: siteSettings.map_query.trim(),
      footer_note: siteSettings.footer_note.trim(),
    };
    await adminRequest("/api/site?resource=site-settings", token, {
      method: "PUT",
      body: JSON.stringify({ settings: body }),
    });
    setSiteSettings(body);
    toast({ title: "Site info updated" });
  };

  const clearFooterDraft = () => {
    setFooterDraft(footerPageEmpty);
    setEditingFooterSlug("");
  };

  const saveFooterPage = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const slug = editingFooterSlug || footerDraft.slug || slugify(footerDraft.label);
      if (!slug || !footerDraft.label.trim() || !footerDraft.section_title.trim()) {
        toast({ title: "Footer page needs a label and section" });
        return;
      }
      const body = {
        ...footerDraft,
        slug,
        section_title: footerDraft.section_title.trim(),
        label: footerDraft.label.trim(),
        summary: footerDraft.summary.trim(),
        body: footerDraft.body.trim(),
        section_order: Math.round(Number(footerDraft.section_order) || 100),
        sort_order: Math.round(Number(footerDraft.sort_order) || 100),
        is_active: footerDraft.is_active !== false,
      };
      if (editingFooterSlug) {
        await adminRequest(`/api/site?resource=footer&slug=${encodeURIComponent(editingFooterSlug)}`, token, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await adminRequest("/api/site?resource=footer", token, { method: "POST", body: JSON.stringify(body) });
      }
      toast({ title: "Footer page saved" });
      clearFooterDraft();
      refresh();
    } catch (error) {
      toast({ title: "Save failed", description: error instanceof Error ? error.message : "Unable to save footer page." });
    }
  };

  const deleteFooterPage = async (slug: string) => {
    if (!confirm("Delete this footer link and page?")) return;
    await adminRequest(`/api/site?resource=footer&slug=${encodeURIComponent(slug)}`, token, { method: "DELETE" });
    toast({ title: "Footer page deleted" });
    if (editingFooterSlug === slug) clearFooterDraft();
    refresh();
  };

  const savePolicy = async (policy: Policy) => {
    await adminRequest(`/api/policies?slug=${encodeURIComponent(policy.slug)}`, token, {
      method: "PUT",
      body: JSON.stringify(policy),
    });
    toast({ title: "Policy updated" });
    refresh();
  };

  if (!supabaseEnabled) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="glass gold-border rounded-3xl p-8 w-full max-w-md text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-gold mx-auto" />
          <h1 className="font-display text-2xl">Admin Disabled</h1>
          <p className="text-sm text-muted-foreground">Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Supabase admin sign-in.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <form onSubmit={signIn} className="glass gold-border rounded-3xl p-8 w-full max-w-sm space-y-4">
          <h1 className="font-display text-3xl text-center">Zyvanta Admin</h1>
          <p className="text-xs text-muted-foreground text-center">Sign in with your Supabase admin account.</p>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputCls} />
          <button disabled={loading} className="w-full bg-gradient-gold text-noir rounded-full py-3 text-xs uppercase tracking-widest font-bold disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gold/20 px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-2xl">Zyvanta Admin</h1>
        <div className="inline-flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.3em] inline-flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-gold" /> Supabase · {session.user.email}
          </span>
          <button onClick={signOut} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-gold">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <div className="container py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(({ id, Icon, label }) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.25em] border ${tab === id ? "bg-gradient-gold text-noir border-gold" : "border-gold/30 text-muted-foreground"}`}>
              <Icon className="w-3.5 h-3.5 inline mr-1" /> {label}{id === "products" ? ` (${products.length})` : id === "courses" ? ` (${courses.length})` : id === "coupons" ? ` (${coupons.length})` : id === "orders" ? ` (${orders.length})` : id === "reviews" ? ` (${reviews.length})` : id === "footer" ? ` (${footerPages.length})` : ""}
            </button>
          ))}
        </div>

        {tab === "products" && (
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
            <form onSubmit={saveProduct} className="glass gold-border rounded-2xl p-6 space-y-3 h-fit sticky top-4">
              <h2 className="font-display text-xl flex items-center gap-2">{editingProductId ? <Save className="w-4 h-4 text-gold" /> : <Plus className="w-4 h-4 text-gold" />} {editingProductId ? "Edit Product" : "Add Product"}</h2>
              <input className={inputCls} placeholder="Slug / ID" value={productDraft.id} onChange={(e) => setProductDraft({ ...productDraft, id: e.target.value })} disabled={Boolean(editingProductId)} />
              <div className="rounded-xl border border-gold/30 px-3 py-2 text-xs flex items-center justify-between gap-3">
                <span className="uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-gold" /> Product Code</span>
                <span className="font-mono text-gold">{productDraft.code || "Auto after save"}</span>
              </div>
              <input className={inputCls} placeholder="Name" value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} />
              <input className={inputCls} placeholder="Category" value={productDraft.category} onChange={(e) => setProductDraft({ ...productDraft, category: e.target.value })} />
              <textarea className={inputCls} rows={3} placeholder="Description" value={productDraft.description} onChange={(e) => setProductDraft({ ...productDraft, description: e.target.value })} />
              <textarea className={inputCls} rows={3} placeholder="Features, one per line" value={productDraft.features.join("\n")} onChange={(e) => setProductDraft({ ...productDraft, features: e.target.value.split("\n") })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" step="1" className={inputCls} placeholder="Price INR" value={productDraft.price || ""} onChange={(e) => setProductDraft({ ...productDraft, price: +e.target.value })} />
                <input type="number" className={inputCls} placeholder="Stock" value={productDraft.stock || ""} onChange={(e) => setProductDraft({ ...productDraft, stock: +e.target.value })} />
              </div>
              <input className={inputCls} placeholder="Image URL" value={productDraft.image} onChange={(e) => setProductDraft({ ...productDraft, image: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <UploadButton label="Upload Image" uploading={uploadingImage} onFile={(file) => uploadCatalogImage(file, "main", "product")} />
                <UploadButton label="Gallery" uploading={uploadingImage} onFile={(file) => uploadCatalogImage(file, "gallery", "product")} />
              </div>
              <textarea className={inputCls} rows={3} placeholder="Gallery image URLs, one per line" value={(productDraft.gallery || []).join("\n")} onChange={(e) => setProductDraft({ ...productDraft, gallery: e.target.value.split("\n") })} />
              <input className={inputCls} placeholder="Tagline" value={productDraft.tagline} onChange={(e) => setProductDraft({ ...productDraft, tagline: e.target.value })} />
              <input className={inputCls} placeholder="Tag" value={productDraft.tag} onChange={(e) => setProductDraft({ ...productDraft, tag: e.target.value })} />
              <div className="rounded-xl border border-gold/20 p-3 space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Payment methods</div>
                <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <input type="checkbox" checked={productDraft.allow_pay_now !== false} onChange={(e) => setProductDraft({ ...productDraft, allow_pay_now: e.target.checked })} />
                  Pay Now
                </label>
                <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <input type="checkbox" checked={productDraft.allow_cod !== false} onChange={(e) => setProductDraft({ ...productDraft, allow_cod: e.target.checked })} />
                  Cash on Delivery
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <input type="checkbox" checked={productDraft.is_active !== false} onChange={(e) => setProductDraft({ ...productDraft, is_active: e.target.checked })} />
                Live selling active
              </label>
              <button className="w-full bg-gradient-gold text-noir rounded-full py-2.5 text-xs uppercase tracking-widest font-bold">{editingProductId ? "Save" : "Add"}</button>
            </form>

            <div className="space-y-3">
              {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
              {products.map((p) => (
                <div key={p.id} className={`glass gold-border rounded-2xl p-4 flex gap-4 ${p.is_active === false ? "opacity-70" : ""}`}>
                  <img src={p.image} alt={p.name} className="w-20 h-20 rounded-xl object-cover bg-noir-soft" />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg flex items-center gap-2">
                      {p.name}
                      <span className={`text-[9px] uppercase tracking-widest rounded-full px-2 py-0.5 ${p.is_active === false ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {p.is_active === false ? "Paused" : "Live"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{p.category} · Stock {p.stock}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Code <span className="font-mono text-gold">{p.code || "Pending"}</span></div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Payment <span className="text-gold">{paymentText(p)}</span></div>
                    <div className="text-gold-gradient font-bold mt-1">{inr(p.price)}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setEditingProductId(p.id); setProductDraft({ ...withProductPaymentDefaults(p), price: toInrAmount(p.price) }); }} className="text-xs uppercase tracking-widest text-gold border border-gold/30 rounded-full px-3 py-1">Edit</button>
                    {p.is_active === false ? (
                      <button onClick={() => resumeProduct(p)} className="text-xs uppercase tracking-widest text-emerald-700 border border-emerald-300 rounded-full px-3 py-1 inline-flex items-center gap-1"><PlayCircle className="w-3 h-3" /> Resume</button>
                    ) : (
                      <button onClick={() => deleteProduct(p.id)} className="text-xs uppercase tracking-widest text-red-600 border border-red-300 rounded-full px-3 py-1 inline-flex items-center gap-1"><PauseCircle className="w-3 h-3" /> Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "courses" && (
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
            <form onSubmit={saveCourse} className="glass gold-border rounded-2xl p-6 space-y-3 h-fit sticky top-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl flex items-center gap-2">
                  {editingCourseId ? <Save className="w-4 h-4 text-gold" /> : <Plus className="w-4 h-4 text-gold" />}
                  {editingCourseId ? "Edit Course" : "Add Course"}
                </h2>
                <label className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <input type="checkbox" checked={coursesSellingEnabled} onChange={(e) => saveCoursesSelling(e.target.checked)} />
                  Selling {coursesSellingEnabled ? "On" : "Off"}
                </label>
              </div>
              <input className={inputCls} placeholder="Slug / ID" value={courseDraft.id} onChange={(e) => setCourseDraft({ ...courseDraft, id: e.target.value })} disabled={Boolean(editingCourseId)} />
              <div className="rounded-xl border border-gold/30 px-3 py-2 text-xs flex items-center justify-between gap-3">
                <span className="uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-gold" /> Course Code</span>
                <span className="font-mono text-gold">{courseDraft.code || "Auto after save"}</span>
              </div>
              <input className={inputCls} placeholder="Course name" value={courseDraft.name} onChange={(e) => setCourseDraft({ ...courseDraft, name: e.target.value })} />
              <input className={inputCls} placeholder="Title" value={courseDraft.title} onChange={(e) => setCourseDraft({ ...courseDraft, title: e.target.value })} />
              <textarea className={inputCls} rows={4} placeholder="Description" value={courseDraft.description} onChange={(e) => setCourseDraft({ ...courseDraft, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" step="1" className={inputCls} placeholder="Price INR" value={courseDraft.price || ""} onChange={(e) => setCourseDraft({ ...courseDraft, price: +e.target.value })} />
                <input className={inputCls} placeholder="Duration, e.g. 4 weeks" value={courseDraft.duration} onChange={(e) => setCourseDraft({ ...courseDraft, duration: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="1" max="5" step="0.1" className={inputCls} placeholder="Rating" value={courseDraft.rating || ""} onChange={(e) => setCourseDraft({ ...courseDraft, rating: +e.target.value })} />
                <input type="number" min="0" className={inputCls} placeholder="Reviews count" value={courseDraft.review_count || ""} onChange={(e) => setCourseDraft({ ...courseDraft, review_count: +e.target.value })} />
              </div>
              <input className={inputCls} placeholder="Image URL" value={courseDraft.image || ""} onChange={(e) => setCourseDraft({ ...courseDraft, image: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <UploadButton label="Upload Image" uploading={uploadingImage} onFile={(file) => uploadCatalogImage(file, "main", "course")} />
                <UploadButton label="Gallery" uploading={uploadingImage} onFile={(file) => uploadCatalogImage(file, "gallery", "course")} />
              </div>
              <textarea className={inputCls} rows={3} placeholder="Gallery image URLs, one per line" value={(courseDraft.gallery || []).join("\n")} onChange={(e) => setCourseDraft({ ...courseDraft, gallery: e.target.value.split("\n") })} />
              <input type="number" className={inputCls} placeholder="Sort order" value={courseDraft.sort_order || ""} onChange={(e) => setCourseDraft({ ...courseDraft, sort_order: +e.target.value })} />
              <div className="rounded-xl border border-gold/20 p-3 space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Payment methods</div>
                <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <input type="checkbox" checked={courseDraft.allow_pay_now !== false} onChange={(e) => setCourseDraft({ ...courseDraft, allow_pay_now: e.target.checked })} />
                  Pay Now
                </label>
                <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <input type="checkbox" checked={courseDraft.allow_cod === true} onChange={(e) => setCourseDraft({ ...courseDraft, allow_cod: e.target.checked })} />
                  Cash on Delivery
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <input type="checkbox" checked={courseDraft.is_active !== false} onChange={(e) => setCourseDraft({ ...courseDraft, is_active: e.target.checked })} />
                Course active
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-gradient-gold text-noir rounded-full py-2.5 text-xs uppercase tracking-widest font-bold">{editingCourseId ? "Save" : "Add"}</button>
                <button
                  type="button"
                  onClick={() => { setCourseDraft(courseEmpty); setEditingCourseId(""); }}
                  className="glass gold-border text-gold rounded-full py-2.5 text-xs uppercase tracking-widest font-bold"
                >
                  Clear
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <div className={`glass gold-border rounded-2xl p-4 flex items-center justify-between gap-3 ${coursesSellingEnabled ? "" : "opacity-75"}`}>
                <div>
                  <div className="font-display text-lg">Course selling is {coursesSellingEnabled ? "On" : "Off"}</div>
                  <div className="text-xs text-muted-foreground">Turn this off to show courses as paused on the website without deleting courses.</div>
                </div>
                <button
                  type="button"
                  onClick={() => saveCoursesSelling(!coursesSellingEnabled)}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold ${coursesSellingEnabled ? "border border-red-300 text-red-600" : "bg-gradient-gold text-noir"}`}
                >
                  {coursesSellingEnabled ? "Turn Off" : "Turn On"}
                </button>
              </div>
              {courses.map((course) => (
                <div key={course.id} className={`glass gold-border rounded-2xl p-4 flex gap-4 ${course.is_active === false ? "opacity-70" : ""}`}>
                  <img src={course.image || "/placeholder.svg"} alt={course.name} className="w-20 h-20 rounded-xl object-cover bg-noir-soft" />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg flex items-center gap-2">
                      {course.name}
                      <span className={`text-[9px] uppercase tracking-widest rounded-full px-2 py-0.5 ${course.is_active === false ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {course.is_active === false ? "Paused" : "Live"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{course.title} · {course.duration} · {course.rating} stars · {course.review_count} reviews</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Code <span className="font-mono text-gold">{course.code || "Pending"}</span></div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Payment <span className="text-gold">{paymentText(course)}</span></div>
                    <div className="text-gold-gradient font-bold mt-1">{inr(course.price)}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setEditingCourseId(course.id); setCourseDraft({ ...withCoursePaymentDefaults(course), price: toInrAmount(course.price) }); }} className="text-xs uppercase tracking-widest text-gold border border-gold/30 rounded-full px-3 py-1">Edit</button>
                    {course.is_active === false ? (
                      <button onClick={() => setCourseActive(course, true)} className="text-xs uppercase tracking-widest text-emerald-700 border border-emerald-300 rounded-full px-3 py-1 inline-flex items-center gap-1"><PlayCircle className="w-3 h-3" /> Resume</button>
                    ) : (
                      <button onClick={() => setCourseActive(course, false)} className="text-xs uppercase tracking-widest text-red-600 border border-red-300 rounded-full px-3 py-1 inline-flex items-center gap-1"><PauseCircle className="w-3 h-3" /> Remove</button>
                    )}
                  </div>
                </div>
              ))}
              {!courses.length && (
                <div className="glass gold-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
                  No courses yet. Add your first course from the form on the left.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "coupons" && (
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8">
            <form onSubmit={saveCoupon} className="glass gold-border rounded-2xl p-6 space-y-3 h-fit sticky top-4">
              <h2 className="font-display text-xl flex items-center gap-2">
                {editingCouponCode ? <Save className="w-4 h-4 text-gold" /> : <Plus className="w-4 h-4 text-gold" />}
                {editingCouponCode ? "Edit Coupon" : "Add Coupon"}
              </h2>
              <input
                className={inputCls}
                placeholder="Coupon code, e.g. ZYVANTA20"
                value={couponDraft.code}
                onChange={(e) => setCouponDraft({ ...couponDraft, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                disabled={Boolean(editingCouponCode)}
                maxLength={32}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={inputCls}
                  placeholder="Discount %"
                  value={couponDraft.discount_percent || ""}
                  onChange={(e) => setCouponDraft({ ...couponDraft, discount_percent: +e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  className={inputCls}
                  placeholder="Minimum order"
                  value={couponDraft.min_order || ""}
                  onChange={(e) => setCouponDraft({ ...couponDraft, min_order: +e.target.value })}
                />
              </div>
              <input
                type="date"
                className={inputCls}
                value={String(couponDraft.expires_at || "").slice(0, 10)}
                onChange={(e) => setCouponDraft({ ...couponDraft, expires_at: e.target.value })}
              />
              <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <input type="checkbox" checked={couponDraft.is_active !== false} onChange={(e) => setCouponDraft({ ...couponDraft, is_active: e.target.checked })} />
                Coupon active
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-gradient-gold text-noir rounded-full py-2.5 text-xs uppercase tracking-widest font-bold">{editingCouponCode ? "Save" : "Add"}</button>
                <button type="button" onClick={clearCouponDraft} className="glass gold-border text-gold rounded-full py-2.5 text-xs uppercase tracking-widest font-bold">Clear</button>
              </div>
            </form>

            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.code} className={`glass gold-border rounded-2xl p-4 flex justify-between gap-4 ${coupon.is_active === false ? "opacity-70" : ""}`}>
                  <div className="min-w-0">
                    <div className="font-display text-lg flex items-center gap-2">
                      <span className="font-mono">{coupon.code}</span>
                      <span className={`text-[9px] uppercase tracking-widest rounded-full px-2 py-0.5 ${coupon.is_active === false ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {coupon.is_active === false ? "Inactive" : "Active"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {coupon.discount_percent}% off{coupon.min_order ? ` above ₹${Number(coupon.min_order).toLocaleString("en-IN")}` : ""}{coupon.expires_at ? ` · Expires ${String(coupon.expires_at).slice(0, 10)}` : " · No expiry"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingCouponCode(coupon.code);
                        setCouponDraft({ ...coupon, expires_at: String(coupon.expires_at || "").slice(0, 10) });
                      }}
                      className="text-xs uppercase tracking-widest text-gold border border-gold/30 rounded-full px-3 py-1"
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteCoupon(coupon.code)} className="text-xs uppercase tracking-widest text-red-600 border border-red-300 rounded-full px-3 py-1 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                </div>
              ))}
              {!coupons.length && (
                <div className="glass gold-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
                  No coupons yet. Add a coupon code from the form on the left.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            {orders.map((o) => (
              <details key={o.id} className="glass gold-border rounded-2xl p-4">
                <summary className="cursor-pointer flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-base">{o.customer_name} · {o.customer_phone}</div>
                    <div className="text-xs text-muted-foreground">{o.address}, {o.city}, {o.state} {o.pincode}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Order <span className="font-mono text-gold">{o.order_code || o.id.slice(0, 10).toUpperCase()}</span></div>
                  </div>
                  <div className="text-right"><div className="text-gold-gradient font-bold">₹{o.total.toLocaleString("en-IN")}</div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{o.payment_method} · {o.payment_status}</div></div>
                </summary>
                <div className="mt-3 pt-3 border-t border-gold/20 text-sm space-y-1">
                  <div>Email: {o.customer_email}</div>
                  <div>Delivery: {o.address}, {o.city}, {o.state} {o.pincode}</div>
                  {o.coupon_code && <div>Coupon: <span className="font-mono text-gold">{o.coupon_code}</span> · {o.coupon_discount_percent || 0}% · Saved ₹{Number(o.discount || 0).toLocaleString("en-IN")}</div>}
                  {o.razorpay_payment_id && <div>Payment ID: <span className="font-mono">{o.razorpay_payment_id}</span></div>}
                  <div className="mt-2 font-bold">Items:</div>
                  <ul className="text-xs text-muted-foreground space-y-0.5">{o.order_items?.map((i, k) => <li key={k}>• {i.name} x {i.qty} - ₹{i.unit_price} {i.item_code && <span className="font-mono text-gold">· {i.item_code}</span>} {i.item_type && <span className="uppercase">· {i.item_type}</span>}</li>)}</ul>
                </div>
              </details>
            ))}
          </div>
        )}

        {tab === "reviews" && (
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
            <form onSubmit={saveReview} className="glass gold-border rounded-2xl p-6 space-y-3 h-fit">
              <h2 className="font-display text-xl">Review</h2>
              <input className={inputCls} placeholder="Product / Course Code" value={reviewDraft.item_code || ""} onChange={(e) => setReviewDraft({ ...reviewDraft, item_code: e.target.value.toUpperCase(), product_id: "" })} />
              <div className="max-h-28 overflow-y-auto rounded-xl border border-gold/20 p-3 text-[11px] text-muted-foreground space-y-1">
                {[...products.map((item) => ({ code: item.code, name: item.name, type: "Product" })), ...courses.map((item) => ({ code: item.code, name: item.name, type: "Course" }))].map((item) => (
                  <button
                    key={`${item.type}-${item.code || item.name}`}
                    type="button"
                    onClick={() => item.code && setReviewDraft({ ...reviewDraft, item_code: item.code, product_id: "" })}
                    className="block w-full text-left hover:text-gold"
                  >
                    <span className="font-mono text-gold">{item.code || "Pending"}</span> · {item.type} · {item.name}
                  </button>
                ))}
              </div>
              <input className={inputCls} placeholder="Name" value={reviewDraft.name} onChange={(e) => setReviewDraft({ ...reviewDraft, name: e.target.value })} />
              <input className={inputCls} placeholder="Role" value={reviewDraft.role || ""} onChange={(e) => setReviewDraft({ ...reviewDraft, role: e.target.value })} />
              <input type="number" min={1} max={5} className={inputCls} placeholder="Rating" value={reviewDraft.rating} onChange={(e) => setReviewDraft({ ...reviewDraft, rating: +e.target.value })} />
              <textarea className={inputCls} rows={4} placeholder="Comment" value={reviewDraft.comment} onChange={(e) => setReviewDraft({ ...reviewDraft, comment: e.target.value })} />
              <div className="flex items-center gap-3">
                {reviewDraft.avatar && <img src={reviewDraft.avatar} alt={reviewDraft.name || "Review avatar"} className="w-12 h-12 rounded-full object-cover border border-gold/40 bg-noir-soft" />}
                <UploadButton label="Upload Avatar" uploading={uploadingImage} onFile={uploadReviewAvatar} className={`flex-1 ${uploadButtonCls}`} />
              </div>
              <input className={inputCls} placeholder="Review photo URL" value={reviewDraft.photo || ""} onChange={(e) => setReviewDraft({ ...reviewDraft, photo: e.target.value })} />
              <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <input type="checkbox" checked={reviewDraft.is_featured !== false} onChange={(e) => setReviewDraft({ ...reviewDraft, is_featured: e.target.checked })} />
                Show on homepage reviews
              </label>
              <button className="w-full bg-gradient-gold text-noir rounded-full py-2.5 text-xs uppercase tracking-widest font-bold">Save Review</button>
            </form>
            <div className="space-y-3">{reviews.map((r) => <div key={r.id || r.name} className="glass gold-border rounded-2xl p-4 flex justify-between gap-4"><div><div className="font-display text-lg">{r.name}</div><div className="text-xs text-muted-foreground">{r.rating} stars · {r.comment}</div><div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{r.item_type || "Homepage"} {r.item_code && <>· <span className="font-mono text-gold">{r.item_code}</span></>}</div></div><button onClick={() => deleteReview(r.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button></div>)}</div>
          </div>
        )}

        {tab === "homepage" && (
          <div className="glass gold-border rounded-2xl p-6 max-w-2xl space-y-4">
            <h2 className="font-display text-2xl">What The Crown Wants</h2>
            <textarea className={inputCls} rows={12} value={crownWants} onChange={(e) => setCrownWants(e.target.value)} />
            <button onClick={saveHomepage} className="bg-gradient-gold text-noir rounded-full px-6 py-3 text-xs uppercase tracking-widest font-bold">Save Homepage</button>
          </div>
        )}

        {tab === "site" && (
          <form onSubmit={saveSiteSettings} className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8">
            <div className="glass gold-border rounded-2xl p-6 space-y-5">
              <h2 className="font-display text-2xl flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold" /> Website Contact & Links
              </h2>

              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Contact details</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gold" /> Email</span>
                    <input className={inputCls} value={siteSettings.email} onChange={(e) => setSiteSettings({ ...siteSettings, email: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gold" /> Phone</span>
                    <input className={inputCls} value={siteSettings.phone} onChange={(e) => setSiteSettings({ ...siteSettings, phone: e.target.value })} />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5 text-gold" /> Instagram handle text</span>
                    <input className={inputCls} value={siteSettings.instagram_handle} onChange={(e) => setSiteSettings({ ...siteSettings, instagram_handle: e.target.value })} />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Store location</div>
                <label className="space-y-1 block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-gold" /> Company name</span>
                  <input className={inputCls} value={siteSettings.company_name} onChange={(e) => setSiteSettings({ ...siteSettings, company_name: e.target.value })} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold" /> Registered office address</span>
                  <textarea className={inputCls} rows={3} value={siteSettings.office_address} onChange={(e) => setSiteSettings({ ...siteSettings, office_address: e.target.value })} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold" /> Google map search location</span>
                  <input className={inputCls} value={siteSettings.map_query} onChange={(e) => setSiteSettings({ ...siteSettings, map_query: e.target.value })} />
                </label>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Social icon redirect links</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5 text-gold" /> Instagram URL</span>
                    <input className={inputCls} value={siteSettings.instagram_url} onChange={(e) => setSiteSettings({ ...siteSettings, instagram_url: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Facebook className="w-3.5 h-3.5 text-gold" /> Facebook URL</span>
                    <input className={inputCls} value={siteSettings.facebook_url} onChange={(e) => setSiteSettings({ ...siteSettings, facebook_url: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 text-gold" /> YouTube URL</span>
                    <input className={inputCls} value={siteSettings.youtube_url} onChange={(e) => setSiteSettings({ ...siteSettings, youtube_url: e.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5"><Twitter className="w-3.5 h-3.5 text-gold" /> Twitter / X URL</span>
                    <input className={inputCls} value={siteSettings.twitter_url} onChange={(e) => setSiteSettings({ ...siteSettings, twitter_url: e.target.value })} />
                  </label>
                </div>
              </div>

              <label className="space-y-1 block">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Footer note</span>
                <input className={inputCls} value={siteSettings.footer_note} onChange={(e) => setSiteSettings({ ...siteSettings, footer_note: e.target.value })} />
              </label>

              <button className="bg-gradient-gold text-noir rounded-full px-6 py-3 text-xs uppercase tracking-widest font-bold">
                Save Site Info
              </button>
            </div>

            <div className="glass gold-border rounded-2xl p-6 space-y-5 h-fit">
              <h3 className="font-display text-xl">Footer Preview</h3>
              <div className="flex gap-3">
                <span className="w-10 h-10 rounded-full glass grid place-items-center text-gold"><Instagram className="w-4 h-4" /></span>
                <span className="w-10 h-10 rounded-full glass grid place-items-center text-gold"><Facebook className="w-4 h-4" /></span>
                <span className="w-10 h-10 rounded-full glass grid place-items-center text-gold"><Youtube className="w-4 h-4" /></span>
                <span className="w-10 h-10 rounded-full glass grid place-items-center text-gold"><Twitter className="w-4 h-4" /></span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gold" /> {siteSettings.email}</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gold" /> {siteSettings.phone}</div>
                <div className="flex items-center gap-2"><Instagram className="w-4 h-4 text-gold" /> {siteSettings.instagram_handle}</div>
              </div>
              <div className="border-t border-gold/20 pt-4 space-y-2 text-sm text-muted-foreground">
                <div className="text-foreground">{siteSettings.company_name}</div>
                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" /> <span>{siteSettings.office_address}</span></div>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {siteSettings.footer_note}
              </div>
            </div>
          </form>
        )}

        {tab === "footer" && (
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8">
            <form onSubmit={saveFooterPage} className="glass gold-border rounded-2xl p-6 space-y-3 h-fit sticky top-4">
              <h2 className="font-display text-xl flex items-center gap-2">
                {editingFooterSlug ? <Save className="w-4 h-4 text-gold" /> : <Plus className="w-4 h-4 text-gold" />}
                {editingFooterSlug ? "Edit Footer Page" : "Add Footer Page"}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Section title" value={footerDraft.section_title} onChange={(e) => setFooterDraft({ ...footerDraft, section_title: e.target.value })} />
                <input className={inputCls} placeholder="Link label" value={footerDraft.label} onChange={(e) => setFooterDraft({ ...footerDraft, label: e.target.value, slug: editingFooterSlug ? footerDraft.slug : slugify(e.target.value) })} />
              </div>
              <input className={inputCls} placeholder="Slug / page URL" value={footerDraft.slug} onChange={(e) => setFooterDraft({ ...footerDraft, slug: slugify(e.target.value) })} disabled={Boolean(editingFooterSlug)} />
              <textarea className={inputCls} rows={2} placeholder="Short summary" value={footerDraft.summary} onChange={(e) => setFooterDraft({ ...footerDraft, summary: e.target.value })} />
              <textarea className={inputCls} rows={9} placeholder="Page content" value={footerDraft.body} onChange={(e) => setFooterDraft({ ...footerDraft, body: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className={inputCls} placeholder="Section order" value={footerDraft.section_order || ""} onChange={(e) => setFooterDraft({ ...footerDraft, section_order: +e.target.value })} />
                <input type="number" className={inputCls} placeholder="Link order" value={footerDraft.sort_order || ""} onChange={(e) => setFooterDraft({ ...footerDraft, sort_order: +e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <input type="checkbox" checked={footerDraft.is_active !== false} onChange={(e) => setFooterDraft({ ...footerDraft, is_active: e.target.checked })} />
                Show link on website
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-gradient-gold text-noir rounded-full py-2.5 text-xs uppercase tracking-widest font-bold">{editingFooterSlug ? "Save" : "Add"}</button>
                <button type="button" onClick={clearFooterDraft} className="glass gold-border text-gold rounded-full py-2.5 text-xs uppercase tracking-widest font-bold">Clear</button>
              </div>
            </form>

            <div className="space-y-3">
              {[...footerPages]
                .sort((a, b) => a.section_order - b.section_order || a.sort_order - b.sort_order || a.label.localeCompare(b.label))
                .map((page) => (
                  <div key={page.slug} className={`glass gold-border rounded-2xl p-4 flex justify-between gap-4 ${page.is_active === false ? "opacity-70" : ""}`}>
                    <div className="min-w-0">
                      <div className="font-display text-lg flex items-center gap-2">
                        {page.label}
                        <span className={`text-[9px] uppercase tracking-widest rounded-full px-2 py-0.5 ${page.is_active === false ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {page.is_active === false ? "Hidden" : "Live"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{page.section_title} - /info/{page.slug}</div>
                      <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{page.summary || page.body}</div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => { setEditingFooterSlug(page.slug); setFooterDraft(page); }} className="text-xs uppercase tracking-widest text-gold border border-gold/30 rounded-full px-3 py-1">Edit</button>
                      <a href={`/info/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-widest text-emerald-700 border border-emerald-300 rounded-full px-3 py-1 text-center">Open</a>
                      <button onClick={() => deleteFooterPage(page.slug)} className="text-xs uppercase tracking-widest text-red-600 border border-red-300 rounded-full px-3 py-1 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                    </div>
                  </div>
                ))}
              {!footerPages.length && (
                <div className="glass gold-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
                  No footer links yet. Add one from the form on the left.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "policies" && (
          <div className="grid md:grid-cols-2 gap-4">
            {policies.map((p, index) => (
              <PolicyEditor key={p.slug} policy={p} onChange={(next) => setPolicies((prev) => prev.map((item, i) => (i === index ? next : item)))} onSave={savePolicy} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PolicyEditor = ({ policy, onChange, onSave }: { policy: Policy; onChange: (policy: Policy) => void; onSave: (policy: Policy) => void }) => (
  <div className="glass gold-border rounded-2xl p-5 space-y-3">
    <input className={inputCls} value={policy.title} onChange={(e) => onChange({ ...policy, title: e.target.value })} />
    <input className={inputCls} value={policy.summary} onChange={(e) => onChange({ ...policy, summary: e.target.value })} />
    <textarea className={inputCls} rows={6} value={policy.body} onChange={(e) => onChange({ ...policy, body: e.target.value })} />
    <button onClick={() => onSave(policy)} className="bg-gradient-gold text-noir rounded-full px-5 py-2.5 text-xs uppercase tracking-widest font-bold">Save</button>
  </div>
);

export default Admin;
