import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Building, FileText, MapPin, User, CheckCircle, AlertCircle, FileCheck, Upload, Check, X, Eye, XCircle, Info, FileSignature, Calendar, Clock } from "lucide-react";
import Swal from 'sweetalert2';

const COLORS = {
  primary: '#4A90E2',
  secondary: '#000000',
  accent: '#FDA811',
  success: '#4CAF50',
  danger: '#E53935',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

export default function BusPermitType() {
  const [selectedType, setSelectedType] = useState('');
  const [isConfirmBackOpen, setIsConfirmBackOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [showPreview, setShowPreview] = useState({});
  const [selectedForPreview, setSelectedForPreview] = useState(null);
  const navigate = useNavigate();

  // Get current date for submission
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get current date for effective date min
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // General requirements for all amendments (removed Authorization Form and Unified Application Form)
  const generalRequirements = [
    {
      title: "Previous Mayor's Permit (Original)",
      description: "The current/active business permit issued by Caloocan City",
      name: "previous_permit_file",
      required: true
    },
    {
      title: "Official Receipt of Business Tax Payment",
      description: "For the current year",
      name: "tax_receipt_file",
      required: true
    },
    {
      title: "Valid Government‑issued ID",
      description: "Of Business Owner",
      name: "owner_id_file",
      required: true
    }
  ];

  // Amendment types with their specific requirements
  const amendmentTypes = [
    { 
      id: 'CHANGE_BUSINESS_NAME', 
      title: 'Change of Business Name', 
      description: 'Update your registered business name',
      icon: <Building className="w-10 h-10" />,
      color: 'border-indigo-200 hover:border-indigo-300',
      bgColor: 'hover:bg-indigo-50',
      formColor: 'text-indigo-600',
      formBgColor: 'bg-indigo-50',
      requirements: [
        {
          title: "Updated Business Registration Certificate",
          description: "Reflecting the new name:",
          details: [
            "Sole Proprietorship – DTI Business Name Certificate (must show the new business name)",
            "Corporation/Partnership/OPC – SEC Certificate of Registration or updated General Information Sheet (GIS) with the new name"
          ],
          name: "business_registration_file",
          required: true
        },
        {
          title: "Board Resolution/Secretary's Certificate",
          description: "Authorizing the name change (for corporations, if applicable)",
          name: "board_resolution_file",
          required: false
        },
        {
          title: "DTI/SEC/CDA Registration",
          description: "Must cover the current owner and show the business activity and name exactly as in the amendment application",
          name: "registration_update_file",
          required: true
        }
      ]
    },
    { 
      id: 'CHANGE_BUSINESS_LINE', 
      title: 'Change of Business Line', 
      description: 'Modify your primary business activities',
      icon: <FileText className="w-10 h-10" />,
      color: 'border-teal-200 hover:border-teal-300',
      bgColor: 'hover:bg-teal-50',
      formColor: 'text-teal-600',
      formBgColor: 'bg-teal-50',
      requirements: [
        {
          title: "Updated SEC/DTI/CDA Registration",
          description: "That includes the revised business activity/line, or proof that the listed business activities cover the amended lines on your permit",
          name: "business_line_registration_file",
          required: true
        },
        {
          title: "Business Activity Documentation",
          description: "Your business activity on the permit must match the scope listed in your business registration documents",
          name: "business_activity_file",
          required: true
        }
      ]
    },
    { 
      id: 'CHANGE_BUSINESS_LOCATION', 
      title: 'Change of Business Location', 
      description: 'Transfer your business to a new address',
      icon: <MapPin className="w-10 h-10" />,
      color: 'border-amber-200 hover:border-amber-300',
      bgColor: 'hover:bg-amber-50',
      formColor: 'text-amber-600',
      formBgColor: 'bg-amber-50',
      requirements: [
        {
          title: "Proof of New Business Address",
          description: "Choose one of the following:",
          details: [
            "If owned: Transfer Certificate of Title (TCT), Tax Declaration, RPT Receipt",
            "If leased: Notarized Contract of Lease or agreement and lessor's consent",
            "If government owned: Affidavit of voluntary vacate or similar proof"
          ],
          name: "address_proof_file",
          required: true
        },
        {
          title: "Locational Clearance",
          description: "For the new address issued via QC E‑Services (to confirm zoning compliance)",
          name: "locational_clearance_file",
          required: true
        },
        {
          title: "Address Verification",
          description: "The address documents must exactly match the new business address you indicate in the amendment",
          name: "address_verification_file",
          required: true
        }
      ]
    },
    { 
      id: 'CHANGE_OWNER', 
      title: 'Change of Owner', 
      description: 'Transfer business ownership to another person',
      icon: <User className="w-10 h-10" />,
      color: 'border-rose-200 hover:border-rose-300',
      bgColor: 'hover:bg-rose-50',
      formColor: 'text-rose-600',
      formBgColor: 'bg-rose-50',
      requirements: [
        {
          title: "Updated Business Registration",
          description: "Reflecting the new owner:",
          details: [
            "For sole proprietorship: Updated DTI Business Name Certificate showing the new owner's name; affidavit of assignment/deed of sale may be required",
            "For corporation/partnership/OPC: SEC Certificate and supporting documents proving the ownership change (e.g., Board Resolution, updated GIS)"
          ],
          name: "ownership_registration_file",
          required: true
        },
        {
          title: "Supporting Corporate Documents",
          description: "Updated registration under the new owner's name and other supporting corporate documents where relevant",
          name: "ownership_support_file",
          required: true
        }
      ]
    }
  ];

  const [formData, setFormData] = useState({
    // Business Information
    business_permit_id: '',
    business_name: '',
    current_business_name: '',
    new_business_name: '',
    business_type: '',
    business_line: '',
    current_business_line: '',
    new_business_line: '',
    current_address: '',
    new_address: '',
    current_owner_name: '',
    new_owner_name: '',
    
    // Contact Information
    contact_person: '',
    contact_number: '',
    email: '',
    
    // Amendment Details
    amendment_type: '',
    amendment_reason: '',
    effective_date: '',
    
    // File attachments - General
    previous_permit_file: null,
    tax_receipt_file: null,
    owner_id_file: null,
    
    // File attachments - Specific (will be populated based on selected type)
    
    // Declaration and Signature fields
    applicant_signature: '',
    date_submitted: getCurrentDate(),
    date_submitted_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  const steps = [
    { id: 1, title: 'Business Information', description: 'Business details' },
    { id: 2, title: 'Amendment Details', description: 'Specific changes' },
    { id: 3, title: 'Required Documents', description: 'Upload documents' },
    { id: 4, title: 'Declaration', description: 'Sign and submit' }, // MOVED: Declaration before Review
    { id: 5, title: 'Review', description: 'Review application' }    // MOVED: Review after Declaration
  ];

  const handleTypeSelection = (typeId) => {
    setSelectedType(typeId);
    const selected = amendmentTypes.find(t => t.id === typeId);
    
    // Show modal when card is clicked
    setShowSelectionModal(true);
  };

  // Function to show requirements modal
  const handleLearnMore = (typeId, e) => {
    e.stopPropagation(); // Prevent card selection
    setSelectedForPreview(typeId);
    setShowRequirementsModal(true);
  };

  // Function to continue application from requirements modal
  const handleContinueFromRequirements = () => {
    setSelectedType(selectedForPreview);
    setShowRequirementsModal(false);
    setShowSelectionModal(true);
  };

  const confirmTypeSelection = () => {
    if (!selectedType) return;
    
    const selected = amendmentTypes.find(t => t.id === selectedType);
    
    // Initialize form with selected amendment type
    setFormData(prev => ({
      ...prev,
      amendment_type: selectedType
    }));
    
    // Initialize specific file fields for the selected amendment type
    const specificReqs = selected?.requirements || [];
    const initialSpecificFiles = {};
    specificReqs.forEach(req => {
      initialSpecificFiles[req.name] = null;
    });
    
    setFormData(prev => ({
      ...prev,
      ...initialSpecificFiles
    }));
    
    setShowSelectionModal(false);
    setShowForm(true);
    setCurrentStep(1);
    setAgreeDeclaration(false); // Reset declaration
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file || null
      }));
    } else {
      // Validate contact number starts with 09
      if (name === 'contact_number') {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length > 0 && !cleaned.startsWith('09')) {
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Contact Number',
            text: 'Contact number must start with 09',
            confirmButtonColor: '#4A90E2'
          });
          return;
        }
        setFormData(prev => ({
          ...prev,
          [name]: cleaned
        }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Function to handle signature upload
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          applicant_signature: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to get full name for declaration
  const getFullName = () => {
    if (selectedType === 'CHANGE_OWNER' && formData.new_owner_name) {
      return formData.new_owner_name;
    }
    return formData.contact_person;
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

  const [errors, setErrors] = useState({});

  const validateStep = (step) => {
    const newErrors = {};
    const selectedAmendment = amendmentTypes.find(t => t.id === selectedType);
    
    if (step === 1) {
      if (!formData.business_permit_id.trim()) newErrors.business_permit_id = 'Business Permit ID is required';
      if (!formData.business_name.trim()) newErrors.business_name = 'Business name is required';
      if (!formData.business_type.trim()) newErrors.business_type = 'Business type is required';
      if (!formData.contact_person.trim()) newErrors.contact_person = 'Contact person is required';
      if (!formData.contact_number.trim()) newErrors.contact_number = 'Contact number is required';
      
      // Type-specific validations
      if (selectedType === 'CHANGE_BUSINESS_NAME') {
        if (!formData.new_business_name.trim()) newErrors.new_business_name = 'New business name is required';
      }
      if (selectedType === 'CHANGE_BUSINESS_LINE') {
        if (!formData.new_business_line.trim()) newErrors.new_business_line = 'New business line is required';
      }
      if (selectedType === 'CHANGE_BUSINESS_LOCATION') {
        if (!formData.new_address.trim()) newErrors.new_address = 'New address is required';
      }
      if (selectedType === 'CHANGE_OWNER') {
        if (!formData.new_owner_name.trim()) newErrors.new_owner_name = 'New owner name is required';
      }
    }
    
    if (step === 2) {
      if (!formData.amendment_reason.trim()) newErrors.amendment_reason = 'Amendment reason is required';
      if (!formData.effective_date) newErrors.effective_date = 'Effective date is required';
      
      // Validate effective date is in the future
      if (formData.effective_date) {
        const today = new Date();
        const selectedDate = new Date(formData.effective_date);
        if (selectedDate <= today) {
          newErrors.effective_date = 'Effective date must be in the future';
        }
      }
    }
    
    if (step === 3) {
      // Validate general required files
      if (!formData.previous_permit_file) newErrors.previous_permit_file = "Previous Mayor's Permit is required";
      if (!formData.tax_receipt_file) newErrors.tax_receipt_file = "Tax receipt is required";
      if (!formData.owner_id_file) newErrors.owner_id_file = "Owner ID is required";
      
      // Validate type-specific required files
      const specificReqs = selectedAmendment?.requirements || [];
      specificReqs.forEach(req => {
        if (req.required && !formData[req.name]) {
          newErrors[req.name] = `${req.title} is required`;
        }
      });
    }
    
    // Validate step 4 (Declaration)
    if (step === 4) {
      if (!formData.applicant_signature) newErrors.applicant_signature = 'Signature is required';
      if (!agreeDeclaration) newErrors.agreeDeclaration = 'You must agree to the declaration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (step) => {
    const selectedAmendment = amendmentTypes.find(t => t.id === selectedType);
    
    if (step === 1) {
      if (!formData.business_permit_id.trim()) return false;
      if (!formData.business_name.trim()) return false;
      if (!formData.business_type.trim()) return false;
      if (!formData.contact_person.trim()) return false;
      if (!formData.contact_number.trim()) return false;
      
      // Type-specific validations
      if (selectedType === 'CHANGE_BUSINESS_NAME' && !formData.new_business_name.trim()) return false;
      if (selectedType === 'CHANGE_BUSINESS_LINE' && !formData.new_business_line.trim()) return false;
      if (selectedType === 'CHANGE_BUSINESS_LOCATION' && !formData.new_address.trim()) return false;
      if (selectedType === 'CHANGE_OWNER' && !formData.new_owner_name.trim()) return false;
      return true;
    }
    
    if (step === 2) {
      if (!formData.amendment_reason.trim()) return false;
      if (!formData.effective_date) return false;
      
      // Check if effective date is in the future
      const today = new Date();
      const selectedDate = new Date(formData.effective_date);
      if (selectedDate <= today) return false;
      
      return true;
    }
    
    if (step === 3) {
      if (!formData.previous_permit_file) return false;
      if (!formData.tax_receipt_file) return false;
      if (!formData.owner_id_file) return false;
      
      const specificReqs = selectedAmendment?.requirements || [];
      for (const req of specificReqs) {
        if (req.required && !formData[req.name]) return false;
      }
      return true;
    }
    
    // Step 4 (Declaration) validation
    if (step === 4) {
      if (!formData.applicant_signature) return false;
      if (!agreeDeclaration) return false;
      return true;
    }
    
    // Step 5 (Review) doesn't need validation
    if (step === 5) {
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (currentStep < steps.length) {
      const ok = validateStep(currentStep);
      if (ok) {
        // If this is the declaration step (step 4), show confirmation modal
        if (currentStep === 4) {
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
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: message,
      confirmButtonColor: '#4CAF50',
      timer: 3000,
      timerProgressBar: true
    }).then(() => {
      navigate("/user/permittracker");
    });
  };

  const showErrorMessage = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonColor: '#E53935'
    });
  };

const handleSubmit = async () => {
  // Validate all steps
  const step1Ok = validateStep(1);
  const step2Ok = validateStep(2);
  const step3Ok = validateStep(3);
  const step4Ok = validateStep(4);

  if (!(step1Ok && step2Ok && step3Ok && step4Ok)) {
    setIsSubmitting(false);
    if (!step1Ok) setCurrentStep(1);
    else if (!step2Ok) setCurrentStep(2);
    else if (!step3Ok) setCurrentStep(3);
    else setCurrentStep(4);

    setShowConfirmModal(false);
    return;
  }

  setIsSubmitting(true);

  try {
    const selectedAmendment = amendmentTypes.find(t => t.id === selectedType);
    const formDataToSend = new FormData();

    // Get applicant_id from localStorage
    const applicantId = localStorage.getItem('userId') || 
                       localStorage.getItem('user_id') || 
                       localStorage.getItem('applicant_id') || 
                       'USER001';

    // DEBUG: Log important values
    console.log('=== DEBUG SUBMISSION DATA ===');
    console.log('selectedType:', selectedType);
    console.log('selectedAmendment:', selectedAmendment);
    console.log('applicantId:', applicantId);
    console.log('agreeDeclaration:', agreeDeclaration);
    console.log('formData:', formData);
    console.log('=============================');

    // Append all text fields (excluding signature which will be handled separately)
    const formFields = {
      applicant_id: applicantId,
      business_permit_id: formData.business_permit_id,
      business_name: formData.business_name,
      new_business_name: formData.new_business_name || "",
      business_type: formData.business_type,
      new_business_line: formData.new_business_line || "",
      new_address: formData.new_address || "",
      new_owner_name: formData.new_owner_name || "",
      contact_person: formData.contact_person,
      contact_number: formData.contact_number,
      email: formData.email || "",
      amendment_type: selectedType, // This is CRITICAL
      amendment_reason: formData.amendment_reason,
      effective_date: formData.effective_date,
      date_submitted: formData.date_submitted,
      date_submitted_time: formData.date_submitted_time,
      status: "pending",
      application_date: new Date().toISOString().split('T')[0],
      declaration_agreed: agreeDeclaration ? "1" : "0"
    };

    // DEBUG: Log each field before appending
    Object.entries(formFields).forEach(([key, value]) => {
      console.log(`Appending ${key}:`, value);
      formDataToSend.append(key, value);
    });

    // Handle signature separately - convert data URL to file to prevent "Data too long" error
    if (formData.applicant_signature && formData.applicant_signature.startsWith('data:image')) {
      try {
        const byteString = atob(formData.applicant_signature.split(',')[1]);
        const mimeString = formData.applicant_signature.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const signatureFile = new File([blob], 'signature.png', { type: mimeString });
        formDataToSend.append('applicant_signature', signatureFile);
        console.log('Signature converted to file:', signatureFile.name, signatureFile.size, 'bytes');
      } catch (error) {
        console.error('Error converting signature:', error);
        showErrorMessage('Failed to process signature. Please try again.');
        return;
      }
    }

    // Attach file uploads - general files
    const generalFileFields = [
      "previous_permit_file",
      "tax_receipt_file",
      "owner_id_file",
    ];

    console.log('General files to upload:');
    generalFileFields.forEach((field) => {
      if (formData[field] instanceof File) {
        console.log(`${field}:`, formData[field].name);
        formDataToSend.append(field, formData[field]);
      } else {
        console.log(`${field}: No file`);
      }
    });

    // Attach file uploads - specific files
    const specificReqs = selectedAmendment?.requirements || [];
    console.log('Specific requirements files:');
    specificReqs.forEach(req => {
      if (formData[req.name] instanceof File) {
        console.log(`${req.name}:`, formData[req.name].name);
        formDataToSend.append(req.name, formData[req.name]);
      } else {
        console.log(`${req.name}: No file`);
      }
    });

    // DEBUG: Show all FormData entries
    console.log('=== FINAL FORMDATA ENTRIES ===');
    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value);
    }
    console.log('==============================');

    // Send to backend
    console.log('Sending request to backend...');
    const response = await fetch("/backend/business_permit/submit_amend.php", {
      method: "POST",
      body: formDataToSend,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseClone = response.clone();
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response data:', data);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Raw response that failed to parse:', responseText);
      showErrorMessage("Server returned invalid response. Please try again.");
      return;
    }

    if (data.success) {
      setShowConfirmModal(false);
      showSuccessMessage(data.message || "Amendment application submitted successfully!");
      
      // Reset everything after successful submission
      setTimeout(() => {
        setFormData({
          business_permit_id: '',
          business_name: '',
          current_business_name: '',
          new_business_name: '',
          business_type: '',
          business_line: '',
          current_business_line: '',
          new_business_line: '',
          current_address: '',
          new_address: '',
          current_owner_name: '',
          new_owner_name: '',
          contact_person: '',
          contact_number: '',
          email: '',
          amendment_reason: '',
          effective_date: '',
          previous_permit_file: null,
          tax_receipt_file: null,
          owner_id_file: null,
          applicant_signature: '',
          date_submitted: getCurrentDate(),
          date_submitted_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setSelectedType('');
        setShowForm(false);
        setCurrentStep(1);
        setAgreeDeclaration(false);
        setErrors({});
      }, 2000);

      setTimeout(() => {
        navigate("/user/permittracker");
      }, 3000);
    } else {
      console.error('Submission failed:', data.message);
      showErrorMessage(data.message || "Failed to submit application. Please check your data and try again.");
    }

  } catch (error) {
    console.error("Network submission error:", error);
    showErrorMessage("Network error: " + error.message);
  } finally {
    setIsSubmitting(false);
  }
};
        

  const goBackToSelection = () => {
    setSelectedType('');
    setShowForm(false);
    setCurrentStep(1);
    setFormData({
      business_permit_id: '',
      business_name: '',
      current_business_name: '',
      new_business_name: '',
      business_type: '',
      business_line: '',
      current_business_line: '',
      new_business_line: '',
      current_address: '',
      new_address: '',
      current_owner_name: '',
      new_owner_name: '',
      contact_person: '',
      contact_number: '',
      email: '',
      amendment_reason: '',
      effective_date: '',
      previous_permit_file: null,
      tax_receipt_file: null,
      owner_id_file: null,
      applicant_signature: '',
      date_submitted: getCurrentDate(),
      date_submitted_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setErrors({});
    setAgreeDeclaration(false);
  };

  const renderStepContent = () => {
    const selectedAmendment = amendmentTypes.find(t => t.id === selectedType);
    
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Business Permit ID *</label>
                <input 
                  type="text" 
                  name="business_permit_id" 
                  value={formData.business_permit_id} 
                  onChange={handleChange} 
                  placeholder="Enter your Business Permit ID" 
                  className={`w-full p-3 border border-black rounded-lg ${errors.business_permit_id ? 'border-red-500' : ''}`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                />
                {errors.business_permit_id && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.business_permit_id}</p>}
              </div>
              
              <div className="md:col-span-1">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Current Business Name *</label>
                <input 
                  type="text" 
                  name="business_name" 
                  value={formData.business_name} 
                  onChange={handleChange} 
                  placeholder="Current registered business name" 
                  className={`w-full p-3 border border-black rounded-lg ${errors.business_name ? 'border-red-500' : ''}`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                />
                {errors.business_name && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.business_name}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Business Type *</label>
                <select 
                  name="business_type" 
                  value={formData.business_type} 
                  onChange={handleChange} 
                  className={`w-full p-3 border border-black rounded-lg ${errors.business_type ? 'border-red-500' : ''}`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                >
                  <option value="">Select business type</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Cooperative">Cooperative</option>
                  <option value="OPC">One Person Corporation (OPC)</option>
                </select>
                {errors.business_type && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.business_type}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Contact Person *</label>
                <input 
                  type="text" 
                  name="contact_person" 
                  value={formData.contact_person} 
                  onChange={handleChange} 
                  placeholder="Full name of contact person" 
                  className={`w-full p-3 border border-black rounded-lg ${errors.contact_person ? 'border-red-500' : ''}`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                />
                {errors.contact_person && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.contact_person}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Contact Number *</label>
                <input 
                  type="text" 
                  name="contact_number" 
                  value={formData.contact_number} 
                  onChange={handleChange} 
                  placeholder="Mobile or telephone number" 
                  className={`w-full p-3 border border-black rounded-lg ${errors.contact_number ? 'border-red-500' : ''}`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                />
                {errors.contact_number && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.contact_number}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="Email address" 
                  className="w-full p-3 border border-black rounded-lg" 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                />
              </div>
              
              {/* Type-specific fields */}
              {selectedType === 'CHANGE_BUSINESS_NAME' && (
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>New Business Name *</label>
                  <input 
                    type="text" 
                    name="new_business_name" 
                    value={formData.new_business_name} 
                    onChange={handleChange} 
                    placeholder="Enter new business name" 
                    className={`w-full p-3 border border-black rounded-lg ${errors.new_business_name ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  />
                  {errors.new_business_name && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.new_business_name}</p>}
                </div>
              )}
              
              {selectedType === 'CHANGE_BUSINESS_LINE' && (
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Current Business Line</label>
                  <input 
                    type="text" 
                    name="current_business_line" 
                    value={formData.current_business_line} 
                    onChange={handleChange} 
                    placeholder="Current business activities" 
                    className="w-full p-3 border border-black rounded-lg" 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  />
                </div>
              )}
              
              {selectedType === 'CHANGE_BUSINESS_LINE' && (
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>New Business Line *</label>
                  <textarea 
                    name="new_business_line" 
                    value={formData.new_business_line} 
                    onChange={handleChange} 
                    placeholder="Describe new business activities" 
                    rows="3"
                    className={`w-full p-3 border border-black rounded-lg ${errors.new_business_line ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  ></textarea>
                  {errors.new_business_line && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.new_business_line}</p>}
                </div>
              )}
              
              {selectedType === 'CHANGE_BUSINESS_LOCATION' && (
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Current Business Address</label>
                  <textarea 
                    name="current_address" 
                    value={formData.current_address} 
                    onChange={handleChange} 
                    placeholder="Current business address" 
                    rows="2"
                    className="w-full p-3 border border-black rounded-lg" 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  ></textarea>
                </div>
              )}
              
              {selectedType === 'CHANGE_BUSINESS_LOCATION' && (
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>New Business Address *</label>
                  <textarea 
                    name="new_address" 
                    value={formData.new_address} 
                    onChange={handleChange} 
                    placeholder="Complete new business address" 
                    rows="3"
                    className={`w-full p-3 border border-black rounded-lg ${errors.new_address ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  ></textarea>
                  {errors.new_address && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.new_address}</p>}
                </div>
              )}
              
              {selectedType === 'CHANGE_OWNER' && (
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Current Owner Name</label>
                  <input 
                    type="text" 
                    name="current_owner_name" 
                    value={formData.current_owner_name} 
                    onChange={handleChange} 
                    placeholder="Current business owner name" 
                    className="w-full p-3 border border-black rounded-lg" 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  />
                </div>
              )}
              
              {selectedType === 'CHANGE_OWNER' && (
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>New Owner Name *</label>
                  <input 
                    type="text" 
                    name="new_owner_name" 
                    value={formData.new_owner_name} 
                    onChange={handleChange} 
                    placeholder="New business owner name" 
                    className={`w-full p-3 border border-black rounded-lg ${errors.new_owner_name ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  />
                  {errors.new_owner_name && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.new_owner_name}</p>}
                </div>
              )}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Amendment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 p-4 rounded-lg mb-4" style={{ 
                  background: selectedAmendment?.formBgColor || '#f3f4f6'
                }}>
                  <div className={`p-3 rounded-full ${selectedAmendment?.formBgColor || 'bg-gray-100'}`}>
                    {selectedAmendment?.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Selected Amendment Type</p>
                    <p className={`text-lg font-bold ${selectedAmendment?.formColor || 'text-gray-800'}`}>
                      {selectedAmendment?.title}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Reason for Amendment *</label>
                <textarea 
                  name="amendment_reason" 
                  value={formData.amendment_reason} 
                  onChange={handleChange} 
                  placeholder="Please explain the reason for this amendment..." 
                  rows="4"
                  className={`w-full p-3 border border-black rounded-lg ${errors.amendment_reason ? 'border-red-500' : ''}`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                ></textarea>
                {errors.amendment_reason && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.amendment_reason}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Effective Date *</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <input 
                    type="date" 
                    name="effective_date" 
                    value={formData.effective_date} 
                    onChange={handleChange} 
                    min={getTomorrowDate()}
                    className={`w-full p-3 border border-black rounded-lg ${errors.effective_date ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  />
                </div>
                {errors.effective_date && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.effective_date}</p>}
                <p className="text-xs text-gray-500 mt-1">Must be a future date</p>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Required Documents</h3>
            
            {/* General Requirements Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold" style={{ color: COLORS.primary }}>General Requirements (For All Amendments)</h4>
              </div>
              <p className="text-sm text-gray-600 mb-6">These documents are required for all types of amendments:</p>
              
              <div className="space-y-4">
                {generalRequirements.map((req, index) => (
                  <div key={index} className="p-4 border border-black rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                          {req.title} {req.required && '*'}
                        </label>
                        <p className="text-xs text-gray-600" style={{ fontFamily: COLORS.font }}>{req.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                      <Upload className="w-5 h-5 text-gray-500" />
                      <input
                        type="file"
                        name={req.name}
                        onChange={handleChange}
                        className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        style={{ fontFamily: COLORS.font }}
                      />
                    </div>
                    {errors[req.name] && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors[req.name]}</p>}
                    {formData[req.name] && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        <span>Uploaded: {formData[req.name].name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Specific Requirements Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h4 className="text-lg font-semibold" style={{ color: '#d97706' }}>
                  Specific Requirements for {selectedAmendment?.title}
                </h4>
              </div>
              <p className="text-sm text-gray-600 mb-6">Additional documents required for this amendment type:</p>
              
              <div className="space-y-4">
                {selectedAmendment?.requirements.map((req, index) => (
                  <div key={index} className="p-4 border border-black rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                          {req.title} {req.required && '*'}
                        </label>
                        <p className="text-xs text-gray-600" style={{ fontFamily: COLORS.font }}>{req.description}</p>
                        {req.details && (
                          <ul className="mt-2 text-xs text-gray-600 list-disc list-inside">
                            {req.details.map((item, i) => (
                              <li key={i} style={{ fontFamily: COLORS.font }}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                      <Upload className="w-5 h-5 text-gray-500" />
                      <input
                        type="file"
                        name={req.name}
                        onChange={handleChange}
                        className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        style={{ fontFamily: COLORS.font }}
                      />
                    </div>
                    {errors[req.name] && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors[req.name]}</p>}
                    {formData[req.name] && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        <span>Uploaded: {formData[req.name].name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* File Requirements Note */}
            <div className="p-4 rounded-lg border border-amber-300 bg-amber-50">
              <p className="text-sm font-medium mb-2" style={{ color: '#92400e' }}>File Requirements:</p>
              <ul className="text-xs space-y-1" style={{ color: '#92400e' }}>
                <li>• All documents must be clear and legible</li>
                <li>• File names should clearly indicate the document type</li>
                <li>• Maximum file size: 5MB per document</li>
                <li>• Accepted formats: PDF, JPG, PNG</li>
                <li>• Required fields are marked with *</li>
              </ul>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Declaration and Signature</h3>
            
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <div className="mb-8 p-6 border-2 border-red-200 bg-red-50 rounded-lg">
                <h4 className="font-bold text-lg mb-4 text-red-700">BUSINESS AMENDMENT DECLARATION</h4>
                <div className="space-y-3 text-sm" style={{ fontFamily: COLORS.font }}>
                  <p>I, <span className="font-bold">{getFullName() || '[Full Name]'}</span>, hereby solemnly declare that:</p>
                  
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>All information provided in this amendment application is true, complete, and correct;</li>
                    <li>I am the registered owner/authorized representative of the business described in this amendment application;</li>
                    <li>The proposed amendment is necessary and justified as described in the application;</li>
                    <li>I have attached all required supporting documents for this amendment;</li>
                    <li>I shall continue to abide by all business regulations, rules, and ordinances of Caloocan City;</li>
                    <li>I understand that any false statement or misrepresentation shall be grounds for:</li>
                    <ul className="list-disc ml-8 mt-2 space-y-1">
                      <li>Immediate cancellation of the amendment application</li>
                      <li>Administrative and criminal liability</li>
                      <li>Blacklisting from future applications</li>
                      <li>Fines and penalties as per existing laws</li>
                    </ul>
                    <li>I agree to the processing of my personal data for amendment purposes in accordance with the Data Privacy Act of 2012;</li>
                    <li>I consent to inspections and monitoring by authorized personnel for verification of amendment details.</li>
                  </ol>
                  
                  <p className="mt-4 font-semibold">Republic Act No. 11032 - Ease of Doing Business and Efficient Government Service Delivery Act of 2018</p>
                  <p className="text-xs italic">"Any person who makes any false statement in any business permit application shall be subject to penalties under existing laws."</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Applicant's Signature <span className="text-red-600">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-32 flex items-center justify-center">
                    {formData.applicant_signature ? (
                      <div className="text-center">
                        <img 
                          src={formData.applicant_signature} 
                          alt="Applicant Signature" 
                          className="max-h-20 mx-auto"
                        />
                        <p className="text-xs mt-2 text-green-600">Signature uploaded</p>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, applicant_signature: '' }))}
                          className="text-xs text-red-600 mt-1 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-500 mb-2">Upload your signature</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                          id="signature-upload"
                        />
                        <label
                          htmlFor="signature-upload"
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          Upload Signature
                        </label>
                      </div>
                    )}
                  </div>
                  {errors.applicant_signature && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.applicant_signature}</p>}
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Date and Time of Submission <span className="text-red-600">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 border border-black rounded-lg bg-gray-50">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                        {formData.date_submitted}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-3 border border-black rounded-lg bg-gray-50">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span className="font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                        {formData.date_submitted_time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Current date and time (auto-filled)</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                    <p className="text-sm mt-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                      I, <span className="font-semibold">{getFullName() || '[Full Name]'}</span>, have read, understood, and agree to all terms and conditions stated in this amendment declaration. I certify that all information provided is accurate and I accept full responsibility for its veracity.
                    </p>
                  </label>
                </div>
                {errors.agreeDeclaration && <p className="text-red-600 text-sm mt-2 ml-8" style={{ fontFamily: COLORS.font }}>{errors.agreeDeclaration}</p>}
              </div>

              {/* Important Note */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium mb-2 text-blue-700">Important Note:</p>
                <p className="text-xs text-blue-600" style={{ fontFamily: COLORS.font }}>
                  After signing and agreeing to the declaration, you will be able to review your complete application before final submission. Click "Next" to proceed to the review page.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Review Your Application</h3>
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <div className="space-y-6">
                {/* Amendment Type Badge */}
                <div className="flex items-center gap-3 p-4 rounded-lg mb-6" style={{ 
                  background: selectedAmendment?.formBgColor || '#f3f4f6'
                }}>
                  <div className={`p-3 rounded-full ${selectedAmendment?.formBgColor || 'bg-gray-100'}`}>
                    {selectedAmendment?.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Amendment Type</p>
                    <p className={`text-xl font-bold ${selectedAmendment?.formColor || 'text-gray-800'}`}>
                      {selectedAmendment?.title}
                    </p>
                  </div>
                </div>

                {/* Declaration Status */}
                <div className="flex items-center gap-3 p-4 rounded-lg mb-6 bg-green-50 border border-green-200">
                  <Check className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">Declaration Signed and Agreed</p>
                    <p className="text-sm text-green-600">You have successfully completed the declaration on {formData.date_submitted} at {formData.date_submitted_time}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Business Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Business Permit ID:</span>
                      <span className="flex-1">{formData.business_permit_id}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Current Business Name:</span>
                      <span className="flex-1">{formData.business_name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Business Type:</span>
                      <span className="flex-1">{formData.business_type}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Contact Person:</span>
                      <span className="flex-1">{formData.contact_person}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Contact Number:</span>
                      <span className="flex-1">{formData.contact_number}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Email:</span>
                      <span className="flex-1">{formData.email || 'N/A'}</span>
                    </div>
                    
                    {/* Type-specific review fields */}
                    {selectedType === 'CHANGE_BUSINESS_NAME' && formData.new_business_name && (
                      <div className="flex items-center md:col-span-2">
                        <span className="font-medium w-40">New Business Name:</span>
                        <span className="flex-1 font-semibold text-blue-600">{formData.new_business_name}</span>
                      </div>
                    )}
                    
                    {selectedType === 'CHANGE_BUSINESS_LINE' && formData.new_business_line && (
                      <div className="flex items-start md:col-span-2">
                        <span className="font-medium w-40">New Business Line:</span>
                        <span className="flex-1">{formData.new_business_line}</span>
                      </div>
                    )}
                    
                    {selectedType === 'CHANGE_BUSINESS_LOCATION' && formData.new_address && (
                      <div className="flex items-start md:col-span-2">
                        <span className="font-medium w-40">New Business Address:</span>
                        <span className="flex-1">{formData.new_address}</span>
                      </div>
                    )}
                    
                    {selectedType === 'CHANGE_OWNER' && formData.new_owner_name && (
                      <div className="flex items-center md:col-span-2">
                        <span className="font-medium w-40">New Owner Name:</span>
                        <span className="flex-1 font-semibold text-blue-600">{formData.new_owner_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Amendment Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Reason for Amendment:</span>
                      <span className="flex-1">{formData.amendment_reason}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Effective Date:</span>
                      <span className="flex-1 font-semibold text-green-600">{formData.effective_date}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Uploaded Documents</h5>
                  <div className="space-y-4">
                    {/* General Requirements Review */}
                    <div>
                      <h6 className="font-medium mb-2 text-blue-600">General Requirements:</h6>
                      <div className="space-y-2">
                        {generalRequirements.map((req, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                            <div className="flex items-center">
                              {formData[req.name] ? (
                                <Check className="w-5 h-5 text-green-600 mr-3" />
                              ) : req.required ? (
                                <X className="w-5 h-5 text-red-600 mr-3" />
                              ) : (
                                <X className="w-5 h-5 text-gray-400 mr-3" />
                              )}
                              <div>
                                <span className="font-medium">{req.title}:</span>
                                <p className="text-sm text-gray-600">
                                  {formData[req.name] ? formData[req.name].name : req.required ? 'Not uploaded' : 'Optional'}
                                </p>
                              </div>
                            </div>
                            {formData[req.name] && (
                              <button
                                type="button"
                                onClick={() => previewFile(formData[req.name])}
                                className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                                style={{ color: COLORS.secondary }}
                              >
                                <Eye className="w-4 h-4" />
                                Preview
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Specific Requirements Review */}
                    {selectedAmendment?.requirements && (
                      <div>
                        <h6 className="font-medium mb-2" style={{ color: '#d97706' }}>Specific Requirements:</h6>
                        <div className="space-y-2">
                          {selectedAmendment.requirements.map((req, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                              <div className="flex items-center">
                                {formData[req.name] ? (
                                  <Check className="w-5 h-5 text-green-600 mr-3" />
                                ) : req.required ? (
                                  <X className="w-5 h-5 text-red-600 mr-3" />
                                ) : (
                                  <X className="w-5 h-5 text-gray-400 mr-3" />
                                )}
                                <div>
                                  <span className="font-medium">{req.title}:</span>
                                  <p className="text-sm text-gray-600">
                                    {formData[req.name] ? formData[req.name].name : req.required ? 'Not uploaded' : 'Optional'}
                                  </p>
                                </div>
                              </div>
                              {formData[req.name] && (
                                <button
                                  type="button"
                                  onClick={() => previewFile(formData[req.name])}
                                  className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                                  style={{ color: COLORS.secondary }}
                                >
                                  <Eye className="w-4 h-4" />
                                  Preview
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Declaration Status</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Declaration Agreed:</span>
                      <span className="flex-1 font-semibold text-green-600">Yes</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Signature Uploaded:</span>
                      <span className="flex-1 font-semibold text-green-600">Yes</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Submission Date:</span>
                      <span className="flex-1">{formData.date_submitted}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Submission Time:</span>
                      <span className="flex-1">{formData.date_submitted_time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // If form is showing, render the form
  if (showForm && selectedType) {
    const selectedAmendment = amendmentTypes.find(t => t.id === selectedType);
    
    return (
      <div className="mx-1 mt-1 p-6 rounded-lg min-h-screen" style={{ background: COLORS.background, color: COLORS.secondary, fontFamily: COLORS.font }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${selectedAmendment?.formBgColor || 'bg-gray-100'}`}>
                {selectedAmendment?.icon}
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary }}>
                  BUSINESS AMENDMENT                 </h1>
                <p className={`mt-1 text-lg font-semibold ${selectedAmendment?.formColor || 'text-gray-800'}`}>
                  {selectedAmendment?.title}
                </p>
              </div>
            </div>
            <p className="mt-2" style={{ color: COLORS.secondary }}>
              Complete the form below to apply for your business amendment
            </p>
          </div>
          <button
            onClick={goBackToSelection}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
            style={{ background: COLORS.success }}
            className="px-4 py-2 rounded-lg font-medium text-white hover:bg-[#FDA811] transition-colors duration-300"
          >
            Back to Selection
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`flex items-center justify-center rounded-full border-2 font-semibold transition-all duration-300 ${
                    currentStep >= step.id ? 'text-white' : 'text-gray-500'
                  }`}
                  style={{
                    background: currentStep >= step.id ? COLORS.success : 'transparent',
                    borderColor: currentStep >= step.id ? COLORS.success : '#9CA3AF',
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
                      color: currentStep >= step.id ? COLORS.success : COLORS.secondary,
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
                    style={{ background: currentStep > step.id ? COLORS.success : '#9CA3AF' }} 
                  />
                )}
              </div>
            ))}
          </div>
        </div>

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
                {currentStep === steps.length - 1 ? 'Submit Application' : 'Next'}
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
          <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
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
          <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
            <div 
              className="p-8 rounded-lg shadow-lg w-full max-w-lg border border-gray-200"
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                fontFamily: COLORS.font,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileSignature className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-center mb-4" style={{ color: COLORS.primary }}>Submit Amendment Application?</h2>
              
              <div className="mb-6">
                <p className="text-sm text-center mb-3" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Are you sure you want to submit your business amendment application? Please ensure all information is correct before submitting.
                </p>
                
                <div className="p-4 bg-gray-50 rounded-lg border mt-4">
                  <p className="text-sm font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Application Summary:</p>
                  <ul className="text-xs space-y-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    <li>• Amendment Type: {selectedAmendment?.title}</li>
                    <li>• Business: {formData.business_name}</li>
                    <li>• Contact Person: {formData.contact_person}</li>
                    <li>• Submission Date: {formData.date_submitted} at {formData.date_submitted_time}</li>
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
          <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
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
          <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
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
                
                {!showConfirmModal && (
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
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show selection cards (initial state) - This part remains the same as before
  return (
    <div className="mx-1 mt-1 p-6 rounded-lg min-h-screen" style={{ background: COLORS.background, color: COLORS.secondary, fontFamily: COLORS.font }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary }}>Business Amendment Application</h1>
          <p className="mt-2" style={{ color: COLORS.secondary }}>
            Select the type of amendment you need and review the requirements before proceeding
          </p>
        </div>
        <button
          onClick={() => setIsConfirmBackOpen(true)}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
          onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
          style={{ background: COLORS.success }}
          className="px-4 py-2 rounded-lg font-medium text-white hover:bg-[#FDA811] transition-colors duration-300"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Centered grid without right sidebar */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl">
          <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: COLORS.secondary }}>Select Amendment Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {amendmentTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => handleTypeSelection(type.id)}
                className={`cursor-pointer rounded-lg border-2 p-6 transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-xl flex flex-col justify-between h-full min-h-[180px]
                  ${selectedType === type.id ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'border-gray-200'} 
                  ${type.color} ${type.bgColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-full" style={{ 
                      background: selectedType === type.id ? 'rgba(59, 130, 246, 0.1)' : '#f9fafb' 
                    }}>
                      {type.icon}
                    </div>
                    {selectedType === type.id && (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{type.title}</h3>
                  <p className="text-gray-600">{type.description}</p>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full" style={{ 
                    background: selectedType === type.id ? COLORS.primary : '#e5e7eb',
                    color: selectedType === type.id ? 'white' : '#6b7280'
                  }}>
                    {selectedType === type.id ? 'Selected' : 'Click to select'}
                  </span>
                  {/* Learn More button */}
                  <button
                    onClick={(e) => handleLearnMore(type.id, e)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300"
                    style={{ 
                      background: COLORS.primary,
                      color: 'white'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                    onMouseLeave={e => e.currentTarget.style.background = COLORS.primary}
                  >
                    <Info className="w-4 h-4" />
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 rounded-lg border border-blue-300 bg-blue-50 mx-auto max-w-3xl">
            <p className="text-sm font-medium mb-2" style={{ color: COLORS.primary }}>How to proceed:</p>
            <ul className="text-xs space-y-1" style={{ color: '#1e40af' }}>
              <li>• Click on one of the amendment types above to select it</li>
              <li>• Click "Learn More" to view detailed requirements for each amendment type</li>
              <li>• Review the specific requirements for your selected amendment</li>
              <li>• Click "Continue to Application" to start the form</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Requirements Preview Modal */}
      {showRequirementsModal && selectedForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6" style={{ background: COLORS.primary }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Requirements Preview</h2>
                  <p className="text-blue-100 text-sm">
                    For: {amendmentTypes.find(t => t.id === selectedForPreview)?.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowRequirementsModal(false)}
                  className="text-white hover:text-blue-200 transition-colors duration-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* General Requirements */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg" style={{ color: COLORS.primary }}>General Requirements</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">These documents are required for all types of amendments:</p>
                
                <ul className="space-y-3">
                  {generalRequirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium" style={{ color: COLORS.secondary }}>{req.title}</p>
                        <p className="text-xs text-gray-600">{req.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Specific Requirements */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-lg" style={{ color: '#d97706' }}>Specific Requirements</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Additional documents required for this amendment type:</p>
                
                <ul className="space-y-4">
                  {amendmentTypes.find(t => t.id === selectedForPreview)?.requirements.map((req, index) => (
                    <li key={index} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-start gap-2 mb-2">
                        <FileCheck className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: COLORS.secondary }}>{req.title}</p>
                          <p className="text-xs text-gray-600">{req.description}</p>
                        </div>
                      </div>
                      
                      {req.details && (
                        <ul className="ml-6 mt-2 space-y-1">
                          {req.details.map((detail, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Important Notes */}
              <div className="mt-6 p-4 rounded-lg" style={{ background: '#fef3c7' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#92400e' }}>Important Notes:</p>
                <ul className="text-xs space-y-1" style={{ color: '#92400e' }}>
                  <li>• All documents must be clear and legible</li>
                  <li>• File names should clearly indicate the document type</li>
                  <li>• Maximum file size: 5MB per document</li>
                  <li>• Accepted formats: PDF, JPG, PNG</li>
                  <li>• You will need your Business Permit ID</li>
                </ul>
              </div>
            </div>
            
            {/* Continue Application Button */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowRequirementsModal(false)}
                  className="px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
                  style={{ 
                    background: '#e5e7eb',
                    color: COLORS.secondary,
                    fontFamily: COLORS.font
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#d1d5db'}
                  onMouseLeave={e => e.currentTarget.style.background = '#e5e7eb'}
                >
                  Close
                </button>
                <button
                  onClick={handleContinueFromRequirements}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                  onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
                  style={{ 
                    background: COLORS.success,
                    color: 'white',
                    fontFamily: COLORS.font
                  }}
                  className="px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
                >
                  Continue Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection Confirmation Modal */}
      {showSelectionModal && selectedType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>
                Confirm Amendment Type
              </h3>
              <button
                onClick={() => setShowSelectionModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg mb-6" style={{ 
              background: amendmentTypes.find(t => t.id === selectedType)?.formBgColor || '#f3f4f6'
            }}>
              <div className={`p-3 rounded-full ${amendmentTypes.find(t => t.id === selectedType)?.formBgColor || 'bg-gray-100'}`}>
                {amendmentTypes.find(t => t.id === selectedType)?.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">You have selected:</p>
                <p className={`text-xl font-bold ${amendmentTypes.find(t => t.id === selectedType)?.formColor || 'text-gray-800'}`}>
                  {amendmentTypes.find(t => t.id === selectedType)?.title}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm mb-3" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                <strong>Description:</strong> {amendmentTypes.find(t => t.id === selectedType)?.description}
              </p>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium mb-2" style={{ color: COLORS.primary }}>Before you proceed:</p>
                <ul className="text-xs space-y-1" style={{ color: '#1e40af' }}>
                  <li>• Make sure you have your Business Permit ID ready</li>
                  <li>• Prepare all required documents</li>
                  <li>• Ensure you have valid government ID</li>
                  <li>• Have your business tax receipt available</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowSelectionModal(false)}
                className="px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
                style={{ 
                  background: '#e5e7eb',
                  color: COLORS.secondary,
                  fontFamily: COLORS.font
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#d1d5db'}
                onMouseLeave={e => e.currentTarget.style.background = '#e5e7eb'}
              >
                Cancel
              </button>
              <button
                onClick={confirmTypeSelection}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
                style={{ 
                  background: COLORS.success,
                  color: 'white',
                  fontFamily: COLORS.font
                }}
                className="px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                Continue to Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Back Modal */}
      {isConfirmBackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full p-8 text-center">
            <h3 className="text-2xl font-semibold mb-6" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Leave Amendment Selection?</h3>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => setIsConfirmBackOpen(false)}
                className="px-8 py-3 rounded-lg font-semibold transition-colors duration-300"
                style={{ 
                  background: '#e5e7eb',
                  color: COLORS.secondary,
                  fontFamily: COLORS.font
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#d1d5db'}
                onMouseLeave={e => e.currentTarget.style.background = '#e5e7eb'}
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/user/dashboard')}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
                style={{ 
                  background: COLORS.success,
                  color: 'white',
                  fontFamily: COLORS.font
                }}
                className="px-8 py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                Yes, Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}