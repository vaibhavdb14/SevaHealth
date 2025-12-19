// NGODashboard.jsx
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bell,
  LogOut,
  Search,
  Edit,
  Trash2,
  UserCircle,
  BarChart3,
  MessageSquare,
  Users,
  FileText,
  Upload,
  Pencil
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

import { auth, db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import RequiredDocumentsModal from '../components/RequiredDocumentsModal';

/**
 * NGODashboard
 *
 * - Dynamic doctor cards (search + filters)
 * - NGOConsultations collection for patient <-> NGO interactions (separate from 'consultations')
 * - Patients tab: list of requests for this NGO (View -> accept / decline)
 * - Messages tab: accepted conversations listing (view details)
 *
 * Note: This file only manages NGO-side UI and Firestore reads/updates.
 * The patient-side should create documents in 'NGOConsultations' (schema above).
 */

const NGODashboard = () => {
  const navigate = useNavigate();

  // supabase
  const [stamp, setStamp] = useState(null);
  const [otherDocs, setOtherDocs] = useState([]);
  const [uploading, setUploading] = useState(false);

  const ngoUid = auth.currentUser?.uid;




  // NGO profile & editing
  const [ngoData, setNgoData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // documents checklist
  const [activeTab, setActiveTab] = useState('ngo');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    ngoName: "",
    email: "",
    phone: "",
    location: "",
    areaOfWork: "",
    contactPerson: "",
    registrationNo: "",
    description: "",
  });

  // Doctors list (dynamic from users collection)
  const [doctors, setDoctors] = useState([]);
  const [doctorLocationFilter, setDoctorLocationFilter] = useState("");
  const [doctorSpecializationFilter, setDoctorSpecializationFilter] =
    useState("");

  // NGOConsultations: requests (live subscription)
  const [requests, setRequests] = useState([]); // all requests for this NGO (pending/accepted/declined)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Accept/Decline UI
  const [ngoDecisionNote, setNgoDecisionNote] = useState(""); // mandatory when accepting

  // Messages tab shows accepted conversations
  const [acceptedConvos, setAcceptedConvos] = useState([]);
  const [doctorChats, setDoctorChats] = useState([]);
  const [viewConvo, setViewConvo] = useState(null);
  const [isViewConvoOpen, setIsViewConvoOpen] = useState(false);

  // ---------------- FETCH NGO PROFILE ----------------
  useEffect(() => {
    const fetchNGO = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;

        const data = snap.data();
        if (data.role !== "NGO") return;

        setNgoData({ uid: user.uid, ...data });

        setFormData({
          ngoName: data.ngoName || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          areaOfWork: data.areaOfWork || "",
          contactPerson: data.contactPerson || "",
          registrationNo: data.registrationNo || "",
          description: data.description || "",
        });
      } catch (err) {
        console.error("Error fetching NGO profile:", err);
      }
    };

    fetchNGO();
  }, []);

  // ---------------- SAVE NGO PROFILE ----------------
  const handleSaveChanges = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, formData);
      setNgoData({ ...ngoData, ...formData });
      setIsEditing(false);
      alert("Profile Updated Successfully!");
    } catch (err) {
      console.error("Error saving NGO profile:", err);
      alert("Failed to save profile.");
    }
  };

  // ---------------- DELETE NGO ACCOUNT ----------------
  const handleDelete = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      await deleteDoc(doc(db, "users", user.uid));
      alert("Account deleted successfully.");
      navigate("/");
    } catch (err) {
      console.error("Error deleting NGO account:", err);
      alert("Failed to delete account.");
    }
  };

  // ---------------- LOAD DOCTORS (one-time) ----------------
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "Doctor"));
        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
        setDoctors(docs);
      } catch (err) {
        console.error("Error fetching doctors:", err);
      }
    };

    fetchDoctors();
  }, []);

  // Helper: unique location & specialization lists for filters
  const doctorLocations = Array.from(
    new Set(doctors.map((d) => d.city || "").filter(Boolean))
  );
  const doctorSpecializations = Array.from(
    new Set(doctors.map((d) => d.specialization || "").filter(Boolean))
  );

  // ---------------- SUBSCRIBE TO NGOConsultations (live) ----------------
  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;

    // Build query for NGOConsultations where ngoId is current user
    const q = query(
      collection(db, "NGOConsultations"),
      where("ngoId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Keep both full list and accepted list for messages tab
        setRequests(list);
        setAcceptedConvos(list.filter((r) => r.status === "accepted"));
      },
      (err) => {
        console.error("NGOConsultations onSnapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  // ---------------- SUBSCRIBE TO docNGoChat (Doctor ↔ NGO messages) ----------------
  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;

    const q = query(
      collection(db, "docNGoChat"),
      where("ngoId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Only show accepted doctor requests
      const accepted = list.filter((item) => item.status === "accepted");

      setDoctorChats(accepted);
    });

    return () => unsubscribe();
  }, []);

  // ---------------- VIEW / OPEN A REQUEST (NGO side) ----------------
  const openRequest = (request) => {
    setSelectedRequest(request);
    setNgoDecisionNote(""); // reset note
    setIsRequestModalOpen(true);
  };

  // ---------------- ACCEPT / DECLINE ----------------
  const handleNGODecision = async (decision) => {
    if (!selectedRequest) return;
    const ref = doc(db, "NGOConsultations", selectedRequest.id);

    if (decision === "decline") {
      try {
        await updateDoc(ref, {
          status: "declined",
          ngoNote: null,
          updatedAt: serverTimestamp(),
        });
        setIsRequestModalOpen(false);
      } catch (err) {
        console.error("Error declining request:", err);
        alert("Failed to decline request");
      }
      return;
    }

    // Accept -> mandatory note required
    if (!ngoDecisionNote || !ngoDecisionNote.trim()) {
      alert("Please enter a note before accepting (this is mandatory).");
      return;
    }

    try {
      await updateDoc(ref, {
        status: "accepted",
        ngoNote: ngoDecisionNote.trim(),
        updatedAt: serverTimestamp(),
      });
      setIsRequestModalOpen(false);
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Failed to accept request");
    }
  };

  // ---------------- VIEW A CONVERSATION (Messages tab) ----------------
  const openConvo = (convo) => {
    setViewConvo(convo);
    setIsViewConvoOpen(true);
  };

  // Small reusable Info component
  const Info = ({ label, value }) => (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );

  // --------------- NGO DOCTOR Chat ----------------
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  const [chatMode, setChatMode] = useState("online");
  const [chatDescription, setChatDescription] = useState("");
  const [chatDate, setChatDate] = useState("");
  const [chatTime, setChatTime] = useState("");
  const [chatPlace, setChatPlace] = useState("");

  const sendDoctorChatRequest = async () => {
    if (!chatDescription.trim()) return alert("Description required");

    const user = getAuth().currentUser;
    if (!user || !selectedDoctor) return;

    try {
      await addDoc(collection(db, "docNGoChat"), {
        ngoId: user.uid,
        ngoName: ngoData?.ngoName || "",
        doctorId: selectedDoctor.uid,
        doctorName: selectedDoctor.name || "",

        messageType: chatMode,
        description: chatDescription,
        date: chatDate,
        time: chatTime,
        place: chatMode === "offline" ? chatPlace : null,

        status: "pending",
        doctorNote: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Request sent to doctor!");
      setIsDoctorModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to send request");
    }
  };

  // supabase
  useEffect(() => {
    fetchNgoDocuments();
  }, []);

  // fetch
  const fetchNgoDocuments = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/get-ngo-documents?ngoUid=${ngoUid}`
      );

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Invalid response from backend", data);
        return;
      }

      setStamp(data.find((d) => d.document_type === "STAMP") || null);
      setOtherDocs(data.filter((d) => d.document_type === "OTHER"));
    } catch (err) {
      console.error("fetchNgoDocuments error:", err);
    }
  };

  useEffect(() => {
    if (ngoUid) fetchNgoDocuments();
  }, [ngoUid]);



  // upload
  const uploadNgoDocument = async (file, documentType) => {
  try {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("ngoUid", ngoUid);
    formData.append("documentType", documentType);

    const res = await fetch("http://localhost:3000/upload-ngo-document", {
      method: "POST",
      body: formData, // ❗ DO NOT set headers
    });

    const text = await res.text(); // IMPORTANT
    console.log("Raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Backend returned non-JSON response");
    }

    if (!res.ok) {
      throw new Error(data.error || "Upload failed");
    }

    fetchNgoDocuments(); // refresh
  } catch (err) {
    console.error("Upload error:", err);
    alert(err.message);
  }
};

  // const uploadNgoDocument = async (file, type) => {
  //   if (!file) return;

  //   try {
  //     setUploading(true);

  //     const formData = new FormData();
  //     formData.append("document", file);
  //     formData.append("documentType", type);
  //     formData.append("ngoUid", ngoUid);

  //     const res = await fetch("http://localhost:3000/upload-ngo-document", {
  //       method: "POST",
  //       body: formData,
  //     });

  //     const text = await res.text();
  //     const data = JSON.parse(text);

  //     if (!res.ok) throw new Error(data.error);

  //     fetchNgoDocuments();
  //   } catch (err) {
  //     console.error("Upload error:", err);
  //     alert("Failed to upload document");
  //   } finally {
  //     setUploading(false);
  //   }
  // };



  // // view
  const viewNgoDocument = async (filePath) => {
    try {
      const res = await fetch(
        `http://localhost:3000/get-ngo-signed-url?filePath=${encodeURIComponent(
          filePath
        )}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      window.open(data.signedUrl, "_blank");
    } catch (err) {
      console.error("View error:", err);
      alert("Unable to open document");
    }
  };



  // rename
  const renameNgoDocument = async (id, currentName) => {
    const newName = prompt("Enter new document name:", currentName);
    if (!newName || newName === currentName) return;

    try {
      const res = await fetch("http://localhost:3000/rename-ngo-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          newName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchNgoDocuments();
    } catch (err) {
      console.error("Rename error:", err);
      alert("Failed to rename document");
    }
  };


  // delete
  const deleteNgoDocument = async (id, filePath) => {
    if (!confirm("Delete this document?")) return;

    try {
      const res = await fetch("http://localhost:3000/delete-ngo-document", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, filePath }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchNgoDocuments();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete document");
    }
  };



  // ---------------- RENDER ----------------
  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/src/assets/logo.png" alt="SevaHealth" className="h-10" />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell />
            </Button>

            <Avatar>
              <AvatarFallback>{(ngoData?.ngoName || "NG")[0]}</AvatarFallback>
            </Avatar>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate("/")}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-6 rounded-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* ---------------- PROFILE ---------------- */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row justify-between">
                <div>
                  <CardTitle>{ngoData?.ngoName || "Loading..."}</CardTitle>
                  <CardDescription>{ngoData?.areaOfWork}</CardDescription>
                </div>

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


                  <Button
                    className="rounded-full"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="mr-2" /> Edit Profile
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardHeader>


              <CardContent className="space-y-3">
                {ngoData ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Info label="Email" value={ngoData.email} />
                      <Info label="Phone" value={ngoData.phone} />
                      <Info label="Location" value={ngoData.location} />
                      <Info label="Area of Work" value={ngoData.areaOfWork} />
                      <Info
                        label="Contact Person"
                        value={ngoData.contactPerson}
                      />
                      <Info
                        label="Registration No"
                        value={ngoData.registrationNo}
                      />
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Description
                      </p>
                      <p>{ngoData.description}</p>
                    </div>
                  </>
                ) : (
                  <p>Loading...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* for documents checklist */}
          <RequiredDocumentsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            role="ngo"
          />

          {/* ---------------- EDIT PROFILE MODAL ---------------- */}
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit NGO Profile</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input
                  placeholder="NGO Name"
                  value={formData.ngoName}
                  onChange={(e) =>
                    setFormData({ ...formData, ngoName: e.target.value })
                  }
                />

                <Input
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />

                <Input
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />

                <Input
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />

                <Input
                  placeholder="Area of Work"
                  value={formData.areaOfWork}
                  onChange={(e) =>
                    setFormData({ ...formData, areaOfWork: e.target.value })
                  }
                />

                <Input
                  placeholder="Contact Person"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                />

                <Input
                  placeholder="Registration No"
                  value={formData.registrationNo}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationNo: e.target.value })
                  }
                />

                <textarea
                  rows={4}
                  className="border rounded-md p-2 col-span-2"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <DialogFooter>
                <Button className="rounded-full" onClick={handleSaveChanges}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ---------------- DELETE CONFIRMATION ---------------- */}
          {confirmDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-full max-w-sm text-center space-y-4 shadow-xl">
                <h2 className="text-xl font-bold">Delete Account?</h2>
                <p>This action cannot be undone. All data will be removed.</p>

                <div className="flex justify-center gap-3">
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="destructive"
                    className="rounded-full"
                    onClick={handleDelete}
                  >
                    Yes, Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- ANALYTICS ---------------- */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">1,245</p>
                    <p className="text-sm text-muted-foreground">
                      Total Patients Served
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <BarChart3 />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">87</p>
                    <p className="text-sm text-muted-foreground">
                      Ongoing Cases
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <UserCircle />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">34</p>
                    <p className="text-sm text-muted-foreground">
                      Doctor Collaborations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ---------------- DOCTORS (dynamic + filters) ---------------- */}
          <TabsContent value="doctors" className="space-y-6">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search doctors..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                value={doctorLocationFilter}
                onChange={(e) => setDoctorLocationFilter(e.target.value)}
                className="border rounded p-2"
              >
                <option value="">All Locations</option>
                {doctorLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              <select
                value={doctorSpecializationFilter}
                onChange={(e) => setDoctorSpecializationFilter(e.target.value)}
                className="border rounded p-2"
              >
                <option value="">All Specializations</option>
                {doctorSpecializations.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors
                .filter(
                  (d) =>
                    (d.name || "")
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    (d.specialization || "")
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    (d.city || "")
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                )
                .filter((d) =>
                  doctorLocationFilter ? d.city === doctorLocationFilter : true
                )
                .filter((d) =>
                  doctorSpecializationFilter
                    ? d.specialization === doctorSpecializationFilter
                    : true
                )
                .map((docItem) => (
                  <Card
                    key={docItem.uid}
                    className="shadow hover:shadow-lg transition"
                  >
                    <CardHeader className="text-center">
                      <Avatar className="mx-auto">
                        <AvatarFallback>
                          <UserCircle />
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle>{docItem.name}</CardTitle>
                      <CardDescription>
                        {docItem.specialization}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 text-center">
                      <p className="text-muted-foreground">{docItem.city}</p>
                      <Button
                        className="rounded-full w-full"
                        onClick={() => {
                          setSelectedDoctor(docItem);
                          setChatDescription("");
                          setChatDate("");
                          setChatTime("");
                          setChatPlace("");
                          setChatMode("online");
                          setIsDoctorModalOpen(true);
                        }}
                      >
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* ---------------- PATIENT REQUESTS (NGOConsultations) ---------------- */}
          <TabsContent value="patients">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Patient Requests</CardTitle>
                <CardDescription>
                  Requests sent by patients to your NGO
                </CardDescription>
              </CardHeader>

              <CardContent>
                {requests.length === 0 ? (
                  <p className="text-muted-foreground">No requests yet.</p>
                ) : (
                  requests
                    .sort(
                      (a, b) =>
                        (b.createdAt?.seconds || 0) -
                        (a.createdAt?.seconds || 0)
                    )
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex justify-between p-4 border rounded-lg mb-3 items-center"
                      >
                        <div className="flex gap-4 items-center">
                          <Avatar>
                            <AvatarFallback>
                              {(r.patientName || r.patientEmail || "P")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">
                              {r.patientName || r.patientEmail}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {r.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 items-center">
                          <div className="text-sm px-3 py-1 rounded-full text-muted-foreground bg-muted/30">
                            {r.status}
                          </div>

                          <Button
                            size="sm"
                            className="rounded-full"
                            onClick={() => openRequest(r)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- MESSAGES (accepted conversations) ---------------- */}
          <TabsContent value="messages">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Messages (Accepted Requests)</CardTitle>
                <CardDescription>
                  Accepted requests — view details
                </CardDescription>
              </CardHeader>

              <CardContent>
                {doctorChats.length === 0 ? (
                  <p className="text-muted-foreground">
                    No doctor conversations yet.
                  </p>
                ) : (
                  doctorChats
                    .sort(
                      (a, b) =>
                        (b.updatedAt?.seconds || 0) -
                        (a.updatedAt?.seconds || 0)
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        className="flex gap-4 p-3 border rounded-lg mb-3 justify-between items-center"
                      >
                        <div className="flex gap-4 items-center">
                          <Avatar>
                            <AvatarFallback>
                              {(c.doctorName || "D")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">{c.doctorName}</p>
                            <p className="text-muted-foreground text-sm">
                              {c.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="rounded-full"
                            onClick={() => openConvo(c)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>NGO Documents</CardTitle>
                <CardDescription>
                  Upload your NGO stamp/seal and other verification documents
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* ---------------- STAMP SECTION ---------------- */}
                <div>
                  <h3 className="font-semibold mb-3">
                    NGO Stamp / Seal <span className="text-red-500">*</span>
                  </h3>

                  {!stamp ? (
                    <div
                      className="border-2 border-dashed border-primary/30 rounded-xl p-10 text-center hover:bg-primary/5 cursor-pointer"
                      onClick={() => document.getElementById("ngoStampInput").click()}
                    >
                      <input
                        type="file"
                        id="ngoStampInput"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          uploadNgoDocument(e.target.files[0], "STAMP")
                        }
                      />
                      <Upload className="w-10 h-10 mx-auto text-primary mb-3" />
                      <h4 className="font-semibold">Upload NGO Stamp</h4>
                      <p className="text-sm text-muted-foreground">Mandatory</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border rounded-lg p-4">
                      <p className="font-medium">{stamp.document_name}</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => viewNgoDocument(stamp.file_path)}>
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            renameNgoDocument(stamp.id, stamp.document_name)
                          }
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <button
                          size="icon"
                          onClick={() =>
                            deleteNgoDocument(stamp.id, stamp.file_path)
                          }
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <hr />

                {/* ---------------- OTHER DOCUMENTS ---------------- */}
                <div>
                  <h3 className="font-semibold mb-3">Other Documents</h3>

                  <div
                    className="border-2 border-dashed border-primary/30 rounded-xl p-10 text-center hover:bg-primary/5 cursor-pointer mb-4"
                    onClick={() => document.getElementById("ngoOtherInput").click()}
                  >
                    <input
                      type="file"
                      id="ngoOtherInput"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        uploadNgoDocument(e.target.files[0], "OTHER")
                      }
                    />
                    <Upload className="w-10 h-10 mx-auto text-primary mb-3" />
                    <h4 className="font-semibold">Upload Document</h4>
                    <p className="text-sm text-muted-foreground">
                      Certificates, ID proof, etc.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {otherDocs.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No additional documents uploaded.
                      </p>
                    )}

                    {otherDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between border rounded-lg p-3"
                      >
                        <p className="font-medium">{doc.document_name}</p>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => viewNgoDocument(doc.file_path)}
                          >
                            View
                          </Button>

                          <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            renameNgoDocument(stamp.id, stamp.document_name)
                          }
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                          <button
                            size="icon"
                            onClick={() =>
                              deleteNgoDocument(doc.id, doc.file_path)
                            }
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>

      {/* ---------------- REQUEST VIEW / DECISION MODAL ---------------- */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Patient Request</DialogTitle>
          </DialogHeader>

          {selectedRequest ? (
            <div className="space-y-4 mt-2">
              <Info
                label="Patient"
                value={
                  selectedRequest.patientName || selectedRequest.patientEmail
                }
              />
              <Info label="Email" value={selectedRequest.patientEmail} />
              <Info label="Description" value={selectedRequest.description} />
              <Info label="Phone" value={selectedRequest.phone} />
              <Info label="Address" value={selectedRequest.address} />
              <Info label="Status" value={selectedRequest.status} />

              {/* If already accepted show NGO note */}
              {selectedRequest.status === "accepted" && (
                <div>
                  <p className="text-sm text-muted-foreground">NGO Note</p>
                  <p className="font-medium">{selectedRequest.ngoNote}</p>
                </div>
              )}

              {/* Only show decision UI for pending */}
              {selectedRequest.status === "pending" && (
                <>
                  <label className="text-sm font-medium">
                    Write a note (mandatory to accept)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border rounded-md p-2"
                    value={ngoDecisionNote}
                    onChange={(e) => setNgoDecisionNote(e.target.value)}
                    placeholder="Write how you will help / next steps..."
                  />
                </>
              )}

              <DialogFooter>
                {selectedRequest.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => handleNGODecision("decline")}
                    >
                      Decline
                    </Button>
                    <Button
                      className="rounded-full"
                      onClick={() => handleNGODecision("accept")}
                    >
                      Accept & Send Note
                    </Button>
                  </>
                )}

                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setIsRequestModalOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="p-4">Loading...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------------- VIEW CONVERSATION MODAL ---------------- */}
      <Dialog open={isViewConvoOpen} onOpenChange={setIsViewConvoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Conversation Details</DialogTitle>
          </DialogHeader>

          {viewConvo ? (
            <div className="space-y-3 mt-2">
              <Info
                label="Patient"
                value={viewConvo.patientName || viewConvo.patientEmail}
              />
              <Info label="Email" value={viewConvo.patientEmail} />
              <Info label="Description" value={viewConvo.description} />
              <Info label="Phone" value={viewConvo.phone} />
              <Info label="Address" value={viewConvo.address} />
              <Info label="NGO Note" value={viewConvo.ngoNote} />
              <Info label="Status" value={viewConvo.status} />
            </div>
          ) : (
            <div className="p-4">Loading...</div>
          )}

          <DialogFooter>
            <Button
              className="rounded-full"
              onClick={() => setIsViewConvoOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDoctorModalOpen} onOpenChange={setIsDoctorModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Collaboration with Doctor</DialogTitle>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Sending request to <b>{selectedDoctor.name}</b>
              </p>

              {/* Select Mode */}
              <select
                className="border p-2 rounded w-full"
                value={chatMode}
                onChange={(e) => setChatMode(e.target.value)}
              >
                <option value="online">Online Session</option>
                <option value="offline">Offline Event</option>
              </select>

              {/* Description */}
              <textarea
                className="w-full border rounded p-2"
                rows={3}
                placeholder="Describe your need..."
                value={chatDescription}
                onChange={(e) => setChatDescription(e.target.value)}
              />

              {/* Date */}
              <Input
                type="date"
                value={chatDate}
                onChange={(e) => setChatDate(e.target.value)}
              />

              {/* Time */}
              <Input
                type="time"
                value={chatTime}
                onChange={(e) => setChatTime(e.target.value)}
              />

              {/* Place only for offline */}
              {chatMode === "offline" && (
                <Input
                  placeholder="Enter venue/place"
                  value={chatPlace}
                  onChange={(e) => setChatPlace(e.target.value)}
                />
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDoctorModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-full"
                  onClick={sendDoctorChatRequest}
                >
                  Send Request
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NGODashboard;