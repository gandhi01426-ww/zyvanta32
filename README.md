# Zyvanta Luxe Launch

Production Vite + React storefront with Supabase data services, Vercel serverless APIs, and server-verified Razorpay Payments.

## Environment

Copy `.env.example` and configure the same values in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `ADMIN_EMAILS`

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Create an Auth user for admin access.
4. Add the admin email to `ADMIN_EMAILS` in Vercel.
5. Add/edit products, courses, coupons, reviews, homepage sections, site contact/social links, footer links, and policies from `/admin`.

If you already ran an older schema and still see the demo products `Aurum Buds Pro`, `Noir Cardholder`, `Solis Aviators`, or `Royal Essence No.7`, run `supabase/schema.sql` again. The latest schema removes those demo rows and upserts the current Zyvanta product list.

## No-Code Product Automation

1. Open `/admin` and sign in with the Supabase Auth admin user.
2. In Products, enter the product title, description, price, stock, category, features, and tag.
3. Upload the main image or gallery images. New uploads are saved under `product-images/zyvanta30/products`, `product-images/zyvanta30/courses`, or `product-images/zyvanta30/reviews` in the public Supabase Storage bucket created by `supabase/schema.sql`.
4. Click Add or Save. The product is written to Supabase, and the storefront listens to Supabase Realtime product changes so customers see updates without a code change.

If products do not refresh instantly, confirm the `products` table is enabled in Supabase Realtime. The included schema attempts to add it to the `supabase_realtime` publication.

## Editable Contact, Social, and Location Details

Open `/admin`, sign in, and use the `Site Info` tab to update the footer Instagram, Facebook, YouTube, and Twitter/X redirect URLs, contact email, phone number, Instagram handle, registered office address, Google Maps location query, company name, and footer note. The `Footer Links` tab still manages the footer link columns and information pages.

## Coupons

Open `/admin`, sign in, and use the `Coupons` tab to create percentage discount coupons with a coupon code, discount percent, minimum order value, optional expiry date, and active/inactive status. Customers can apply a coupon during checkout after entering delivery details. Coupon validation and discount calculation happen on the server for checkout options, Cash on Delivery orders, Razorpay order creation, and Razorpay payment verification.

## Product Search

Customers can search products from the top navigation beside `Shop`. Matching products appear first in the shop section, followed by a recommended row of other available products. If no product matches the search, the shop section shows the unavailable product message.

## Razorpay Setup

1. Create Razorpay live API keys.
2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to Vercel.
3. Use `/checkout` to test Pay Now. Orders are saved only after server-side signature and amount verification.
4. Cash on Delivery orders are saved directly through the secure order API.

## Vercel Deployment

1. Import the project into Vercel.
2. Set the environment variables above.
3. Keep the default free Vercel domain. Vercel automatically creates a URL like `https://zyvanta30.vercel.app` or `https://<project-name>-<team>.vercel.app`; no purchased domain is required.
4. Deploy. `vercel.json` sets `npm ci`, `npm run build`, `dist`, SPA routing, and cache headers.
5. Do not connect a custom domain unless you buy and configure it first. The app now creates canonical URLs from the live deployment URL, so Vercel's free domain works cleanly.

## Local Development

Install dependencies, then run:

```bash
npm run dev
```

For API parity with production, use Vercel dev:

```bash
vercel dev
```
