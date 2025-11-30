# 🏥 SevaHealth - Unified Health Management System

SevaHealth is a unified healthcare management web application built using **React** and **Firebase**.  
It connects **Doctors**, **Patients**, and **NGOs** on one platform for efficient medical record management, communication, and service coordination.

---

## 🚀 Features

- 👨‍⚕️ **Doctor Portal:** Register, manage patient records, and view appointments.  
- 🧑‍🤝‍🧑 **Patient Portal:** Register, access your profile, and connect with doctors.  
- 🏢 **NGO Portal:** Manage organization info, outreach activities, and patient support.  
- 🔐 **Firebase Authentication:** Secure login and registration using Firebase Auth.  
- ☁️ **Firestore Database:** Stores user data with unique document IDs.  
- ⚙️ **Role-Based Access Control:** Each user (Doctor, Patient, NGO) is identified by a `role` key in Firestore.  
- 🖼️ **Responsive UI:** Built with React and Tailwind for a clean and mobile-friendly design.

---

## 🧩 Tech Stack

- **Frontend:** React.js  
- **Backend:** Firebase Authentication + Firestore Database  
- **Styling:** Tailwind CSS / Lucide React Icons  

---

## 📂 Folder Structure
healthcare-seva-net
├── src/
│ ├── components/
│ │ ├── DoctorPortal.jsx
│ │ ├── PatientPortal.jsx
│ │ ├── NGOPortal.jsx
│ │ ├── LoginPage.jsx
│ │ └── Navbar.jsx
│ │
│ ├── firebase.js # Firebase configuration file
│ ├── App.js # Main component with routing
│ └── index.js # React entry point
│
├── public/
│ └── index.html
│
└── package.json

---

## 🧠 Firestore Structure

users (collection)
├── <unique_user_id>
│ ├── name: "John Doe"
│ ├── email: "johndoe@gmail.com
"
│ ├── phone: "9999999999"
│ ├── role: "doctor" | "patient" | "ngo"
│ ├── location: "Mumbai"
│ └── createdAt: Timestamp


---

## ⚡ Installation Guide

1️⃣ **Clone the Repository**
```bash
git clone https://github.com/Gauri-Bharsakale/healthcare-seva-net.git
cd healthcare-seva-net
npm run dev 
