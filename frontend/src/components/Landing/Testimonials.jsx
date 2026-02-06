import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee"

const topRowTestimonials = [
  {
    author: {
      name: "Alex Johnson",
      handle: "@alexj_student",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
    },
    text: "MoneyCouncil helped me finally understand where my money goes. The budget tracking is intuitive and actually fun to use!"
  },
  {
    author: {
      name: "Sarah Lee",
      handle: "@sarah.finances",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    text: "I saved over $500 this semester just by using the savings goals feature. Highly recommend for any college student."
  }
]


const bottomRowTestimonials = [
  {
    author: {
      name: "Michael Chen",
      handle: "@chen_econ",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
    },
    text: "The financial literacy modules are great. Short, sweet, and surprisingly deep. I fee much more confident about investing now."
  },
  {
    author: {
      name: "Emily Davis",
      handle: "@emilyd_art",
      avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=150&h=150&fit=crop&crop=face"
    },
    text: "Integration with my bank account was seamless. The dashboard gives me a perfect overview of my financial health."
  }
]


export function Testimonials() {
  return (
    <TestimonialsSection
      title="Trusted by Students"
      description="Join thousands of students who are taking control of their financial future."
      topTestimonials={topRowTestimonials}
      bottomTestimonials={bottomRowTestimonials}
    />
  )
}
export default Testimonials;
