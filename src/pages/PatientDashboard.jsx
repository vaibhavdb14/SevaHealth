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
  Upload,
  MessageSquare,
  UserCircle,
  Building2,
  Trash2,
  Edit,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { deleteUser, onAuthStateChanged } from "firebase/auth";
import { setDoc, increment } from "firebase/firestore";


const PatientDashboard = () => {
  const navigate = useNavigate();

  // UI
  const [searchQuery, setSearchQuery] = useState("");
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeletePopup, setIsDeletePopup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    age: "",
    city: "",
    description: "",
  });

  // Doctor Filters
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterSpecialization, setFilterSpecialization] = useState("all");

  // NGO Filters
  const [ngoFilterLocation, setNgoFilterLocation] = useState("all");

  // lists
  const [doctorList, setDoctorList] = useState([]);
  const [ngoList, setNgoList] = useState([]);
  // Build distinct filter options
  const doctorLocations = [
    "all",
    ...new Set(doctorList.map((d) => d.city || "")),
  ];
  const doctorSpecializations = [
    "all",
    ...new Set(doctorList.map((d) => d.specialization || "")),
  ];

  const ngoLocations = [
    "all",
    ...new Set(ngoList.map((ngo) => ngo.location || "")),
  ];

  // consultations (patient)
  const [consultations, setConsultations] = useState([]);

  // new consultation modal
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultDescription, setConsultDescription] = useState("");
  const [isDescriptionSent, setIsDescriptionSent] = useState(false);

  // chat (read-only previous consultation popup)
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  const [chatData, setChatData] = useState(null);

  // NGO Consultation States
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [isNGOModalOpen, setIsNGOModalOpen] = useState(false);

  const [ngoDescription, setNgoDescription] = useState("");
  const [ngoPhone, setNgoPhone] = useState("");
  const [ngoAddress, setNgoAddress] = useState("");
  const [ngoRequests, setNgoRequests] = useState([]); // my requests to NGOs

  const [isNGOViewPopupOpen, setIsNGOViewPopupOpen] = useState(false);
  const [selectedNGORequest, setSelectedNGORequest] = useState(null);

  //Sevapoints (omitted for brevity)
  const [givenPoints, setGivenPoints] = useState({});

  // -----------------------
  // 1) Auth listener -> load logged-in user's profile
  // -----------------------
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // not logged in -> redirect to auth
        console.log("No logged-in user, redirecting to /auth");
        navigate("/auth");
        return;
      }

      try {
        // load the user's document by authoritative doc id = user.uid
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            gender: data.gender || "",
            age: data.age || "",
            city: data.city || "",
            description: data.description || "",
          });
        } else {
          console.warn("User document not found for uid:", user.uid);
          setUserData(null);
        }
      } catch (err) {
        console.error("Error loading current user profile:", err);
      }
    });

    return () => {
      unsubAuth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------
  // 2) Load doctorList and ngoList (one-time reads)
  //    NOTE: This does NOT modify auth or userData
  // -----------------------
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const qSnap = await getDocs(collection(db, "users"));
        const docs = await Promise.all(
          qSnap.docs
            .filter((d) => d.data().role === "Doctor")
            .map(async (d) => {
              const doctorId = d.id;

              // load seva points
              const ptsSnap = await getDoc(doc(db, "SevaPoints", doctorId));
              const sevaPoints = ptsSnap.exists() ? ptsSnap.data().points : 0;

              return { uid: doctorId, sevaPoints, ...d.data() };
            })
        );

        setDoctorList(docs);
      } catch (err) {
        console.error("Error fetching doctors:", err);
      }
    };

    const fetchNGOs = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "NGO"));
        const qSnap = await getDocs(q);
        const list = qSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
        setNgoList(list);
      } catch (err) {
        console.error("Error fetching NGOs:", err);
      }
    };

    fetchDoctors();
    fetchNGOs();
  }, []);

  // -----------------------
  // 3) Subscribe to consultations for the currently authenticated patient
  //    Use auth.currentUser.uid explicitly so we don't accidentally use any other uid
  // -----------------------
  useEffect(() => {
    let unsubscribeConsults = null;

    const setupConsultSubscription = () => {
      const user = auth.currentUser;
      if (!user) {
        return;
      }

      try {
        const q = query(
          collection(db, "consultations"),
          where("patientId", "==", user.uid)
        );
        unsubscribeConsults = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setConsultations(list);
        });
      } catch (err) {
        console.error("Error subscribing to consultations:", err);
      }
    };

    setupConsultSubscription();
    // cleanup
    return () => {
      if (unsubscribeConsults) unsubscribeConsults();
    };
  }, []); // run once after mount

  // Subscribe to NGOConsultations for this patient
  useEffect(() => {
    let unsub = null;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(
        collection(db, "NGOConsultations"),
        where("patientId", "==", user.uid)
      );

      unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setNgoRequests(list);
      });
    } catch (err) {
      console.error("Error loading NGO requests:", err);
    }

    return () => unsub && unsub();
  }, []);

  //Sevapoints useEffect (omitted for brevity)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "SevaTransactions"),
      where("patientId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const temp = {};
      snap.docs.forEach((d) => {
        temp[d.data().consultationId] = true;
      });
      setGivenPoints(temp);
    });

    return () => unsub();
  }, []);

  // -----------------------
  // Profile update / delete (explicitly use auth.currentUser.uid)
  // -----------------------
  const handleSaveChanges = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("No logged-in user");
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, formData);
      setUserData({ ...userData, ...formData });
      setIsEditing(false);
      alert("Profile updated");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("No logged-in user");
      // Delete Firestore doc for this logged-in user only
      await deleteDoc(doc(db, "users", user.uid));
      // Attempt to delete auth user (may require recent login)
      await deleteUser(user);
      alert("Account deleted");
      navigate("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Failed to delete account (maybe re-login required)");
    }
  };

  // -----------------------
  // Create consultation (patient -> doctor)
  // -----------------------
  const handleOpenConsultation = (doctor) => {
    setSelectedDoctor(doctor);
    setConsultDescription("");
    setIsDescriptionSent(false); // always allow new requests
    setIsConsultationModalOpen(true);
  };

  const handleSendConsultation = async () => {
    if (!consultDescription.trim()) return alert("Describe problem");
    const user = auth.currentUser;
    if (!user || !selectedDoctor) return;

    try {
      await addDoc(collection(db, "consultations"), {
        patientId: user.uid,
        patientEmail: userData?.email || null,
        doctorId: selectedDoctor.uid,
        doctorEmail: selectedDoctor.email || null,
        status: "pending",
        initialDescription: consultDescription.trim(),
        mode: null,
        scheduledTime: null,
        contactNumber: null,
        location: null,
        patientAcknowledged: false,
        doctorAcknowledged: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsDescriptionSent(true);
      alert("Request sent to doctor");
    } catch (err) {
      console.error("Error creating consultation:", err);
      alert("Failed to send request");
    }
  };

  const sendNGORequest = async () => {
    if (!ngoDescription.trim()) return alert("Description is required");
    if (!ngoPhone.trim()) return alert("Phone is required");
    if (!ngoAddress.trim()) return alert("Address is required");

    const user = auth.currentUser;
    if (!user || !selectedNGO) return;

    try {
      await addDoc(collection(db, "NGOConsultations"), {
        ngoId: selectedNGO.uid,
        ngoEmail: selectedNGO.email || null,
        ngoName: selectedNGO.ngoName || null,

        patientId: user.uid,
        patientEmail: userData?.email || null,
        patientName: userData?.name || null,

        description: ngoDescription.trim(),
        phone: ngoPhone.trim(),
        address: ngoAddress.trim(),

        status: "pending",
        ngoNote: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Your request has been sent to the NGO!");
      setIsNGOModalOpen(false);
    } catch (err) {
      console.error("Error sending NGO request:", err);
      alert("Failed to send request");
    }
  };

  // -----------------------
  // Open read-only previous consultation (no navigation)
  // -----------------------
  const openChatRoom = async (doctor) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(
        collection(db, "consultations"),
        where("patientId", "==", user.uid),
        where("doctorId", "==", doctor.uid)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("No previous consultation found.");
        return;
      }

      const docSnap = snap.docs[0];
      const consult = { id: docSnap.id, ...docSnap.data() };
      // fallback for location
      consult.location = consult.location || doctor.city || null;

      setChatData(consult);
      setIsChatPopupOpen(true);
    } catch (err) {
      console.error("Error loading consultation:", err);
      alert("Failed to load consultation");
    }
  };

  //sevapoints helper (omitted for brevity)
  const giveSevaPoint = async (consultation) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1️⃣ Add +1 to doctor’s SevaPoints doc
      const ref = doc(db, "SevaPoints", consultation.doctorId);
      await setDoc(ref, { points: increment(1) }, { merge: true });

      // 2️⃣ Mark this consultation as "point already given"
      await addDoc(collection(db, "SevaTransactions"), {
        doctorId: consultation.doctorId,
        patientId: user.uid,
        consultationId: consultation.id,
        createdAt: serverTimestamp(),
      });

      setGivenPoints((prev) => ({ ...prev, [consultation.id]: true }));

      alert("You gave 1 Seva Point ❤️");
    } catch (err) {
      console.error("Error giving point:", err);
      alert("Failed to give point");
    }
  };

  // small helper: does this doctor have any consultation with this patient?
  // const doctorHasConsultation = (docUid) =>
  //   consultations.some((c) => c.doctorId === docUid);

  // -----------------------
  // JSX render
  // -----------------------
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
              <AvatarFallback>{userData?.name?.[0] || "PT"}</AvatarFallback>
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
        {/* Patient Info */}
        {userData && (
          <Card className="mb-8 shadow-card">
            <CardHeader className="flex flex-row justify-between">
              <div>
                <CardTitle>Welcome, {userData.name}</CardTitle>
                <CardDescription>
                  Your personal health information
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <Button
                  className="rounded-full"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit Profile
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsDeletePopup(true)}
                >
                  <Trash2 />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{userData.email}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{userData.phone}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{userData.gender}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{userData.age}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{userData.city}</p>
              </div>

              <div className="md:col-span-3">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">
                  {userData.description || "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="doctors" className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5   rounded-full">
            <TabsTrigger value="doctors" className="rounded-full">
              Find Doctor
            </TabsTrigger>

            <TabsTrigger value="ngos" className="rounded-full">
              Find NGO
            </TabsTrigger>

            <TabsTrigger value="ngo-requests" className="rounded-full">
              My NGO Requests
            </TabsTrigger>

            <TabsTrigger value="reports" className="rounded-full">
              My Reports
            </TabsTrigger>
            <TabsTrigger value="consultations" className="rounded-full">
              My Consultations
            </TabsTrigger>
          </TabsList>
          {/* Doctors */}
          <TabsContent value="doctors" className="space-y-6">
            <div className="flex flex-col gap-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search doctors..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Location Filter */}
                <select
                  className="border rounded-lg p-2"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                >
                  {doctorLocations.map((loc, i) => (
                    <option key={i} value={loc}>
                      {loc === "all" ? "All Locations" : loc}
                    </option>
                  ))}
                </select>

                {/* Specialization Filter */}
                <select
                  className="border rounded-lg p-2"
                  value={filterSpecialization}
                  onChange={(e) => setFilterSpecialization(e.target.value)}
                >
                  {doctorSpecializations.map((sp, i) => (
                    <option key={i} value={sp}>
                      {sp === "all" ? "All Specializations" : sp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctorList.length > 0 ? (
                doctorList
                  .filter((d) => {
                    const matchesSearch =
                      d.name
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      d.specialization
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      d.city?.toLowerCase().includes(searchQuery.toLowerCase());

                    const matchesLocation =
                      filterLocation === "all" || d.city === filterLocation;

                    const matchesSpecialization =
                      filterSpecialization === "all" ||
                      d.specialization === filterSpecialization;

                    return (
                      matchesSearch && matchesLocation && matchesSpecialization
                    );
                  })

                  .map((doctor) => (
                    <Card
                      key={doctor.uid}
                      className="shadow-card hover:shadow-soft transition-smooth"
                    >
                      <CardHeader>
                        <div className="flex flex-col items-center text-center gap-3">
                          <Avatar className="w-20 h-20">
                            <AvatarFallback>
                              <UserCircle className="w-12 h-12" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {doctor.name}
                              {doctor.sevaPoints !== undefined && (
                                <span className="text-pink-600 text-sm">
                                  ❤️ {doctor.sevaPoints}
                                </span>
                              )}
                            </CardTitle>

                            <CardDescription>
                              {doctor.specialization}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-sm">
                          <strong>Experience:</strong> {doctor.experience} years
                        </p>
                        <p className="text-sm">
                          <strong>Location:</strong> {doctor.city}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            className="flex-1 rounded-full"
                            onClick={() => handleOpenConsultation(doctor)}
                          >
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <p className="text-center text-muted-foreground">
                  No doctors available right now 😕
                </p>
              )}
            </div>
          </TabsContent>
          {/* NGOs */}
          <TabsContent value="ngos" className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search NGOs..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* NGO Location Filter */}
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
                        <Button
                          className="w-full rounded-full"
                          onClick={() => {
                            setSelectedNGO(ngo);
                            setNgoDescription("");
                            setNgoPhone(userData?.phone || "");
                            setNgoAddress(userData?.city || "");
                            setIsNGOModalOpen(true);
                          }}
                        >
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
          {/* NGO Requests */}
          <TabsContent value="ngo-requests" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>My NGO Requests</CardTitle>
                <CardDescription>
                  Your assistance requests to NGOs
                </CardDescription>
              </CardHeader>

              <CardContent>
                {ngoRequests.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No NGO requests yet.
                  </p>
                )}

                {ngoRequests.map((req) => (
                  <div
                    key={req.id}
                    className="border p-3 rounded-lg flex justify-between items-center mt-3"
                  >
                    <div>
                      <p className="font-medium">{req.ngoName}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.description.slice(0, 50)}...
                      </p>

                      <p className="text-xs mt-1">
                        <strong>Status:</strong>{" "}
                        <span
                          className={
                            req.status === "accepted"
                              ? "text-emerald-600"
                              : req.status === "declined"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }
                        >
                          {req.status}
                        </span>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        setSelectedNGORequest(req);
                        setIsNGOViewPopupOpen(true);
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultations" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>My Consultations</CardTitle>
                <CardDescription>
                  Your doctor consultation history
                </CardDescription>
              </CardHeader>

              <CardContent>
                {consultations.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No consultations yet.
                  </p>
                )}

                {consultations.map((c) => {
                  const doctor = doctorList.find((d) => d.uid === c.doctorId);

                  return (
                    <div
                      key={c.id}
                      className="border p-3 rounded-lg flex justify-between items-center mt-3"
                    >
                      <div>
                        <p className="font-medium">
                          Doctor: {doctor?.name || "Unknown Doctor"}
                        </p>

                        <p className="text-xs mt-1">
                          <strong>Status:</strong>{" "}
                          <span
                            className={
                              c.status === "accepted"
                                ? "text-emerald-600"
                                : c.status === "declined"
                                ? "text-red-600"
                                : "text-yellow-600"
                            }
                          >
                            {c.status}
                          </span>
                        </p>
                      </div>

                      {c.status === "accepted" && (
                        <div className="mt-2 flex items-center gap-2">
                          {!givenPoints[c.id] ? (
                            <Button
                              size="sm"
                              className="rounded-full bg-pink-500 hover:bg-pink-600"
                              onClick={() => giveSevaPoint(c)}
                            >
                              ❤️ Give Seva Point
                            </Button>
                          ) : (
                            <span className="text-pink-600 text-sm">
                              You gave 1 ❤️
                            </span>
                          )}
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setChatData(c);
                          setIsChatPopupOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Upload Medical Reports</CardTitle>
                <CardDescription>Share your documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center hover:bg-primary/5 cursor-pointer"
                  onClick={() => document.getElementById("fileInput").click()}
                >
                  <input type="file" id="fileInput" className="hidden" />
                  <Upload className="w-12 h-12 mx-auto text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Upload Report</h3>
                  <p className="text-sm text-muted-foreground">PDF, JPG, PNG</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit profile dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
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
              placeholder="City / Location"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
            <textarea
              className="col-span-2 border rounded-md p-2"
              placeholder="Describe your medical concern..."
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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

      {/* Delete confirmation */}
      <Dialog open={isDeletePopup} onOpenChange={setIsDeletePopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            This action is permanent and cannot be undone. All your medical data
            will be deleted.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeletePopup(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={handleDeleteAccount}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consultation modal */}
      <Dialog
        open={isConsultationModalOpen}
        onOpenChange={setIsConsultationModalOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect with Doctor</DialogTitle>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                You are sending a request to{" "}
                <span className="font-semibold">{selectedDoctor.name}</span>
                {selectedDoctor.specialization &&
                  ` (${selectedDoctor.specialization})`}
              </p>

              <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={4}
                placeholder="Describe your medical problem..."
                value={consultDescription}
                onChange={(e) => setConsultDescription(e.target.value)}
                disabled={isDescriptionSent}
              />

              {isDescriptionSent && (
                <p className="text-xs text-emerald-600">
                  Your request has been sent. You’ll be notified when the doctor
                  responds.
                </p>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setIsConsultationModalOpen(false)}
                >
                  Close
                </Button>
                {!isDescriptionSent && (
                  <Button
                    className="rounded-full"
                    onClick={handleSendConsultation}
                  >
                    Send Request
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat history popup (read-only) */}
      <Dialog open={isChatPopupOpen} onOpenChange={setIsChatPopupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Previous Consultation</DialogTitle>
          </DialogHeader>

          {chatData ? (
            <div className="space-y-3">
              <p>
                <strong>Problem:</strong> {chatData.initialDescription}
              </p>
              <p>
                <strong>Status:</strong> {chatData.status}
              </p>

              {chatData.status === "accepted" && (
                <>
                  <p>
                    <strong>Mode:</strong> {chatData.mode}
                  </p>
                  <p>
                    <strong>Scheduled Time:</strong> {chatData.scheduledTime}
                  </p>
                  <p>
                    <strong>Contact Number:</strong> {chatData.contactNumber}
                  </p>
                  <p>
                    <strong>Doctor Location:</strong> {chatData.location}
                  </p>
                </>
              )}

              {chatData.status === "declined" && (
                <p className="text-red-600">Doctor declined this request.</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}

          <DialogFooter>
            <Button
              className="rounded-full"
              onClick={() => setIsChatPopupOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NGO Request Modal */}
      <Dialog open={isNGOModalOpen} onOpenChange={setIsNGOModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request NGO Assistance</DialogTitle>
          </DialogHeader>

          {selectedNGO && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Requesting help from <b>{selectedNGO.ngoName}</b>
              </p>

              <textarea
                className="w-full border rounded-md p-2"
                rows={4}
                placeholder="Describe your problem..."
                value={ngoDescription}
                onChange={(e) => setNgoDescription(e.target.value)}
              />

              <Input
                placeholder="Your Phone Number"
                value={ngoPhone}
                onChange={(e) => setNgoPhone(e.target.value)}
              />

              <Input
                placeholder="Your Address"
                value={ngoAddress}
                onChange={(e) => setNgoAddress(e.target.value)}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setIsNGOModalOpen(false)}
                >
                  Cancel
                </Button>

                <Button className="rounded-full" onClick={sendNGORequest}>
                  Send Request
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* View NGO Request Popup */}
      <Dialog open={isNGOViewPopupOpen} onOpenChange={setIsNGOViewPopupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>NGO Request Details</DialogTitle>
          </DialogHeader>

          {selectedNGORequest ? (
            <div className="space-y-3">
              <p>
                <b>NGO:</b> {selectedNGORequest.ngoName}
              </p>
              <p>
                <b>Description:</b> {selectedNGORequest.description}
              </p>
              <p>
                <b>Your Phone:</b> {selectedNGORequest.phone}
              </p>
              <p>
                <b>Your Address:</b> {selectedNGORequest.address}
              </p>
              <p>
                <b>Status:</b> {selectedNGORequest.status}
              </p>

              {selectedNGORequest.status === "accepted" && (
                <>
                  <p className="text-emerald-600">
                    <b>NGO Note:</b>
                  </p>
                  <p>{selectedNGORequest.ngoNote}</p>
                </>
              )}

              {selectedNGORequest.status === "declined" && (
                <p className="text-red-600 font-semibold">
                  Your request was declined.
                </p>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}

          <DialogFooter>
            <Button
              className="rounded-full"
              onClick={() => setIsNGOViewPopupOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientDashboard;
