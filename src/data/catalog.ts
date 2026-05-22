export type ProductCategory = string;

export type ProductReview = {
  id?: string;
  product_id?: string;
  item_id?: string;
  item_type?: "product" | "course";
  item_code?: string;
  name: string;
  role?: string;
  avatar?: string;
  rating: number;
  comment: string;
  photo?: string;
  is_featured?: boolean;
};

export type Product = {
  id: string;
  code?: string;
  name: string;
  price: number;
  tag: string;
  category: ProductCategory;
  image: string;
  gallery?: string[];
  tagline: string;
  description: string;
  features: string[];
  rating: number;
  review_count: number;
  stock: number;
  is_featured?: boolean;
  is_active?: boolean;
  allow_pay_now?: boolean;
  allow_cod?: boolean;
  sort_order?: number;
  reviews?: ProductReview[];
};

export type Course = {
  id: string;
  code?: string;
  name: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  image?: string;
  gallery?: string[];
  rating: number;
  review_count: number;
  is_active?: boolean;
  allow_pay_now?: boolean;
  allow_cod?: boolean;
  sort_order?: number;
};

const asset = (slug: string, frame: string) => `/assets/products/${slug}-${frame}.jpg`;
const gallery = (slug: string) => [asset(slug, "main"), asset(slug, "features"), asset(slug, "lifestyle"), asset(slug, "details")];

export const fallbackProducts: Product[] = [
  {
    id: "rd-aura-speaker",
    code: "ZYP-RDAURA",
    name: "RD Aura Wireless Speaker",
    price: 1099,
    tag: "New Arrival",
    category: "Speakers",
    image: asset("rd-aura-speaker", "main"),
    gallery: gallery("rd-aura-speaker"),
    tagline: "Portable sound with a bold strap finish.",
    description: "A compact wireless TWS speaker with Type-C charging, AUX support and a rugged portable body designed for everyday music.",
    features: ["Up to 6 hours music time", "1200mAh battery", "TWS speaker pairing", "Type-C charging and AUX port", "Portable strap design"],
    rating: 4.7,
    review_count: 184,
    stock: 40,
    is_featured: true,
    allow_pay_now: true,
    allow_cod: true,
  },
  {
    id: "rd-hush-cl790-headphones",
    code: "ZYP-HUSH790",
    name: "RD Hush CL-790 Headphones",
    price: 1799,
    tag: "Bestseller",
    category: "Headphones",
    image: asset("rd-hush-cl790-headphones", "main"),
    gallery: gallery("rd-hush-cl790-headphones"),
    tagline: "Long-play headphones for work, travel and music.",
    description: "Over-ear wireless headphones with 42 hours total playtime, Bluetooth 5.3, Type-C charging, FM, AUX, SD card support and IPX4 protection.",
    features: ["Up to 42 hours playtime", "Bluetooth 5.3", "Type-C charging", "FM, AUX and SD card modes", "IPX4 water resistant"],
    rating: 4.8,
    review_count: 236,
    stock: 35,
    is_featured: true,
    allow_pay_now: true,
    allow_cod: true,
  },
  {
    id: "dk-solar-wall-lamp",
    code: "ZYP-SOLAR",
    name: "DK Solar Wall Lamp",
    price: 899,
    tag: "Outdoor",
    category: "Lighting",
    image: asset("dk-solar-wall-lamp", "main"),
    gallery: gallery("dk-solar-wall-lamp"),
    tagline: "Elegant evening illumination, powered by the sun.",
    description: "Solar wall lamp with a monocrystalline panel, motion detection, rechargeable battery and IP65 waterproof protection for balconies, gates and exterior walls.",
    features: ["Monocrystalline solar cell", "10-meter motion detection", "Up to 12-hour run time", "IP65 waterproof rating", "Replaceable Edison-style LED bulb"],
    rating: 4.6,
    review_count: 142,
    stock: 50,
    is_featured: true,
    allow_pay_now: true,
    allow_cod: true,
  },
  {
    id: "boat-airdopes-141-pack",
    code: "ZYP-BOAT141",
    name: "boAt Airdopes 141",
    price: 1299,
    tag: "Popular",
    category: "Earbuds",
    image: asset("boat-airdopes-141-pack", "main"),
    gallery: gallery("boat-airdopes-141-pack"),
    tagline: "Signature sound in a compact everyday case.",
    description: "True wireless earbuds with touch controls, IPX4 water resistance, 13mm drivers, ASAP charging and up to 42 hours total playback.",
    features: ["42 hours total playtime", "13mm drivers", "Quick response touch controls", "Bluetooth v5.1", "IPX4 water and sweat resistance"],
    rating: 4.8,
    review_count: 411,
    stock: 65,
    is_featured: true,
    allow_pay_now: true,
    allow_cod: true,
  },
  {
    id: "oud-smart-pods-navy",
    code: "ZYP-OUDNAVY",
    name: "OUD Smart Pods Navy",
    price: 399,
    tag: "Value Pick",
    category: "Earbuds",
    image: asset("oud-smart-pods-navy", "main"),
    gallery: gallery("oud-smart-pods-navy"),
    tagline: "Navy blue pods with serious battery life.",
    description: "OUD Smart Pods in a navy and orange finish with Type-C charging, touch controls, 13mm drivers and up to 42 hours playtime.",
    features: ["Up to 42 hours playtime", "13mm drivers", "Type-C charging", "IPX5 water resistant", "Touch controls and voice assistant"],
    rating: 4.7,
    review_count: 328,
    stock: 80,
    is_featured: true,
    allow_pay_now: true,
    allow_cod: true,
  },
  {
    id: "boat-airdopes-141-bold-black",
    code: "ZYP-BOATBLK",
    name: "boAt AirDopes 141 Bold Black",
    price: 1199,
    tag: "Bold Black",
    category: "Earbuds",
    image: asset("boat-airdopes-141-bold-black", "main"),
    gallery: gallery("boat-airdopes-141-bold-black"),
    tagline: "Clean black earbuds with fast charging.",
    description: "Bold black true wireless earbuds with immersive audio, low-latency gaming mode, IWP tech and ASAP charging for quick top-ups.",
    features: ["5 min charge gives up to 75 min playback", "Up to 42 hours total playback", "Low-latency gaming mode", "IWP tech for clearer calls", "IPX4 sweat resistant"],
    rating: 4.8,
    review_count: 497,
    stock: 70,
    is_featured: true,
    allow_pay_now: true,
    allow_cod: true,
  },
  {
    id: "smart-audio-collection",
    code: "ZYP-AUDIO",
    name: "Smart Audio Collection",
    price: 1499,
    tag: "Collection",
    category: "Bundles",
    image: asset("smart-audio-collection", "main"),
    gallery: gallery("smart-audio-collection"),
    tagline: "A curated smart-audio showcase for everyday listeners.",
    description: "A premium audio collection layout featuring smart pods, black earbuds and multi-color true wireless options for style-focused buyers.",
    features: ["Curated audio bundle styling", "Multiple earbud color options", "Smart touch controls", "Up to 42 hours playback options", "Compact travel-friendly charging cases"],
    rating: 4.6,
    review_count: 121,
    stock: 25,
    is_featured: true,
    allow_pay_now: true,
    allow_cod: true,
  },
  {
    id: "oud-smart-pods-kit",
    code: "ZYP-OUDKIT",
    name: "OUD Smart Pods Accessory Kit",
    price: 499,
    tag: "Complete Kit",
    category: "Bundles",
    image: asset("oud-smart-pods-kit", "main"),
    gallery: gallery("oud-smart-pods-kit"),
    tagline: "Smart pods plus charging-ready essentials.",
    description: "A complete OUD Smart Pods kit presentation with extra ear tips, cable support, touch controls, IPX water resistance and 42-hour playback positioning.",
    features: ["42 hours playtime", "Bluetooth v5.1", "13mm drivers", "Touch control", "Complete accessory kit presentation"],
    rating: 4.7,
    review_count: 207,
    stock: 45,
    is_featured: true,
    allow_pay_now: true,
    allow_cod: true,
  },
];

export const fallbackReviews: ProductReview[] = [
  { product_id: "rd-aura-speaker", item_id: "rd-aura-speaker", item_type: "product", item_code: "ZYP-RDAURA", name: "Rahul Mehta", role: "Verified Buyer", rating: 5, comment: "The product looks exactly like the photos and delivery was smooth.", avatar: "https://i.pravatar.cc/150?img=12", is_featured: true },
  { product_id: "rd-hush-cl790-headphones", item_id: "rd-hush-cl790-headphones", item_type: "product", item_code: "ZYP-HUSH790", name: "Priya Reddy", role: "Verified Buyer", rating: 5, comment: "Good quality, clean packaging and impressive battery backup for the price.", avatar: "https://i.pravatar.cc/150?img=47", is_featured: true },
  { product_id: "boat-airdopes-141-pack", item_id: "boat-airdopes-141-pack", item_type: "product", item_code: "ZYP-BOAT141", name: "Arjun Nair", role: "Verified Buyer", rating: 4, comment: "Easy to use and feels premium in hand. Worth buying.", avatar: "https://i.pravatar.cc/150?img=32", is_featured: true },
  { product_id: "oud-smart-pods-navy", item_id: "oud-smart-pods-navy", item_type: "product", item_code: "ZYP-OUDNAVY", name: "Sneha Kapoor", role: "Verified Buyer", rating: 5, comment: "I liked the finish and the sound quality. Checkout was simple.", avatar: "https://i.pravatar.cc/150?img=68", is_featured: true },
];

export const fallbackCourses: Course[] = [
  {
    id: "dropshipping-mastery",
    code: "ZYC-DROP",
    name: "Dropshipping Mastery",
    title: "Build a profitable store from zero",
    description: "Learn supplier sourcing, product research, store setup, ads, checkout flow and scaling systems for a practical online business.",
    price: 999,
    duration: "6 weeks",
    image: "/assets/product-1.webp",
    gallery: ["/assets/product-1.webp"],
    rating: 4.8,
    review_count: 214,
    is_active: true,
    allow_pay_now: true,
    allow_cod: false,
    sort_order: 10,
  },
  {
    id: "instagram-growth-engine",
    code: "ZYC-INSTA",
    name: "Instagram Growth Engine",
    title: "Grow content, followers and brand deals",
    description: "A focused course on reels, hooks, content calendars, profile positioning, analytics and monetising a personal or product brand.",
    price: 799,
    duration: "4 weeks",
    image: "/assets/product-2.webp",
    gallery: ["/assets/product-2.webp"],
    rating: 4.7,
    review_count: 168,
    is_active: true,
    allow_pay_now: true,
    allow_cod: false,
    sort_order: 20,
  },
  {
    id: "ai-for-solo-entrepreneurs",
    code: "ZYC-AI",
    name: "AI for Solo Entrepreneurs",
    title: "Use AI tools to run a lean digital business",
    description: "Use AI for product ideas, writing, images, automation, customer support and daily operating workflows without a large team.",
    price: 1199,
    duration: "5 weeks",
    image: "/assets/product-3.webp",
    gallery: ["/assets/product-3.webp"],
    rating: 4.9,
    review_count: 132,
    is_active: true,
    allow_pay_now: true,
    allow_cod: false,
    sort_order: 30,
  },
];

export const fallbackCrownWants = fallbackProducts.map((product) => product.name);
