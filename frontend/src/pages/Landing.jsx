import Hero from "@/components/Landing/Hero";
import Features from "@/components/Landing/Features";
import Testimonials from "@/components/Landing/Testimonials";
import Footer from "@/components/Landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero />
      <Features />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Landing;
