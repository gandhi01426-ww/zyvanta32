create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  code text unique,
  name text not null,
  price numeric(10,2) not null check (price > 0),
  category text not null,
  tag text default 'New',
  image text not null,
  gallery jsonb not null default '[]'::jsonb,
  tagline text default '',
  description text default '',
  features jsonb not null default '[]'::jsonb,
  rating numeric(2,1) default 5,
  review_count integer default 0,
  stock integer not null default 0,
  is_featured boolean default false,
  is_active boolean default true,
  allow_pay_now boolean not null default true,
  allow_cod boolean not null default true,
  sort_order integer default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products add column if not exists gallery jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists is_active boolean default true;
alter table public.products add column if not exists allow_pay_now boolean not null default true;
alter table public.products add column if not exists allow_cod boolean not null default true;
alter table public.products add column if not exists sort_order integer default 100;
alter table public.products add column if not exists code text;
create unique index if not exists products_code_unique on public.products (code) where code is not null;

create table if not exists public.courses (
  id text primary key,
  code text unique,
  name text not null,
  title text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  duration text not null default '',
  image text default '',
  gallery jsonb not null default '[]'::jsonb,
  rating numeric(2,1) default 5,
  review_count integer default 0,
  is_active boolean default true,
  allow_pay_now boolean not null default true,
  allow_cod boolean not null default false,
  sort_order integer default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.courses add column if not exists title text not null default '';
alter table public.courses add column if not exists description text not null default '';
alter table public.courses add column if not exists duration text not null default '';
alter table public.courses add column if not exists image text default '';
alter table public.courses add column if not exists gallery jsonb not null default '[]'::jsonb;
alter table public.courses add column if not exists rating numeric(2,1) default 5;
alter table public.courses add column if not exists review_count integer default 0;
alter table public.courses add column if not exists is_active boolean default true;
alter table public.courses add column if not exists allow_pay_now boolean not null default true;
alter table public.courses add column if not exists allow_cod boolean not null default false;
alter table public.courses add column if not exists sort_order integer default 100;
alter table public.courses add column if not exists updated_at timestamptz default now();
alter table public.courses add column if not exists code text;
create unique index if not exists courses_code_unique on public.courses (code) where code is not null;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  address text not null,
  pincode text not null,
  city text not null,
  state text not null,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique,
  customer_id uuid references public.customers(id),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  address text not null,
  pincode text not null,
  city text not null,
  state text not null,
  subtotal integer not null,
  shipping integer not null,
  tax integer not null,
  discount integer not null default 0,
  coupon_code text,
  coupon_discount_percent integer,
  total integer not null,
  payment_method text not null check (payment_method in ('online', 'cod')),
  payment_status text not null,
  order_status text not null default 'confirmed',
  razorpay_order_id text,
  razorpay_payment_id text unique,
  created_at timestamptz default now()
);

alter table public.orders add column if not exists order_code text;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists coupon_discount_percent integer;
create unique index if not exists orders_order_code_unique on public.orders (order_code) where order_code is not null;

create table if not exists public.coupons (
  code text primary key,
  discount_percent integer not null check (discount_percent > 0 and discount_percent <= 100),
  min_order integer not null default 0,
  expires_at date,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.coupons add column if not exists discount_percent integer not null default 10 check (discount_percent > 0 and discount_percent <= 100);
alter table public.coupons add column if not exists min_order integer not null default 0;
alter table public.coupons add column if not exists expires_at date;
alter table public.coupons add column if not exists is_active boolean not null default true;
alter table public.coupons add column if not exists updated_at timestamptz default now();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id),
  item_id text,
  item_type text not null default 'product' check (item_type in ('product', 'course')),
  item_code text,
  name text not null,
  qty integer not null check (qty > 0),
  unit_price integer not null,
  line_total integer not null,
  created_at timestamptz default now()
);

alter table public.order_items add column if not exists item_id text;
alter table public.order_items add column if not exists item_type text not null default 'product' check (item_type in ('product', 'course'));
alter table public.order_items add column if not exists item_code text;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text references public.products(id),
  item_id text,
  item_type text check (item_type in ('product', 'course')),
  item_code text,
  name text not null,
  role text,
  avatar text,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  photo text,
  is_featured boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.reviews add column if not exists item_id text;
alter table public.reviews add column if not exists item_type text check (item_type in ('product', 'course'));
alter table public.reviews add column if not exists item_code text;
create index if not exists reviews_item_code_idx on public.reviews (item_code);
create index if not exists reviews_item_lookup_idx on public.reviews (item_type, item_id);

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text,
  content jsonb not null default '{}'::jsonb,
  sort_order integer default 100,
  updated_at timestamptz default now()
);

create table if not exists public.delivery_policies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  body text not null,
  sort_order integer default 100,
  is_active boolean default true,
  updated_at timestamptz default now()
);

create table if not exists public.footer_pages (
  slug text primary key,
  section_title text not null,
  section_order integer not null default 100,
  label text not null,
  summary text not null default '',
  body text not null default '',
  sort_order integer not null default 100,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.footer_pages add column if not exists section_title text not null default 'About';
alter table public.footer_pages add column if not exists section_order integer not null default 100;
alter table public.footer_pages add column if not exists label text not null default '';
alter table public.footer_pages add column if not exists summary text not null default '';
alter table public.footer_pages add column if not exists body text not null default '';
alter table public.footer_pages add column if not exists sort_order integer not null default 100;
alter table public.footer_pages add column if not exists is_active boolean default true;
alter table public.footer_pages add column if not exists updated_at timestamptz default now();

alter table public.products enable row level security;
alter table public.courses enable row level security;
alter table public.reviews enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.delivery_policies enable row level security;
alter table public.footer_pages enable row level security;
alter table public.coupons enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products" on public.products for select using (is_active = true);

drop policy if exists "Public read active courses" on public.courses;
create policy "Public read active courses" on public.courses for select using (is_active = true);

drop policy if exists "Public read active reviews" on public.reviews;
create policy "Public read active reviews" on public.reviews for select using (is_active = true);

drop policy if exists "Public read homepage" on public.homepage_sections;
create policy "Public read homepage" on public.homepage_sections for select using (true);

drop policy if exists "Public read active policies" on public.delivery_policies;
create policy "Public read active policies" on public.delivery_policies for select using (is_active = true);

drop policy if exists "Public read active footer pages" on public.footer_pages;
create policy "Public read active footer pages" on public.footer_pages for select using (is_active = true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "Authenticated upload product images" on storage.objects;
drop policy if exists "Authenticated update product images" on storage.objects;
drop policy if exists "Authenticated delete product images" on storage.objects;

-- Browser writes are intentionally disabled. Admin uploads go through /api/uploads,
-- which verifies ADMIN_EMAILS and uses the server-side service role key.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'courses'
  ) then
    alter publication supabase_realtime add table public.courses;
  end if;
end $$;

insert into public.homepage_sections (section_key, title, content, sort_order)
values ('crown_wants', 'What The Crown Wants', '{"items":["RD Aura Wireless Speaker","RD Hush CL-790 Headphones","DK Solar Wall Lamp","boAt Airdopes 141","OUD Smart Pods Navy","boAt AirDopes 141 Bold Black","Smart Audio Collection","OUD Smart Pods Accessory Kit"]}', 10)
on conflict (section_key) do update set
  title = excluded.title,
  content = excluded.content,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.homepage_sections (section_key, title, content, sort_order)
values ('courses_settings', 'Courses Settings', '{"selling_enabled":true}', 20)
on conflict (section_key) do update set
  title = excluded.title,
  content = public.homepage_sections.content || excluded.content,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.homepage_sections (section_key, title, content, sort_order)
values ('site_settings', 'Site Settings', '{"email":"zyvanta.co@gmail.com","phone":"+91 70130 14863","instagram_handle":"@zyvanta.co","instagram_url":"https://www.instagram.com/zyvanta.co?igsh=cmlzbGN4bGJ0NHh6","facebook_url":"https://facebook.com","youtube_url":"https://youtube.com","twitter_url":"https://twitter.com","company_name":"Zyvanta Luxe Pvt. Ltd.","office_address":"4-4-92, Pujaripeta, Srikakulam, Andhra Pradesh","map_query":"4-4-92, Pujaripeta, Srikakulam, Andhra Pradesh, India","footer_note":"Crafted with obsession."}', 30)
on conflict (section_key) do update set
  title = excluded.title,
  content = public.homepage_sections.content || excluded.content,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.delivery_policies (slug, title, summary, body, sort_order) values
('delivery-policy', 'Delivery Policy', 'Express dispatch with careful packaging and tracking.', 'Orders are packed within 24 hours and dispatched through tracked courier partners. Delivery timelines depend on the destination pincode and courier availability.', 10),
('returns', '7 Days Return', 'Simple returns for unused products in original packaging.', 'Return requests are accepted within 7 days of delivery when the product is unused, undamaged, and returned with all original accessories and packaging.', 20),
('warranty', '1 Year Warranty', 'Coverage for manufacturing defects.', 'Eligible Zyvanta products include a 1 year limited warranty against manufacturing defects. Damage caused by misuse, accidents, or unauthorized repair is excluded.', 30),
('secure-payments', 'Secure Payments', 'Encrypted checkout with verified payment confirmation.', 'Online payments are processed through a certified payment gateway and verified server-side before any paid order is created.', 40)
on conflict (slug) do nothing;

insert into public.footer_pages (slug, section_title, section_order, label, summary, body, sort_order, is_active) values
('contact-us', 'About', 10, 'Contact Us', 'Reach the Zyvanta team for orders, partnerships, and customer care.', $$Customer care
Email: zyvanta.co@gmail.com
Phone: +91 70130 14863
Registered office: 4-4-92, Pujaripeta, Srikakulam, Andhra Pradesh.

For order support, include your order code, phone number, and delivery pincode so our team can respond faster.$$ , 10, true),
('about-us', 'About', 10, 'About Us', 'A sharper essentials brand built around useful products, clear service, and dependable commerce.', $$Zyvanta is a modern commerce brand focused on practical lifestyle essentials, learning products, and curated digital-first experiences.

We choose products for everyday usefulness, clear value, and presentation quality. Every category is handled with a simple promise: make discovery easy, checkout secure, and support reachable.$$ , 20, true),
('careers', 'About', 10, 'Careers', 'Build with a small team working across commerce, content, design, and customer experience.', $$Zyvanta looks for people who enjoy ownership, clean execution, and customer-first thinking.

Current focus areas include product operations, customer support, digital marketing, catalog management, and creator partnerships. Send your profile to zyvanta.co@gmail.com.$$ , 30, true),
('zyvanta-stories', 'About', 10, 'Zyvanta Stories', 'Updates from the brand, product notes, launches, and practical business lessons.', $$Zyvanta Stories is our space for launch notes, customer learnings, product explainers, behind-the-scenes decisions, and academy updates.$$ , 40, true),
('press', 'About', 10, 'Press', 'Media and partnership information for Zyvanta announcements.', $$For press, interviews, launch notes, or brand assets, contact zyvanta.co@gmail.com with the subject line Press Enquiry.

Please include your publication, deadline, topic, and the format you need.$$ , 50, true),
('information', 'About', 10, 'Information', 'Important company, service, and shopping information in one place.', $$Product prices, availability, delivery timelines, course availability, and payment methods can change based on stock, admin settings, serviceability, and promotions.

Customers should review product details, payment options, and policy pages before placing an order.$$ , 60, true),
('aurum-audio-labs', 'Group Companies', 20, 'Aurum Audio Labs', 'A concept audio vertical for sound-led accessories and personal listening products.', $$Aurum Audio Labs represents Zyvanta's audio-focused product direction: wireless speakers, earbuds, headphones, and practical sound accessories.

The vertical is designed around dependable daily listening, simple product education, and clean after-sales support.$$ , 10, true),
('noir-atelier', 'Group Companies', 20, 'Noir Atelier', 'A design-led concept studio for refined essentials and lifestyle collections.', $$Noir Atelier is a Zyvanta concept for future design-led accessories and lifestyle essentials.

Its focus is restrained styling, durable materials, and useful pieces that feel premium without becoming complicated.$$ , 20, true),
('solis-eyewear-co', 'Group Companies', 20, 'Solis Eyewear Co.', 'A future eyewear concept for everyday frames, sunglasses, and optical accessories.', $$Solis Eyewear Co. is planned as a focused eyewear concept under the Zyvanta brand system.

The aim is to combine accessible pricing, clean frame design, and reliable product information for online buyers.$$ , 30, true),
('royal-essence-parfums', 'Group Companies', 20, 'Royal Essence Parfums', 'A fragrance concept for signature scents, gifting, and personal care collections.', $$Royal Essence Parfums is a future fragrance and gifting concept connected to Zyvanta's premium essentials direction.

The concept is built around clear fragrance notes, thoughtful packaging, and dependable customer guidance.$$ , 40, true),
('zyvanta-ventures', 'Group Companies', 20, 'Zyvanta Ventures', 'The wider business studio behind Zyvanta commerce, academy, and future digital products.', $$Zyvanta Ventures is the operating idea behind our commerce, course, content, and brand-building initiatives.

The focus is practical digital businesses, useful customer experiences, and disciplined growth across related verticals.$$ , 50, true),
('payments', 'Help', 30, 'Payments', 'Understand Pay Now, Cash on Delivery, and product-level payment availability.', $$Zyvanta supports Pay Now and Cash on Delivery where available.

Pay Now orders are verified securely before a paid order is created. Cash on Delivery is shown only when every item in your bag is eligible.$$ , 10, true),
('shipping', 'Help', 30, 'Shipping', 'Dispatch, tracking, delivery timelines, and serviceability information.', $$Orders are packed carefully and dispatched through available courier partners.

Delivery timelines depend on stock, destination pincode, courier coverage, and local conditions. Tracking details are shared when available.$$ , 20, true),
('help-cancellation-returns', 'Help', 30, 'Cancellation & Returns', 'Help for cancelling orders, return eligibility, and refund handling.', $$Cancellation requests can be reviewed before dispatch. After dispatch, the return process depends on the product condition and delivery status.

Returns are accepted only for eligible unused products in original packaging, with accessories and proof of purchase.$$ , 30, true),
('faq', 'Help', 30, 'FAQ', 'Common questions about orders, delivery, payments, and support.', $$How do I contact support?
Email zyvanta.co@gmail.com with your order code and phone number.

Why is COD not visible?
COD appears only when every item in your bag is eligible for Cash on Delivery.$$ , 40, true),
('cancellation-returns', 'Consumer Policy', 40, 'Cancellation & Returns', 'The customer policy for cancellations, returns, replacements, and refunds.', $$Cancellation requests are reviewed based on order status. Orders that are already dispatched may not be cancellable immediately.

Return eligibility depends on item type, condition, packaging, and the time elapsed after delivery. Products must be unused, undamaged, and returned with all included accessories.$$ , 10, true),
('terms-of-use', 'Consumer Policy', 40, 'Terms of Use', 'Rules for using the Zyvanta website, checkout, services, and content.', $$By using Zyvanta, you agree to use the website for lawful purchases and genuine enquiries only.

Product information, pricing, availability, offers, and policies may be updated from time to time. Orders are subject to verification, payment confirmation, stock availability, and serviceability.$$ , 20, true),
('security', 'Consumer Policy', 40, 'Security', 'How Zyvanta approaches safer browsing, checkout, and payment verification.', $$Online payment flow is verified through the payment gateway and server-side confirmation before paid orders are created.

Never share OTPs, card PINs, passwords, or private payment credentials with anyone claiming to represent Zyvanta.$$ , 30, true),
('privacy', 'Consumer Policy', 40, 'Privacy', 'How customer information is used for orders, support, and service improvements.', $$Zyvanta collects information needed to process orders, provide customer support, improve service quality, and communicate important updates.

We do not ask customers to share payment passwords, card PINs, or OTPs. Customer information is handled for legitimate business and support purposes.$$ , 40, true),
('gift-cards', 'Footer', 90, 'Gift Cards', 'Gift card information for future Zyvanta gifting options.', $$Zyvanta gift card support is planned for future releases.

When available, customers will be able to use eligible gift cards for selected products and experiences.$$ , 10, true),
('help-center', 'Footer', 90, 'Help Center', 'A quick route to customer care, payment help, shipping support, and policy answers.', $$The Zyvanta Help Center brings together support for payments, delivery, cancellations, returns, privacy, and product questions.

For direct help, email zyvanta.co@gmail.com with your order code, phone number, and a short description of the issue.$$ , 20, true)
on conflict (slug) do nothing;

update public.order_items
set product_id = null
where product_id in ('aurum-buds-pro', 'noir-cardholder', 'solis-aviators', 'royal-essence-no-7');

delete from public.products
where id in ('aurum-buds-pro', 'noir-cardholder', 'solis-aviators', 'royal-essence-no-7');

insert into public.products (id, code, name, price, category, tag, image, gallery, tagline, description, features, rating, review_count, stock, is_featured, sort_order) values
('rd-aura-speaker', 'ZYP-RDAURA', 'RD Aura Wireless Speaker', 1099, 'Speakers', 'New Arrival', '/assets/products/rd-aura-speaker-main.jpg', '["/assets/products/rd-aura-speaker-main.jpg","/assets/products/rd-aura-speaker-features.jpg","/assets/products/rd-aura-speaker-lifestyle.jpg","/assets/products/rd-aura-speaker-details.jpg"]', 'Portable sound with a bold strap finish.', 'A compact wireless TWS speaker with Type-C charging, AUX support and a rugged portable body designed for everyday music.', '["Up to 6 hours music time","1200mAh battery","TWS speaker pairing","Type-C charging and AUX port","Portable strap design"]', 4.7, 184, 40, true, 10),
('rd-hush-cl790-headphones', 'ZYP-HUSH790', 'RD Hush CL-790 Headphones', 1799, 'Headphones', 'Bestseller', '/assets/products/rd-hush-cl790-headphones-main.jpg', '["/assets/products/rd-hush-cl790-headphones-main.jpg","/assets/products/rd-hush-cl790-headphones-features.jpg","/assets/products/rd-hush-cl790-headphones-lifestyle.jpg","/assets/products/rd-hush-cl790-headphones-details.jpg"]', 'Long-play headphones for work, travel and music.', 'Over-ear wireless headphones with 42 hours total playtime, Bluetooth 5.3, Type-C charging, FM, AUX, SD card support and IPX4 protection.', '["Up to 42 hours playtime","Bluetooth 5.3","Type-C charging","FM, AUX and SD card modes","IPX4 water resistant"]', 4.8, 236, 35, true, 20),
('dk-solar-wall-lamp', 'ZYP-SOLAR', 'DK Solar Wall Lamp', 899, 'Lighting', 'Outdoor', '/assets/products/dk-solar-wall-lamp-main.jpg', '["/assets/products/dk-solar-wall-lamp-main.jpg","/assets/products/dk-solar-wall-lamp-features.jpg","/assets/products/dk-solar-wall-lamp-lifestyle.jpg","/assets/products/dk-solar-wall-lamp-details.jpg"]', 'Elegant evening illumination, powered by the sun.', 'Solar wall lamp with a monocrystalline panel, motion detection, rechargeable battery and IP65 waterproof protection for balconies, gates and exterior walls.', '["Monocrystalline solar cell","10-meter motion detection","Up to 12-hour run time","IP65 waterproof rating","Replaceable Edison-style LED bulb"]', 4.6, 142, 50, true, 30),
('boat-airdopes-141-pack', 'ZYP-BOAT141', 'boAt Airdopes 141', 1299, 'Earbuds', 'Popular', '/assets/products/boat-airdopes-141-pack-main.jpg', '["/assets/products/boat-airdopes-141-pack-main.jpg","/assets/products/boat-airdopes-141-pack-features.jpg","/assets/products/boat-airdopes-141-pack-lifestyle.jpg","/assets/products/boat-airdopes-141-pack-details.jpg"]', 'Signature sound in a compact everyday case.', 'True wireless earbuds with touch controls, IPX4 water resistance, 13mm drivers, ASAP charging and up to 42 hours total playback.', '["42 hours total playtime","13mm drivers","Quick response touch controls","Bluetooth v5.1","IPX4 water and sweat resistance"]', 4.8, 411, 65, true, 40),
('oud-smart-pods-navy', 'ZYP-OUDNAVY', 'OUD Smart Pods Navy', 399, 'Earbuds', 'Value Pick', '/assets/products/oud-smart-pods-navy-main.jpg', '["/assets/products/oud-smart-pods-navy-main.jpg","/assets/products/oud-smart-pods-navy-features.jpg","/assets/products/oud-smart-pods-navy-lifestyle.jpg","/assets/products/oud-smart-pods-navy-details.jpg"]', 'Navy blue pods with serious battery life.', 'OUD Smart Pods in a navy and orange finish with Type-C charging, touch controls, 13mm drivers and up to 42 hours playtime.', '["Up to 42 hours playtime","13mm drivers","Type-C charging","IPX5 water resistant","Touch controls and voice assistant"]', 4.7, 328, 80, true, 50),
('boat-airdopes-141-bold-black', 'ZYP-BOATBLK', 'boAt AirDopes 141 Bold Black', 1199, 'Earbuds', 'Bold Black', '/assets/products/boat-airdopes-141-bold-black-main.jpg', '["/assets/products/boat-airdopes-141-bold-black-main.jpg","/assets/products/boat-airdopes-141-bold-black-features.jpg","/assets/products/boat-airdopes-141-bold-black-lifestyle.jpg","/assets/products/boat-airdopes-141-bold-black-details.jpg"]', 'Clean black earbuds with fast charging.', 'Bold black true wireless earbuds with immersive audio, low-latency gaming mode, IWP tech and ASAP charging for quick top-ups.', '["5 min charge gives up to 75 min playback","Up to 42 hours total playback","Low-latency gaming mode","IWP tech for clearer calls","IPX4 sweat resistant"]', 4.8, 497, 70, true, 60),
('smart-audio-collection', 'ZYP-AUDIO', 'Smart Audio Collection', 1499, 'Bundles', 'Collection', '/assets/products/smart-audio-collection-main.jpg', '["/assets/products/smart-audio-collection-main.jpg","/assets/products/smart-audio-collection-features.jpg","/assets/products/smart-audio-collection-lifestyle.jpg","/assets/products/smart-audio-collection-details.jpg"]', 'A curated smart-audio showcase for everyday listeners.', 'A premium audio collection layout featuring smart pods, black earbuds and multi-color true wireless options for style-focused buyers.', '["Curated audio bundle styling","Multiple earbud color options","Smart touch controls","Up to 42 hours playback options","Compact travel-friendly charging cases"]', 4.6, 121, 25, true, 70),
('oud-smart-pods-kit', 'ZYP-OUDKIT', 'OUD Smart Pods Accessory Kit', 499, 'Bundles', 'Complete Kit', '/assets/products/oud-smart-pods-kit-main.jpg', '["/assets/products/oud-smart-pods-kit-main.jpg","/assets/products/oud-smart-pods-kit-features.jpg","/assets/products/oud-smart-pods-kit-lifestyle.jpg","/assets/products/oud-smart-pods-kit-details.jpg"]', 'Smart pods plus charging-ready essentials.', 'A complete OUD Smart Pods kit presentation with extra ear tips, cable support, touch controls, IPX water resistance and 42-hour playback positioning.', '["42 hours playtime","Bluetooth v5.1","13mm drivers","Touch control","Complete accessory kit presentation"]', 4.7, 207, 45, true, 80)
on conflict (id) do update set
  code = coalesce(public.products.code, excluded.code),
  name = excluded.name,
  price = excluded.price,
  category = excluded.category,
  tag = excluded.tag,
  image = excluded.image,
  gallery = excluded.gallery,
  tagline = excluded.tagline,
  description = excluded.description,
  features = excluded.features,
  rating = excluded.rating,
  review_count = excluded.review_count,
  stock = excluded.stock,
  is_featured = excluded.is_featured,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.courses (id, code, name, title, description, price, duration, image, gallery, rating, review_count, is_active, sort_order) values
('dropshipping-mastery', 'ZYC-DROP', 'Dropshipping Mastery', 'Build a profitable store from zero', 'Learn supplier sourcing, product research, store setup, ads, checkout flow and scaling systems for a practical online business.', 999, '6 weeks', '/assets/product-1.webp', '["/assets/product-1.webp"]', 4.8, 214, true, 10),
('instagram-growth-engine', 'ZYC-INSTA', 'Instagram Growth Engine', 'Grow content, followers and brand deals', 'A focused course on reels, hooks, content calendars, profile positioning, analytics and monetising a personal or product brand.', 799, '4 weeks', '/assets/product-2.webp', '["/assets/product-2.webp"]', 4.7, 168, true, 20),
('ai-for-solo-entrepreneurs', 'ZYC-AI', 'AI for Solo Entrepreneurs', 'Use AI tools to run a lean digital business', 'Use AI for product ideas, writing, images, automation, customer support and daily operating workflows without a large team.', 1199, '5 weeks', '/assets/product-3.webp', '["/assets/product-3.webp"]', 4.9, 132, true, 30)
on conflict (id) do update set
  code = coalesce(public.courses.code, excluded.code),
  name = excluded.name,
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  duration = excluded.duration,
  image = excluded.image,
  gallery = excluded.gallery,
  rating = excluded.rating,
  review_count = excluded.review_count,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.reviews (product_id, item_id, item_type, item_code, name, role, avatar, rating, comment, is_featured) values
('rd-aura-speaker', 'rd-aura-speaker', 'product', 'ZYP-RDAURA', 'Rahul Mehta', 'Verified Buyer', 'https://i.pravatar.cc/150?img=12', 5, 'The product looks exactly like the photos and delivery was smooth.', true),
('rd-hush-cl790-headphones', 'rd-hush-cl790-headphones', 'product', 'ZYP-HUSH790', 'Priya Reddy', 'Verified Buyer', 'https://i.pravatar.cc/150?img=47', 5, 'Good quality, clean packaging and impressive battery backup for the price.', true),
('boat-airdopes-141-pack', 'boat-airdopes-141-pack', 'product', 'ZYP-BOAT141', 'Arjun Nair', 'Verified Buyer', 'https://i.pravatar.cc/150?img=32', 4, 'Easy to use and feels premium in hand. Worth buying.', true),
('oud-smart-pods-navy', 'oud-smart-pods-navy', 'product', 'ZYP-OUDNAVY', 'Sneha Kapoor', 'Verified Buyer', 'https://i.pravatar.cc/150?img=68', 5, 'I liked the finish and the sound quality. Checkout was simple.', true);

update public.products
set code = 'ZYP-' || upper(substr(regexp_replace(id, '[^a-zA-Z0-9]', '', 'g'), 1, 6)) || '-' || upper(substr(md5(id), 1, 4))
where code is null;

update public.courses
set code = 'ZYC-' || upper(substr(regexp_replace(id, '[^a-zA-Z0-9]', '', 'g'), 1, 6)) || '-' || upper(substr(md5(id), 1, 4))
where code is null;

update public.orders
set order_code = 'ZYO-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where order_code is null;

update public.order_items oi
set
  item_type = coalesce(oi.item_type, 'product'),
  item_id = coalesce(oi.item_id, oi.product_id),
  item_code = coalesce(oi.item_code, p.code)
from public.products p
where oi.product_id = p.id
  and (oi.item_id is null or oi.item_code is null);

update public.reviews r
set
  item_type = coalesce(r.item_type, 'product'),
  item_id = coalesce(r.item_id, r.product_id),
  item_code = coalesce(r.item_code, p.code)
from public.products p
where r.product_id = p.id
  and (r.item_id is null or r.item_code is null);
