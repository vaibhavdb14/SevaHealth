import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import sevaLogo from "@/assets/seva-logo-teal.png";

// Firebase imports
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";

const NGOPortal = () => {
  const [formData, setFormData] = useState({
    ngoName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    location: "",
    areaOfWork: "",
    contactPerson: "",
    registrationNo: "",
    description: "",
  });

  const navigate = useNavigate();

  // Handle registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      // 1️⃣ Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // 2️⃣ Save NGO data in Firestore inside "users" collection
      await setDoc(doc(db, "users", user.uid), {
        role: "NGO",
        uid: user.uid,
        ngoName: formData.ngoName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        areaOfWork: formData.areaOfWork,
        contactPerson: formData.contactPerson,
        registrationNo: formData.registrationNo,
        description: formData.description,
        createdAt: serverTimestamp(),
      });

      // ✅ Step 3: Success message + verification reminder
        await sendEmailVerification(user);
        toast.success("Account created! Please check your email to verify your account.");
        setTimeout(() => navigate("/auth"), 2000);
    } catch (error) {
      console.error("Error during registration:", error);
      toast.error(error.message);
    }
  };

  // JSX for NGO Registration Form
  return (
    <div className="min-h-screen gradient-subtle py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <img src={sevaLogo} alt="SevaHealth Logo" className="h-12 w-12" />
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <Card className="shadow-soft border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/30 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-secondary-foreground" />
            </div>
            <CardTitle className="text-3xl">NGO Registration</CardTitle>
            <CardDescription className="text-base">
              Register your NGO to collaborate on healthcare initiatives
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NGO Name */}
                <div className="space-y-2">
                  <Label htmlFor="ngoName">NGO Name *</Label>
                  <Input
                    id="ngoName"
                    placeholder="Health for All NGO"
                    value={formData.ngoName}
                    onChange={(e) =>
                      setFormData({ ...formData, ngoName: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ngo@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="Mumbai, Maharashtra"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Area of Work */}
                <div className="space-y-2">
                  <Label htmlFor="areaOfWork">Area of Work *</Label>
                  <Input
                    id="areaOfWork"
                    placeholder="Rural Healthcare & Education"
                    value={formData.areaOfWork}
                    onChange={(e) =>
                      setFormData({ ...formData, areaOfWork: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="Dr. Anjali Verma"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* Registration No */}
                <div className="space-y-2">
                  <Label htmlFor="registrationNo">Registration No *</Label>
                  <Input
                    id="registrationNo"
                    placeholder="NGO/2020/12345"
                    value={formData.registrationNo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationNo: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your NGO's mission and activities..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Register NGO
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NGOPortal;
