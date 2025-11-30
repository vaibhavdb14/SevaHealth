import { Heart, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6" />
              <span className="text-xl font-bold">SevaHealth</span>
            </div>
            <p className="text-sm opacity-90">
              Connecting healthcare providers and seekers across India for affordable, accessible medical care.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="/" className="hover:opacity-100 transition-smooth">Home</Link></li>
              <li><Link to="/doctor-portal" className="hover:opacity-100 transition-smooth">Doctor Portal</Link></li>
              <li><Link to="/ngo-portal" className="hover:opacity-100 transition-smooth">NGO Portal</Link></li>
              <li><Link to="/patient-portal" className="hover:opacity-100 transition-smooth">Patient Portal</Link></li>
              <li><Link to="/contact" className="hover:opacity-100 transition-smooth">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li><a href="#" className="hover:opacity-100 transition-smooth">Privacy Policy</a></li>
              <li><a href="#" className="hover:opacity-100 transition-smooth">Terms of Service</a></li>
              <li><a href="#" className="hover:opacity-100 transition-smooth">Cookie Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>contact@sevahealth.org</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+91 XXX XXX XXXX</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Mumbai, India</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-6 text-center text-sm opacity-90">
          <p>© 2025 SevaHealth. All rights reserved. Made with ❤️ for accessible healthcare.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
