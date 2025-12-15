// import { useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   Stethoscope,
//   Building2,
//   HeartPulse,
//   Heart,
//   MessageCircle,
//   X,
// } from "lucide-react";

// import HeroSection from "@/components/HeroSection";
// import About from "@/components/About";
// import HowItWorks from "@/components/HowItWorks";
// // ❌ removed old UserCategories + BenefitsSection imports
// import ImpactTracker from "@/components/ImpactTracker";
// import Footer from "@/components/Footer";
// import LanguageToggle from "@/components/LanguageToggle";
// import sevaLogo from "@/assets/seva-logo-teal.png";
// import { useLanguage } from "@/contexts/LanguageContext";
// import { translations } from "@/translations";

// // Feedback modal (shadcn)
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";

// // Firestore
// import { db } from "../firebaseConfig";
// import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// const Index = () => {
//   const { language } = useLanguage();
//   const t = translations[language];

//   const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
//   const [rating, setRating] = useState(0);
//   const [hoverRating, setHoverRating] = useState(0);
//   const [message, setMessage] = useState("");
//   const [email, setEmail] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const ratingLabels = ["Very Bad", "Bad", "Okay", "Good", "Awesome"];

//   const currentLabel =
//     (hoverRating && ratingLabels[hoverRating - 1]) ||
//     (rating && ratingLabels[rating - 1]) ||
//     "";

//   const showEmailField = message.trim().length > 0;

//   const handleFeedbackSubmit = async (e) => {
//     e.preventDefault();

//     if (rating === 0 && !message.trim()) {
//       alert("Please select at least a rating or write a message.");
//       return;
//     }

//     if (message.trim() && !email.trim()) {
//       alert("Please enter your email so we can respond to your feedback.");
//       return;
//     }

//     try {
//       setIsSubmitting(true);

//       await addDoc(collection(db, "feedback"), {
//         rating,
//         message: message.trim() || null,
//         email: message.trim() ? email.trim() : null,
//         createdAt: serverTimestamp(),
//       });

//       setRating(0);
//       setHoverRating(0);
//       setMessage("");
//       setEmail("");
//       setIsFeedbackOpen(false);
//       alert("Thank you for your feedback! 💚");
//     } catch (error) {
//       console.error("Error saving feedback:", error);
//       alert("Something went wrong while sending your feedback.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       {/* HEADER */}
//       <header className="sticky top-0 left-0 right-0 z-50 bg-[#e6f4f2] border-b border-primary/10">
//         <div className="container mx-auto px-4 py-3 flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             <img src={sevaLogo} alt="SevaHealth" className="h-10" />
//             {/* subtle app name for extra clarity on light bg */}
//             <span className="hidden sm:inline text-lg font-semibold text-emerald-900">
//               SevaHealth
//             </span>
//           </div>

//           <div className="flex items-center gap-4">
//             <LanguageToggle />
//             <a
//               href="/auth"
//               className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full font-medium shadow-soft transition-smooth"
//             >
//               {t.common.login}
//             </a>
//           </div>
//         </div>
//       </header>

//       {/* HERO (existing component) */}
//       <HeroSection />

//       {/* NEW: simplified role chooser with icons (replaces old big cards) */}
//       <section className="py-14 bg-background">
//         <div className="container mx-auto px-4">
//           <div className="text-center mb-10">
//             <p className="text-sm font-medium tracking-wide text-emerald-700 uppercase">
//               Start your Seva journey
//             </p>
//             <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-3">
//               Choose how you want to contribute
//             </h2>
//             <p className="text-muted-foreground max-w-2xl mx-auto">
//               Whether you&apos;re a doctor, an NGO, or a patient seeking help,
//               SevaHealth gives you a dedicated space to connect and collaborate.
//             </p>
//           </div>

//           <div className="grid gap-4 md:flex md:justify-center">
//             {/* Doctor */}
//             <Link
//               to="/auth?role=doctor"
//               className="flex items-center justify-center gap-3 bg-card border border-emerald-100 rounded-full px-6 py-3 shadow-card hover:shadow-soft transition-smooth"
//             >
//               <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
//                 <Stethoscope className="w-5 h-5 text-emerald-700" />
//               </span>
//               <span className="font-medium text-emerald-900">Join as Doctor</span>
//             </Link>

//             {/* NGO */}
//             <Link
//               to="/auth?role=ngo"
//               className="flex items-center justify-center gap-3 bg-card border border-emerald-100 rounded-full px-6 py-3 shadow-card hover:shadow-soft transition-smooth"
//             >
//               <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
//                 <Building2 className="w-5 h-5 text-emerald-700" />
//               </span>
//               <span className="font-medium text-emerald-900">Join as NGO</span>
//             </Link>

//             {/* Patient */}
//             <Link
//               to="/auth?role=patient"
//               className="flex items-center justify-center gap-3 bg-card border border-emerald-100 rounded-full px-6 py-3 shadow-card hover:shadow-soft transition-smooth"
//             >
//               <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
//                 <HeartPulse className="w-5 h-5 text-emerald-700" />
//               </span>
//               <span className="font-medium text-emerald-900">
//                 Join as Patient
//               </span>
//             </Link>
//           </div>
//         </div>
//       </section>

//       {/* Existing sections – unchanged */}
//       <About />
//       <HowItWorks />
//       {/* UserCategories + BenefitsSection removed as per your request */}
//       <ImpactTracker />

//       {/* FEEDBACK CARD SECTION */}
//       <section className="py-16 bg-muted/40">
//         <div className="container mx-auto px-4">
//           <div className="max-w-3xl mx-auto">
//             <div className="bg-card border border-emerald-100 rounded-2xl p-6 md:p-8 shadow-soft flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
//               <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50">
//                 <MessageCircle className="w-6 h-6 text-emerald-700" />
//               </div>
//               <div className="flex-1">
//                 <h3 className="text-xl font-semibold text-emerald-900">
//                   Help us make SevaHealth better
//                 </h3>
//                 <p className="text-sm text-muted-foreground mt-1">
//                   Share your experience, suggest improvements, or just tell us
//                   how you feel. Your feedback directly shapes the platform.
//                 </p>
//               </div>
//               <Button
//                 className="rounded-full mt-2 md:mt-0"
//                 variant="default"
//                 onClick={() => setIsFeedbackOpen(true)}
//               >
//                 Share Feedback
//               </Button>
//             </div>
//           </div>
//         </div>
//       </section>

//       <Footer />

//       {/* FEEDBACK POPUP */}
//       <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
//         <DialogContent className="max-w-lg">
//           <DialogHeader className="flex flex-row items-start justify-between gap-2">
//             <DialogTitle className="text-xl font-semibold">
//               Share your feedback
//             </DialogTitle>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="rounded-full"
//               onClick={() => setIsFeedbackOpen(false)}
//             >
//               <X className="w-4 h-4" />
//             </Button>
//           </DialogHeader>

//           <form onSubmit={handleFeedbackSubmit} className="space-y-6 mt-2">
//             {/* Hearts rating */}
//             <div className="space-y-2">
//               <p className="text-sm font-medium text-foreground">
//                 How was your experience with SevaHealth?
//               </p>
//               <div className="flex items-center gap-2">
//                 {[1, 2, 3, 4, 5].map((value) => {
//                   const active = (hoverRating || rating) >= value;
//                   return (
//                     <button
//                       key={value}
//                       type="button"
//                       onMouseEnter={() => setHoverRating(value)}
//                       onMouseLeave={() => setHoverRating(0)}
//                       onClick={() => setRating(value)}
//                       className="p-1.5 rounded-full transition-transform hover:scale-110"
//                     >
//                       <Heart
//                         className={`w-7 h-7 ${
//                           active
//                             ? "text-red-500 fill-red-500"
//                             : "text-emerald-600"
//                         }`}
//                       />
//                     </button>
//                   );
//                 })}
//               </div>
//               {currentLabel && (
//                 <p className="text-xs font-medium text-muted-foreground">
//                   {currentLabel}
//                 </p>
//               )}
//             </div>

//             {/* Message */}
//             <div className="space-y-2">
//               <label className="text-sm font-medium text-foreground">
//                 Message (optional)
//               </label>
//               <Textarea
//                 placeholder="Tell us a bit about what worked well or what could be better..."
//                 rows={4}
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//               />
//             </div>

//             {/* Email – only if message is filled */}
//             {showEmailField && (
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-foreground">
//                   Email (required if you wrote a message)
//                 </label>
//                 <Input
//                   type="email"
//                   placeholder="your@email.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                 />
//               </div>
//             )}

//             <DialogFooter className="flex justify-between items-center gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="rounded-full"
//                 onClick={() => setIsFeedbackOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 className="rounded-full"
//                 disabled={isSubmitting}
//               >
//                 {isSubmitting ? "Sending..." : "Submit Feedback"}
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default Index;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  Building2,
  HeartPulse,
  Heart,
  MessageCircle,
  X,
} from "lucide-react";

import About from "@/components/About";
import HowItWorks from "@/components/HowItWorks";
import ImpactTracker from "@/components/ImpactTracker";
import Footer from "@/components/Footer";
import LanguageToggle from "@/components/LanguageToggle";
import sevaLogo from "@/assets/seva-logo-teal.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { db } from "../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const backgroundImages = [
  "/src/assets/image1.jpeg",
  "/src/assets/image2.jpeg",
  "/src/assets/image3.jpeg",
];

const Index = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const ratingLabels = ["Very Bad", "Bad", "Okay", "Good", "Awesome"];
  const currentLabel =
    (hoverRating && ratingLabels[hoverRating - 1]) ||
    (rating && ratingLabels[rating - 1]) ||
    "";
  const showEmailField = message.trim().length > 0;

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0 && !message.trim()) {
      alert("Please select at least a rating or write a message.");
      return;
    }

    if (message.trim() && !email.trim()) {
      alert("Please enter your email so we can respond to your feedback.");
      return;
    }

    try {
      setIsSubmitting(true);

      await addDoc(collection(db, "feedback"), {
        rating,
        message: message.trim() || null,
        email: message.trim() ? email.trim() : null,
        createdAt: serverTimestamp(),
      });

      setRating(0);
      setHoverRating(0);
      setMessage("");
      setEmail("");
      setIsFeedbackOpen(false);
      alert("Thank you for your feedback! 💚");
    } catch (error) {
      console.error("Error saving feedback:", error);
      alert("Something went wrong while sending your feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-r from-teal-800 to-teal-600 shadow-lg border-b border-teal-900/30">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <img
              src={sevaLogo}
              alt="SevaHealth"
              className="h-10 drop-shadow-md"
            />
          </div>

          {/* CONTROLS */}
          <div className="flex items-center gap-4">
            <div className="text-white">
              <LanguageToggle />
            </div>

            <a
              href="/auth"
              className="bg-white text-emerald-700 font-medium rounded-full px-6 py-2 shadow-md hover:bg-emerald-100 transition-smooth"
            >
              {t.common.login}
            </a>
          </div>
        </div>
      </header>

      <section
        className="w-full h-[80vh] flex flex-col justify-center items-center text-center px-4 transition-all duration-700"
        style={{
          backgroundImage: `url(${backgroundImages[currentIndex]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <span className="bg-white/40 text-primary font-medium backdrop-blur px-5 py-2 rounded-full">
          ❤️ Healthcare Seva for All
        </span>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white mt-6 leading-tight drop-shadow-lg">
          Bridging the Gap Between
          <br />
          Those Who Can Help and
          <br />
          Those Who Need Care
        </h1>

        <p className="text-lg text-white/90 max-w-2xl mt-6 drop-shadow">
          A unified healthcare seva network connecting doctors, NGOs & patients.
        </p>
      </section>

      {/* ROLE BUTTONS (unchanged except styling) */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-medium tracking-wide text-emerald-700 uppercase">
              Start your Seva journey
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
              Choose how you want to contribute
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {/* Doctor Button */}
            <Link
              to="/doctor-portal"
              className="flex items-center justify-center gap-4 bg-white border border-emerald-300
        rounded-full px-10 py-4 text-lg shadow-lg hover:shadow-emerald-300/50 hover:bg-emerald-50
        transition-all duration-300 group"
            >
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100
        group-hover:bg-emerald-200 transition"
              >
                <Stethoscope className="w-6 h-6 text-emerald-700" />
              </span>
              <span className="font-semibold text-emerald-800">
                Join as Doctor
              </span>
            </Link>

            {/* NGO Button */}
            <Link
              to="/ngo-portal"
              className="flex items-center justify-center gap-4 bg-white border border-emerald-300
        rounded-full px-10 py-4 text-lg shadow-lg hover:shadow-emerald-300/50 hover:bg-emerald-50
        transition-all duration-300 group"
            >
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100
        group-hover:bg-emerald-200 transition"
              >
                <Building2 className="w-6 h-6 text-emerald-700" />
              </span>
              <span className="font-semibold text-emerald-800">
                Join as NGO
              </span>
            </Link>

            {/* Patient Button */}
            <Link
              to="/patient-portal"
              className="flex items-center justify-center gap-4 bg-white border border-emerald-300
        rounded-full px-10 py-4 text-lg shadow-lg hover:shadow-emerald-300/50 hover:bg-emerald-50
        transition-all duration-300 group"
            >
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100
        group-hover:bg-emerald-200 transition"
              >
                <HeartPulse className="w-6 h-6 text-emerald-700" />
              </span>
              <span className="font-semibold text-emerald-800">
                Join as Patient
              </span>
            </Link>
          </div>
        </div>
      </section>

      <About />
      <HowItWorks />
      <ImpactTracker />

      {/*FEEDBACK CARD SECTION */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-emerald-100 rounded-2xl p-6 md:p-8 shadow-soft flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50">
                <MessageCircle className="w-6 h-6 text-emerald-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-emerald-900">
                  Help us make SevaHealth better
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Share your experience, suggest improvements, or just tell us
                  how you feel. Your feedback directly shapes the platform.
                </p>
              </div>
              <Button
                className="rounded-full mt-2 md:mt-0"
                variant="default"
                onClick={() => setIsFeedbackOpen(true)}
              >
                Share Feedback
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      {/* FEEDBACK POPUP */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="flex flex-row items-start justify-between gap-2">
            <DialogTitle className="text-xl font-semibold">
              Share your feedback
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFeedbackSubmit} className="space-y-6 mt-2">
            {/* Hearts rating */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                How was your experience with SevaHealth?
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = (hoverRating || rating) >= value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(value)}
                      className="p-1.5 rounded-full transition-transform hover:scale-110"
                    >
                      <Heart
                        className={`w-7 h-7 ${
                          active
                            ? "text-red-500 fill-red-500"
                            : "text-emerald-600"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {currentLabel && (
                <p className="text-xs font-medium text-muted-foreground">
                  {currentLabel}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Message (optional)
              </label>
              <Textarea
                placeholder="Tell us a bit about what worked well or what could be better..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            {/* Email – only if message is filled */}
            {showEmailField && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email (required if you wrote a message)
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            <DialogFooter className="flex justify-between items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setIsFeedbackOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
