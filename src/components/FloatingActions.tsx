import { useState } from "react";
import { Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FloatingActions = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase
        .from('contact_submissions' as any)
        .insert({
          parent_name: formData.get('parentName') as string,
          child_name: formData.get('childName') as string,
          child_age: parseInt(formData.get('childAge') as string),
          phone: formData.get('phone') as string,
          email: (formData.get('email') as string) || null,
          english_level: (formData.get('level') as string) || null,
        });

      if (error) throw error;

      toast({
        title: "Trial booking submitted!",
        description: "We'll contact you within 24 hours via Zalo to schedule your free trial class.",
      });

      setIsDialogOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error submitting trial booking:', error);
      toast({
        title: "Error submitting booking",
        description: "Please try again or contact us directly via Zalo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Zalo Chat Button - Bottom Left */}
      <a
        href="https://zalo.me/0084981646304"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 group"
        aria-label="Chat on Zalo"
      >
        <div className="w-14 h-14 bg-accent-teal rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-pulse-slow">
          <MessageCircle size={28} className="text-background" />
        </div>
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-foreground text-background px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Chat on Zalo
        </span>
      </a>

      {/* Book Trial Button - Bottom Right */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Book Free Trial"
      >
        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-pulse-slow">
          <Calendar size={28} className="text-foreground" />
        </div>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Book FREE Trial
        </span>
      </button>

      {/* Quick Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">Book Your Free Trial</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="parentName">Parent/Guardian Name *</Label>
              <Input id="parentName" name="parentName" required placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="childName">Child's Name *</Label>
              <Input id="childName" name="childName" required placeholder="Child's name" />
            </div>
            <div>
              <Label htmlFor="childAge">Child's Age *</Label>
              <select
                id="childAge"
                name="childAge"
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select age</option>
                {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((age) => (
                  <option key={age} value={age}>
                    {age} years old
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="0084 XXX XXX XXX" />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" name="email" type="email" placeholder="your@email.com" />
            </div>
            <div>
              <Label htmlFor="level">Current English Level</Label>
              <select
                id="level"
                name="level"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select level</option>
                <option value="beginner">Complete beginner</option>
                <option value="some_english">Some English</option>
                <option value="confident">Confident speaker</option>
                <option value="unsure">Not sure</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingActions;
