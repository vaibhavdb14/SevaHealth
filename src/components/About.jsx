// import { useLanguage } from "@/contexts/LanguageContext";
// import { translations } from "@/translations";

// const About = () => {
//   const { language } = useLanguage();
//   const t = translations[language];

//   return (
//     <section className="py-20 bg-background">
//       <div className="container mx-auto px-4">
//         <div className="max-w-4xl mx-auto text-center">
//           <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
//             {t.about.title}
//           </h2>
//           <p className="text-lg text-muted-foreground leading-relaxed mb-6">
//             {t.about.paragraph1}
//           </p>
//           <p className="text-lg text-muted-foreground leading-relaxed">
//             {t.about.paragraph2} <span className="text-primary font-semibold">{t.about.seva}</span> {t.about.sevaDescription}, {t.about.paragraph3}
//           </p>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default About;


import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";

const About = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <section className="py-24 bg-gradient-to-b from-emerald-50/40 to-white">
      <div className="container mx-auto px-4">

        <div className="max-w-5xl mx-auto text-center space-y-6 animate-fadeIn">
          {/* Section Top Accent Line */}
          <div className="w-20 h-1 mx-auto bg-emerald-600 rounded-full mb-2"></div>

          <h2 className="text-4xl md:text-5xl font-extrabold text-emerald-900 tracking-tight">
            {t.about.title}
          </h2>

          <p className="text-lg md:text-xl text-emerald-800 leading-relaxed">
            {t.about.paragraph1}
          </p>

          <p className="text-lg md:text-xl text-emerald-800 leading-relaxed max-w-4xl mx-auto">
            {t.about.paragraph2}{" "}
            <span className="text-emerald-700 font-bold">{t.about.seva}</span>{" "}
            {t.about.sevaDescription}, {t.about.paragraph3}
          </p>
        </div>

        {/* Light Illustration Banner Under Text */}
        <div className="mt-12 flex justify-center">
          <img
            src="https://media.gettyimages.com/id/1435661952/photo/children-holding-a-planet-outdoors.jpg?s=612x612&w=0&k=20&c=IUjXFGVT3eIx8FbdI3Z-VpHCtHHzFqzhQ72HqLg74xs="
            alt="About SevaHealth"
            className="w-full max-w-4xl rounded-2xl shadow-lg border border-emerald-200"
          />
        </div>
      </div>
    </section>
  );
};

export default About;
