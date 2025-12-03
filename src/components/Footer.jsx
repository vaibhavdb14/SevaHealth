// 

import React, { useState } from 'react';
import { Heart, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

// --- POLICY CONTENT DATA ---
// NOTE: Replace the content here with your actual legal text.
const policyContent = {
    privacy: {
        title: "Privacy Policy",
        content: (
            <div className="space-y-4">
                <p>We value your privacy. We collect basic information such as your name, email, and interactions with our website to provide and improve our services. We also gather non-personal data like device details, pages visited, and IP address for analytics and security.</p>
                <p>We use this information to operate SevaHealth, improve user experience, respond to inquiries, and maintain site safety. We do not sell your data. We may share information with trusted service providers or if required by law.</p>
                <p>We take reasonable steps to protect your information but cannot guarantee full security. SevaHealth is not intended for users under 13. You may contact us anytime to access, update, or request deletion of your information.</p>
                <p className="text-xs text-gray-500">Last Updated: December 2025</p>
            </div>
        )
    },
    terms: {
        title: "Terms of Service",
        content: (
            <div className="space-y-4">
                <p>By using SevaHealth, you agree to these Terms. SevaHealth provides general health information and an AI-based assistant for educational purposes only. The platform does not offer medical advice, diagnosis, or treatment. For medical issues, please consult a qualified healthcare professional.</p>
                <p>You agree to use the site responsibly and not engage in harmful, unlawful, or disruptive activities. All content on SevaHealth, including branding, text, and design, belongs to us and cannot be copied or reused without permission.</p>
                <p>We are not responsible for decisions made based on the information on our platform. Your use of SevaHealth is at your own risk. We may update or terminate services at any time.</p>
                <p>By accessing or using our service, you agree to be bound by these terms. Unauthorized use is strictly prohibited.</p>
            </div>
        )
    },
    cookie: {
        title: "Cookie Policy",
        content: (
            <div className="space-y-4">
                <p>We use essential and analytics cookies to enhance your experience on SevaHealth and improve our service delivery.</p>
                <p>We use essential cookies for security, analytics cookies to understand website performance, and functional cookies to save settings like language or theme. Some third-party services used on our site may also place their own cookies.</p>
                <p>You can manage your cookie preferences through your browser settings.</p>
            </div>
        )
    }
};
// ----------------------------

const Footer = () => {
    // State to manage the visibility of the modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    // State to hold the content currently displayed in the modal
    const [modalData, setModalData] = useState({ title: '', content: null });

    // Function to handle the click on a legal link
    const handleLinkClick = (policyKey) => {
        const data = policyContent[policyKey];
        if (data) {
            setModalData(data);
            setIsModalOpen(true); // Show the modal
        }
    };

    // Function to close the modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Prevent closing the modal when clicking inside the content box
    const handleModalContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        <>
            {/* -------------------- START Footer Component -------------------- */}
            <footer className="bg-primary text-primary-foreground py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Company Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="w-6 h-6" />
                                <span className="text-xl font-bold">SevaHealth</span>
                            </div>
                            <p className="text-sm opacity-90">
                                Connecting healthcare providers and seekers across India for affordable, accessible medical care.
                            </p>
                        </div>
                        
                        {/* Quick Links */}
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
                        
                        {/* Legal Links (MODIFIED) */}
                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm opacity-90">
                                {/* Changed <a> to <li> and added onClick handlers */}
                                <li 
                                    className="cursor-pointer hover:opacity-100 transition-smooth"
                                    onClick={() => handleLinkClick('privacy')}
                                >
                                    Privacy Policy
                                </li>
                                <li 
                                    className="cursor-pointer hover:opacity-100 transition-smooth"
                                    onClick={() => handleLinkClick('terms')}
                                >
                                    Terms of Service
                                </li>
                                <li 
                                    className="cursor-pointer hover:opacity-100 transition-smooth"
                                    onClick={() => handleLinkClick('cookie')}
                                >
                                    Cookie Policy
                                </li>
                            </ul>
                        </div>
                        
                        {/* Contact Info */}
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
                    
                    {/* Copyright */}
                    <div className="border-t border-white/20 pt-6 text-center text-sm opacity-90">
                        <p>© 2025 SevaHealth. All rights reserved. Made with ❤️ for accessible healthcare.</p>
                    </div>
                </div>
            </footer>
            {/* -------------------- END Footer Component -------------------- */}


            {/* -------------------- START Modal/Popup Component -------------------- */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={closeModal} // Close on clicking outside
                >
                    <div 
                        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative p-6 md:p-8"
                        onClick={handleModalContentClick} // Prevent close on clicking inside
                    >
                        {/* Close Button (X) */}
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-teal-600 transition-colors text-3xl font-bold leading-none"
                            onClick={closeModal}
                        >
                            &times;
                        </button>

                        {/* Modal Header (Teal Style) */}
                        <h2 className="text-2xl font-bold text-teal-600 border-b-2 border-teal-600 pb-3 mb-6">
                            {modalData.title}
                        </h2>

                        {/* Modal Body (Content) */}
                        <div className="text-gray-700">
                            {modalData.content}
                        </div>
                    </div>
                </div>
            )}
            {/* -------------------- END Modal/Popup Component -------------------- */}
        </>
    );
};

export default Footer;