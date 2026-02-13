import AboutSection from "@/features/home/components/AboutSection"
import EcoSection from "@/features/home/components/EcoSection";
import EventsSection from "@/features/home/components/EventsSection";
import FeaturedMembersSection from "@/features/home/components/FeaturedMembersSection";
import HeroSection from "@/features/home/components/HeroSection";
import IndustriesSection from "@/features/home/components/IndustriesSection";
import MembershipSection from "@/features/home/components/MembershipSection";
import NewsSection from "@/features/home/components/NewsSection";
import PartnersSection from "@/features/home/components/PartnersSection";
import ContactSection from "@/shared/components/ContactSection";
import VideoContainerSection from "@/features/home/components/VideoContainerSection";


const componentMap: Record<string, React.ComponentType<any>> = {
  "home.hero": HeroSection,
  "home.about-summary": AboutSection,
  "home.featured-member": FeaturedMembersSection,
  "home.events-spotlight": EventsSection,
  "home.ecosystem": EcoSection,
  "home.video-container-block": VideoContainerSection,
  "home.industries": IndustriesSection,
  "home.newsand-publication": NewsSection,
  "home.our-partner": PartnersSection,
  "home.membership-section": MembershipSection,
  "home.contact-us": ContactSection,
};

export default componentMap;