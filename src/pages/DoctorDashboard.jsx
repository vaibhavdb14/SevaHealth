import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  LogOut,
  Search,
  MessageSquare,
  Edit,
  Building2,
  Trash2,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ShadCN Dialog for Edit Modal
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Firebase imports
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"; // ➤ Added deleteDoc
import { collection, getDocs, query, where } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

import RequiredDocumentsModal from '../components/RequiredDocumentsModal';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorData, setDoctorData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  // documents checklist
  const [activeTab, setActiveTab] = useState('doctor');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "",
    age: "",
    city: "",
    specialization: "",
    experience: "",
    qualification: "",
    availability: "",
    hospitalName: "",
    bio: "",
  });

  //NGO search state
  // NGO Filters
  const [ngoFilterLocation, setNgoFilterLocation] = useState("all");

  //fetching consultations
  // Consultations
  const [consultations, setConsultations] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);

  const [scheduleData, setScheduleData] = useState({
    mode: "online",
    scheduledTime: "",
    contactNumber: "",
  });

  // Fetch Doctor Details
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/auth");
          return;
        }

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDoctorData(data);
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      }
    };

    fetchDoctorData();

    // Fetch NGOs
    const fetchNGOs = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "NGO"));
        const querySnapshot = await getDocs(q);

        const list = querySnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));

        setNgoList(list);
      } catch (error) {
        console.error("Error loading NGO list:", error);
      }
    };

    fetchNGOs();
  }, [navigate]);

  // 🔥 Fetch NGO → Doctor chat requests
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "docNGoChat"),
      where("doctorId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNgoChats(list);
    });

    return () => unsub();
  }, []);

  // 🔥 Fetch Consultations (separate useEffect)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "consultations"),
      where("doctorId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConsultations(list);
    });

    return () => unsubscribe();
  }, []);

  // Open Edit Modal & Autofill
  const handleEditOpen = () => {
    setFormData({
      name: doctorData.name || "",
      phone: doctorData.phone || "",
      gender: doctorData.gender || "",
      age: doctorData.age || "",
      city: doctorData.city || "",
      specialization: doctorData.specialization || "",
      experience: doctorData.experience || "",
      qualification: doctorData.qualification || "",
      availability: doctorData.availability || "",
      hospitalName: doctorData.hospitalName || "",
      bio: doctorData.bio || "",
    });

    setIsEditing(true);
  };

  // Save Updated Data
  const handleSaveChanges = async () => {
    try {
      const user = auth.currentUser;
      const docRef = doc(db, "users", user.uid);

      await updateDoc(docRef, formData);

      setDoctorData({ ...doctorData, ...formData }); // immediate UI update
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // ➤ DELETE ACCOUNT FUNCTION
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      const user = auth.currentUser;
      await deleteDoc(doc(db, "users", user.uid)); // Delete from Firestore

      alert("Your account has been deleted successfully.");
      navigate("/"); // Redirect to homepage
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account.");
    }
  };

  const [ngoList, setNgoList] = useState([]);

  // NGO → Doctor chat requests
  const [ngoChats, setNgoChats] = useState([]);
  const [selectedNgoChat, setSelectedNgoChat] = useState(null);
  const [isNgoChatModalOpen, setIsNgoChatModalOpen] = useState(false);
  const [doctorResponseNote, setDoctorResponseNote] = useState("");

  // Build distinct location options for NGOs
  const ngoLocations = [
    "all",
    ...new Set(ngoList.map((n) => n.location || "")),
  ];

  const handleDoctorDecision = async (decision) => {
    if (!selectedConsultation) return;

    const ref = doc(db, "consultations", selectedConsultation.id);

    if (decision === "decline") {
      await updateDoc(ref, {
        status: "declined",
        updatedAt: serverTimestamp(),
      });
      setIsConsultModalOpen(false);
      return;
    }

    await updateDoc(ref, {
      status: "accepted",
      mode: scheduleData.mode,
      scheduledTime: scheduleData.scheduledTime.trim(),
      contactNumber: scheduleData.contactNumber.trim() || null,
      updatedAt: serverTimestamp(),
    });

    setIsConsultModalOpen(false);
  };

  // Doctor decision for NGO chat
  const handleNgoChatDecision = async (decision) => {
    if (!selectedNgoChat) return;

    const ref = doc(db, "docNGoChat", selectedNgoChat.id);

    if (decision === "decline") {
      await updateDoc(ref, {
        status: "declined",
        doctorNote: null,
        updatedAt: serverTimestamp(),
      });
      setIsNgoChatModalOpen(false);
      return;
    }

    // Accept → note required
    if (!doctorResponseNote.trim()) {
      alert("Please write a note before accepting.");
      return;
    }

    await updateDoc(ref, {
      status: "accepted",
      doctorNote: doctorResponseNote,
      updatedAt: serverTimestamp(),
    });

    setIsNgoChatModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/src/assets/logo.png" alt="SevaHealth" className="h-10" />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>
                {doctorData ? doctorData.name?.[0]?.toUpperCase() : "DR"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate("/")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 rounded-full">
            <TabsTrigger value="profile" className="rounded-full">
              Profile
            </TabsTrigger>
            <TabsTrigger value="ngos" className="rounded-full">
              Connect with NGOs
            </TabsTrigger>
            <TabsTrigger value="consultations" className="rounded-full">
              Consultations
            </TabsTrigger>
            <TabsTrigger value="ngo-messages" className="rounded-full">
              NGO Messages
            </TabsTrigger>
          </TabsList>

          {/* PROFILE SECTION */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {doctorData ? `Dr. ${doctorData.name}` : "Loading..."}
                  </CardTitle>
                  <CardDescription className="text-lg mt-1">
                    {doctorData ? doctorData.city : ""}
                  </CardDescription>
                </div>

                {/* ➤ EDIT + DELETE BUTTONS */}
                <div className="flex gap-2">
                  {/* --- NEW: Documents Checklist Button --- */}
                  <Button
                    // Replicate the styling from the Edit Profile button
                    className="rounded-full"
                    onClick={() => setIsModalOpen(true)} // <-- This opens the modal (ensure setIsModalOpen state is defined)
                  >
                    {/* Using a Lucide icon for consistency, like 'ScrollText' or 'FileText' */}
                    <FileText className="w-4 h-4 mr-2" /> Documents Checklist
                  </Button>

                  <Button className="rounded-full" onClick={handleEditOpen}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full"
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardHeader>


              <CardContent className="space-y-4">
                {doctorData ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Personal Info */}
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{doctorData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{doctorData.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">
                        {doctorData.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-medium">{doctorData.age}</p>
                    </div>

                    {/* Professional Info */}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Specialization
                      </p>
                      <p className="font-medium">
                        {doctorData.specialization || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Experience
                      </p>
                      <p className="font-medium">
                        {doctorData.experience
                          ? `${doctorData.experience} years`
                          : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Qualification
                      </p>
                      <p className="font-medium">
                        {doctorData.qualification || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Hospital / Clinic
                      </p>
                      <p className="font-medium">
                        {doctorData.hospitalName || "Not provided"}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Availability
                      </p>
                      <p className="font-medium">
                        {doctorData.availability || "Not provided"}
                      </p>
                    </div>

                    {/* Bio at end */}
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Bio</p>
                      <p className="font-medium">
                        {doctorData.bio || "No bio provided"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    Loading profile...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <p className="text-3xl font-bold text-primary">45</p>
                  <p className="text-muted-foreground mt-1">Cases Helped</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <p className="text-3xl font-bold text-primary">120</p>
                  <p className="text-muted-foreground mt-1">
                    Hours Volunteered
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <p className="text-3xl font-bold text-primary">8</p>
                  <p className="text-muted-foreground mt-1">NGO Partnerships</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* for documents checklist */}
          <RequiredDocumentsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            role="doctor"
          />

          {/* NGOs */}
          <TabsContent value="ngos" className="space-y-6">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search NGOs..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Location Filter */}
              <select
                className="border rounded-lg p-2"
                value={ngoFilterLocation}
                onChange={(e) => setNgoFilterLocation(e.target.value)}
              >
                {ngoLocations.map((loc, i) => (
                  <option key={i} value={loc}>
                    {loc === "all" ? "All Locations" : loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ngoList.length > 0 ? (
                ngoList
                  .filter((ngo) => {
                    const matchesSearch =
                      ngo.ngoName
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      ngo.location
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase());

                    const matchesLocation =
                      ngoFilterLocation === "all" ||
                      ngo.location === ngoFilterLocation;

                    return matchesSearch && matchesLocation;
                  })

                  .map((ngo) => (
                    <Card
                      key={ngo.uid}
                      className="shadow-card hover:shadow-soft transition-smooth"
                    >
                      <CardHeader className="flex flex-col items-center text-center gap-3">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={ngo.photoURL || ""} />
                          <AvatarFallback>
                            <Building2 className="w-12 h-12" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {ngo.ngoName}
                          </CardTitle>
                          <CardDescription>
                            {ngo.areaOfWork || "Support Services"}
                          </CardDescription>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-sm">
                          <strong>Location:</strong> {ngo.location}
                        </p>

                        <Button className="w-full rounded-full">
                          Request Assistance
                        </Button>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <p className="text-center text-muted-foreground col-span-full">
                  No NGOs found.
                </p>
              )}
            </div>
          </TabsContent>

          {/* CONSULTATIONS */}
          <TabsContent value="consultations" className="space-y-6">
            {consultations.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No consultation requests yet
              </p>
            ) : (
              consultations.map((c) => (
                <Card
                  key={c.id}
                  className="shadow-card hover:shadow-soft transition-smooth cursor-pointer"
                  onClick={() => {
                    setSelectedConsultation(c);
                    setScheduleData({
                      mode: c.mode || "online",
                      scheduledTime: c.scheduledTime || "",
                      contactNumber: c.contactNumber || "",
                    });
                    setIsConsultModalOpen(true);
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Patient: {c.patientEmail}
                    </CardTitle>
                    <CardDescription>Status: {c.status}</CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          {/* NGO → Doctor Messages */}
          <TabsContent value="ngo-messages" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>NGO Requests</CardTitle>
                <CardDescription>Messages sent by NGOs</CardDescription>
              </CardHeader>

              <CardContent>
                {ngoChats.length === 0 ? (
                  <p className="text-muted-foreground">No NGO requests yet.</p>
                ) : (
                  ngoChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="border p-4 rounded-lg mb-3 hover:bg-muted/30 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold">{chat.ngoName}</p>
                        <p className="text-sm text-muted-foreground">
                          {chat.description.slice(0, 50)}...
                        </p>
                        <p className="text-xs mt-1">
                          <strong>Status:</strong>{" "}
                          <span
                            className={
                              chat.status === "accepted"
                                ? "text-green-600"
                                : chat.status === "declined"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                            }
                          >
                            {chat.status}
                          </span>
                        </p>
                      </div>

                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setSelectedNgoChat(chat);
                          setDoctorResponseNote(chat.doctorNote || "");
                          setIsNgoChatModalOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* EDIT PROFILE MODAL */}
      {/* ---------------------------------------------------------------- */}

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <Input
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Input
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
            <Input
              placeholder="Gender"
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
            />
            <Input
              placeholder="Age"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
            />

            <Input
              placeholder="City"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
            <Input
              placeholder="Specialization"
              value={formData.specialization}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specialization: e.target.value,
                })
              }
            />
            <Input
              placeholder="Experience (years)"
              value={formData.experience}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  experience: e.target.value,
                })
              }
            />
            <Input
              placeholder="Qualification"
              value={formData.qualification}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  qualification: e.target.value,
                })
              }
            />
            <Input
              placeholder="Hospital/Clinic"
              className="col-span-2"
              value={formData.hospitalName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hospitalName: e.target.value,
                })
              }
            />
            <Input
              placeholder="Availability"
              className="col-span-2"
              value={formData.availability}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  availability: e.target.value,
                })
              }
            />

            <textarea
              className="col-span-2 border rounded-md p-2"
              placeholder="Bio / Description"
              rows={4}
              value={formData.bio}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bio: e.target.value,
                })
              }
            />
          </div>

          <DialogFooter>
            <Button onClick={handleSaveChanges} className="rounded-full">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConsultModalOpen} onOpenChange={setIsConsultModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Consultation Request</DialogTitle>
          </DialogHeader>

          {selectedConsultation && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                From: {selectedConsultation.patientEmail}
              </p>

              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Problem Description:d
                </p>
                <p className="text-sm">
                  {selectedConsultation.initialDescription}
                </p>
              </div>

              {selectedConsultation.status === "pending" && (
                <>
                  <label className="text-sm font-medium">
                    Consultation Mode
                  </label>
                  <select
                    className="border rounded-lg w-full p-2"
                    value={scheduleData.mode}
                    onChange={(e) =>
                      setScheduleData({ ...scheduleData, mode: e.target.value })
                    }
                  >
                    <option value="online">Online (Call)</option>
                    <option value="offline">Offline (Clinic Visit)</option>
                  </select>

                  <Input
                    placeholder="e.g. 15 Jan 4 PM"
                    value={scheduleData.scheduledTime}
                    onChange={(e) =>
                      setScheduleData({
                        ...scheduleData,
                        scheduledTime: e.target.value,
                      })
                    }
                  />

                  {scheduleData.mode === "online" && (
                    <Input
                      placeholder="Phone Number"
                      value={scheduleData.contactNumber}
                      onChange={(e) =>
                        setScheduleData({
                          ...scheduleData,
                          contactNumber: e.target.value,
                        })
                      }
                    />
                  )}

                  <DialogFooter>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => handleDoctorDecision("decline")}
                    >
                      Decline
                    </Button>

                    <Button
                      className="rounded-full"
                      onClick={() => handleDoctorDecision("accept")}
                    >
                      Accept & Send Details
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NGO → Doctor Chat Modal */}
      <Dialog open={isNgoChatModalOpen} onOpenChange={setIsNgoChatModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>NGO Request Details</DialogTitle>
          </DialogHeader>

          {selectedNgoChat ? (
            <div className="space-y-4">
              <p>
                <strong>NGO:</strong> {selectedNgoChat.ngoName}
              </p>
              <p>
                <strong>Mode:</strong> {selectedNgoChat.messageType}
              </p>

              <p>
                <strong>Description:</strong> {selectedNgoChat.description}
              </p>

              <p>
                <strong>Date:</strong> {selectedNgoChat.date}
              </p>
              <p>
                <strong>Time:</strong> {selectedNgoChat.time}
              </p>

              {selectedNgoChat.messageType === "offline" && (
                <p>
                  <strong>Place:</strong> {selectedNgoChat.place}
                </p>
              )}

              {/* Already accepted */}
              {selectedNgoChat.status === "accepted" && (
                <div>
                  <p className="text-sm text-muted-foreground">Your Note:</p>
                  <p className="font-medium">{selectedNgoChat.doctorNote}</p>
                </div>
              )}

              {/* Pending Action */}
              {selectedNgoChat.status === "pending" && (
                <>
                  <textarea
                    className="w-full border rounded-md p-2"
                    rows={3}
                    placeholder="Write a note..."
                    value={doctorResponseNote}
                    onChange={(e) => setDoctorResponseNote(e.target.value)}
                  />

                  <DialogFooter>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => handleNgoChatDecision("decline")}
                    >
                      Decline
                    </Button>

                    <Button
                      className="rounded-full"
                      onClick={() => handleNgoChatDecision("accept")}
                    >
                      Accept Request
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDashboard;