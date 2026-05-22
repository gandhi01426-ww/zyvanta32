import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

// Code-split below-the-fold sections to shrink initial JS
const Products = lazy(() => import("@/components/Products"));
const Problems = lazy(() => import("@/components/Problems"));
const WhyUs = lazy(() => import("@/components/WhyUs"));
const Reviews = lazy(() => import("@/components/Reviews"));
const Discover = lazy(() => import("@/components/Discover"));
const CTA = lazy(() => import("@/components/CTA"));
const Footer = lazy(() => import("@/components/Footer"));

const Index = () => (
  <main className="min-h-screen">
    <Navbar />
    <Hero />
    <Suspense fallback={null}>
      <Products />
      <Problems />
      <WhyUs />
      <Reviews />
      <Discover />
      <CTA />
      <Footer />
    </Suspense>
  </main>
);

export default Index;
