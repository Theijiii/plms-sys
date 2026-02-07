import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ArrowLeft, Building, FileText, MapPin, User, 
  CheckCircle, AlertCircle, FileCheck, Upload, Check, X, Eye, 
  XCircle, Info, FileSignature, Calendar, Clock, Award, Shield, 
  Store, CreditCard, Home, Package, Truck, Users, RefreshCw, Edit,
  ClipboardCheck, FileSearch, CalendarDays, AlertTriangle, Loader2
} from "lucide-react";

const COLORS = {
  primary: '#4A90E2',
  secondary: '#000000',
  accent: '#FDA811',
  success: '#4CAF50',
  danger: '#E53935',
  warning: '#FF9800',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

export default function BusinessSpecialPermitApplication() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [showPreview, setShowPreview] = useState({});
  const [errors, setErrors] = useState({});
  const [applicantId, setApplicantId] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const navigate = useNavigate();

  // Get current date for submission
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get tomorrow's date for minimum date selection
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get applicant_id from localStorage on component mount
  useEffect(() => {
    const id = localStorage.getItem('userId') || 
               localStorage.getItem('user_id') || 
               localStorage.getItem('applicant_id') || 
               'USER001';
    setApplicantId(id);
  }, []);

  const steps = [
    { id: 1, title: 'Applicant Information', description: 'Business owner details' },
    { id: 2, title: 'Event Details', description: 'Special permit information' },
    { id: 3, title: 'Documents', description: 'Upload required documents' },
    { id: 4, title: 'Review & Submit', description: 'Review and submit application' }
  ];

  const [formData, setFormData] = useState({
    // Applicant Information
    business_name: '',
    owner_first_name: '',
    owner_last_name: '',
    owner_middle_name: '',
    owner_address: '',
    contact_number: '',
    email_address: '',
    
    // Special Permit Details
    special_permit_type: '',
    event_description: '',
    event_date_start: '',
    event_date_end: '',
    event_location: '',
    estimated_attendees: '',
    
    // Documents
    event_permit: null,
    barangay_clearance: null,
    valid_id: null,
    
    // Declaration
    applicant_signature: '',
    declaration_agreed: false,
    
    // System fields
    applicant_id: '',
    date_submitted: getCurrentDate(),
    time_submitted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  // Initialize with applicant_id
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      applicant_id: applicantId
    }));
  }, [applicantId]);

  const specialPermitTypes = [
    'Temporary Event Permit',
    'Seasonal Business Permit',
    'Pop-up Store Permit',
    'Trade Fair / Bazaar Permit',
    'Festival / Concert Permit',
    'Food Cart / Mobile Vendor Permit',
    'Construction Site Permit',
    'Promotional Event Permit',
    'Other Special Permit'
  ];

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file || null
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle signature upload
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, applicant_signature: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.business_name.trim()) newErrors.business_name = 'Business name is required';
      if (!formData.owner_first_name.trim()) newErrors.owner_first_name = 'First name is required';
      if (!formData.owner_last_name.trim()) newErrors.owner_last_name = 'Last name is required';
      if (!formData.owner_address.trim()) newErrors.owner_address = 'Address is required';
      if (!formData.contact_number.trim()) newErrors.contact_number = 'Contact number is required';
      if (!formData.email_address.trim()) newErrors.email_address = 'Email is required';
    }
    
    if (step === 2) {
      if (!formData.special_permit_type) newErrors.special_permit_type = 'Permit type is required';
      if (!formData.event_date_start) newErrors.event_date_start = 'Start date is required';
      if (!formData.event_date_end) newErrors.event_date_end = 'End date is required';
      if (formData.event_date_start && formData.event_date_start < getTomorrowDate()) {
        newErrors.event_date_start = 'Start date must be in the future';
      }
      if (formData.event_date_end && formData.event_date_end < getTomorrowDate()) {
        newErrors.event_date_end = 'End date must be in the future';
      }
      if (formData.event_date_start && formData.event_date_end && formData.event_date_end < formData.event_date_start) {
        newErrors.event_date_end = 'End date must be after start date';
      }
      if (!formData.event_location.trim()) newErrors.event_location = 'Location is required';
    }
    
    if (step === 3) {
      if (!formData.barangay_clearance) newErrors.barangay_clearance = 'Barangay clearance is required';
      if (!formData.valid_id) newErrors.valid_id = 'Valid ID is required';
    }
    
    if (step === 4) {
      if (!formData.applicant_signature) newErrors.applicant_signature = 'Signature is required';
      if (!agreeDeclaration) newErrors.agreeDeclaration = 'You must agree to the declaration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (step) => {
    if (step === 1) {
      return formData.business_name.trim() && 
             formData.owner_first_name.trim() && 
             formData.owner_last_name.trim() && 
             formData.owner_address.trim() &&
             formData.contact_number.trim() && 
             formData.email_address.trim();
    }
    
    if (step === 2) {
      return formData.special_permit_type && 
             formData.event_date_start && 
             formData.event_date_end && 
             formData.event_location.trim();
    }
    
    if (step === 3) {
      return formData.barangay_clearance && formData.valid_id;
    }
    
    if (step === 4) {
      return formData.applicant_signature && agreeDeclaration;
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (currentStep < steps.length) {
      const ok = validateStep(currentStep);
      if (ok) {
        if (currentStep === steps.length - 1) {
          setShowConfirmModal(true);
        } else {
          setCurrentStep(currentStep + 1);
          setErrors({});
        }
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const showSuccessMessage = (message) => {
    setModalTitle('Success!');
    setModalMessage(message);
    setShowSuccessModal(true);
  };

  const showErrorMessage = (message) => {
    setModalTitle('Error');
    setModalMessage(message);
    setShowErrorModal(true);
  };

  const handleSubmit = async () => {
    // Validate all steps
    for (let i = 1; i <= steps.length; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        setShowConfirmModal(false);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Prepare form data
      const formFields = {
        applicant_id: applicantId,
        business_name: formData.business_name,
        owner_first_name: formData.owner_first_name,
        owner_last_name: formData.owner_last_name,
        owner_middle_name: formData.owner_middle_name || '',
        owner_address: formData.owner_address,
        contact_number: formData.contact_number,
        email_address: formData.email_address,
        special_permit_type: formData.special_permit_type,
        event_description: formData.event_description || '',
        event_date_start: formData.event_date_start,
        event_date_end: formData.event_date_end,
        event_location: formData.event_location,
        estimated_attendees: formData.estimated_attendees || '',
        applicant_signature: formData.applicant_signature,
        declaration_agreed: agreeDeclaration ? 1 : 0,
        date_submitted: formData.date_submitted,
        time_submitted: formData.time_submitted,
        status: 'PENDING',
        permit_type: 'SPECIAL'
      };

      // Append form fields
      Object.entries(formFields).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Append files
      const files = ['event_permit', 'barangay_clearance', 'valid_id'];
      files.forEach(fileName => {
        if (formData[fileName] instanceof File) {
          formDataToSend.append(fileName, formData[fileName]);
        }
      });

      // Send to backend
      const response = await fetch("/backend/business_permit/submit_special.php", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseClone = response.clone();
      const responseText = await responseClone.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        showErrorMessage("Server returned invalid response. Please try again.");
        return;
      }

      if (data.success) {
        setShowConfirmModal(false);
        showSuccessMessage(data.message || "Special permit application submitted successfully!");
        
        setTimeout(() => {
          navigate("/user/permittracker");
        }, 3000);
      } else {
        showErrorMessage(data.message || "Failed to submit application. Please try again.");
      }

    } catch (error) {
      console.error("Submission error:", error);
      showErrorMessage("Network error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewFile = (file) => {
    if (!file) return null;
    
    const url = URL.createObjectURL(file);
    const fileType = file.type.split('/')[0];
    
    setShowPreview({
      url: url,
      type: fileType,
      name: file.name
    });
  };

  const closePreview = () => {
    if (showPreview.url) {
      URL.revokeObjectURL(showPreview.url);
    }
    setShowPreview({});
  };

  // Render review page (step 4)
  const renderReviewPage = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Review Application</h3>
          <p className="text-sm text-gray-600 mb-4">Please review all information before submitting your special permit application.</p>
        </div>

        <div className="space-y-6">
          {/* Application Summary Card */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg" style={{ color: COLORS.primary }}>Application Summary</h4>
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                SPECIAL PERMIT APPLICATION
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Application Date</p>
                <p className="font-medium">{formData.date_submitted}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Application Time</p>
                <p className="font-medium">{formData.time_submitted}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Applicant ID</p>
                <p className="font-medium">{formData.applicant_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Permit Type</p>
                <p className="font-medium">{formData.special_permit_type}</p>
              </div>
            </div>
          </div>

          {/* Applicant Information */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>Applicant Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Business Name</p>
                <p className="font-medium">{formData.business_name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="font-medium">{formData.owner_first_name} {formData.owner_middle_name} {formData.owner_last_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Number</p>
                <p className="font-medium">{formData.contact_number || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email Address</p>
                <p className="font-medium">{formData.email_address || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="font-medium">{formData.owner_address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>Event/Special Permit Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Permit Type</p>
                <p className="font-medium">{formData.special_permit_type || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Event Start Date</p>
                <p className="font-medium">{formData.event_date_start || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Event End Date</p>
                <p className="font-medium">{formData.event_date_end || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Event Location</p>
                <p className="font-medium">{formData.event_location || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estimated Attendees</p>
                <p className="font-medium">{formData.estimated_attendees || 'Not specified'}</p>
              </div>
              {formData.event_description && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Event Description</p>
                  <p className="font-medium p-3 bg-gray-50 rounded">{formData.event_description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents Summary */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>Documents Uploaded</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  {formData.barangay_clearance ? (
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 mr-3" />
                  )}
                  <div>
                    <p className="font-medium">Barangay Clearance</p>
                    <p className="text-sm text-gray-600">
                      {formData.barangay_clearance ? formData.barangay_clearance.name : 'Not uploaded'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  {formData.valid_id ? (
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 mr-3" />
                  )}
                  <div>
                    <p className="font-medium">Valid ID</p>
                    <p className="text-sm text-gray-600">
                      {formData.valid_id ? formData.valid_id.name : 'Not uploaded'}
                    </p>
                  </div>
                </div>
              </div>

              {formData.event_permit && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium">Event Permit (Optional)</p>
                      <p className="text-sm text-gray-600">{formData.event_permit.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Declaration */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>Declaration</h4>
            
            <div className="mb-6 p-4 border-2 border-red-200 bg-red-50 rounded-lg">
              <h5 className="font-bold mb-3 text-red-700">SPECIAL PERMIT DECLARATION</h5>
              <div className="text-sm space-y-2">
                <p>I, <span className="font-bold">{formData.owner_first_name} {formData.owner_last_name}</span>, hereby solemnly declare that:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>All information provided in this application is true, complete, and correct;</li>
                  <li>I will comply with all applicable laws and regulations;</li>
                  <li>I will ensure public safety during the event/operation;</li>
                  <li>I accept full responsibility for any violations;</li>
                  <li>I understand this permit is temporary and subject to city regulations.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="final-declaration"
                checked={agreeDeclaration}
                onChange={(e) => setAgreeDeclaration(e.target.checked)}
                className={`w-5 h-5 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500 ${errors.agreeDeclaration ? 'border-red-500' : ''}`}
              />
              <label htmlFor="final-declaration" className="ml-3">
                <span className="font-bold text-red-700">FINAL DECLARATION AND CONSENT *</span>
                <p className="text-sm mt-1">
                  I have read, understood, and agree to all terms and conditions stated in this declaration. I certify that all information provided is accurate and I accept full responsibility.
                </p>
              </label>
            </div>
            {errors.agreeDeclaration && <p className="text-red-600 text-sm mt-2 ml-8">{errors.agreeDeclaration}</p>}

            <div className="mt-6 pt-6 border-t">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Signature <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Upload an image of your signature (PNG, JPG, etc.)</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Applicant Signature</p>
                  {formData.applicant_signature ? (
                    <div className="mt-2">
                      <img 
                        src={formData.applicant_signature} 
                        alt="Signature" 
                        className="h-20 border rounded"
                      />
                      <p className="text-xs text-green-600 mt-1">Signature uploaded</p>
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm mt-1">Signature required</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Submission Date</p>
                  <p className="font-medium">{formData.date_submitted}</p>
                  <p className="text-xs text-gray-500">{formData.time_submitted}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Applicant Information</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[0].description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Business Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  className={`w-full p-3 border border-black rounded-lg ${errors.business_name ? 'border-red-500' : ''}`}
                  placeholder="Enter business name"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {errors.business_name && <p className="text-red-600 text-sm mt-1">{errors.business_name}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Owner First Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="owner_first_name"
                  value={formData.owner_first_name}
                  onChange={handleChange}
                  className={`w-full p-3 border border-black rounded-lg ${errors.owner_first_name ? 'border-red-500' : ''}`}
                  placeholder="First name"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {errors.owner_first_name && <p className="text-red-600 text-sm mt-1">{errors.owner_first_name}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Owner Last Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="owner_last_name"
                  value={formData.owner_last_name}
                  onChange={handleChange}
                  className={`w-full p-3 border border-black rounded-lg ${errors.owner_last_name ? 'border-red-500' : ''}`}
                  placeholder="Last name"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {errors.owner_last_name && <p className="text-red-600 text-sm mt-1">{errors.owner_last_name}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Owner Middle Name
                </label>
                <input
                  type="text"
                  name="owner_middle_name"
                  value={formData.owner_middle_name}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  placeholder="Middle name (optional)"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Owner Address <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="owner_address"
                  value={formData.owner_address}
                  onChange={handleChange}
                  className={`w-full p-3 border border-black rounded-lg ${errors.owner_address ? 'border-red-500' : ''}`}
                  placeholder="Complete address"
                  rows="3"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                ></textarea>
                {errors.owner_address && <p className="text-red-600 text-sm mt-1">{errors.owner_address}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Contact Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className={`w-full p-3 border border-black rounded-lg ${errors.contact_number ? 'border-red-500' : ''}`}
                  placeholder="09XXXXXXXXX"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {errors.contact_number && <p className="text-red-600 text-sm mt-1">{errors.contact_number}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email_address"
                  value={formData.email_address}
                  onChange={handleChange}
                  className={`w-full p-3 border border-black rounded-lg ${errors.email_address ? 'border-red-500' : ''}`}
                  placeholder="email@example.com"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {errors.email_address && <p className="text-red-600 text-sm mt-1">{errors.email_address}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Event/Special Permit Details</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[1].description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Special Permit Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="special_permit_type"
                  value={formData.special_permit_type}
                  onChange={handleChange}
                  className={`w-full p-3 border border-black rounded-lg ${errors.special_permit_type ? 'border-red-500' : ''}`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                >
                  <option value="">Select permit type</option>
                  {specialPermitTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.special_permit_type && <p className="text-red-600 text-sm mt-1">{errors.special_permit_type}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Event/Activity Description
                </label>
                <textarea
                  name="event_description"
                  value={formData.event_description}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  rows="4"
                  placeholder="Describe the event or activity"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                ></textarea>
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Event Start Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="event_date_start"
                  value={formData.event_date_start}
                  onChange={handleChange}
                  min={getTomorrowDate()}
                  className={`w-full p-3 border border-black rounded-lg ${errors.event_date_start ? 'border-red-500' : ''}`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {errors.event_date_start && <p className="text-red-600 text-sm mt-1">{errors.event_date_start}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Event End Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="event_date_end"
                  value={formData.event_date_end}
                  onChange={handleChange}
                  min={formData.event_date_start || getTomorrowDate()}
                  className={`w-full p-3 border border-black rounded-lg ${errors.event_date_end ? 'border-red-500' : ''}`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {errors.event_date_end && <p className="text-red-600 text-sm mt-1">{errors.event_date_end}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Event Location <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="event_location"
                  value={formData.event_location}
                  onChange={handleChange}
                  className={`w-full p-3 border border-black rounded-lg ${errors.event_location ? 'border-red-500' : ''}`}
                  placeholder="Complete address of event location"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {errors.event_location && <p className="text-red-600 text-sm mt-1">{errors.event_location}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Estimated Attendees
                </label>
                <input
                  type="number"
                  name="estimated_attendees"
                  value={formData.estimated_attendees}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  placeholder="Expected number of attendees"
                  min="0"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Upload Documents</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[2].description}</p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Check className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 mb-1">Important Note for Special Permit:</p>
                  <p className="text-sm text-blue-700">
                    • All documents marked with <span className="font-bold text-red-600">*</span> are <span className="font-bold text-red-600">MANDATORY</span> for special permit application.
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    • Ensure all documents are clear and readable.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Event Permit (Optional) */}
              <div className="border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {formData.event_permit ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Info className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Event Permit (Optional)</span>
                      <p className="text-sm text-gray-600">
                        {formData.event_permit ? formData.event_permit.name : 'Upload if available'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        name="event_permit"
                        onChange={handleChange}
                        accept=".pdf,.jpg,.png,.doc,.docx"
                        className="hidden"
                      />
                      <div className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border border-gray-300">
                        <Upload className="w-4 h-4" />
                        {formData.event_permit ? 'Change' : 'Upload'}
                      </div>
                    </label>
                    {formData.event_permit && (
                      <button
                        type="button"
                        onClick={() => previewFile(formData.event_permit)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Barangay Clearance (Required) */}
              <div className="border border-gray-300 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {formData.barangay_clearance ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Barangay Clearance: <span className="text-red-500">*</span></span>
                      <p className="text-sm text-gray-600">
                        {formData.barangay_clearance ? formData.barangay_clearance.name : 'Required'}
                      </p>
                      <p className="text-xs text-red-500 font-semibold">* This document is mandatory</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        name="barangay_clearance"
                        onChange={handleChange}
                        accept=".pdf,.jpg,.png,.doc,.docx"
                        className="hidden"
                      />
                      <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                        !formData.barangay_clearance ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
                      }`}>
                        <Upload className="w-4 h-4" />
                        {formData.barangay_clearance ? 'Change' : 'Upload'}
                      </div>
                    </label>
                    {formData.barangay_clearance && (
                      <button
                        type="button"
                        onClick={() => previewFile(formData.barangay_clearance)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {errors.barangay_clearance && <p className="text-red-600 text-sm mt-1">{errors.barangay_clearance}</p>}

              {/* Valid ID (Required) */}
              <div className="border border-gray-300 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {formData.valid_id ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Valid ID: <span className="text-red-500">*</span></span>
                      <p className="text-sm text-gray-600">
                        {formData.valid_id ? formData.valid_id.name : 'Required'}
                      </p>
                      <p className="text-xs text-red-500 font-semibold">* This document is mandatory</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        name="valid_id"
                        onChange={handleChange}
                        accept=".pdf,.jpg,.png,.doc,.docx"
                        className="hidden"
                      />
                      <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                        !formData.valid_id ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
                      }`}>
                        <Upload className="w-4 h-4" />
                        {formData.valid_id ? 'Change' : 'Upload'}
                      </div>
                    </label>
                    {formData.valid_id && (
                      <button
                        type="button"
                        onClick={() => previewFile(formData.valid_id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {errors.valid_id && <p className="text-red-600 text-sm mt-1">{errors.valid_id}</p>}
            </div>
          </div>
        );
        
      case 4:
        return renderReviewPage();
        
      default:
        return null;
    }
  };

  return (
    <div className="mx-1 mt-1 p-6 rounded-lg min-h-screen" style={{ background: COLORS.background, color: COLORS.secondary, fontFamily: COLORS.font }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-purple-100">
              <Award className="w-10 h-10 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary }}>
                Special Permit Application
              </h1>
              <p className="mt-1 text-lg font-semibold text-purple-700">
                Caloocan City Business Permit and Licensing Office
              </p>
            </div>
          </div>
          <p className="mt-2" style={{ color: COLORS.secondary }}>
            Complete the form below to apply for a special business permit
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              Special Permit Application
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/user/dashboard')}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
          onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
          style={{ background: COLORS.success }}
          className="px-4 py-2 rounded-lg font-medium text-white hover:bg-[#FDA811] transition-colors duration-300"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between overflow-x-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2" style={{ 
                background: currentStep >= step.id ? COLORS.success : 'transparent', 
                borderColor: currentStep >= step.id ? COLORS.success : '#9CA3AF', 
                color: currentStep >= step.id ? '#fff' : '#9CA3AF',
                fontFamily: COLORS.font
              }}>{step.id}</div>
              <div className="ml-3 hidden md:block">
                <p className="text-sm font-medium" style={{ 
                  color: currentStep >= step.id ? COLORS.success : COLORS.secondary,
                  fontFamily: COLORS.font
                }}>{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="hidden md:block w-16 h-0.5 mx-4" style={{ background: currentStep > step.id ? COLORS.success : '#9CA3AF' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Status Message */}
      {submitStatus && <div className="p-4 mb-6 rounded" style={{ 
        background: submitStatus.type === 'success' ? '#e6f9ed' : 
                   submitStatus.type === 'warning' ? '#fff8e6' : '#fdecea', 
        color: submitStatus.type === 'success' ? COLORS.success : 
               submitStatus.type === 'warning' ? COLORS.warning : COLORS.danger,
        fontFamily: COLORS.font,
        border: '1px solid ' + (submitStatus.type === 'success' ? COLORS.success : 
                               submitStatus.type === 'warning' ? COLORS.warning : COLORS.danger)
      }}>{submitStatus.message}</div>}

      <form onSubmit={handleFormSubmit} className="space-y-8">
        {renderStepContent()}

        <div className="flex justify-between pt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
              style={{ background: COLORS.success }}
              className="px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
            >
              Previous
            </button>
          )}

          {currentStep < steps.length ? (
            <button
              type="submit"
              disabled={!isStepValid(currentStep)}
              style={{ background: !isStepValid(currentStep) ? '#9CA3AF' : COLORS.success }}
              onMouseEnter={e => {
                if (isStepValid(currentStep)) e.currentTarget.style.background = COLORS.accent;
              }}
              onMouseLeave={e => {
                if (isStepValid(currentStep)) e.currentTarget.style.background = COLORS.success;
              }}
              className={`px-6 py-3 rounded-lg font-semibold text-white ${
                !isStepValid(currentStep) ? 'cursor-not-allowed' : 'transition-colors duration-300'
              }`}
            >
              {currentStep === steps.length - 1 ? 'Review & Submit' : 'Next'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
              style={{ background: COLORS.success }}
              className="px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
            >
              Submit Application
            </button>
          )}
        </div>
      </form>

      {/* File Preview Modal */}
      {showPreview.url && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="rounded-lg shadow-lg w-full max-w-4xl border border-gray-200 overflow-hidden"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font,
              backdropFilter: 'blur(10px)',
              maxHeight: '90vh'
            }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold" style={{ color: COLORS.primary }}>Preview Document</h2>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <p className="text-sm mb-4" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                File: <span className="font-medium">{showPreview.name}</span>
              </p>
              
              <div className="bg-white rounded-lg border p-4">
                {showPreview.type === 'image' ? (
                  <div className="flex justify-center">
                    <img 
                      src={showPreview.url} 
                      alt="Preview" 
                      className="max-w-full h-auto max-h-[500px]"
                    />
                  </div>
                ) : showPreview.type === 'application' && showPreview.name?.includes('.pdf') ? (
                  <iframe 
                    src={showPreview.url} 
                    className="w-full h-[500px] rounded"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8">
                    <FileText className="w-24 h-24 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">File: {showPreview.name}</p>
                    <p className="text-gray-500 mb-6">Preview not available for this file type</p>
                    <a 
                      href={showPreview.url} 
                      download={showPreview.name}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300"
                    >
                      Download File
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={closePreview}
                  style={{ background: COLORS.success }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                  onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
                  className="px-6 py-2 rounded-lg font-semibold text-white transition-colors duration-300"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="p-8 rounded-lg shadow-lg w-full max-w-lg border border-gray-200"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <FileSignature className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-center mb-4" style={{ color: COLORS.primary }}>Submit Special Permit Application?</h2>
            
            <div className="mb-6">
              <p className="text-sm text-center mb-3" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                Are you sure you want to submit your special permit application? Please ensure all information is correct before submitting.
              </p>
              
              <div className="p-4 bg-gray-50 rounded-lg border mt-4">
                <p className="text-sm font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Application Summary:</p>
                <ul className="text-xs space-y-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  <li>• Business: {formData.business_name}</li>
                  <li>• Owner: {formData.owner_first_name} {formData.owner_last_name}</li>
                  <li>• Permit Type: {formData.special_permit_type}</li>
                  <li>• Event Period: {formData.event_date_start} to {formData.event_date_end}</li>
                  <li>• Location: {formData.event_location}</li>
                  <li>• Submission Date: {formData.date_submitted}</li>
                  <li>• Declaration Status: <span className="text-green-600 font-semibold">Agreed and Signed</span></li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                style={{ background: COLORS.danger }}
                onMouseEnter={e => {
                  if (!isSubmitting) e.currentTarget.style.background = COLORS.accent;
                }}
                onMouseLeave={e => {
                  if (!isSubmitting) e.currentTarget.style.background = COLORS.danger;
                }}
                className={`px-6 py-2 rounded-lg font-semibold text-white ${
                  isSubmitting ? 'cursor-not-allowed' : 'transition-colors duration-300'
                }`}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ background: isSubmitting ? '#9CA3AF' : COLORS.success }}
                onMouseEnter={e => {
                  if (!isSubmitting) e.currentTarget.style.background = COLORS.accent;
                }}
                onMouseLeave={e => {
                  if (!isSubmitting) e.currentTarget.style.background = COLORS.success;
                }}
                className={`px-6 py-2 rounded-lg font-semibold text-white ${
                  isSubmitting ? 'cursor-not-allowed' : 'transition-colors duration-300'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="p-8 rounded-lg shadow-lg w-full max-w-lg border border-gray-200"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-center mb-4" style={{ color: COLORS.primary }}>{modalTitle}</h2>
            
            <div className="mb-6">
              <p className="text-sm text-center mb-3" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                {modalMessage}
              </p>
              <p className="text-xs text-center text-gray-500" style={{ fontFamily: COLORS.font }}>
                You will be redirected to your dashboard in a few seconds...
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/user/permittracker");
                }}
                style={{ background: COLORS.success }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                Track Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="p-8 rounded-lg shadow-lg w-full max-w-lg border border-gray-200"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-center mb-4" style={{ color: COLORS.danger }}>{modalTitle}</h2>
            
            <div className="mb-6">
              <p className="text-sm text-center mb-3" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                {modalMessage}
              </p>
              <p className="text-xs text-center text-gray-500" style={{ fontFamily: COLORS.font }}>
                Please check your information and try again.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowErrorModal(false)}
                style={{ background: COLORS.danger }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.danger}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                Close
              </button>
              
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setShowConfirmModal(true);
                }}
                style={{ background: COLORS.success }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
