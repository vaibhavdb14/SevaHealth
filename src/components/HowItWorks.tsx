// import { UserPlus, Users, Stethoscope, Handshake, TrendingUp } from "lucide-react";
// import { Card } from "@/components/ui/card";
// import { useLanguage } from "@/contexts/LanguageContext";
// import { translations } from "@/translations";

// const stepIcons = [UserPlus, Users, Stethoscope, Handshake, TrendingUp];

// const HowItWorks = () => {
//   const { language } = useLanguage();
//   const t = translations[language];

//   return (
//     <section className="py-20 bg-muted/30">
//       <div className="container mx-auto px-4">
//         <div className="text-center mb-16">
//           <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
//             {t.howItWorks.title}
//           </h2>
//           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//             {t.howItWorks.subtitle}
//           </p>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
//           {t.howItWorks.steps.map((step, index) => {
//             const Icon = stepIcons[index];
//             return (
//               <Card key={index} className="p-6 text-center hover:shadow-soft transition-smooth bg-card border-border/50">
//                 <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
//                   <Icon className="w-8 h-8 text-primary" />
//                 </div>
//                 <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
//                   {index + 1}
//                 </div>
//                 <h3 className="text-lg font-semibold mb-2 text-foreground">{step.title}</h3>
//                 <p className="text-sm text-muted-foreground">{step.description}</p>
//               </Card>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default HowItWorks;

import { UserPlus, Users, Stethoscope, Handshake, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";

const stepIcons = [UserPlus, Users, Stethoscope, Handshake, TrendingUp];

const HowItWorks = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <section className="py-24 bg-gradient-to-b from-emerald-50/50 to-white">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-emerald-900 tracking-tight">
            {t.howItWorks.title}
          </h2>
          <p className="text-lg md:text-xl text-emerald-700 max-w-2xl mx-auto leading-relaxed">
            {t.howItWorks.subtitle}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {t.howItWorks.steps.map((step, index) => {
            const Icon = stepIcons[index];

            return (
              <div key={index} className="relative group">
                
                {/* Connector Line (Desktop Only) */}
                {index !== t.howItWorks.steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 right-[-40px] w-20 h-[2px] bg-emerald-300 group-hover:bg-emerald-500 transition-colors"></div>
                )}

                <Card
                  className="p-6 h-full text-center rounded-2xl bg-white/70 backdrop-blur shadow-md border border-emerald-100
                  hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                >
                  
                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-100 flex items-center justify-center 
                    animate-pulse-slow group-hover:scale-110 transition-transform">
                    <Icon className="w-10 h-10 text-emerald-700" />
                  </div>

                  {/* Step Number */}
                  <div className="w-9 h-9 mx-auto mb-3 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                    {index + 1}
                  </div>

                  <h3 className="text-xl font-semibold text-emerald-900 mb-2">
                    {step.title}
                  </h3>

                  <p className="text-sm text-emerald-700 leading-relaxed">
                    {step.description}
                  </p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes pulseSlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.07); }
        }
        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
