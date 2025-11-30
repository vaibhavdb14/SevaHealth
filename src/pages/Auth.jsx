// Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig"; // ✅ use existing config

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Building2, Heart, ArrowLeft } from "lucide-react";



const Auth = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  ///Here we are handling the login functionality
 const handleLogin = async (e) => {
  e.preventDefault();

  try {
    await signInWithEmailAndPassword(auth, email, password);

    if (selectedRole === "doctor") {
      navigate("/doctor-dashboard");
    } else if (selectedRole === "patient") {
      navigate("/patient-dashboard");
    } else if (selectedRole === "ngo") {
      navigate("/ngo-dashboard");
    }
  } catch (error) {
    alert(error.message);
  }
};


  const roles = [
    {
      id: "doctor",
      title: "Doctor",
      icon: UserCircle,
      description: "Healthcare professionals offering seva",
      color: "bg-primary/10 hover:bg-primary/20 border-primary/30",
    },
    {
      id: "patient",
      title: "Patient",
      icon: Heart,
      description: "Seeking medical assistance",
      color: "bg-secondary/10 hover:bg-secondary/20 border-secondary/30",
    },
    {
      id: "ngo",
      title: "NGO",
      icon: Building2,
      description: "Organizations providing healthcare support",
      color: "bg-accent/10 hover:bg-accent/20 border-accent/30",
    },
  ];

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <Card className="shadow-soft">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/src/assets/logo.png"
                alt="SevaHealth"
                className="h-16"
              />
            </div>
            <CardTitle className="text-3xl">Welcome to SevaHealth</CardTitle>
            <CardDescription>Login to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground mb-6">
                  Select your role to continue
                </p>
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full p-6 rounded-xl border-2 transition-smooth ${role.color} flex items-start gap-4 text-left`}
                  >
                    <role.icon className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {role.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">
                    {selectedRole.charAt(0).toUpperCase() +
                      selectedRole.slice(1)}{" "}
                    Login
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRole(null)}
                  >
                    Change Role
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full rounded-full">
                  Login
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don’t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate(`/${selectedRole}-portal`)}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
