import { useState } from "react";
import { Calendar, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FloatingActions = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic here
    alert("Thank you! We'll contact you within 24 hours.");
    setIsDialogOpen(false);
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
              <Label htmlFor="name">Parent/Guardian Name *</Label>
              <Input id="name" required placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" type="tel" required placeholder="0084 XXX XXX XXX" />
            </div>
            <div>
              <Label htmlFor="age">Child's Age *</Label>
              <select
                id="age"
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
            <Button type="submit" className="w-full">
              Submit Request
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingActions;
