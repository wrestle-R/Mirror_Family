import { CheckCircle } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Build Your Profile",
    description: "Enter your monthly income, expenses, debts, savings goals, and risk preferences through our simple questionnaire."
  },
  {
    step: "02",
    title: "AI Analysis",
    description: "Our multi-agent AI council analyzes your financial data, with each agent focusing on a specific aspect of your finances."
  },
  {
    step: "03",
    title: "Get Your Plan",
    description: "Receive a personalized monthly action plan with clear, actionable steps to improve your financial health."
  },
  {
    step: "04",
    title: "Track Progress",
    description: "Monitor your spending, savings growth, and debt payoff through our visual dashboard and scenario comparisons."
  }
];

const HowItWorks = () => {
  console.log("HowItWorks: Rendering");

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to transform your financial future with AI-powered guidance.
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-start gap-6 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{item.step}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                  {item.title}
                  <CheckCircle className="w-5 h-5 text-chart-2" />
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
