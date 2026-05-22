import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index.tsx";
import { CartProvider } from "@/context/CartContext";
import SiteMeta from "@/components/SiteMeta";

const Admin = lazy(() => import("./pages/Admin.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
const OrderResult = lazy(() => import("./pages/OrderResult.tsx"));
const Courses = lazy(() => import("./pages/Courses.tsx"));
const FooterInfo = lazy(() => import("./pages/FooterInfo.tsx"));
const CartDrawer = lazy(() => import("@/components/CartDrawer"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CartProvider>
        <BrowserRouter>
          <SiteMeta />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<OrderResult status="success" />} />
              <Route path="/checkout/failure" element={<OrderResult status="failure" />} />
              <Route path="/info/:slug" element={<FooterInfo />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CartDrawer />
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
    <Analytics />
    <SpeedInsights />
  </QueryClientProvider>
);

export default App;
