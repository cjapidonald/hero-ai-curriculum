import { Link } from "react-router-dom";
import { Target, Eye, Award, Heart, Rocket, TrendingUp, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
  const timeline = [
    { year: "2022", icon: "🌟", title: "HeroSchool Founded", desc: "Revolutionary idea: Cambridge curriculum + AI technology" },
    { year: "2023", icon: "📚", title: "Authorized Cambridge Test Center", desc: "Official partner for Starters, Movers & Flyers exams" },
    { year: "2024", icon: "🏆", title: "95% Exam Pass Rate", desc: "Proven results with AI-powered personalization" },
    { year: "2025", icon: "🚀", title: "Expanding Programs", desc: "New levels, more events, growing community" },
  ];

  const values = [
    { icon: Target, title: "Excellence", desc: "Cambridge standards, no shortcuts" },
    { icon: Heart, title: "Care", desc: "Small classes, individual attention" },
    { icon: Rocket, title: "Innovation", desc: "AI and technology in every lesson" },
    { icon: TrendingUp, title: "Growth Mindset", desc: "Celebrating progress, not perfection" },
    { icon: UsersIcon, title: "Partnership", desc: "Parents and teachers working together" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/20 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Every Child Has a Superpower Waiting to Be Unleashed
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                Igniting English Excellence Since 2022
              </p>
              <p className="text-lg">
                We believe every child can master English with the right curriculum, dedicated teachers, and smart technology.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"
                alt="Happy students learning"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Timeline */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Journey</h2>
          <div className="max-w-4xl mx-auto space-y-8">
            {timeline.map((item, index) => (
              <div
                key={item.year}
                className="flex gap-6 items-start animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl flex-shrink-0">{item.icon}</div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-primary mb-1">{item.year}</div>
                  <div className="text-xl font-semibold mb-2">{item.title}</div>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding gradient-yellow-light">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="gradient-pink p-8 rounded-2xl text-background">
              <Target size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-4">🎯 OUR MISSION</h3>
              <p className="text-lg">
                To deliver high-quality, engaging English lessons that achieve excellence while preparing children for a technology-driven world.
              </p>
            </div>
            <div className="gradient-teal p-8 rounded-2xl text-background">
              <Eye size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-4">👁️ OUR VISION</h3>
              <p className="text-lg">
                To be Vietnam's leading English center where every child discovers their superpower through personalized learning and global curriculum.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            The HeroSchool Difference
          </h2>
          <div className="space-y-12 max-w-5xl mx-auto">
            <div className="bg-muted p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="text-3xl">🤖</span> AI-Powered Personalization
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="font-bold text-destructive mb-2">BEFORE (Traditional):</div>
                  <p className="text-sm">Same lesson for all 20+ students → Some bored, some lost</p>
                </div>
                <div>
                  <div className="font-bold text-accent-teal mb-2">AFTER (HeroSchool):</div>
                  <p className="text-sm">AI analyzes results → Personalized path for each child</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Award className="text-primary" /> Authorized Cambridge Center
              </h3>
              <p className="mb-4">Test right here at HeroSchool. No traveling across Hanoi.</p>
              <ul className="space-y-2">
                <li>✅ Familiar environment reduces anxiety</li>
                <li>✅ Teachers know the curriculum inside-out</li>
                <li>✅ Practice tests in actual exam rooms</li>
                <li>✅ Same-day registration support</li>
              </ul>
            </div>

            <div className="bg-muted p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="text-3xl">📱</span> Real-Time Parent Dashboard
              </h3>
              <p className="mb-4 italic">"No waiting for quarterly reports. You're always in the loop."</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-background p-3 rounded-lg text-sm">✅ Today's attendance</div>
                <div className="bg-background p-3 rounded-lg text-sm">📝 Homework completion</div>
                <div className="bg-background p-3 rounded-lg text-sm">💯 Latest quiz scores</div>
                <div className="bg-background p-3 rounded-lg text-sm">📊 Skills progress</div>
                <div className="bg-background p-3 rounded-lg text-sm">📅 Upcoming classes</div>
                <div className="bg-background p-3 rounded-lg text-sm">💬 Teacher comments</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="section-padding bg-foreground text-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <value.icon size={48} className="mx-auto mb-3 text-primary" />
                <h3 className="font-bold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results & Testimonials */}
      <section className="section-padding gradient-yellow-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Our Results Speak for Themselves
          </h2>
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mb-12 text-center">
            <div>
              <div className="text-5xl font-bold text-primary mb-2">95%</div>
              <div className="text-sm text-muted-foreground">Exam Pass Rate</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">4.9/5</div>
              <div className="text-sm text-muted-foreground">Parent Satisfaction</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">International School Acceptance</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-background p-6 rounded-xl">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-primary">⭐</span>
                ))}
              </div>
              <p className="mb-4 italic">
                "My daughter started at Stage 1 with zero English. After 3 years at HeroSchool, she passed Flyers with 14 shields and now attends BIS."
              </p>
              <p className="text-sm font-semibold">— Mrs. Nguyen, Smart City</p>
            </div>
            <div className="bg-background p-6 rounded-xl">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-primary">⭐</span>
                ))}
              </div>
              <p className="mb-4 italic">
                "The small class size makes such a difference. My son actually looks forward to English class now!"
              </p>
              <p className="text-sm font-semibold">— Mr. Tran, Parent</p>
            </div>
            <div className="bg-background p-6 rounded-xl">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-primary">⭐</span>
                ))}
              </div>
              <p className="mb-4 italic">
                "Best English center in Hanoi. Cambridge curriculum + AI technology + caring teachers = results."
              </p>
              <p className="text-sm font-semibold">— Ms. Pham, Mother of twins</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">Ready to Meet Us?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/contact">Book Free Trial Class</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-foreground hover:bg-foreground hover:text-background">
              <Link to="/curriculum">View Curriculum</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
