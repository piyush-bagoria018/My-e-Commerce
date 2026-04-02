import { Footer } from "@/components/common/Footer";
import { Header } from "@/components/common/Header";
import { TopBar } from "@/components/common/TopBar";
import { BestSellingSection } from "@/components/home/BestSellingSection";
import { BrowseCategorySection } from "@/components/home/BrowseCategorySection";
import { ExploreProductsSection } from "@/components/home/ExploreProductsSection";
import { FeaturedDealSection } from "@/components/home/FeaturedDealSection";
import { FlashSalesSection } from "@/components/home/FlashSalesSection";
import { HomeHero } from "@/components/home/HomeHero";
import { NewArrivalSection } from "@/components/home/NewArrivalSection";
import { TrustBadgesSection } from "@/components/home/TrustBadgesSection";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <Header />
      <main>
        <HomeHero />
        <FlashSalesSection />
        <BrowseCategorySection />
        <BestSellingSection />
        <FeaturedDealSection />
        <ExploreProductsSection />
        <NewArrivalSection />
        <TrustBadgesSection />
      </main>
      <Footer />
    </>
  );
}
