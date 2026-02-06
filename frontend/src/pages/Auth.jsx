import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  updateProfile,
  signOut
} from "firebase/auth";
import { auth, googleProvider } from "@/config/firebase";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Sun, Moon, ArrowLeft } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const navigate = useNavigate();
  const { user, syncStudentWithBackend, loading: userLoading } = useUser();
  const { theme, toggleTheme } = useTheme();

  console.log("Auth: Rendering, isLogin:", isLogin, "user:", user?.email);

  useEffect(() => {
    if (user && !userLoading) {
      console.log("Auth: User already logged in, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [user, userLoading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    console.log("Auth: Form data updated:", name);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return false;
    }
    
    if (!isLogin && !formData.name) {
      toast.error("Please enter your name");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    console.log("Auth: Email auth initiated, isLogin:", isLogin);
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      let userCredential;
      
      if (isLogin) {
        console.log("Auth: Attempting login with email:", formData.email);
        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        console.log("Auth: Login successful:", userCredential.user.uid);
      } else {
        console.log("Auth: Attempting registration with email:", formData.email);
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        console.log("Auth: Registration successful:", userCredential.user.uid);
        
        await updateProfile(userCredential.user, {
          displayName: formData.name
        });
        console.log("Auth: Profile updated with name:", formData.name);
      }

      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      
      console.log("Auth: Syncing with backend...");
      const syncResult = await syncStudentWithBackend(userCredential.user, formData.name);
      console.log("Auth: Backend sync complete");
      
      // Redirect new users to profile page, existing users to dashboard
      if (isLogin) {
        navigate("/dashboard");
      } else {
        navigate("/profile", { state: { isNewUser: true } });
      }
      
    } catch (error) {
      console.error("Auth: Email auth error:", error);
      
      let errorMessage = "An error occurred. Please try again.";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered. Please login instead.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/password accounts are not enabled.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak. Use at least 6 characters.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      try {
        await signOut(auth);
        console.log("Auth: Signed out due to error");
      } catch (signOutError) {
        console.error("Auth: Error signing out:", signOutError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log("Auth: Google sign-in initiated");
    setLoading(true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Auth: Google sign-in successful:", result.user.uid);
      
      // Check if this is a new user by checking additionalUserInfo
      const isNewUser = result._tokenResponse?.isNewUser || false;
      
      toast.success(isNewUser ? "Welcome to Money Council!" : "Welcome back!");
      
      console.log("Auth: Syncing Google user with backend...");
      await syncStudentWithBackend(result.user);
      console.log("Auth: Backend sync complete");
      
      // Redirect new users to profile page to complete setup
      if (isNewUser) {
        navigate("/profile", { state: { isNewUser: true } });
      } else {
        navigate("/dashboard");
      }
      
    } catch (error) {
      console.error("Auth: Google sign-in error:", error);
      
      let errorMessage = "Google sign-in failed. Please try again.";
      
      switch (error.code) {
        case "auth/popup-closed-by-user":
          errorMessage = "Sign-in cancelled.";
          break;
        case "auth/popup-blocked":
          errorMessage = "Pop-up was blocked. Please allow pop-ups.";
          break;
        case "auth/cancelled-popup-request":
          errorMessage = "Only one sign-in popup can be open at a time.";
          break;
        case "auth/account-exists-with-different-credential":
          errorMessage = "An account already exists with this email using a different sign-in method.";
          break;
        default:
          errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      try {
        await signOut(auth);
        console.log("Auth: Signed out due to error");
      } catch (signOutError) {
        console.error("Auth: Error signing out:", signOutError);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: "", email: "", password: "" });
    console.log("Auth: Mode toggled to:", !isLogin ? "login" : "register");
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-linear-to-bl from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-linear-to-tr from-chart-1/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full"
        >
          {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>
      </div>

      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Sign in to access your financial dashboard" 
              : "Start your journey to financial wellness"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <FcGoogle className="w-5 h-5 mr-2" />
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
