import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import Swal from "sweetalert2";
import { logPermitSubmission } from '../../../services/ActivityLogger';

const COLORS = {
  primary: '#4A90E2', // Blue for title
  secondary: '#000000', // Black for subheadings and text
  accent: '#FDA811',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

export default function ProfessionalRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const professions = {
    Architect: ["Designer of Record", "Interior Design Consultant", "Landscape Designer", "Consultant"],
    "Civil Engineer": ["Designer of Record", "Structural Designer", "Inspector / Supervisor", "Contractor"],
    "Structural Engineer": ["Structural Designer", "Inspector / Supervisor", "Consultant"],
    "Electrical Engineer": ["Electrical Designer", "Inspector / Supervisor", "Consultant"],
    "Mechanical Engineer": ["Mechanical Designer", "Consultant"],
    "Electronics Engineer": ["Electronics Designer", "Consultant"],
    "Sanitary Engineer": ["Sanitary / Plumbing Designer", "Consultant"],
    "Master Plumber": ["Plumbing Designer", "Consultant"],
    "Geodetic Engineer": ["Surveyor"],
    "Interior Designer": ["Interior Design Consultant"],
    "Landscape Architect": ["Landscape Designer"],
    "Environmental Planner": ["Environmental Consultant"],
    "Fire Protection Engineer": ["Fire Safety Consultant"],
    Contractor: ["Contractor"],
  };

  const steps = [
    { id: 1, title: "Personal Information", description: "Basic personal details" },
    { id: 2, title: "Credentials & Specialization", description: "License and profession details" },
    { id: 3, title: "Uploads", description: "Required documents" },
    { id: 4, title: "Declaration & Approval", description: "Review and submit" }
  ];

  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    first_name: "",
    middle_initial: "",
    last_name: "",
    suffix: "",
    birth_date: "",
    contact_number: "",
    email: "",
    // Step 2: Combined Credentials & Specialization
    prc_license: "",
    prc_expiry: "",
    ptr_number: "",
    tin: "",
    profession: "",
    role: "",
    // Step 3: Uploads
    prc_id_file: null,
    ptr_file: null,
    signature_file: null,
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else if (name === "contact_number") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      setFormData(prev => ({
        ...prev,
        [name]: onlyNums
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.first_name || formData.first_name.trim() === '') newErrors.first_name = 'First name is required';
      if (!formData.last_name || formData.last_name.trim() === '') newErrors.last_name = 'Last name is required';
      if (!formData.birth_date) newErrors.birth_date = 'Birth date is required';
      if (!formData.contact_number || formData.contact_number.trim() === '') newErrors.contact_number = 'Contact number is required';
      if (!formData.email || formData.email.trim() === '') newErrors.email = 'Email is required';
    }
    if (step === 2) {
      if (!formData.prc_license || formData.prc_license.trim() === '') newErrors.prc_license = 'PRC License is required';
      if (!formData.prc_expiry) newErrors.prc_expiry = 'PRC Expiry is required';
      if (!formData.ptr_number || formData.ptr_number.trim() === '') newErrors.ptr_number = 'PTR Number is required';
      if (!formData.tin || formData.tin.trim() === '') newErrors.tin = 'TIN is required';
      if (!formData.profession) newErrors.profession = 'Profession is required';
      if (!formData.role) newErrors.role = 'Role is required';
    }
    if (step === 3) {
      if (!formData.prc_id_file) newErrors.prc_id_file = 'PRC ID is required';
      if (!formData.ptr_file) newErrors.ptr_file = 'PTR is required';
      if (!formData.signature_file) newErrors.signature_file = 'Signature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (step) => {
    if (step === 1) {
      if (!formData.first_name || formData.first_name.trim() === '') return false;
      if (!formData.last_name || formData.last_name.trim() === '') return false;
      if (!formData.birth_date) return false;
      if (!formData.contact_number || formData.contact_number.trim() === '') return false;
      if (!formData.email || formData.email.trim() === '') return false;
      return true;
    }
    if (step === 2) {
      if (!formData.prc_license || formData.prc_license.trim() === '') return false;
      if (!formData.prc_expiry) return false;
      if (!formData.ptr_number || formData.ptr_number.trim() === '') return false;
      if (!formData.tin || formData.tin.trim() === '') return false;
      if (!formData.profession) return false;
      if (!formData.role) return false;
      return true;
    }
    if (step === 3) {
      if (!formData.prc_id_file) return false;
      if (!formData.ptr_file) return false;
      if (!formData.signature_file) return false;
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      const ok = validateStep(currentStep);
      if (ok) {
        setCurrentStep(currentStep + 1);
        setErrors({});
      }
    }
  };

  const handleFinalStep = async (e) => {
    e.preventDefault();
    const ok = validateStep(currentStep);
    if (ok) {
      const result = await Swal.fire({
        title: 'Confirm Registration',
        html: `
          <div style="font-family: ${COLORS.font}; text-align: left;">
            <p class="mb-3">Are you sure you want to submit your professional registration?</p>
            <div class="bg-gray-50 p-3 rounded text-sm">
              <p><strong>Name:</strong> ${formData.first_name} ${formData.last_name}</p>
              <p><strong>Profession:</strong> ${formData.profession}</p>
              <p><strong>PRC License:</strong> ${formData.prc_license}</p>
            </div>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Submit',
        cancelButtonText: 'Cancel',
        confirmButtonColor: COLORS.accent,
        cancelButtonColor: '#9CA3AF',
        customClass: {
          popup: 'swal-wide'
        }
      });
      
      if (result.isConfirmed) {
        handleSubmit(e);
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (currentStep < steps.length) {
      nextStep();
    } else {
      handleFinalStep(e);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    
    // Validate all steps
    const step1Ok = validateStep(1);
    const step2Ok = validateStep(2);
    const step3Ok = validateStep(3);
    
    if (!(step1Ok && step2Ok && step3Ok)) {
      setIsSubmitting(false);
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please complete all required fields in all steps.',
        confirmButtonColor: COLORS.primary
      });
      if (!step1Ok) setCurrentStep(1);
      else if (!step2Ok) setCurrentStep(2);
      else setCurrentStep(3);
      return;
    }

    // Show loading
    Swal.fire({
      title: 'Submitting Registration...',
      html: 'Please wait while we process your professional registration.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('middle_initial', formData.middle_initial || '');
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('suffix', formData.suffix || '');
      formDataToSend.append('birth_date', formData.birth_date);
      formDataToSend.append('contact_number', formData.contact_number);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('prc_license', formData.prc_license);
      formDataToSend.append('prc_expiry', formData.prc_expiry);
      formDataToSend.append('ptr_number', formData.ptr_number);
      formDataToSend.append('tin', formData.tin);
      formDataToSend.append('profession', formData.profession);
      formDataToSend.append('role', formData.role);
      
      // Add user_id from localStorage if available
      const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
      if (userId) {
        formDataToSend.append('user_id', userId);
      }
      
      // Add file uploads
      if (formData.prc_id_file) {
        formDataToSend.append('prc_id_file', formData.prc_id_file);
      }
      if (formData.ptr_file) {
        formDataToSend.append('ptr_file', formData.ptr_file);
      }
      if (formData.signature_file) {
        formDataToSend.append('signature_file', formData.signature_file);
      }
      
      // Submit to backend
      const response = await fetch('/backend/building_permit/professional_registration.php', {
        method: 'POST',
        body: formDataToSend
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setIsSubmitting(false);
        logPermitSubmission("Building Permit", result.data?.registration_id || "", { permit_type: "Professional Registration" });
        
        Swal.fire({
          icon: 'success',
          title: 'Registration Submitted!',
          html: `
            <div style="font-family: ${COLORS.font};">
              <p class="mb-2">Your professional registration has been submitted successfully.</p>
              <p class="text-sm text-gray-600">You will receive a confirmation email shortly.</p>
              <div class="mt-3 p-3 bg-green-50 rounded text-sm">
                <p><strong>Registration ID:</strong> ${result.data.registration_id}</p>
                <p><strong>Status:</strong> ${result.data.status}</p>
              </div>
            </div>
          `,
          confirmButtonColor: COLORS.success,
          confirmButtonText: 'Back to Dashboard'
        }).then(() => {
          navigate('/user/dashboard');
        });
      } else {
        throw new Error(result.message || 'Submission failed');
      }
      
    } catch (error) {
      console.error('Submission error:', error);
      setIsSubmitting(false);
      
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.message || 'Failed to submit professional registration. Please try again.',
        confirmButtonColor: COLORS.danger
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>First Name *</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.first_name ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.first_name && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.first_name}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Middle Initial</label>
                <input type="text" name="middle_initial" value={formData.middle_initial} onChange={handleChange} className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Last Name *</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.last_name ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.last_name && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.last_name}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Suffix</label>
                <input type="text" name="suffix" value={formData.suffix} onChange={handleChange} className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Birth Date *</label>
                <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.birth_date ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.birth_date && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.birth_date}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Contact Number *</label>
                <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.contact_number ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.contact_number && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.contact_number}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.email ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.email && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.email}</p>}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Credentials & Specialization</h3>
            
            {/* Professional Credentials */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4" style={{ color: COLORS.secondary }}>Professional Credentials</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>PRC License Number *</label>
                  <input type="text" name="prc_license" value={formData.prc_license} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.prc_license ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                  {errors.prc_license && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.prc_license}</p>}
                </div>
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>PRC Expiry Date *</label>
                  <input type="date" name="prc_expiry" value={formData.prc_expiry} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.prc_expiry ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                  {errors.prc_expiry && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.prc_expiry}</p>}
                </div>
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>PTR Number *</label>
                  <input type="text" name="ptr_number" value={formData.ptr_number} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.ptr_number ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                  {errors.ptr_number && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.ptr_number}</p>}
                </div>
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>TIN *</label>
                  <input type="text" name="tin" value={formData.tin} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.tin ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                  {errors.tin && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.tin}</p>}
                </div>
              </div>
            </div>

            {/* Specialization */}
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: COLORS.secondary }}>Specialization</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Profession *</label>
                  <select name="profession" value={formData.profession} onChange={(e) => { handleChange(e); setFormData((prev) => ({ ...prev, role: "" })); }} className={`w-full p-3 border border-black rounded-lg ${errors.profession ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} required>
                    <option value="">Select profession</option>
                    {Object.keys(professions).map((prof) => (
                      <option key={prof} value={prof}>{prof}</option>
                    ))}
                  </select>
                  {errors.profession && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.profession}</p>}
                </div>
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Role in Project *</label>
                  <select name="role" value={formData.role} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.role ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} required disabled={!formData.profession}>
                    <option value="">Select role</option>
                    {formData.profession && professions[formData.profession].map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {errors.role && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.role}</p>}
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Required Documents</h3>
            
            <div className="space-y-4">
              {/* PRC ID */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                  PRC ID (Professional Regulation Commission ID) *
                </label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input
                    type="file"
                    name="prc_id_file"
                    onChange={handleChange}
                    className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    style={{ fontFamily: COLORS.font }}
                  />
                </div>
                {errors.prc_id_file && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.prc_id_file}</p>}
              </div>

              {/* PTR */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                  PTR (Professional Tax Receipt) *
                </label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input
                    type="file"
                    name="ptr_file"
                    onChange={handleChange}
                    className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    style={{ fontFamily: COLORS.font }}
                  />
                </div>
                {errors.ptr_file && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.ptr_file}</p>}
              </div>

              {/* Signature */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                  Digital Signature *
                </label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input
                    type="file"
                    name="signature_file"
                    onChange={handleChange}
                    className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    style={{ fontFamily: COLORS.font }}
                  />
                </div>
                {errors.signature_file && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.signature_file}</p>}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Declaration & Approval</h3>
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <h4 className="font-bold mb-4 text-lg" style={{ color: COLORS.secondary }}>Review Your Registration</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: COLORS.secondary }}>Personal Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm" style={{ fontFamily: COLORS.font }}>
                    <p><strong>First Name:</strong> {formData.first_name}</p>
                    <p><strong>Middle Initial:</strong> {formData.middle_initial || 'N/A'}</p>
                    <p><strong>Last Name:</strong> {formData.last_name}</p>
                    <p><strong>Suffix:</strong> {formData.suffix || 'N/A'}</p>
                    <p><strong>Birth Date:</strong> {formData.birth_date}</p>
                    <p><strong>Contact Number:</strong> {formData.contact_number}</p>
                    <p className="md:col-span-2"><strong>Email:</strong> {formData.email}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-2" style={{ color: COLORS.secondary }}>Professional Credentials</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm" style={{ fontFamily: COLORS.font }}>
                    <p><strong>PRC License:</strong> {formData.prc_license}</p>
                    <p><strong>PRC Expiry:</strong> {formData.prc_expiry}</p>
                    <p><strong>PTR Number:</strong> {formData.ptr_number}</p>
                    <p><strong>TIN:</strong> {formData.tin}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-2" style={{ color: COLORS.secondary }}>Specialization</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm" style={{ fontFamily: COLORS.font }}>
                    <p><strong>Profession:</strong> {formData.profession}</p>
                    <p><strong>Role:</strong> {formData.role}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-2" style={{ color: COLORS.secondary }}>Uploaded Documents</h5>
                  <ul className="text-sm space-y-1" style={{ fontFamily: COLORS.font }}>
                    {formData.prc_id_file && <li>✓ PRC ID: {formData.prc_id_file.name}</li>}
                    {formData.ptr_file && <li>✓ PTR: {formData.ptr_file.name}</li>}
                    {formData.signature_file && <li>✓ Signature: {formData.signature_file.name}</li>}
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Declaration:</p>
                <p className="text-sm" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>I hereby declare that all information provided is true and correct to the best of my knowledge. I understand that any false information may result in the rejection of my registration.</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-1 mt-1 p-6 rounded-lg min-h-screen" style={{ background: COLORS.background, color: COLORS.secondary, fontFamily: COLORS.font }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary }}>PROFESSIONAL REGISTRATION</h1>
          <p className="mt-2" style={{ color: COLORS.secondary }}>
            Register as a licensed professional or engineer to be accredited for building projects.
          </p>
        </div>
        <button
          onClick={() => navigate('/user/building/type')}
          style={{ background: COLORS.primary, color: '#fff' }}
          className="px-4 py-2 rounded-lg transition-colors hover:bg-[#FDA811] font-medium"
        >
          Back to Permits
        </button>
      </div>

      {/* Progress Steps - Oval Design */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`flex items-center justify-center rounded-full border-2 font-semibold transition-all duration-300 ${
                  currentStep >= step.id ? 'text-white' : 'text-gray-500'
                }`}
                style={{
                  background: currentStep >= step.id ? COLORS.primary : 'transparent',
                  borderColor: currentStep >= step.id ? COLORS.primary : '#9CA3AF',
                  width: '45px',
                  height: '30px',
                  borderRadius: '20px',
                  fontFamily: COLORS.font
                }}
              >
                {step.id}
              </div>
              <div className="ml-3 hidden md:block">
                <p 
                  className="text-sm font-medium" 
                  style={{ 
                    color: currentStep >= step.id ? COLORS.primary : COLORS.secondary,
                    fontFamily: COLORS.font
                  }}
                >
                  {step.title}
                </p>
                <p className="text-xs" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div 
                  className="hidden md:block w-16 h-0.5 mx-4" 
                  style={{ background: currentStep > step.id ? COLORS.primary : '#9CA3AF' }} 
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {submitStatus && (
        <div className={`p-4 mb-6 rounded ${
          submitStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`} style={{ fontFamily: COLORS.font }}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-8">
        {renderStepContent()}

        <div className="flex justify-between pt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              style={{ background: '#9CA3AF', color: '#fff' }}
              className="px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Previous
            </button>
          )}

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
              style={{ background: !isStepValid(currentStep) ? '#9CA3AF' : COLORS.primary, color: '#fff' }}
              className={`px-6 py-3 rounded-lg font-semibold ${!isStepValid(currentStep) ? 'cursor-not-allowed' : 'hover:bg-blue-700 transition-colors'}`}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !(isStepValid(1) && isStepValid(2) && isStepValid(3))}
              style={{ background: (isSubmitting || !(isStepValid(1) && isStepValid(2) && isStepValid(3))) ? '#9CA3AF' : COLORS.accent, color: '#fff' }}
              className={`px-6 py-3 rounded-lg font-semibold ${(isSubmitting || !(isStepValid(1) && isStepValid(2) && isStepValid(3))) ? 'cursor-not-allowed' : 'hover:bg-orange-600 transition-colors'}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          )}
        </div>
      </form>

    </div>
  );
}