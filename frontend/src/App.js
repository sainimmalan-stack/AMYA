import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import SmoothScroll from "@/components/SmoothScroll";
import Layout from "@/components/Layout";
import { ConfigProvider } from "@/context/ConfigContext";
import { AuthProvider } from "@/context/AuthContext";

import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import LivePress from "@/pages/LivePress";
import OurStory from "@/pages/OurStory";
import About from "@/pages/About";
import Transparency from "@/pages/Transparency";
import Contact from "@/pages/Contact";
import Policy from "@/pages/Policy";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const withLayout = (el) => <Layout>{el}</Layout>;

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <SmoothScroll>
            <Routes>
              <Route path="/" element={withLayout(<Home />)} />
              <Route path="/shop" element={withLayout(<Shop />)} />
              <Route path="/shop/:category" element={withLayout(<Shop />)} />
              <Route path="/product/:slug" element={withLayout(<ProductDetail />)} />
              <Route path="/live-press" element={withLayout(<LivePress />)} />
              <Route path="/our-story" element={withLayout(<OurStory />)} />
              <Route path="/about" element={withLayout(<About />)} />
              <Route path="/transparency" element={withLayout(<Transparency />)} />
              <Route path="/contact" element={withLayout(<Contact />)} />
              <Route path="/policies/:slug" element={withLayout(<Policy />)} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={withLayout(<NotFound />)} />
            </Routes>
          </SmoothScroll>
          <Toaster position="top-center" />
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
