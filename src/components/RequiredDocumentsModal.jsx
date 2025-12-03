import React from 'react';
import ReactDOM from 'react-dom';

// --- DOCUMENT CONTENT MAP ---
// Updated content + added “User Stamp/Seal” requirement for all roles
const DOCUMENT_CONTENT_MAP = {
    patient: {
        title: "Documents Required for Patients",
        content: (
            <div className="space-y-6">
                <p className="text-gray-700 mb-4">
                    Please keep the following documents ready to ensure smooth consultation, accurate medical history tracking, and faster NGO assistance:
                </p>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-lg mb-2 text-teal-700">1. Identity Verification</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                        <li><strong>Primary ID:</strong> Aadhaar Card / Voter ID / Passport.</li>
                        <li><strong>Contact Proof:</strong> Active Mobile Number for OTP and updates.</li>
                        <li><strong>Patient Stamp/Seal:</strong> Mandatory for identity validation since many photo prescriptions are not accepted.</li>
                    </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-lg mb-2 text-teal-700">2. Medical Records</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                        <li>Previous prescriptions and treatment notes.</li>
                        <li>Diagnostic reports (Blood tests, X-ray, MRI, CT, sonography) from the last 6–12 months.</li>
                        <li>Ongoing medication list or treatment plan.</li>
                    </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-lg mb-2 text-teal-700">3. NGO Assistance (If applicable)</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                        <li>Income Certificate or BPL Card.</li>
                        <li>Local address verification (electricity bill, rent agreement).</li>
                        <li>Referral letter if you were directed by a social worker.</li>
                    </ul>
                </div>
            </div>
        )
    },

    doctor: {
        title: "Documents Required for Doctors",
        content: (
            <div className="space-y-6">
                <p className="text-gray-700 mb-4">
                    To verify your credentials and activate your SevaHealth doctor portal, please upload the following documents:
                </p>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-lg mb-2 text-teal-700">1. Professional Credentials (Mandatory)</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                        <li>MBBS / MD / MS degree certificate.</li>
                        <li>Valid Medical Council Registration (MCI/SMC).</li>
                        <li>Government Photo ID (Aadhaar / Passport).</li>
                        <li><strong>Doctor’s Official Stamp/Seal:</strong> Mandatory to validate digital prescriptions and avoid rejection.</li>
                    </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-lg mb-2 text-teal-700">2. Practice & Professional Details</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                        <li>Specialization certificates (MD, MS, DNB, Fellowship).</li>
                        <li>Clinic/Hospital address proof (Utility bill or Registration proof).</li>
                        <li>Experience certificates or previous work credentials (optional but recommended).</li>
                    </ul>
                </div>
            </div>
        )
    },

    ngo: {
        title: "Documents Required for NGOs",
        content: (
            <div className="space-y-6">
                <p className="text-gray-700 mb-4">
                    To collaborate with SevaHealth for healthcare support programs, please provide the following organizational documents:
                </p>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-lg mb-2 text-teal-700">1. Registration & Legal Compliance</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                        <li>NGO Registration Certificate (Society/Trust/Section 8).</li>
                        <li>PAN of the organization.</li>
                        <li>12A & 80G certificates (if applicable).</li>
                        <li><strong>Authorized Stamp/Seal of NGO:</strong> Required for validation of documents and official letters.</li>
                    </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-lg mb-2 text-teal-700">2. Operational Documents</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                        <li>Audited financial statements of the last 2 years.</li>
                        <li>Annual reports or activity summaries.</li>
                        <li>List of trustees/board/governing members.</li>
                        <li>Declaration of non-profit operational status.</li>
                    </ul>
                </div>
            </div>
        )
    }
};
// -----------------------------------


// --- Modal Component (Reusable) ---
const RequiredDocumentsModal = ({ isOpen, onClose, role }) => {
    if (!isOpen) return null;

    const data = DOCUMENT_CONTENT_MAP[role] || DOCUMENT_CONTENT_MAP["patient"];

    const handleModalContentClick = (e) => e.stopPropagation();

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative p-6 md:p-8"
                onClick={handleModalContentClick}
            >
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-teal-600 transition-colors text-3xl font-bold leading-none"
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold text-teal-600 border-b-2 border-teal-600 pb-3 mb-6">
                    {data.title}
                </h2>

                {data.content}
            </div>
        </div>,
        document.body
    );
};

export default RequiredDocumentsModal;
