import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTA = () => {
  const navigate = useNavigate();

  console.log("CTA: Rendering");

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Ready to Take Control of Your Finances?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of students and young professionals who are building financial confidence with Money Council.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="w-full sm:w-auto text-lg px-8"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground">
            No credit card required
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
