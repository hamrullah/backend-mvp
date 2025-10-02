"use client";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import FeaturedDeals from "./components/FeaturedDeals";
import CategoriesBoard from "./components/CategoriesBoard";
import DealsGrid from "./components/DealsGrid";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import AffiliateCTA from "./components/AffiliateCTA";

// modal
import LoginModal from "./components/LoginModal";
import SignUpModal from "./components/SignUpModal";

export default function Page() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);
  const openSignup = () => setSignupOpen(true);
  const closeSignup = () => setSignupOpen(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar onOpenLogin={openLogin} onOpenSignup={openSignup} />
      <main>
        <Hero /> {/* opsional: kalau mau tombol Login di Hero */}
        <FeaturedDeals />
        <CategoriesBoard />
        <DealsGrid />
        <HowItWorks />
        <Testimonials />
        <AffiliateCTA />
      </main>
      <Footer />

      {/* Satu instance masing-masing modal untuk seluruh halaman */}
      <LoginModal open={loginOpen} onClose={closeLogin} />
      <SignUpModal open={signupOpen} onClose={closeSignup} />
    </div>
  );
}
