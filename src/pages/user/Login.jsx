import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Shield, Mail, Lock, UserPlus, X, FileText, ShieldCheck } from "lucide-react";
import Swal from 'sweetalert2';
import Footer from '../../components/user/Footer';
import { sendOtp, verifyOtp, registerUser, loginUser, getUserProfile } from "../../services/AuthService";
import { logLogin, logRegistration } from "../../services/ActivityLogger";

export default function Login() {
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);
  
  // Modal states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  
  // OTP states
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loginData, setLoginData] = useState(null);
  const [otpContext, setOtpContext] = useState(null); // 'login' | 'register'
  const [otpTargetEmail, setOtpTargetEmail] = useState("");

  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    suffix: "",
    birthdate: "",
    regEmail: "",
    mobile: "",
    address: "",
    houseNumber: "",
    street: "",
    barangay: "",
    regPassword: "",
    confirmPassword: ""
  });
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Header visibility on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (direction !== "down" && scrollY > 50) {
        setIsVisible(true);
      } else if (direction === "down" && scrollY > 50) {
        setIsVisible(false);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };

    window.addEventListener("scroll", updateScrollDirection);
    return () => window.removeEventListener("scroll", updateScrollDirection);
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError("Please enter both username/email and password.");
      return;
    }

    try {
      const response = await loginUser({ email: username, password });

      if (response.success) {
        setSuccess("Login successful! Sending OTP...");
        setLoginData({ username, token: response.token });

        const otpResponse = await sendOtp(username, "login");

        if (!otpResponse.success) {
          setLoginData(null);
          setError(otpResponse.message || "Failed to send OTP. Please try again.");
          setSuccess("");
          return;
        }

        setOtpContext("login");
        setOtpTargetEmail(username);
        setOtp(["", "", "", "", "", ""]);
        setOtpError("");
        setOtpSuccess("");
        setShowOtpModal(true);
        setCountdown(30);
        setSuccess("");
      } else {
        setError(response.message || "Invalid username/email or password.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while logging in. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    // Implement Google OAuth logic here
    console.log("Google login clicked");
  };

  const handleRegisterClick = () => setShowRegisterModal(true);
  const handleCloseRegisterModal = () => {
    setShowRegisterModal(false);
    setRegisterForm({
      firstName: "",
      lastName: "",
      middleName: "",
      suffix: "",
      birthdate: "",
      regEmail: "",
      mobile: "",
      address: "",
      houseNumber: "",
      street: "",
      barangay: "",
      regPassword: "",
      confirmPassword: ""
    });
    setNoMiddleName(false);
    setAgreeTerms(false);
    setAgreePrivacy(false);
    setPendingRegistration(null);
  };

  const handleOpenTerms = () => setShowTermsModal(true);
  const handleCloseTermsModal = () => setShowTermsModal(false);
  const handleOpenPrivacy = () => setShowPrivacyModal(true);
  const handleClosePrivacyModal = () => setShowPrivacyModal(false);
  const handleFooterTerms = () => setShowTermsModal(true);
  const handleFooterPrivacy = () => setShowPrivacyModal(true);

  // Handle input changes
  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNoMiddleNameChange = (e) => {
    setNoMiddleName(e.target.checked);
    setRegisterForm(prev => ({
      ...prev,
      middleName: e.target.checked ? "N/A" : ""
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!agreeTerms || !agreePrivacy) {
      Swal.fire({ icon: 'warning', title: 'Agreement Required', text: 'Please agree to both Terms of Service and Privacy Policy.', confirmButtonColor: '#4CAF50' });
      return;
    }

    if (!registerForm.firstName || !registerForm.lastName || !registerForm.regEmail || !registerForm.regPassword) {
      Swal.fire({ icon: 'error', title: 'Missing Fields', text: 'Please fill in all required fields.', confirmButtonColor: '#4CAF50' });
      return;
    }

    if (registerForm.regPassword !== registerForm.confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Password Mismatch', text: 'Passwords do not match. Please try again.', confirmButtonColor: '#4CAF50' });
      return;
    }

    try {
      // SEND OTP
      const otpResponse = await sendOtp(registerForm.regEmail, "register");

      if (!otpResponse.success) {
        Swal.fire({ icon: 'error', title: 'OTP Failed', text: otpResponse.message || 'Failed to send OTP. Please try again.', confirmButtonColor: '#4CAF50' });
        return;
      }

      // Open OTP modal and track context
      setOtpContext("register");
      setOtpTargetEmail(registerForm.regEmail);
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setOtpSuccess("");
      setShowOtpModal(true);
      setCountdown(30);

      // Save registration data temporarily until OTP is verified
      setPendingRegistration({
        email: registerForm.regEmail,
        password: registerForm.regPassword,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        middleName: noMiddleName ? "N/A" : registerForm.middleName,
        suffix: registerForm.suffix,
        birthdate: registerForm.birthdate,
        mobile_number: registerForm.mobile,
        house_number: registerForm.houseNumber,
        street: registerForm.street,
        barangay: registerForm.barangay,
        city_municipality: "Default City", // You might want to make these dynamic
        province: "Default Province",
        region: "Default Region",
        zip_code: null
      });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'An error occurred while sending OTP. Please try again.', confirmButtonColor: '#4CAF50' });
    }
  };

  // OTP Input Handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Only allow numbers
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedNumbers = pastedData.replace(/\D/g, '').split('').slice(0, 6);
    
    if (pastedNumbers.length === 6) {
      const newOtp = [...otp];
      pastedNumbers.forEach((num, index) => {
        newOtp[index] = num;
      });
      setOtp(newOtp);
      
      // Focus last input
      const lastInput = document.getElementById(`otp-5`);
      if (lastInput) lastInput.focus();
    }
  };

  const finalizeLogin = () => {
    if (!loginData?.token) {
      setOtpError("Login session expired. Please login again.");
      return;
    }

    const { token, username: loginEmail } = loginData;

    // Store under the key your header expects
    localStorage.setItem("auth_token", token); // <-- must match UserHeader
    localStorage.setItem("email", loginEmail);

    closeOtpModal();
    logLogin(loginEmail, "user");
    navigate("/user/dashboard");
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpSuccess("");

    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }

    if (!otpContext || !otpTargetEmail) {
      setOtpError("No OTP request in progress. Please try again.");
      return;
    }

    try {
      // Call OTP verification API
      const response = await verifyOtp(otpTargetEmail, otpString, otpContext);
      
      console.log("🔐 [OTP API Response]:", response);
      
      if (!response.success) {
        setOtpError(response.message || "Invalid OTP");
        return;
      }

      setOtpSuccess("OTP verified successfully!");
      
      // ✅ CRITICAL: If this is registration, complete the registration process
      if (otpContext === "register" && pendingRegistration) {
        console.log("📝 Starting registration process with data:", pendingRegistration);
        
        // Call the registerUser function to save data to database
        const registerResponse = await registerUser(pendingRegistration);
        
        console.log("📝 [Registration API Response]:", registerResponse);
        
        if (!registerResponse.success) {
          setOtpError(registerResponse.message || "Registration failed after OTP verification");
          return;
        }
        
        // Registration successful - save auth data
        localStorage.setItem("auth_token", registerResponse.token || response.token || "dummy_token");
        localStorage.setItem("goserveph_role", "user");
        localStorage.setItem("goserveph_email", otpTargetEmail);
        localStorage.setItem("email", otpTargetEmail);
        
        // Save user profile data if returned
        if (registerResponse.first_name) {
          localStorage.setItem("first_name", registerResponse.first_name);
        }
        if (registerResponse.last_name) {
          localStorage.setItem("last_name", registerResponse.last_name);
        }
        if (registerResponse.full_name) {
          localStorage.setItem("full_name", registerResponse.full_name);
          localStorage.setItem("display_name", registerResponse.full_name);
        }
        
        if (registerResponse.user_id) {
          localStorage.setItem("goserveph_user_id", registerResponse.user_id);
        }
        
        setOtpSuccess("Registration successful! Redirecting to dashboard...");
        
        closeOtpModal();
        logRegistration(otpTargetEmail, registerResponse.full_name || pendingRegistration.firstName || "");
        
        // Redirect to user dashboard
        setTimeout(() => {
          navigate("/user/dashboard");
        }, 1000);
        
        return;
      }
      
      // If it's login OTP verification, continue with existing logic
      if (otpContext === "login") {
        // ... existing login logic ...
        
        // CRITICAL: Save department for admin routing
        console.log("✅ Saving department data:", response.department);
        
        // Store ALL authentication data
        localStorage.setItem("auth_token", response.token || "dummy_token");
        localStorage.setItem("goserveph_role", response.role || "user");
        localStorage.setItem("goserveph_email", otpTargetEmail);
        localStorage.setItem("email", otpTargetEmail);
        
        // THIS IS THE KEY: Save department if it exists
        if (response.department) {
          localStorage.setItem("goserveph_department", response.department);
          console.log("✅ Department saved:", response.department);
        } else if (response.isAdmin) {
          // If isAdmin is true but department is not set, assign based on email
          const department = getDepartmentFromEmail(otpTargetEmail);
          if (department) {
            localStorage.setItem("goserveph_department", department);
            console.log("✅ Department assigned from email:", department);
          }
        }
        
        if (response.user_id) {
          localStorage.setItem("goserveph_user_id", response.user_id);
        }
        
        if (response.name) {
          localStorage.setItem("goserveph_name", response.name);
          sessionStorage.setItem("admin_name", response.name);
        }
        
        // Also store department in sessionStorage for AdminSidebar
        if (response.department) {
          sessionStorage.setItem("admin_department", response.department);
        }
        
        // Debug what was saved
        console.log("🔍 After login - localStorage:", {
          role: localStorage.getItem("goserveph_role"),
          department: localStorage.getItem("goserveph_department"),
          email: localStorage.getItem("goserveph_email")
        });
        
        closeOtpModal();
        logLogin(otpTargetEmail, response.role || "user");
        
        // Redirect based on role
        setTimeout(() => {
          if (response.role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/user/dashboard");
          }
        }, 300);
      }
      
    } catch (err) {
      console.error(err);
      setOtpError("Network error while verifying OTP");
    }
  };

  // Helper function to get department from email
  function getDepartmentFromEmail(email) {
    const emailToDepartment = {
      'superadmin@eplms.com': 'super',
      'businessadmin@eplms.com': 'business',
      'buildingadmin@eplms.com': 'building',
      'barangaystaff@eplms.com': 'barangay',
      'transportadmin@eplms.com': 'transport',
      'admin@eplms.com': 'super'
    };
    return emailToDepartment[email.toLowerCase()] || null;
  }

  const handleResendOtp = async () => {
    if (countdown > 0 || !otpTargetEmail || !otpContext) return;
    if (otpContext === "register" && !pendingRegistration?.email) return;

    setIsResending(true);
    setOtpError("");
    setOtpSuccess("Resending OTP...");

    try {
      const otpResponse = await sendOtp(otpTargetEmail, otpContext);

      if (!otpResponse.success) {
        setOtpError(otpResponse.message || "Failed to resend OTP");
      } else {
        setOtpSuccess("New OTP has been sent to your email.");
        setOtp(["", "", "", "", "", ""]);
        setCountdown(30);
      }
    } catch (err) {
      setOtpError("Network error while resending OTP");
    }

    setIsResending(false);
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setOtpSuccess("");
    setLoginData(null);
    setOtpContext(null);
    setOtpTargetEmail("");
    setCountdown(0);
    setIsResending(false);
    setPendingRegistration(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
      {/* Background Image with Low Opacity */}
      <div className="fixed inset-0 z-0 bg-[url('/GovServePH.png')] bg-center bg-contain bg-no-repeat opacity-15"></div>

      {/* Animated Background Particles */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(76,175,80,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(74,144,226,0.1)_0%,transparent_50%),radial-gradient(circle_at_40%_40%,rgba(253,168,17,0.05)_0%,transparent_50%)] animate-pulse"></div>
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 bg-white shadow-sm border-b-4 border-[#FDA811] transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          {/* LEFT: Logo + Title + Tagline + Back Button */}
          <div className="flex items-center gap-3">
            
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <img
                src="/GSM_logo.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold">
                <span className="text-blue-700">Go</span>
                <span className="text-green-600">Serve</span>
                <span className="text-blue-700">PH</span>
              </span>
              <span className="text-sm text-gray-600">
                Serbisyong Publiko, Abot-Kamay Mo.
              </span>
            </div>
          </div>

          {/* RIGHT: Time and Date */}
          <div className="text-right text-sm text-gray-800">
            <div className="font-semibold">{time.toLocaleTimeString()}</div>
            <div>
              {time.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-8 flex-1">
                            {/* Back Button */}
<button
  onClick={() => navigate(-1)}
  className="px-4 py-2 bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors duration-300 border border-[#3d8b40] shadow-sm hover:shadow-md mr-2 flex items-center gap-2"
  aria-label="Go back"
>
  <ArrowLeft className="w-5 h-5" />
  <span>Back</span>
</button>
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          
          {/* Left Section - Features */}
          <div className="text-center lg:text-left space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 bg-clip-text text-transparent bg-size-600 animate-gradient">
              Abot-Kamay mo ang Serbisyong Publiko!
            </h2>
            <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Access government services conveniently through our digital platform. 
              Fast, secure, and reliable public service at your fingertips.
            </p>
          </div>

          {/* Right Section - Login Form */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md mx-auto w-full border border-white/20 hover:shadow-2xl transition-all duration-300 hover:translate-y-[-4px]">
            <div className="text-center mb-8 space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Mag-login</h2>
              <p className="text-gray-600 text-sm">Punan ang mga kailangan impormasyon upang ma-access ang iyong account</p>
            </div>

            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <div>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  placeholder="Ilagay ang iyong username o email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    name="password" 
                    placeholder="Ilagay ang iyong password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Tandaan ako
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    Nakalimutan ang password?
                  </a>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Mag-login
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O</span>
                </div>
              </div>
              
              <div>
                <button 
                  type="button" 
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                  <span>Magpatuloy gamit ang Google</span>
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Wala pang account? 
                  <button 
                    type="button" 
                    className="text-blue-600 hover:text-blue-800 font-semibold ml-1 transition-colors"
                    onClick={handleRegisterClick}
                  >
                    Mag-register dito
                  </button>
                </p>
              </div>
            </form>

            {/* Security Features */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                <h3 className="text-sm font-medium mb-2 text-blue-800">Mga Paalala sa Seguridad:</h3>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• Siguraduhing tama ang impormasyong ilalagay</li>
                  <li>• Huwag ibahagi ang iyong password sa iba</li>
                  <li>• Kung may problema, tumawag sa IT Department</li>
                  <li>• Account ay maaaring ma-lock pagkatapos ng 5 failed attempts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-12 px-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-gray-100 animate-in">

            {/* HEADER */}
            <div className="sticky top-0 w-full bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 text-center z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg md:text-xl font-bold text-white">Create your Account</h2>
                  <p className="text-green-100 text-xs">Fill in all required fields to register</p>
                </div>
              </div>
              <button type="button" onClick={handleCloseRegisterModal} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM AREA */}
            <form 
              id="registerForm" 
              className="space-y-5 p-6 overflow-y-auto max-h-[calc(85vh-80px)]" 
              onSubmit={handleRegisterSubmit}
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">First Name<span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="firstName" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    value={registerForm.firstName}
                    onChange={handleRegisterInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">Last Name<span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="lastName" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    value={registerForm.lastName}
                    onChange={handleRegisterInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">Middle Name<span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    id="middleName" 
                    name="middleName" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={registerForm.middleName}
                    onChange={handleRegisterInputChange}
                    disabled={noMiddleName}
                  />
                  <label className="inline-flex items-center mt-2 text-sm text-gray-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="noMiddleName" 
                      className="mr-2 rounded text-green-600 focus:ring-green-500"
                      checked={noMiddleName}
                      onChange={handleNoMiddleNameChange}
                    /> 
                    No middle name
                  </label>
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">Suffix</label>
                  <input 
                    type="text" 
                    name="suffix" 
                    placeholder="Jr., Sr., III (optional)" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    value={registerForm.suffix}
                    onChange={handleRegisterInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">Birthdate<span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="birthdate" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    value={registerForm.birthdate}
                    onChange={handleRegisterInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">Email Address<span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    name="regEmail" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    value={registerForm.regEmail}
                    onChange={handleRegisterInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">Mobile Number<span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    name="mobile" 
                    required 
                    placeholder="09XXXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    value={registerForm.mobile}
                    onChange={handleRegisterInputChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-1 font-medium text-gray-700">Address<span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="address" 
                    required 
                    placeholder="Lot/Unit, Building, Subdivision"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    value={registerForm.address}
                    onChange={handleRegisterInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">House #<span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="houseNumber" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    value={registerForm.houseNumber}
                    onChange={handleRegisterInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">Street<span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="street" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    value={registerForm.street}
                    onChange={handleRegisterInputChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-1 font-medium text-gray-700">Barangay<span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="barangay" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    value={registerForm.barangay}
                    onChange={handleRegisterInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">Password<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      type={showRegPassword ? "text" : "password"}
                      id="regPassword" 
                      name="regPassword" 
                      minLength="10" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      value={registerForm.regPassword}
                      onChange={handleRegisterInputChange}
                    />
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">Confirm Password<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword" 
                      name="confirmPassword" 
                      minLength="10" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterInputChange}
                    />
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms & Privacy */}
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <label className="inline-flex items-center">
                    <input 
                      type="checkbox" 
                      id="agreeTerms" 
                      className="mr-2" 
                      required
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <span>I have read, understood, and agreed to the</span>
                  </label>
                  <button 
                    type="button" 
                    className="ml-2 text-green-600 hover:underline"
                    onClick={handleOpenTerms}
                  >
                    Terms of Use
                  </button>
                </div>

                <div className="flex items-center text-sm">
                  <label className="inline-flex items-center">
                    <input 
                      type="checkbox" 
                      id="agreePrivacy" 
                      className="mr-2" 
                      required
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                    />
                    <span>I have read, understood, and agreed to the</span>
                  </label>
                  <button 
                    type="button" 
                    className="ml-2 text-green-600 hover:underline"
                    onClick={handleOpenPrivacy}
                  >
                    Data Privacy Policy
                  </button>
                </div>

                <p className="text-xs text-gray-600">
                  By clicking on the register button below, I hereby agree to both the Terms of Use and Data Privacy Policy
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200"
                  onClick={handleCloseRegisterModal}
                >
                  Cancel
                </button>

                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Register
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-gray-100">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Terms of Service Agreement</h3>
              </div>
              <button 
                type="button" 
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-all duration-200"
                onClick={handleCloseTermsModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 text-sm leading-6">
                <p><strong>Welcome to GoServePH!</strong></p>
                <p>This GoServePH Services Agreement ("Agreement") is a binding legal contract for the use of our software systems—which handle data input, monitoring, processing, and analytics—("Services") between GoServePH ("us," "our," or "we") and you, the registered user ("you" or "user").</p>
                <p>This Agreement details the terms and conditions for using our Services. By accessing or using any GoServePH Services, you agree to these terms. If you don't understand any part of this Agreement, please contact us at info@goserveph.com.</p>
                <h4 className="font-semibold">OVERVIEW OF THIS AGREEMENT</h4>
                <p>This document outlines the terms for your use of the GoServePH system:</p>
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr><th className="py-1 pr-4">Section</th><th className="py-1">Topic</th></tr>
                    </thead>
                    <tbody>
                        <tr><td className="py-1 pr-4">Section A</td><td className="py-1">General Account Setup and Use</td></tr>
                        <tr><td className="py-1 pr-4">Section B</td><td className="py-1">Technology, Intellectual Property, and Licensing</td></tr>
                        <tr><td className="py-1 pr-4">Section C</td><td className="py-1">Payment Terms, Fees, and Billing</td></tr>
                        <tr><td className="py-1 pr-4">Section D</td><td className="py-1">Data Usage, Privacy, and Security</td></tr>
                        <tr><td className="py-1 pr-4">Section E</td><td className="py-1">Additional Legal Terms and Disclaimers</td></tr>
                    </tbody>
                </table>
                <h4 className="font-semibold">SECTION A: GENERAL TERMS</h4>
                <p><strong>1. Your Account and Registration</strong></p>
                <p>a. Account Creation: To use our Services, you must create an Account. Your representative (Representative) must provide us with required details, including your entity's name, address, contact person, email, phone number, relevant ID/tax number, and the nature of your business/activities.</p>
                <p>b. Review and Approval: We reserve the right to review and approve your application, which typically takes at least two (2) business days. We can deny or reject any application at our discretion.</p>
                <p>c. Eligibility: Only businesses, institutions, and other entities based in the Philippines are eligible to apply for a GoServePH Account.</p>
                <p>d. Representative Authority: You confirm that your Representative has the full authority to provide your information and legally bind your entity to this Agreement. We may ask for proof of this authority.</p>
                <p>e. Validation: We may require additional documentation at any time (e.g., business licenses, IDs) to verify your entity's ownership, control, and the information you provided.</p>
                <p><strong>2. Services and Support</strong></p>
                <p>We provide support for general account inquiries and issues that prevent the proper use of the system ("System Errors"). Support includes resources available through our in-app Ticketing System and website documentation ("Documentation"). For further questions, contact us at support@goserveph.com.</p>
                <p><strong>3. Service Rules and Restrictions</strong></p>
                <p>a. Lawful Use: You must use the Services lawfully and comply with all applicable Philippine laws, rules, and regulations ("Laws") regarding your use of the Services and the transactions you facilitate ("Transactions").</p>
                <p>b. Prohibited Activities: You may not use the Services to facilitate illegal transactions, or for personal/household use. Specifically, you must not, nor allow others to:</p>
                <ul className="list-disc pl-5">
                    <li>Access non-public systems or data.</li>
                    <li>Copy, resell, or distribute the Services, Documentation, or system content.</li>
                    <li>Use, transfer, or access data you do not own or have no documented rights to use.</li>
                    <li>Act as a service agent for the Services.</li>
                    <li>Transfer your rights under this Agreement.</li>
                    <li>Bypass technical limitations or enable disabled features.</li>
                    <li>Reverse engineer the Services (except where legally permitted).</li>
                    <li>Interfere with the normal operation of the Services or impose an unreasonably large load on the system.</li>
                </ul>
                <p><strong>4. Electronic Notices and Consent</strong></p>
                <p>a. Electronic Consent: By registering, you provide your electronic signature and consent to receive all notices and disclosures from us electronically (via our website, email, or text message), which has the same legal effect as a physical signature.</p>
                <p>b. Delivery: We are not liable for non-receipt of notices due to issues beyond our control (e.g., network outages, incorrect contact details, firewall restrictions). Notices posted or emailed are considered received within 24 hours.</p>
                <p>c. Text Messages: You authorize us to use text messages to verify your account control (like two-step verification) and provide critical updates. Standard carrier charges may apply.</p>
                <p>d. Withdrawing Consent: You can withdraw your consent to electronic notices only by terminating your Account.</p>
                <p><strong>5. Termination</strong></p>
                <p>a. Agreement Term: This Agreement starts upon registration and continues until terminated by you or us.</p>
                <p>b. Termination by You: You can terminate by emailing a closure request to info@goserveph.com. Your Account will be closed within 120 business days of receipt.</p>
                <p>c. Termination by Us: We may terminate this Agreement, suspend your Account, or close it at any time, for any reason, by providing you notice. Immediate suspension or termination may occur if:</p>
                <ul className="list-disc pl-5">
                    <li>You pose a significant fraud or credit risk.</li>
                    <li>You use the Services in a prohibited manner or violate this Agreement.</li>
                    <li>Law requires us to do so.</li>
                </ul>
                <p>d. Effect of Termination: Upon termination:</p>
                <ul className="list-disc pl-5">
                    <li>All licenses granted to you end.</li>
                    <li>We may delete your data and information (though we have no obligation to do so).</li>
                    <li>We are not liable to you for any damages related to the termination, suspension, or data deletion.</li>
                    <li>You remain liable for any outstanding fees, fines, or financial obligations incurred before termination.</li>
                </ul>
                <h4 className="font-semibold">SECTION B: TECHNOLOGY</h4>
                <p><strong>1. System Access and Updates</strong></p>
                <p>We provide access to the web system and/or mobile application ("Application"). You must only use the Application as described in the Documentation. We will update the Application and Documentation periodically, which may add or remove features, and we will notify you of material changes.</p>
                <p><strong>2. Ownership of Intellectual Property (IP)</strong></p>
                <p>a. Your Data: You retain ownership of all your master data, raw transactional data, and generated reports gathered from the system.</p>
                <p>b. GoServePH IP: We exclusively own all rights, titles, and interests in the patents, copyrights, trademarks, system designs, and documentation ("GoServePH IP"). All rights in GoServePH IP not expressly granted to you are reserved by us.</p>
                <p>c. Ideas: If you submit comments or ideas for system improvements ("Ideas"), you agree that we are free to use these Ideas without any attribution or compensation to you.</p>
                <p><strong>3. License Coverage</strong></p>
                <p>We grant you a non-exclusive and non-transferable license to electronically access and use the GoServePH IP only as described in this Agreement. We are not selling the IP to you, and you cannot sublicense it. We may revoke this license if you violate the Agreement.</p>
                <p><strong>4. References to Our Relationship</strong></p>
                <p>During the term of this Agreement, both you and we may publicly identify the other party as the service provider or client, respectively. If you object to us identifying you as a client, you must notify us at info@goserveph.com. Upon termination, both parties must remove all public references to the relationship.</p>
                <h4 className="font-semibold">SECTION C: PAYMENT TERMS AND CONDITIONS</h4>
                <p><strong>1. Service Fees</strong></p>
                <p>We will charge the Fees for set-up, access, support, penalties, and other transactions as described on the GoServePH website. We may revise the Fees at any time, with at least 30 days' notice before the revisions apply to you.</p>
                <p><strong>2. Payment Terms and Schedule</strong></p>
                <p>a. Billing: Your monthly bill for the upcoming month is generated by the system on the 21st day of the current month and is due after 5 days. Billing is based on the number of registered users ("End-User") as of the 20th day.</p>
                <p>b. Payment Method: All payments must be settled via our third-party Payment System Provider, PayPal. You agree to abide by all of PayPal's terms, and we are not responsible for any issues with their service.</p>
                <p><strong>3. Taxes</strong></p>
                <p>Fees exclude applicable taxes. You are solely responsible for remitting all taxes for your business to the appropriate Philippine tax and revenue authorities.</p>
                <p><strong>4. Payment Processing</strong></p>
                <p>We are not a bank and do not offer services regulated by the Bangko Sentral ng Pilipinas. We reserve the right to reject your application or terminate your Account if you are ineligible to use PayPal services.</p>
                <p><strong>5. Processing Disputes and Refunds</strong></p>
                <p>You must report disputes and refund requests by emailing us at billing@goserveph.com. Disputes will only be investigated if reported within 60 days from the billing date. If a refund is warranted, it will be issued as a credit memo for use on future bills.</p>
                <h4 className="font-semibold">SECTION D: DATA USAGE, PRIVACY AND SECURITY</h4>
                <p><strong>1. Data Usage Overview</strong></p>
                <p>Data security is a top priority. This section outlines our obligations when handling information.</p>
                <p>'PERSONAL DATA' is information that relates to and can identify a person.</p>
                <p>'USER DATA' is information that describes your business, operations, products, or services.</p>
                <p>'GoServePH DATA' is transactional data over our infrastructure, fraud analysis info, aggregated data, and other information originating from the Services.</p>
                <p>'DATA' means all of the above.</p>
                <p>We use Data to provide Services, mitigate fraud, and improve our systems. We do not provide Personal Data to unaffiliated parties for marketing purposes.</p>
                <p><strong>2. Data Protection and Privacy</strong></p>
                <p>a. Confidentiality: You will protect all Data received via the Services and only use it in connection with this Agreement. Neither party may use Personal Data for marketing without express consent. We may disclose Data if required by legal instruments (e.g., subpoena).</p>
                <p>b. Privacy Compliance: You affirm that you comply with all Laws governing the privacy and protection of the Data you provide to or access through the Services. You are responsible for obtaining all necessary consents from End-Users to allow us to collect, use, and disclose their Data.</p>
                <p>c. Data Processing Roles: You shall be the data controller, and we shall be the data intermediary. We will process the Personal Data only according to this Agreement and will implement appropriate measures to protect it.</p>
                <p>d. Data Mining: You may not mine the database or any part of it without our express consent.</p>
                <p><strong>3. Security Controls</strong></p>
                <p>We are responsible for protecting your Data using commercially reasonable administrative, technical, and physical security measures. However, no system is impenetrable. You agree that you are responsible for implementing your own firewall, anti-virus, anti-phishing, and other security measures ("Security Controls"). We may suspend your Account to maintain the integrity of the Services, and you waive the right to claim losses that result from such actions.</p>
                <h4 className="font-semibold">SECTION E: ADDITIONAL LEGAL TERMS</h4>
                <p><strong>1. Right to Amend</strong></p>
                <p>We can change or add to these terms at any time by posting the changes on our website. Your continued use of the Services constitutes your acceptance of the modified Agreement.</p>
                <p><strong>2. Assignment</strong></p>
                <p>You cannot assign this Agreement or your Account rights to anyone else without our prior written consent. We can assign this Agreement without your consent.</p>
                <p><strong>3. Force Majeure</strong></p>
                <p>Neither party will be liable for delays or non-performance caused by events beyond reasonable control, such as utility failures, acts of nature, or war. This does not excuse your obligation to pay fees.</p>
                <p><strong>4. Representations and Warranties</strong></p>
                <p>By agreeing, you warrant that:</p>
                <ul className="list-disc pl-5">
                    <li>You are eligible to use the Services and have the authority to enter this Agreement.</li>
                    <li>All information you provide is accurate and complete.</li>
                    <li>You will comply with all Laws.</li>
                    <li>You will not use the Services for fraudulent or illegal purposes.</li>
                </ul>
                <p><strong>5. No Warranties</strong></p>
                <p>We provide the Services and GoServePH IP "AS IS" and "AS AVAILABLE," without any express, implied, or statutory warranties of title, merchantability, fitness for a particular purpose, or non-infringement.</p>
                <p><strong>6. Limitation of Liability</strong></p>
                <p>We shall not be responsible or liable to you for any indirect, punitive, incidental, special, consequential, or exemplary damages resulting from your use or inability to use the Services, lost profits, personal injury, or property damage. We are not liable for damages arising from:</p>
                <ul className="list-disc pl-5">
                    <li>Hacking, tampering, or unauthorized access to your Account.</li>
                    <li>Your failure to implement Security Controls.</li>
                    <li>Use of the Services inconsistent with the Documentation.</li>
                    <li>Bugs, viruses, or interruptions to the Services.</li>
                </ul>
                <p>This Agreement and all incorporated policies constitute the entire agreement between you and GoServePH.</p>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
              <button 
                type="button" 
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                onClick={handleCloseTermsModal}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-gray-100">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Data Privacy Policy</h3>
              </div>
              <button 
                type="button" 
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-all duration-200"
                onClick={handleClosePrivacyModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
           <div className="px-6 py-4 space-y-4 text-sm leading-6">
              <h3 className="text-lg font-semibold">GoServePH Data Privacy Policy</h3>
                <p><strong>Protecting the information you and your users handle through our system is our highest priority.</strong> This policy outlines how GoServePH manages, secures, and uses your data.</p>
                <h4 className="font-semibold">1. How We Define and Use Data</h4>
                <p>In this policy, we define the types of data that flow through the GoServePH system:</p>
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr><th className="py-1 pr-4">Term</th><th className="py-1">Definition</th></tr>
                    </thead>
                    <tbody>
                        <tr><td className="py-1 pr-4">Personal Data</td><td className="py-1">Any information that can identify a specific person, whether directly or indirectly, shared or accessible through the Services.</td></tr>
                        <tr><td className="py-1 pr-4">User Data</td><td className="py-1">Information that describes your business operations, services, or internal activities.</td></tr>
                        <tr><td className="py-1 pr-4">GoServePH Data</td><td className="py-1">Details about transactions and activity on our platform, information used for fraud detection, aggregated data, and any non-personal information generated by our system.</td></tr>
                        <tr><td className="py-1 pr-4">DATA</td><td className="py-1">Used broadly to refer to all the above: Personal Data, User Data, and GoServePH Data.</td></tr>
                    </tbody>
                </table>
                <h4 className="font-semibold">Our Commitment to Data Use</h4>
                <p>We analyze and manage data only for the following critical purposes:</p>
                <ul className="list-disc pl-5">
                    <li>To provide, maintain, and improve the GoServePH Services for you and all other users.</li>
                    <li>To detect and mitigate fraud, financial loss, or other harm to you or other users.</li>
                    <li>To develop and enhance our products, systems, and tools.</li>
                </ul>
                <p>We will not sell or share Personal Data with unaffiliated parties for their marketing purposes. By using our system, you consent to our use of your Data in this manner.</p>
                <h4 className="font-semibold">2. Data Protection and Compliance</h4>
                <p><strong>Confidentiality</strong></p>
                <p>We commit to using Data only as permitted by our agreement or as specifically directed by you. You, in turn, must protect all Data you access through GoServePH and use it only in connection with our Services. Neither party may use Personal Data to market to third parties without explicit consent.</p>
                <p>We will only disclose Data when legally required to do so, such as through a subpoena, court order, or search warrant.</p>
                <p><strong>Privacy Compliance and Responsibilities</strong></p>
                <p><em>Your Legal Duty:</em> You affirm that you are, and will remain, compliant with all applicable Philippine laws (including the Data Privacy Act of 2012) governing the collection, protection, and use of the Data you provide to us.</p>
                <p><em>Consent:</em> You are responsible for obtaining all necessary rights and consents from your End-Users to allow us to collect, use, and store their Personal Data.</p>
                <p><em>End-User Disclosure:</em> You must clearly inform your End-Users that GoServePH processes transactions for you and may receive their Personal Data as part of that process.</p>
                <p><strong>Data Processing Roles</strong></p>
                <p>When we process Personal Data on your behalf, we operate under the following legal roles:</p>
                <ul className="list-disc pl-5">
                    <li>You are the Data Controller (you determine why and how the data is processed).</li>
                    <li>We are the Data Intermediary (we process data strictly according to your instructions).</li>
                </ul>
                <p>As the Data Intermediary, we commit to:</p>
                <ul className="list-disc pl-5">
                    <li>Implementing appropriate security measures to protect the Personal Data we process.</li>
                    <li>Not retaining Personal Data longer than necessary to fulfill the purposes set out in our agreement.</li>
                </ul>
                <p>You acknowledge that we rely entirely on your instructions. Therefore, we are not liable for any claims resulting from our actions that were based directly or indirectly on your instructions.</p>
                <p><strong>Prohibited Activities</strong></p>
                <p>You are strictly prohibited from data mining the GoServePH database or any portion of it without our express written permission.</p>
                <p><strong>Breach Notification</strong></p>
                <p>If we become aware of an unauthorized acquisition, disclosure, change, or loss of Personal Data on our systems (a "Breach"), we will notify you and provide sufficient information to help you mitigate any negative impact, consistent with our legal obligations.</p>
                <h4 className="font-semibold">3. Account Deactivation and Data Deletion</h4>
                <p><strong>Initiating Deactivation</strong></p>
                <p>If you wish to remove your personal information from our systems, you must go to your Edit Profile page and click the 'Deactivate Account' button. This action initiates the data deletion and account deactivation process.</p>
                <p><strong>Data Retention</strong></p>
                <p>Upon deactivation, all of your Personal Identifying Information will be deleted from our systems.</p>
                <p><em>Important Note:</em> Due to the nature of our role as a Government Services Management System, and for legal, accounting, and audit purposes, we are required to retain some of your non-personal account activity history and transactional records. You will receive a confirmation email once your request has been fully processed.</p>
                <h4 className="font-semibold">4. Security Controls and Responsibilities</h4>
                <p><strong>Our Security</strong></p>
                <p>We are responsible for implementing commercially reasonable administrative, technical, and physical procedures to protect Data from unauthorized access, loss, or modification. We comply with all applicable Laws in handling Data.</p>
                <p><strong>Your Security Controls</strong></p>
                <p>You acknowledge that no security system is perfect. You agree to implement your own necessary security measures ("Security Controls"), which must include:</p>
                <ul className="list-disc pl-5">
                    <li>Firewall and anti-virus systems.</li>
                    <li>Anti-phishing systems.</li>
                    <li>End-User and device management policies.</li>
                    <li>Data handling protocols.</li>
                </ul>
                <p>We reserve the right to suspend your Account or the Services if necessary to maintain system integrity and security, or to prevent harm. You waive any right to claim losses that result from a Breach or any action we take to prevent harm.</p>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
              <button 
                type="button" 
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                onClick={handleClosePrivacyModal}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">OTP Verification</h3>
              </div>
              <button 
                type="button" 
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-all duration-200"
                onClick={closeOtpModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border-2 border-green-200">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Enter Verification Code</h4>
                <p className="text-gray-500 text-sm">
                  A 6-digit verification code has been sent to <span className="font-semibold text-gray-700">{otpTargetEmail}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    6-Digit OTP Code
                  </label>
                  <div className="flex justify-between space-x-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* OTP Error/Success Messages */}
                {otpError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {otpError}
                  </div>
                )}
                {otpSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {otpSuccess}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || isResending}
                    className={`text-sm font-medium ${
                      countdown > 0 || isResending
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-800 transition-colors'
                    }`}
                  >
                    {isResending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Verify OTP
                </button>
              </form>

              <div className="p-4 rounded-xl border bg-amber-50 border-amber-200">
                <h5 className="text-sm font-semibold mb-2 text-amber-800 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-amber-600" />
                  Security Notice
                </h5>
                <ul className="text-xs space-y-1.5 text-amber-700">
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-amber-500">&#8226;</span> Never share your OTP with anyone</li>
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-amber-500">&#8226;</span> This OTP will expire in 10 minutes</li>
                  <li className="flex items-start gap-1.5"><span className="mt-0.5 text-amber-500">&#8226;</span> Contact support if you didn't request this code</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />

      {/* Custom Animations */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 6s ease infinite;
        }
      `}</style>
    </div>
  );
}