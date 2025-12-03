import { useEffect, useState } from "react";
import { Users, Stethoscope, Building2, Heart } from "lucide-react";

const stats = [
  { icon: Heart, label: "Patients Helped", target: 500, suffix: "+" },
  { icon: Stethoscope, label: "Doctors Volunteering", target: 120, suffix: "+" },
  { icon: Building2, label: "NGOs Connected", target: 80, suffix: "+" },
  { icon: Users, label: "Lives Impacted", target: 2000, suffix: "+" },
];

const ImpactTracker = () => {
  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    stats.forEach((stat, index) => {
      let current = 0;
      const increment = stat.target / steps;

      const timer = setInterval(() => {
        current += increment;
        if (current >= stat.target) {
          current = stat.target;
          clearInterval(timer);
        }
        setCounts(prev => {
          const newCounts = [...prev];
          newCounts[index] = Math.floor(current);
          return newCounts;
        });
      }, interval);
    });
  }, []);

  return (
    <section className="py-20 gradient-hero">
      <div className="container mx-auto px-4">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Our Growing Impact
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Together, we're making healthcare accessible across India
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <stat.icon className="w-8 h-8 text-white" />
              </div>

              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {counts[index]}{stat.suffix}
              </div>

              <div className="text-sm md:text-base text-white/80 font-medium">
                {stat.label}
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactTracker;
