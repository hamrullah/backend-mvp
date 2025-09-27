import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import FeaturedDeals from "./components/FeaturedDeals";
import CategoriesBoard from "./components/CategoriesBoard";
import DealsGrid from "./components/DealsGrid";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import AffiliateCTA from "./components/AffiliateCTA";

export default function Page() {
return (
<div className="min-h-screen bg-white text-gray-900">
<Navbar />
<main>
<Hero />
<FeaturedDeals />
<CategoriesBoard />
<DealsGrid />
<HowItWorks />
<Testimonials />
<AffiliateCTA />


</main>
<Footer />
</div>
);
}