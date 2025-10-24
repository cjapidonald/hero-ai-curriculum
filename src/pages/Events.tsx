import { Link } from "react-router-dom";
import { Calendar, Clock, Users, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, FormEvent, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

interface EventRecord {
  id: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  max_participants: number | null;
  current_participants: number | null;
  price: number | null;
}

interface UpcomingEvent {
  title: string;
  date: string;
  time: string;
  ages: string;
  activities: string[];
  learning: string;
  spots: number;
  total: number;
  color: string;
}

const Events = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbEvents, setDbEvents] = useState<EventRecord[]>([]);

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select<EventRecord>("id, title, event_date, start_time, end_time, location, max_participants, current_participants, price")
        .eq("is_published", true)
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true });

      if (!error && data) {
        setDbEvents(data);
      }
    };
    fetchEvents();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const eventIndex = formData.get("event") as string;
    const selectedIndex = Number.parseInt(eventIndex, 10);

    // Get event ID from either database events or fallback to hardcoded
    const eventId =
      dbEvents.length > 0 && Number.isInteger(selectedIndex) ? dbEvents[selectedIndex]?.id ?? null : null;

    try {
      const { error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: eventId,
          parent_name: formData.get("parentName") as string,
          child_name: formData.get("childName") as string,
          child_age: Number.parseInt(formData.get("childAge") as string, 10),
          phone: formData.get("phone") as string,
          email: (formData.get("email") as string) || null,
          notes: (formData.get("notes") as string) || null,
        });

      if (error) throw error;

      toast({
        title: "Registration successful!",
        description: "We'll send you a confirmation via Zalo soon.",
      });

      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast({
        title: "Error registering",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingEvents: UpcomingEvent[] = useMemo(
    () => [
    {
      title: "🌈 FUN WITH COLORS",
      date: "Saturday, March 15, 2025",
      time: "10:00 AM - 11:30 AM",
      ages: "5-8",
      activities: [
        "Mix primary colors to create new colors",
        "Light refraction with prisms",
        "Make rainbow milk with dish soap",
        "Color-changing science magic"
      ],
      learning: "How light works, color theory, chemical reactions",
      spots: 5,
      total: 20,
      color: "gradient-pink"
    },
    {
      title: "🧲 MAGNETIC MAGIC",
      date: "Saturday, March 22, 2025",
      time: "2:00 PM - 3:30 PM",
      ages: "6-10",
      activities: [
        "Test which objects are magnetic",
        "Build a magnetic maze",
        "Make a compass from household items",
        "Magnetic slime experiment"
      ],
      learning: "Magnetism, north/south poles, magnetic fields",
      spots: 12,
      total: 20,
      color: "gradient-teal"
    },
    {
      title: "🌋 EXPLODING VOLCANOES",
      date: "Saturday, March 29, 2025",
      time: "10:00 AM - 11:30 AM",
      ages: "7-12",
      activities: [
        "Build miniature volcanoes",
        "Create 'lava' using baking soda and vinegar",
        "Learn about real volcanoes around the world",
        "Make eruption predictions"
      ],
      learning: "Chemical reactions, geology, pressure and gases",
      spots: 0,
      total: 20,
      color: "bg-accent-orange"
    }
  ],
    [],
  );

  const todaysDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const availableEvents = dbEvents.length > 0
    ? dbEvents
    : upcomingEvents.filter((event) => event.spots > 0);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-accent-pink/20 via-primary/20 to-accent-teal/20 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-accent-pink/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-accent-teal/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
            Science, Discovery & Fun - Open to All!
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            Free Monthly Events for Kids | Ages 5-12 | No Enrollment Required
          </p>
          <Button asChild size="lg" className="rounded-full">
            <a href="#events">See Upcoming Events</a>
          </Button>
        </div>
      </section>

      {/* Why Free Events */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            Learning Happens Everywhere
          </h2>
          <p className="text-center text-lg mb-12 max-w-3xl mx-auto">
            Our monthly science events give children in Smart City the chance to explore, create, and discover—all in English!
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="text-5xl mb-3">🔬</div>
              <h3 className="font-bold mb-2">Hands-On Science</h3>
              <p className="text-sm text-muted-foreground">Real experiments, real learning</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-3">🎨</div>
              <h3 className="font-bold mb-2">Creativity & Problem-Solving</h3>
              <p className="text-sm text-muted-foreground">Think outside the box</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-3">👥</div>
              <h3 className="font-bold mb-2">Make Friends</h3>
              <p className="text-sm text-muted-foreground">English-speaking environment</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-3">😊</div>
              <h3 className="font-bold mb-2">Build Confidence</h3>
              <p className="text-sm text-muted-foreground">Try new things in a safe space</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" className="section-padding gradient-yellow-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Upcoming Events - Register Now!
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                className={`${event.color} p-6 rounded-2xl text-background border-2 border-transparent hover:border-foreground transition-all card-hover`}
              >
                <h3 className="text-2xl font-bold mb-3">{event.title}</h3>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>Ages {event.ages}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="font-semibold mb-2">What we'll do:</p>
                  <ul className="text-sm space-y-1">
                    {event.activities.map((activity, i) => (
                      <li key={i}>• {activity}</li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <p className="font-semibold mb-1">Kids will learn:</p>
                  <p className="text-sm">{event.learning}</p>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Capacity:</span>
                    <span>{event.spots > 0 ? `${event.spots} spots left!` : 'SOLD OUT'}</span>
                  </div>
                  <div className="w-full bg-background/30 rounded-full h-2">
                    <div
                      className="bg-background h-2 rounded-full transition-all"
                      style={{ width: `${((event.total - event.spots) / event.total) * 100}%` }}
                    />
                  </div>
                </div>
                <Button
                  asChild={event.spots > 0}
                  disabled={event.spots === 0}
                  className="w-full"
                  variant={event.spots === 0 ? "secondary" : "default"}
                >
                  {event.spots > 0 ? (
                    <a href="#register">Register Now</a>
                  ) : (
                    <span>Join Waitlist</span>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-muted p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-6 text-center">Event Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary" />
                <div>
                  <div className="font-semibold">Frequency</div>
                  <div className="text-sm text-muted-foreground">1 event per month</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-primary" />
                <div>
                  <div className="font-semibold">Duration</div>
                  <div className="text-sm text-muted-foreground">90 minutes</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="text-primary" />
                <div>
                  <div className="font-semibold">Capacity</div>
                  <div className="text-sm text-muted-foreground">20 children per event</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary" />
                <div>
                  <div className="font-semibold">Cost</div>
                  <div className="text-sm text-muted-foreground">FREE (materials provided)</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary text-2xl">🎯</span>
                <div>
                  <div className="font-semibold">Age Range</div>
                  <div className="text-sm text-muted-foreground">5-12 years old</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-primary" />
                <div>
                  <div className="font-semibold">Location</div>
                  <div className="text-sm text-muted-foreground">Smart City i4 Building</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="section-padding bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-background p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-6 text-center">Register for the Next Event</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="event">Event Selection *</Label>
                <select id="event" name="event" required className="w-full px-3 py-2 border border-input rounded-md bg-background">
                  <option value="">Select an event</option>
                  {/* Use database events if available, otherwise fallback to hardcoded */}
                  {availableEvents.map((event, index) => {
                    if ("event_date" in event) {
                      const eventDate = event.event_date ?? todaysDate;
                      return (
                        <option key={event.id} value={index}>
                          {event.title} - {eventDate}
                        </option>
                      );
                    }
                    return (
                      <option key={event.title} value={index}>
                        {event.title} - {event.date}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="childName">Child's Name *</Label>
                  <Input id="childName" name="childName" required />
                </div>
                <div>
                  <Label htmlFor="childAge">Child's Age *</Label>
                  <select id="childAge" name="childAge" required className="w-full px-3 py-2 border border-input rounded-md bg-background">
                    <option value="">Select age</option>
                    {[5, 6, 7, 8, 9, 10, 11, 12].map(age => (
                      <option key={age} value={age}>{age} years old</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentName">Parent Name *</Label>
                  <Input id="parentName" name="parentName" required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" name="phone" type="tel" required placeholder="0084 XXX XXX XXX" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div>
                <Label htmlFor="notes">Any allergies or special needs?</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="consent" name="consent" className="mt-1" />
                <Label htmlFor="consent" className="text-sm">
                  I consent to photos being taken for HeroSchool's social media
                </Label>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register Now"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Non-Students Welcome */}
      <section className="section-padding gradient-yellow-light">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center p-8 bg-background rounded-2xl border-4 border-primary">
            <div className="text-5xl mb-4">🎁</div>
            <h3 className="text-2xl font-bold mb-4">Not a HeroSchool student? No problem!</h3>
            <p className="text-lg">
              These events are open to the entire Smart City community. Come join the fun!
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Want Regular English Classes Too?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            If your child loves our events, imagine what they'll learn in our Cambridge curriculum courses!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/curriculum">View Curriculum</Link>
            </Button>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link to="/contact">Book Free Trial</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Events;
