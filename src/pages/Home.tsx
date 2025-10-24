import { Link } from "react-router-dom";
import { Book, Brain, Users, Trophy, ArrowRight, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RollingNumber from "@/components/RollingNumber";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-muted via-background to-background relative overflow-hidden">
        <div className="absolute top-10 right-10 w-20 h-20 bg-accent-pink/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-accent-teal/20 rounded-full blur-2xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <p className="text-primary font-semibold uppercase tracking-wide">Welcome to HeroSchool</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Unlock Your Child's English Superpowers
              </h1>
              <p className="text-xl text-muted-foreground">
                Cambridge Curriculum | Ages 5-14 | Smart City, Hanoi
              </p>
              <p className="text-lg">
                Premium English language center offering Cambridge Global Stage curriculum – the same trusted program used by Vinschool and leading international schools across Vietnam.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="rounded-full group">
                  <Link to="/contact">
                    Book FREE Trial <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Link to="/curriculum">Explore Curriculum</Link>
                </Button>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"
                  alt="Happy children learning English"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent-teal rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose HeroSchool */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Parents Choose HeroSchool
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="gradient-pink p-8 rounded-2xl text-background card-hover">
              <Book size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-3">Cambridge Excellence</h3>
              <p className="text-background/90">
                Official Cambridge Global Stage curriculum used by top international schools. Stages 1-6 with authorized exam center for Starters, Movers & Flyers.
              </p>
            </div>
            <div className="gradient-primary p-8 rounded-2xl text-background card-hover">
              <Brain size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-3">AI-Powered Learning</h3>
              <p className="text-background/90">
                Smart technology analyzes every quiz and test, identifies weaknesses, and personalizes each child's learning path. Parent dashboard with real-time progress.
              </p>
            </div>
            <div className="gradient-teal p-8 rounded-2xl text-background card-hover">
              <Users size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-3">Small Class Sizes</h3>
              <p className="text-background/90">
                Maximum 12 students per class. Expert teachers: 50% foreign for beginners, 100% foreign for advanced levels. 2 sessions/week, 1.5 hours each.
              </p>
            </div>
            <div className="bg-accent-orange p-8 rounded-2xl text-background card-hover">
              <Trophy size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-3">Guaranteed Results</h3>
              <p className="text-background/90">
                We guarantee your child will master ALL skills and vocabulary specified by Cambridge. 95% exam pass rate with 4-5 shields.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="section-padding gradient-yellow-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What's Included in Every Course
          </h2>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600"
                alt="Children using tablets for learning"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4">
              {[
                "Student Learning App with Quizzes",
                "AI Progress Reports & Parent Dashboard",
                "Online & Offline Homework",
                "Small Classes (Max 12 Students)",
                "Interactive Tools (Kahoot, Blooket, Wordwall)",
                "Cambridge Exam Preparation",
                "Free Monthly Science Events",
                "2 Sessions/Week (1.5 Hours Each)",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="text-accent-teal flex-shrink-0 mt-1" size={24} />
                  <span className="text-lg">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Learning Pathway */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Your Child's Learning Journey
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border-2 border-muted rounded-2xl">
                <div className="text-4xl font-bold text-primary mb-2">Stage 2</div>
                <div className="text-lg font-semibold mb-2">Pre-A1 Starters</div>
                <div className="w-16 h-16 mx-auto bg-accent-pink/20 rounded-full flex items-center justify-center mb-3">
                  <Trophy className="text-accent-pink" size={32} />
                </div>
                <p className="text-sm text-muted-foreground">Official Cambridge Test Center</p>
              </div>
              <div className="text-center p-6 border-2 border-muted rounded-2xl">
                <div className="text-4xl font-bold text-primary mb-2">Stage 4</div>
                <div className="text-lg font-semibold mb-2">A1 Movers</div>
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-3">
                  <Trophy className="text-primary" size={32} />
                </div>
                <p className="text-sm text-muted-foreground">Official Cambridge Test Center</p>
              </div>
              <div className="text-center p-6 border-2 border-muted rounded-2xl">
                <div className="text-4xl font-bold text-primary mb-2">Stage 6</div>
                <div className="text-lg font-semibold mb-2">A2 Flyers</div>
                <div className="w-16 h-16 mx-auto bg-accent-teal/20 rounded-full flex items-center justify-center mb-3">
                  <Trophy className="text-accent-teal" size={32} />
                </div>
                <p className="text-sm text-muted-foreground">Official Cambridge Test Center</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-padding bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <RollingNumber
                end={95}
                suffix="%"
                className="text-5xl font-bold text-primary mb-2"
              />
              <div className="text-lg">Exam Pass Rate</div>
            </div>
            <div>
              <RollingNumber
                end={12}
                className="text-5xl font-bold text-primary mb-2"
              />
              <div className="text-lg">Max Class Size</div>
            </div>
            <div>
              <RollingNumber
                end={2022}
                className="text-5xl font-bold text-primary mb-2"
              />
              <div className="text-lg">Established</div>
            </div>
            <div>
              <RollingNumber
                end={100}
                suffix="%"
                className="text-5xl font-bold text-primary mb-2"
              />
              <div className="text-lg">Parent Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Location CTA */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-xl h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.8639290869737!2d105.74216931540344!3d21.037128292795653!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313454c7e1e6c1eb%3A0x7e54c8c9e0c6c8c9!2sSmart%20City!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="HeroSchool Location"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Visit Our Center in Smart City</h2>
              <div className="flex items-start gap-3">
                <MapPin className="text-primary flex-shrink-0 mt-1" size={24} />
                <p className="text-lg">
                  Smart City, i4 Building Imperia<br />
                  Nam Từ Liêm District, Hanoi
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" variant="outline" className="border-2 border-primary">
                  <a href="https://maps.app.goo.gl/XPkZoxFgtEG5aCbe9" target="_blank" rel="noopener noreferrer">
                    View on Google Maps
                  </a>
                </Button>
                <Button asChild size="lg">
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Ready to Get Started?</h2>
          <Button asChild size="lg" variant="secondary" className="rounded-full text-lg px-8">
            <Link to="/contact">Book Your FREE Trial Class Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
