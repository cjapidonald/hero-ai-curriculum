import { Link } from "react-router-dom";
import { CheckCircle2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const Fees = () => {
  const pricingPlans = [
    {
      months: 3,
      monthlyRate: "2,200,000",
      total: "6,600,000",
      savings: null,
      badge: "Trial Period",
      popular: false,
    },
    {
      months: 6,
      monthlyRate: "2,000,000",
      total: "12,000,000",
      savings: "1,200,000",
      badge: "One Semester",
      popular: false,
    },
    {
      months: 9,
      monthlyRate: "1,850,000",
      total: "16,650,000",
      savings: "3,150,000",
      badge: "MOST POPULAR - School Year",
      popular: true,
    },
    {
      months: 12,
      monthlyRate: "1,700,000",
      total: "20,400,000",
      savings: "6,000,000",
      badge: "BEST VALUE",
      popular: false,
      bestValue: true,
    },
  ];

  const includedFeatures = [
    "Cambridge Global Stage Textbooks",
    "Student Learning App (Unlimited Access)",
    "Weekly Homework Packs (Printable)",
    "AI Progress Reports (Monthly)",
    "Parent Dashboard (Real-time)",
    "2 Classes Per Week (1.5 hours = 12 hrs/month)",
    "Small Class Size (Max 12 Students)",
    "Expert Teachers (50-100% Foreign)",
    "Interactive Tools (Kahoot, Wordwall, Blooket)",
    "Free Science Events (Monthly)",
    "Cambridge Exam Preparation",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/20 via-background to-background relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-accent-pink/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-accent-teal/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
            Investment in Your Child's Future
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Transparent Pricing | Flexible Plans | Special Discounts
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Choose Your Payment Plan
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            All plans include the same premium features - save more with longer commitments
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.months}
                className={`p-6 rounded-2xl border-2 card-hover relative ${
                  plan.popular
                    ? "border-primary shadow-xl bg-primary/5"
                    : plan.bestValue
                    ? "border-accent-teal shadow-xl bg-accent-teal/5"
                    : "border-muted"
                }`}
              >
                {(plan.popular || plan.bestValue) && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-background ${
                      plan.popular ? "bg-primary" : "bg-accent-teal"
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold mb-2">{plan.months} MONTHS</div>
                  <div className="text-2xl font-bold text-primary mb-1">
                    ₫{plan.monthlyRate}/month
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: ₫{plan.total}
                  </div>
                  {plan.savings && (
                    <div className="text-sm font-semibold text-accent-teal mt-2">
                      You Save: ₫{plan.savings}
                    </div>
                  )}
                </div>
                <Button
                  asChild
                  className={`w-full rounded-full ${
                    plan.popular || plan.bestValue
                      ? "bg-primary hover:bg-primary/90"
                      : ""
                  }`}
                  variant={plan.popular || plan.bestValue ? "default" : "outline"}
                >
                  <Link to="/contact">
                    {plan.popular ? "Choose This Plan" : "Select Plan"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Discounts */}
      <section className="section-padding gradient-yellow-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Save Even More with Special Discounts
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            <div className="gradient-pink p-8 rounded-2xl text-background">
              <div className="flex items-center gap-3 mb-4">
                <Gift size={40} />
                <h3 className="text-2xl font-bold">10% SIBLING DISCOUNT</h3>
              </div>
              <p className="mb-4">Enroll 2 or more children from the same family</p>
              <div className="bg-background/20 p-4 rounded-xl text-sm">
                <strong>Example:</strong> 2 children on 9-month plan<br />
                Regular: ₫33,300,000<br />
                With discount: <strong>₫29,970,000</strong>
              </div>
            </div>
            <div className="gradient-teal p-8 rounded-2xl text-background">
              <div className="flex items-center gap-3 mb-4">
                <Gift size={40} />
                <h3 className="text-2xl font-bold">10% REFERRAL DISCOUNT</h3>
              </div>
              <p className="mb-4">Refer a friend who enrolls - you both save 10%</p>
              <div className="bg-background/20 p-4 rounded-xl text-sm">
                <strong>Benefits:</strong><br />
                • Your friend gets 10% off<br />
                • You get 10% off next payment<br />
                • Unlimited referrals!
              </div>
            </div>
          </div>
          <div className="max-w-2xl mx-auto bg-background p-6 rounded-xl text-center">
            <h4 className="font-bold text-lg mb-2">Can discounts be combined?</h4>
            <p className="text-primary font-bold text-2xl">YES!</p>
            <p className="text-sm text-muted-foreground">Maximum 20% discount (sibling + referral)</p>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What's Included in Every Course
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {includedFeatures.map((feature) => (
              <div key={feature} className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                <CheckCircle2 className="text-accent-teal flex-shrink-0 mt-0.5" size={20} />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="section-padding gradient-yellow-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            HeroSchool vs Other English Centers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto bg-background rounded-xl overflow-hidden">
              <thead className="bg-primary text-foreground">
                <tr>
                  <th className="p-4 text-left">Feature</th>
                  <th className="p-4 text-center bg-primary/80">HeroSchool</th>
                  <th className="p-4 text-center">Traditional Centers</th>
                  <th className="p-4 text-center">Online-Only</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Class Size</td>
                  <td className="p-4 text-center bg-primary/10">✅ Max 12</td>
                  <td className="p-4 text-center">❌ 20-30</td>
                  <td className="p-4 text-center">🤷 Varies</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Curriculum</td>
                  <td className="p-4 text-center bg-primary/10">✅ Cambridge</td>
                  <td className="p-4 text-center">❌ Local</td>
                  <td className="p-4 text-center">🤷 Mixed</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">AI Tracking</td>
                  <td className="p-4 text-center bg-primary/10">✅ Yes</td>
                  <td className="p-4 text-center">❌ No</td>
                  <td className="p-4 text-center">🤷 Sometimes</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Parent Dashboard</td>
                  <td className="p-4 text-center bg-primary/10">✅ Real-time</td>
                  <td className="p-4 text-center">❌ Manual</td>
                  <td className="p-4 text-center">🤷 Limited</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Exam Center</td>
                  <td className="p-4 text-center bg-primary/10">✅ Authorized</td>
                  <td className="p-4 text-center">❌ Must travel</td>
                  <td className="p-4 text-center">❌ No</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Fees;
