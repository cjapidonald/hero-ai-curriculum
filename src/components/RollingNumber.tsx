import { useEffect, useRef, useState } from "react";

interface RollingNumberProps {
  end: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

const RollingNumber = ({ end, suffix = "", duration = 2000, className = "" }: RollingNumberProps) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);

      setCount(currentCount);

      if (progress >= 1) {
        clearInterval(timer);
        setCount(end);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [hasStarted, end, duration]);

  return (
    <div ref={elementRef} className={className}>
      {count}{suffix}
    </div>
  );
};

export default RollingNumber;
