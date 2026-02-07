import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sendOtp, verifyOtp, registerUser } from "../../services/AuthService";
import Footer from '../../components/user/Footer';

export default function Register() {
  const [time, setTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  
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
  const [pendingRegistration, setPendingRegistration] = useState(null);
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpTargetEmail, setOtpTargetEmail] = useState("");
  
  const [formErrors, setFormErrors] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    if (name === "mobile") {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setRegisterForm(prev => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setRegisterForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNoMiddleNameChange = (e) => {
    setNoMiddleName(e.target.checked);
    setRegisterForm(prev => ({
      ...prev,
      middleName: e.target.checked ? "N/A" : ""
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!registerForm.firstName.trim()) errors.firstName = "First name is required";
    if (!registerForm.lastName.trim()) errors.lastName = "Last name is required";
    if (!noMiddleName && !registerForm.middleName.trim()) errors.middleName = "Middle name is required";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!registerForm.regEmail.trim()) {
      errors.regEmail = "Email is required";
    } else if (!emailRegex.test(registerForm.regEmail)) {
      errors.regEmail = "Please enter a valid email address";
    }
    
    if (!registerForm.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(registerForm.mobile)) {
      errors.mobile = "Mobile number must be 10 digits (e.g., 9123456789)";
    }
    
    if (!registerForm.birthdate) errors.birthdate = "Birthdate is required";
    
    if (!registerForm.address.trim()) errors.address = "Address is required";
    if (!registerForm.houseNumber.trim()) errors.houseNumber = "House number is required";
    if (!registerForm.street.trim()) errors.street = "Street is required";
    if (!registerForm.barangay.trim()) errors.barangay = "Barangay is required";
    
    if (!registerForm.regPassword) {
      errors.regPassword = "Password is required";
    } else if (registerForm.regPassword.length < 10) {
      errors.regPassword = "Password must be at least 10 characters";
    }
    
    if (!registerForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (registerForm.regPassword !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    if (!agreeTerms) errors.agreeTerms = "You must agree to the Terms of Service";
    if (!agreePrivacy) errors.agreePrivacy = "You must agree to the Privacy Policy";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      alert("Please agree to both Terms of Service and Privacy Policy");
      return;
    }

    try {
      const otpResponse = await sendOtp(registerForm.regEmail, "register");

      if (!otpResponse.success) {
        alert(otpResponse.message || "Failed to send OTP");
        return;
      }

      setOtpTargetEmail(registerForm.regEmail);
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setOtpSuccess("");
      setShowOtpModal(true);
      setCountdown(30);

setPendingRegistration({
  email: registerForm.regEmail,
  password: registerForm.regPassword,
  firstName: registerForm.firstName,
  lastName: registerForm.lastName,
  middleName: noMiddleName ? "N/A" : registerForm.middleName,
  suffix: registerForm.suffix || "", // Send empty string if no suffix
  birthdate: registerForm.birthdate,
  mobile_number: registerForm.mobile, // Remove +63 prefix, backend doesn't expect it
  house_number: registerForm.houseNumber,
  street: registerForm.street,
  barangay: registerForm.barangay,
  // Remove the 'address' field since backend doesn't use it
  city_municipality: "Default City",
  province: "Default Province",
  region: "Default Region",
  zip_code: null

      });
    } catch (err) {
      console.error(err);
      alert("An error occurred while sending OTP");
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
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
      
      const lastInput = document.getElementById(`otp-5`);
      if (lastInput) lastInput.focus();
    }
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

  if (!otpTargetEmail) {
    setOtpError("No OTP request in progress. Please try again.");
    return;
  }

  try {
    const response = await verifyOtp(otpTargetEmail, otpString, "register");
    
    if (!response.success) {
      setOtpError(response.message || "Invalid OTP");
      return;
    }

    setOtpSuccess("OTP verified successfully! Completing registration...");
    
    if (pendingRegistration) {
      // Debug: Log what we're sending
      console.log("Registration data:", pendingRegistration);
      
      const registerResponse = await registerUser(pendingRegistration);
      
      // Debug: Log the response
      console.log("Registration response:", registerResponse);
      
      if (registerResponse.success) {
        // Store the token from registration response
        if (registerResponse.token) {
          localStorage.setItem("auth_token", registerResponse.token);
          localStorage.setItem("email", pendingRegistration.email);
          localStorage.setItem("goserveph_role", "user");
          localStorage.setItem("goserveph_user_id", registerResponse.user_id);
          localStorage.setItem("goserveph_email", pendingRegistration.email);
          
          if (pendingRegistration.firstName) {
            localStorage.setItem("goserveph_user_name", `${pendingRegistration.firstName} ${pendingRegistration.lastName}`);
          }
          
          sessionStorage.setItem("user_id", registerResponse.user_id);
          sessionStorage.setItem("user_email", pendingRegistration.email);
          sessionStorage.setItem("role", "user");
          
          setOtpSuccess("Registration completed successfully! Redirecting to dashboard...");
          
          setTimeout(() => {
            closeOtpModal();
            resetRegistrationForm();
            navigate("/user/dashboard");
          }, 500);
        } else {
          setOtpError("No token received from registration. Please try logging in manually.");
        }
      } else {
        setOtpError(registerResponse.message || "Registration failed after OTP verification");
      }
    } else {
      setOtpError("Registration data not found. Please try again.");
    }
    
  } catch (err) {
    console.error("Registration error:", err);
    setOtpError("Network error while verifying OTP");
  }
};

  const handleResendOtp = async () => {
    if (countdown > 0 || !otpTargetEmail) return;

    setIsResending(true);
    setOtpError("");
    setOtpSuccess("Resending OTP...");

    try {
      const otpResponse = await sendOtp(otpTargetEmail, "register");

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
    setOtpTargetEmail("");
    setCountdown(0);
    setIsResending(false);
    setPendingRegistration(null);
  };

  const resetRegistrationForm = () => {
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
    setFormErrors({});
  };

  const handleOpenTerms = () => setShowTermsModal(true);
  const handleCloseTermsModal = () => setShowTermsModal(false);
  const handleOpenPrivacy = () => setShowPrivacyModal(true);
  const handleClosePrivacyModal = () => setShowPrivacyModal(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
      <div className="fixed inset-0 z-0 bg-[url('/GovServePH.png')] bg-center bg-contain bg-no-repeat opacity-15"></div>

      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(76,175,80,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(74,144,226,0.1)_0%,transparent_50%),radial-gradient(circle_at_40%_40%,rgba(253,168,17,0.05)_0%,transparent_50%)] animate-pulse"></div>
      </div>

      <header
        className={`sticky top-0 z-50 bg-white shadow-sm border-b-4 border-[#FDA811] transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
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

      <main className="relative z-10 container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create your GoServePH Account
            </h1>
            <p className="text-gray-600">
              Fill in all required information to register for your account
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 border border-white/20">
            <form id="registerForm" className="space-y-6" onSubmit={handleRegisterSubmit}>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      First Name<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="firstName"
                      name="firstName" 
                      required 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      value={registerForm.firstName}
                      onChange={handleRegisterInputChange}
                      placeholder="Enter your first name"
                    />
                    {formErrors.firstName && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Last Name<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="lastName"
                      name="lastName" 
                      required 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      value={registerForm.lastName}
                      onChange={handleRegisterInputChange}
                      placeholder="Enter your last name"
                    />
                    {formErrors.lastName && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Middle Name<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="middleName"
                      name="middleName" 
                      required 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.middleName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      value={registerForm.middleName}
                      onChange={handleRegisterInputChange}
                      disabled={noMiddleName}
                      placeholder="Enter your middle name"
                    />
                    <label className="inline-flex items-center mt-2 text-sm">
                      <input 
                        type="checkbox" 
                        id="noMiddleName" 
                        className="mr-2"
                        checked={noMiddleName}
                        onChange={handleNoMiddleNameChange}
                      /> 
                      No middle name
                    </label>
                    {formErrors.middleName && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.middleName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Suffix</label>
                    <input 
                      type="text" 
                      name="suffix" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      value={registerForm.suffix}
                      onChange={handleRegisterInputChange}
                      placeholder="Jr., Sr., III (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Birthdate<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      id="birthdate"
                      name="birthdate" 
                      required 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.birthdate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      value={registerForm.birthdate}
                      onChange={handleRegisterInputChange}
                    />
                    {formErrors.birthdate && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.birthdate}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email Address<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      id="regEmail"
                      name="regEmail" 
                      required 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.regEmail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      value={registerForm.regEmail}
                      onChange={handleRegisterInputChange}
                      placeholder="your.email@example.com"
                    />
                    {formErrors.regEmail && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.regEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Mobile Number<span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 px-3 py-3 bg-gray-50 border border-gray-300 border-r-0 rounded-l-lg text-gray-600 text-sm h-[52px] flex items-center">
                        +63
                      </div>
                      <input 
                        type="tel" 
                        id="mobile"
                        name="mobile" 
                        required 
                        maxLength="10"
                        className={`w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:border-transparent transition-all duration-200 h-[52px] ${
                          formErrors.mobile ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                        }`}
                        value={registerForm.mobile}
                        onChange={handleRegisterInputChange}
                        placeholder="9123456789"
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      {formErrors.mobile ? (
                        <p className="text-xs text-red-600">{formErrors.mobile}</p>
                      ) : (
                        <p className="text-xs text-gray-500">Format: 9XXXXXXXXX (10 digits)</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {registerForm.mobile.length}/10 digits
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      House #<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="houseNumber"
                      name="houseNumber" 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.houseNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      value={registerForm.houseNumber}
                      onChange={handleRegisterInputChange}
                      placeholder="123"
                    />
                    {formErrors.houseNumber && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.houseNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Street<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="street"
                      name="street" 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.street ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      value={registerForm.street}
                      onChange={handleRegisterInputChange}
                      placeholder="Main Street"
                    />
                    {formErrors.street && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.street}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Barangay<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="barangay"
                      name="barangay" 
                      required 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.barangay ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      value={registerForm.barangay}
                      onChange={handleRegisterInputChange}
                      placeholder="Enter your barangay"
                    />
                    {formErrors.barangay && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.barangay}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Full Address<span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="address"
                      name="address" 
                      required 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      value={registerForm.address}
                      onChange={handleRegisterInputChange}
                      placeholder="Lot/Unit, Building, Subdivision, etc."
                    />
                    {formErrors.address && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Security Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="password" 
                        id="regPassword"
                        name="regPassword" 
                        minLength="10" 
                        required 
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 pr-12 ${
                          formErrors.regPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                        }`}
                        value={registerForm.regPassword}
                        onChange={handleRegisterInputChange}
                        placeholder="At least 10 characters"
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                        onClick={() => {
                          const input = document.getElementById('regPassword');
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                    {formErrors.regPassword && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.regPassword}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum 10 characters with letters and numbers
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Confirm Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="password" 
                        id="confirmPassword"
                        name="confirmPassword" 
                        minLength="10" 
                        required 
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 pr-12 ${
                          formErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                        }`}
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterInputChange}
                        placeholder="Re-enter your password"
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                        onClick={() => {
                          const input = document.getElementById('confirmPassword');
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start">
                  <input 
                    type="checkbox" 
                    id="agreeTerms" 
                    className="mt-1 mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    required
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (formErrors.agreeTerms) {
                        setFormErrors(prev => ({ ...prev, agreeTerms: "" }));
                      }
                    }}
                  />
                  <label htmlFor="agreeTerms" className="text-sm">
                    I have read, understood, and agreed to the{' '}
                    <button 
                      type="button" 
                      className="text-green-600 hover:underline font-medium"
                      onClick={handleOpenTerms}
                    >
                      Terms of Use
                    </button>
                  </label>
                </div>
                {formErrors.agreeTerms && (
                  <p className="ml-7 text-xs text-red-600">{formErrors.agreeTerms}</p>
                )}

                <div className="flex items-start">
                  <input 
                    type="checkbox" 
                    id="agreePrivacy" 
                    className="mt-1 mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    required
                    checked={agreePrivacy}
                    onChange={(e) => {
                      setAgreePrivacy(e.target.checked);
                      if (formErrors.agreePrivacy) {
                        setFormErrors(prev => ({ ...prev, agreePrivacy: "" }));
                      }
                    }}
                  />
                  <label htmlFor="agreePrivacy" className="text-sm">
                    I have read, understood, and agreed to the{' '}
                    <button 
                      type="button" 
                      className="text-green-600 hover:underline font-medium"
                      onClick={handleOpenPrivacy}
                    >
                      Data Privacy Policy
                    </button>
                  </label>
                </div>
                {formErrors.agreePrivacy && (
                  <p className="ml-7 text-xs text-red-600">{formErrors.agreePrivacy}</p>
                )}

                <p className="text-xs text-gray-600 mt-2 pl-7">
                  By clicking on the register button below, I hereby agree to both the Terms of Use and Data Privacy Policy
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto text-center text-blue-600 hover:text-blue-800 font-medium transition-colors py-2 px-4 rounded-lg border border-gray-300 hover:border-blue-300"
                >
                  ← Back to Login
                </Link>
                
                <button 
                  type="submit" 
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-orange-500 hover:to-orange-600 text-white py-3 px-8 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Register Account
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                <h3 className="text-sm font-medium mb-2 text-blue-800">Registration Guidelines:</h3>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• All fields marked with * are required</li>
                  <li>• Password must be at least 10 characters long</li>
                  <li>• Mobile number must be 10 digits (e.g., 9123456789)</li>
                  <li>• A verification OTP will be sent to your email</li>
                  <li>• Ensure your email address is correct and accessible</li>
                  <li>• Your mobile number will be used for important notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">GoServePH Terms of Service Agreement</h3>
              <button 
                type="button" 
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={handleCloseTermsModal}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                        <tr><td className="py-1 pr-4">Section E</td><td className="py-1">Additional Legal Terms and Disputes</td></tr>
                    </tbody>
                </table>
                <p>By proceeding with registration, you acknowledge that you have read and agreed to these terms.</p>
            </div>
            <div className="border-t px-6 py-3 flex justify-end">
              <button 
                type="button" 
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-orange-500 transition-colors"
                onClick={handleCloseTermsModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">GoServePH Data Privacy Policy</h3>
              <button 
                type="button" 
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={handleClosePrivacyModal}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
           <div className="px-6 py-4 space-y-4 text-sm leading-6">
              <h3 className="text-lg font-semibold">GoServePH Data Privacy Policy</h3>
                <p><strong>Protecting the information you and your users handle through our system is our highest priority.</strong> This policy outlines how GoServePH manages, secures, and uses your data.</p>
                <p>We collect personal information such as your name, email address, mobile number, and address to provide you with our services. Your data is stored securely and used only for the purposes of account management, service delivery, and communication related to your use of GoServePH.</p>
                <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                <p>By registering, you consent to the collection and use of your information as described in this policy.</p>
            </div>
            <div className="border-t px-6 py-3 flex justify-end">
              <button 
                type="button" 
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-orange-500 transition-colors"
                onClick={handleClosePrivacyModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Email Verification</h3>
              <button 
                type="button" 
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={closeOtpModal}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Verify Your Email</h4>
                <p className="text-gray-600 text-sm">
                  A 6-digit verification code has been sent to:
                  <br />
                  <span className="font-medium">{otpTargetEmail}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    6-Digit Verification Code
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
                    {isResending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-orange-500 hover:to-orange-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Verify & Complete Registration
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
      
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