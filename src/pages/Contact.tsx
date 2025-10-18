import { Phone, Mail, MapPin, Facebook, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Contact = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/20 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
            Get in Touch with HeroSchool
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            We're Here to Help! Book a Trial | Ask Questions | Schedule a Tour
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="bg-muted p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-2">Send Us a Message</h2>
              <p className="text-sm text-muted-foreground mb-6">We'll respond within 24 hours</p>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                    <Input id="parentName" required />
                  </div>
                  <div>
                    <Label htmlFor="childName">Child's Name *</Label>
                    <Input id="childName" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="childAge">Child's Age *</Label>
                  <select id="childAge" required className="w-full px-3 py-2 border border-input rounded-md bg-background">
                    <option value="">Select age</option>
                    {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(age => (
                      <option key={age} value={age}>{age} years old</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="level">Current English Level</Label>
                  <select id="level" className="w-full px-3 py-2 border border-input rounded-md bg-background">
                    <option value="">Select level</option>
                    <option value="beginner">Complete beginner (no English)</option>
                    <option value="some">Some English (basic words)</option>
                    <option value="confident">Confident speaker (conversations)</option>
                    <option value="unsure">Not sure / Need assessment</option>
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" type="tel" required placeholder="+84 XXX XXX XXX" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" />
                  </div>
                </div>
                <div>
                  <Label>Preferred Contact Method *</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="contact" value="zalo" defaultChecked />
                      <span>📱 Zalo (fastest)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="contact" value="email" />
                      <span>📧 Email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="contact" value="phone" />
                      <span>☎️ Phone</span>
                    </label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="source">How did you hear about us?</Label>
                  <select id="source" className="w-full px-3 py-2 border border-input rounded-md bg-background">
                    <option value="">Select...</option>
                    <option>Facebook</option>
                    <option>Google search</option>
                    <option>Friend/family referral</option>
                    <option>Smart City community</option>
                    <option>Flyer/poster</option>
                    <option>Vinschool parent</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <Label>What are you interested in?</Label>
                  <div className="space-y-2 mt-2">
                    {["Book a free trial class", "Get curriculum information", "Schedule a center tour", "Register for events", "Ask about pricing", "Other questions"].map((item) => (
                      <label key={item} className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span className="text-sm">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Message/Questions *</Label>
                  <Textarea id="message" required rows={4} />
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="updates" className="mt-1" />
                  <Label htmlFor="updates" className="text-sm">
                    I agree to receive updates about courses and events from HeroSchool
                  </Label>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Map */}
              <div>
                <h3 className="text-2xl font-bold mb-4">Visit Our Center</h3>
                <div className="rounded-2xl overflow-hidden shadow-xl h-64 mb-4">
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
                <div className="bg-muted p-4 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <MapPin className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold">HeroSchool English Center</div>
                      <div className="text-sm">Smart City, i4 Building Imperia</div>
                      <div className="text-sm">Tây Mỗ, Nam Từ Liêm District</div>
                      <div className="text-sm">Hanoi, Vietnam</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    🚗 Free parking | 🏢 Near Imperia Garden, Vincom, Aeon Mall
                  </div>
                </div>
                <Button asChild className="w-full mt-4" variant="outline">
                  <a href="https://maps.app.goo.gl/XPkZoxFgtEG5aCbe9" target="_blank" rel="noopener noreferrer">
                    Get Directions
                  </a>
                </Button>
              </div>

              {/* Contact Details */}
              <div className="bg-muted p-6 rounded-2xl space-y-4">
                <h3 className="text-xl font-bold mb-4">Contact Details</h3>
                <a
                  href="https://zalo.me/0084981646304"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-accent-teal text-background rounded-xl hover:opacity-90 transition-opacity"
                >
                  <div className="text-2xl">📱</div>
                  <div>
                    <div className="font-semibold">Zalo (Fastest Response)</div>
                    <div className="text-sm">0084 981646304</div>
                  </div>
                </a>
                <div className="flex items-center gap-3 p-3 bg-background rounded-xl">
                  <Phone className="text-primary" />
                  <div>
                    <div className="font-semibold">Phone</div>
                    <div className="text-sm">0084 981646304</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background rounded-xl">
                  <Mail className="text-primary" />
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-sm">dcjapi@gmail.com</div>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="bg-muted p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4">Office Hours</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="font-medium">Monday - Friday</span>
                    <span>8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="font-medium">Saturday</span>
                    <span>8:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Sunday</span>
                    <span>By appointment</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  💡 Best time to visit: Weekday afternoons 2-5 PM (see classes in action!)
                </p>
              </div>

              {/* Social Media */}
              <div className="bg-muted p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4">Follow Us</h3>
                <div className="space-y-3">
                  <a
                    href="https://www.youtube.com/@Heroenglish-q1y"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-background rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <Youtube className="text-destructive" size={24} />
                    <div>
                      <div className="font-semibold">YouTube</div>
                      <div className="text-xs text-muted-foreground">@Heroenglish-q1y</div>
                    </div>
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61552900374349"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-background rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <Facebook className="text-primary" size={24} />
                    <div>
                      <div className="font-semibold">Facebook</div>
                      <div className="text-xs text-muted-foreground">HeroSchool Vietnam</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding gradient-yellow-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Quick Answers</h2>
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            <AccordionItem value="trial">
              <AccordionTrigger>Do you offer trial classes?</AccordionTrigger>
              <AccordionContent>
                Yes! First class is FREE. We'll assess your child's level and recommend the right stage.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="missed">
              <AccordionTrigger>What if my child misses a class?</AccordionTrigger>
              <AccordionContent>
                Makeup classes available with 24-hour notice. All materials are posted in the student app.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="observe">
              <AccordionTrigger>Can I observe my child's class?</AccordionTrigger>
              <AccordionContent>
                Absolutely! Parents welcome anytime. We recommend observing the first few classes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ready">
              <AccordionTrigger>How long until my child is exam-ready?</AccordionTrigger>
              <AccordionContent>
                Most children complete each stage in 9-12 months with regular attendance. Our AI tracks exact progress.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="class-size">
              <AccordionTrigger>What's your maximum class size?</AccordionTrigger>
              <AccordionContent>
                12 students maximum, guaranteed. Most classes have 8-10 students.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default Contact;
