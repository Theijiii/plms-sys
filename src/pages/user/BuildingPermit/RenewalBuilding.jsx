import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, X, Eye, FileText, AlertCircle, Loader2, Shield } from "lucide-react";
import { createWorker } from 'tesseract.js';
import Swal from 'sweetalert2';
import { logPermitSubmission } from '../../../services/ActivityLogger';

const COLORS = {
  primary: '#4A90E2',
  secondary: '#000000',
  accent: '#FDA811',
  success: '#4CAF50',
  danger: '#E53935',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguans", "Argentinean", "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Barbudans", "Batswana", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djibouti", "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian", "Herzegovinian", "Honduran", "Hungarian", "I-Kiribati", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan", "Kittian and Nevisian", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivan", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Moroccan", "Mosotho", "Motswana", "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan", "San Marinese", "Sao Tomean", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian", "Slovenian", "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamer", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian or Tobagonian", "Tunisian", "Turkish", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbekistani", "Venezuelan", "Vietnamese", "Welsh", "Yemenite", "Zambian", "Zimbabwean"
];

const calculateAge = (birthdate) => {
  if (!birthdate) return null;
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function RenewalBuilding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState({});

  const [verificationStatus, setVerificationStatus] = useState({
    isVerifying: false,
    isVerified: false,
    verificationResults: null,
    verificationError: null,
    progress: 0
  });

  const [formData, setFormData] = useState({
    // Previous Permit
    previous_permit_number: '',
    previous_permit_expiry: '',

    // Applicant Information
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    contact_no: '',
    email: '',
    birthdate: '',
    gender: '',
    civil_status: '',
    nationality: '',
    tin: '',

    // Project Site
    lot_no: '',
    blk_no: '',
    tct_no: '',
    tax_dec_no: '',
    street: '',
    barangay: '',
    city_municipality: 'Caloocan City',
    province: 'Metro Manila',

    // Application / Building Info
    home_address: '',
    form_of_ownership: '',
    use_of_permit: '',
    remarks: '',
    total_estimated_cost: '',
    number_of_storeys: '',
    number_of_units: '',
    total_floor_area: '',
    lot_area: '',

    // ID Info
    id_type: '',
    id_number: '',

    // File attachments
    valid_id_file: null,
    previous_permit_file: null,
    signature_file: null,
    building_plan_file: null,
  });

  const steps = [
    { id: 1, title: 'Previous Permit', description: 'Existing permit info' },
    { id: 2, title: 'Applicant Info', description: 'Personal details' },
    { id: 3, title: 'Project Site & Building', description: 'Location & building details' },
    { id: 4, title: 'Uploads', description: 'Required documents' },
    { id: 5, title: 'Review', description: 'Review your application' }
  ];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file || null }));

      if (name === 'valid_id_file' && file) {
        setVerificationStatus({
          isVerifying: false,
          isVerified: false,
          verificationResults: null,
          verificationError: null,
          progress: 0
        });
      }
    } else if (name === 'contact_no') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: onlyNums }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const previewFile = (file) => {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    const fileType = file.type.split('/')[0];
    setShowPreview({ url, type: fileType, name: file.name });
  };

  const closePreview = () => {
    if (showPreview.url) URL.revokeObjectURL(showPreview.url);
    setShowPreview({});
  };

  const normalizeText = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

  const fuzzyMatch = (str1, str2, threshold = 0.5) => {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 0.0;
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    const similarity = matches / longer.length;
    return similarity >= threshold ? similarity : 0;
  };

  const ID_TYPE_PATTERNS = {
    "Philippine National ID (PhilSys ID)": ["philsys", "philippine national id", "national id", "phil id", "republic of the philippines", "pambansang pagkakakilanlan"],
    "Passport (DFA)": ["passport", "dfa", "department of foreign affairs"],
    "Driver's License (LTO)": ["driver", "license", "licence", "lto", "land transportation"],
    "UMID": ["umid", "unified multi-purpose id", "sss", "gsis"],
    "PRC ID": ["prc", "professional regulation commission"],
    "Voter's ID": ["voter", "comelec", "commission on elections"],
    "Postal ID (PhilPost)": ["postal", "philpost", "philippine postal"],
    "Senior Citizen ID": ["senior citizen", "osca"],
    "PWD ID": ["pwd", "person with disability"],
    "SSS ID": ["sss", "social security system"],
    "GSIS eCard": ["gsis", "government service insurance"],
    "PhilHealth ID": ["philhealth", "philippine health"],
    "Pag-IBIG ID": ["pag-ibig", "pagibig", "hdmf"],
    "TIN ID": ["tin", "tax identification number", "bir"],
    "Barangay ID": ["barangay id", "brgy id"],
    "NBI Clearance": ["nbi clearance", "national bureau of investigation"],
    "School ID": ["school id", "student id"],
    "Company / Employee ID": ["company id", "employee id"]
  };

  const detectIDType = (extractedText) => {
    const textLower = extractedText.toLowerCase();
    const detectedTypes = [];
    for (const [idType, keywords] of Object.entries(ID_TYPE_PATTERNS)) {
      let matchCount = 0;
      for (const keyword of keywords) {
        if (textLower.includes(keyword.toLowerCase())) matchCount++;
      }
      if (matchCount > 0) {
        detectedTypes.push({ type: idType, confidence: matchCount / keywords.length, matchCount });
      }
    }
    detectedTypes.sort((a, b) => b.matchCount !== a.matchCount ? b.matchCount - a.matchCount : b.confidence - a.confidence);
    return detectedTypes.length > 0 ? detectedTypes[0] : null;
  };

  const verifyDocument = async () => {
    if (!formData.valid_id_file) {
      setVerificationStatus(prev => ({ ...prev, verificationError: 'Please upload a valid ID first' }));
      return;
    }
    if (!formData.first_name || !formData.last_name || !formData.id_number) {
      setVerificationStatus(prev => ({ ...prev, verificationError: 'Please fill in First Name, Last Name, and ID Number before verification' }));
      return;
    }
    if (!formData.id_type) {
      setVerificationStatus(prev => ({ ...prev, verificationError: 'Please select an ID type before verification' }));
      return;
    }

    setVerificationStatus({ isVerifying: true, isVerified: false, verificationResults: null, verificationError: null, progress: 0 });

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setVerificationStatus(prev => ({ ...prev, progress: Math.round(m.progress * 100) }));
          }
        }
      });
      setVerificationStatus(prev => ({ ...prev, progress: 10 }));
      const { data: { text } } = await worker.recognize(formData.valid_id_file);
      await worker.terminate();
      setVerificationStatus(prev => ({ ...prev, progress: 90 }));

      const extractedText = text.toLowerCase();
      const firstNameMatch = fuzzyMatch(formData.first_name, extractedText);
      const lastNameMatch = fuzzyMatch(formData.last_name, extractedText);

      let middleNameMatch = null;
      if (formData.middle_name) {
        const fullMiddleMatch = fuzzyMatch(formData.middle_name, extractedText);
        const middleInitial = formData.middle_name.charAt(0).toLowerCase();
        const hasMiddleInitial = extractedText.includes(middleInitial);
        middleNameMatch = fullMiddleMatch > 0 || hasMiddleInitial;
      }

      const idNumberNormalized = normalizeText(formData.id_number);
      const extractedTextNormalized = normalizeText(extractedText);
      const idNumberMatch = extractedTextNormalized.includes(idNumberNormalized) ||
        extractedText.includes(idNumberNormalized) ||
        fuzzyMatch(formData.id_number, extractedText) > 0.8;

      const detectedID = detectIDType(text);
      const idTypeMatch = detectedID && detectedID.type === formData.id_type;

      const results = {
        firstName: { matched: firstNameMatch > 0, confidence: firstNameMatch, value: formData.first_name },
        lastName: { matched: lastNameMatch > 0, confidence: lastNameMatch, value: formData.last_name },
        middleName: formData.middle_name ? {
          matched: middleNameMatch === true || middleNameMatch > 0,
          confidence: middleNameMatch === true ? 1.0 : (middleNameMatch || 0),
          value: formData.middle_name
        } : null,
        idNumber: { matched: idNumberMatch, confidence: idNumberMatch ? 1.0 : 0, value: formData.id_number },
        idType: {
          detected: detectedID ? detectedID.type : 'Unknown',
          selected: formData.id_type,
          matched: idTypeMatch,
          confidence: detectedID ? detectedID.confidence : 0
        },
        extractedText: text
      };

      const allMatched = results.firstName.matched &&
        results.lastName.matched &&
        results.idNumber.matched &&
        results.idType.matched &&
        (!formData.middle_name || results.middleName.matched);

      setVerificationStatus({
        isVerifying: false,
        isVerified: allMatched,
        verificationResults: results,
        verificationError: allMatched ? null : 'Some information does not match the ID',
        progress: 100
      });
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus({
        isVerifying: false,
        isVerified: false,
        verificationResults: null,
        verificationError: 'Failed to verify document: ' + error.message,
        progress: 0
      });
    }
  };

  const [errors, setErrors] = useState({});

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.previous_permit_number || formData.previous_permit_number.trim() === '') newErrors.previous_permit_number = 'Previous permit number is required';
      if (!formData.previous_permit_expiry) newErrors.previous_permit_expiry = 'Previous permit expiry date is required';
    }
    if (step === 2) {
      if (!formData.first_name || formData.first_name.trim() === '') newErrors.first_name = 'First name is required';
      if (!formData.last_name || formData.last_name.trim() === '') newErrors.last_name = 'Last name is required';
      if (!formData.contact_no || formData.contact_no.trim() === '') {
        newErrors.contact_no = 'Contact number is required';
      } else if (!formData.contact_no.startsWith('09')) {
        newErrors.contact_no = 'Contact number must start with 09';
      } else if (formData.contact_no.length !== 11) {
        newErrors.contact_no = 'Contact number must be exactly 11 digits';
      }
      if (!formData.email || formData.email.trim() === '') newErrors.email = 'Email is required';
      if (!formData.birthdate) {
        newErrors.birthdate = 'Birth date is required';
      } else if (calculateAge(formData.birthdate) < 18) {
        newErrors.birthdate = 'You must be at least 18 years old to apply';
      }
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.civil_status) newErrors.civil_status = 'Civil status is required';
      if (!formData.nationality || formData.nationality.trim() === '') newErrors.nationality = 'Nationality is required';
    }
    if (step === 3) {
      if (!formData.street || formData.street.trim() === '') newErrors.street = 'Street is required';
      if (!formData.barangay || formData.barangay.trim() === '') newErrors.barangay = 'Barangay is required';
      if (!formData.city_municipality || formData.city_municipality.trim() === '') newErrors.city_municipality = 'City/Municipality is required';
      if (!formData.province || formData.province.trim() === '') newErrors.province = 'Province is required';
      if (!formData.use_of_permit || formData.use_of_permit.trim() === '') newErrors.use_of_permit = 'Use/purpose of permit is required';
      if (!formData.form_of_ownership || formData.form_of_ownership.trim() === '') newErrors.form_of_ownership = 'Form of ownership is required';
    }
    if (step === 4) {
      if (!formData.valid_id_file) newErrors.valid_id_file = 'Valid ID is required';
      if (!formData.signature_file) newErrors.signature_file = 'Applicant Signature is required';
      if (formData.valid_id_file && !verificationStatus.isVerified) {
        newErrors.verification_required = 'You must verify your ID and it must be VALID to proceed';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (step) => {
    if (step === 1) {
      if (!formData.previous_permit_number || formData.previous_permit_number.trim() === '') return false;
      if (!formData.previous_permit_expiry) return false;
      return true;
    }
    if (step === 2) {
      if (!formData.first_name || formData.first_name.trim() === '') return false;
      if (!formData.last_name || formData.last_name.trim() === '') return false;
      if (!formData.contact_no || formData.contact_no.trim() === '') return false;
      if (!formData.contact_no.startsWith('09') || formData.contact_no.length !== 11) return false;
      if (!formData.email || formData.email.trim() === '') return false;
      if (!formData.birthdate) return false;
      if (!formData.gender) return false;
      if (!formData.civil_status) return false;
      if (!formData.nationality || formData.nationality.trim() === '') return false;
      return true;
    }
    if (step === 3) {
      if (!formData.street || formData.street.trim() === '') return false;
      if (!formData.barangay || formData.barangay.trim() === '') return false;
      if (!formData.city_municipality || formData.city_municipality.trim() === '') return false;
      if (!formData.province || formData.province.trim() === '') return false;
      if (!formData.use_of_permit || formData.use_of_permit.trim() === '') return false;
      if (!formData.form_of_ownership || formData.form_of_ownership.trim() === '') return false;
      return true;
    }
    if (step === 4) {
      if (!formData.valid_id_file) return false;
      if (!formData.signature_file) return false;
      if (!verificationStatus.isVerified) return false;
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

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      nextStep();
    } else if (currentStep === steps.length - 1) {
      const ok = validateStep(currentStep);
      if (ok) {
        setCurrentStep(currentStep + 1);
        setErrors({});
      }
    } else {
      const result = await Swal.fire({
        title: 'Confirm Submission',
        html: `
          <div class="text-left">
            <p class="mb-3 text-sm">Are you sure you want to submit your building permit renewal application? Please review your information before submitting.</p>
            <div class="p-4 bg-gray-50 rounded-lg border mb-4">
              <p class="text-sm font-semibold mb-2">Declaration:</p>
              <p class="text-sm mb-3">I hereby declare that all information provided is true and correct to the best of my knowledge. I understand that any false information may result in the rejection of my application.</p>
            </div>
          </div>
        `,
        icon: 'question',
        input: 'checkbox',
        inputValue: 0,
        inputPlaceholder: 'I agree to the above declaration',
        confirmButtonText: 'Confirm & Submit',
        confirmButtonColor: COLORS.success,
        cancelButtonText: 'Cancel',
        cancelButtonColor: COLORS.danger,
        showCancelButton: true,
        inputValidator: (result) => {
          return !result && 'You must agree to the declaration!';
        },
        customClass: { popup: 'text-left', htmlContainer: 'text-left' }
      });

      if (result.isConfirmed) {
        await handleSubmit();
      }
    }
  };

  const showSuccessMessage = async (message) => {
    await Swal.fire({
      title: 'Success!',
      html: `
        <div class="text-center">
          <p class="mb-3">${message}</p>
          <p class="text-xs text-gray-500">You will be redirected...</p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Track Application',
      confirmButtonColor: COLORS.success,
      timer: 3000,
      timerProgressBar: true
    }).then((result) => {
      if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
        navigate('/user/permittracker');
      }
    });
  };

  const showErrorMessage = async (message) => {
    await Swal.fire({
      title: 'Error',
      html: `
        <div class="text-center">
          <p class="mb-3">${message}</p>
          <p class="text-xs text-gray-500">Please check your information and try again.</p>
        </div>
      `,
      icon: 'error',
      confirmButtonText: 'Close',
      confirmButtonColor: COLORS.danger
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

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
      return;
    }

    try {
      const formDataToSend = new FormData();

      Object.entries({
        user_id: localStorage.getItem('user_id') || localStorage.getItem('goserveph_user_id') || '0',
        permit_action: 'RENEWAL',
        previous_permit_number: formData.previous_permit_number,
        previous_permit_expiry: formData.previous_permit_expiry,
        first_name: formData.first_name,
        middle_initial: formData.middle_name || '',
        last_name: formData.last_name,
        suffix: formData.suffix || '',
        tin: formData.tin || '',
        contact_no: formData.contact_no,
        email: formData.email,
        citizenship: formData.nationality,
        home_address: formData.home_address || '',
        form_of_ownership: formData.form_of_ownership,
        use_of_permit: formData.use_of_permit,
        remarks: formData.remarks || '',
        total_estimated_cost: formData.total_estimated_cost || '0',
        lot_no: formData.lot_no || '',
        blk_no: formData.blk_no || '',
        tct_no: formData.tct_no || '',
        tax_dec_no: formData.tax_dec_no || '',
        street: formData.street,
        barangay: formData.barangay,
        city_municipality: formData.city_municipality,
        province: formData.province,
        number_of_units: formData.number_of_units || '0',
        number_of_storeys: formData.number_of_storeys || '0',
        total_floor_area: formData.total_floor_area || '0',
        lot_area: formData.lot_area || '0',
      }).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const fileFields = ['valid_id_file', 'previous_permit_file', 'signature_file', 'building_plan_file'];
      fileFields.forEach((field) => {
        if (formData[field] instanceof File) {
          formDataToSend.append(field, formData[field]);
        }
      });

      // Also send signature as 'signature' for backend compatibility
      if (formData.signature_file instanceof File) {
        formDataToSend.append('signature', formData.signature_file);
      }

      const response = await fetch('/backend/building_permit/building_permit.php', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const responseClone = response.clone();
      let data;
      try {
        data = await response.json();
      } catch {
        const rawText = await responseClone.text();
        console.error('Raw server response:', rawText);
        throw new Error('Server did not return valid JSON');
      }

      if (data.success) {
        logPermitSubmission("Building Permit", data.application_id || data.data?.application_id || "", { permit_type: "Renewal" });
        await showSuccessMessage(data.message || 'Renewal application submitted successfully!');
      } else {
        await showErrorMessage(data.message || 'Failed to submit application.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      await showErrorMessage('Network error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Previous Permit Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Previous Permit Number *</label>
                <input type="text" name="previous_permit_number" value={formData.previous_permit_number} onChange={handleChange} placeholder="e.g. BP-2024-XXXXX" className={`w-full p-3 border border-black rounded-lg ${errors.previous_permit_number ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.previous_permit_number && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.previous_permit_number}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Previous Permit Expiry Date *</label>
                <input type="date" name="previous_permit_expiry" value={formData.previous_permit_expiry} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.previous_permit_expiry ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.previous_permit_expiry && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.previous_permit_expiry}</p>}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>First Name *</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" className={`w-full p-3 border border-black rounded-lg ${errors.first_name ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.first_name && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.first_name}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Middle Name</label>
                <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} placeholder="Middle Name" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Last Name *</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" className={`w-full p-3 border border-black rounded-lg ${errors.last_name ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.last_name && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.last_name}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Suffix</label>
                <input type="text" name="suffix" value={formData.suffix} onChange={handleChange} placeholder="Jr., Sr., III, etc." className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Contact Number *</label>
                <input type="text" name="contact_no" value={formData.contact_no} onChange={handleChange} placeholder="09XXXXXXXXX" className={`w-full p-3 border border-black rounded-lg ${errors.contact_no ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.contact_no && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.contact_no}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className={`w-full p-3 border border-black rounded-lg ${errors.email ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.email && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.email}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Birth Date *</label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  className={`w-full p-3 border border-black rounded-lg ${errors.birthdate ? 'border-red-500' : ''}`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {formData.birthdate && calculateAge(formData.birthdate) < 18 && (
                  <p className="text-red-600 text-sm mt-1 font-semibold" style={{ fontFamily: COLORS.font }}>
                    You must be at least 18 years old to apply.
                  </p>
                )}
                {errors.birthdate && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.birthdate}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.gender ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.gender}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Civil Status *</label>
                <select name="civil_status" value={formData.civil_status} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.civil_status ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  <option value="">Select civil status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
                {errors.civil_status && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.civil_status}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Nationality *</label>
                <select name="nationality" value={formData.nationality} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.nationality ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  <option value="">Select nationality</option>
                  {NATIONALITIES.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
                {errors.nationality && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.nationality}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>TIN</label>
                <input type="text" name="tin" value={formData.tin} onChange={handleChange} placeholder="Tax Identification Number" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Home Address</label>
                <input type="text" name="home_address" value={formData.home_address} onChange={handleChange} placeholder="Home Address" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Project Site & Building Information</h3>

            <h4 className="text-lg font-semibold" style={{ color: COLORS.primary }}>Project Site Location</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Lot No.</label>
                <input type="text" name="lot_no" value={formData.lot_no} onChange={handleChange} placeholder="Lot No." className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Block No.</label>
                <input type="text" name="blk_no" value={formData.blk_no} onChange={handleChange} placeholder="Block No." className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>TCT No.</label>
                <input type="text" name="tct_no" value={formData.tct_no} onChange={handleChange} placeholder="TCT No." className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Tax Dec. No.</label>
                <input type="text" name="tax_dec_no" value={formData.tax_dec_no} onChange={handleChange} placeholder="Tax Declaration No." className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Street *</label>
                <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Street" className={`w-full p-3 border border-black rounded-lg ${errors.street ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.street && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.street}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Barangay *</label>
                <input type="text" name="barangay" value={formData.barangay} onChange={handleChange} placeholder="Barangay" className={`w-full p-3 border border-black rounded-lg ${errors.barangay ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.barangay && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.barangay}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>City/Municipality *</label>
                <input type="text" name="city_municipality" value={formData.city_municipality} onChange={handleChange} placeholder="City/Municipality" className={`w-full p-3 border border-black rounded-lg ${errors.city_municipality ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.city_municipality && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.city_municipality}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Province *</label>
                <input type="text" name="province" value={formData.province} onChange={handleChange} placeholder="Province" className={`w-full p-3 border border-black rounded-lg ${errors.province ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.province && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.province}</p>}
              </div>
            </div>

            <h4 className="text-lg font-semibold mt-6" style={{ color: COLORS.primary }}>Building Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Use/Purpose of Permit *</label>
                <select name="use_of_permit" value={formData.use_of_permit} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.use_of_permit ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  <option value="">Select purpose</option>
                  <option value="Renewal of Building Permit">Renewal of Building Permit</option>
                  <option value="Renovation / Alteration">Renovation / Alteration</option>
                  <option value="Addition / Extension">Addition / Extension</option>
                  <option value="Change of Use / Occupancy">Change of Use / Occupancy</option>
                  <option value="Repair">Repair</option>
                </select>
                {errors.use_of_permit && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.use_of_permit}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Form of Ownership *</label>
                <select name="form_of_ownership" value={formData.form_of_ownership} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.form_of_ownership ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  <option value="">Select ownership</option>
                  <option value="Individual">Individual</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Cooperative">Cooperative</option>
                  <option value="Others">Others</option>
                </select>
                {errors.form_of_ownership && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.form_of_ownership}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>No. of Storeys</label>
                <input type="number" name="number_of_storeys" value={formData.number_of_storeys} onChange={handleChange} placeholder="Number of Storeys" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>No. of Units</label>
                <input type="number" name="number_of_units" value={formData.number_of_units} onChange={handleChange} placeholder="Number of Units" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Total Floor Area (sqm)</label>
                <input type="number" name="total_floor_area" value={formData.total_floor_area} onChange={handleChange} placeholder="Total Floor Area" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Lot Area (sqm)</label>
                <input type="number" name="lot_area" value={formData.lot_area} onChange={handleChange} placeholder="Lot Area" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Total Estimated Cost</label>
                <input type="number" name="total_estimated_cost" value={formData.total_estimated_cost} onChange={handleChange} placeholder="Total Estimated Cost" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Valid ID Type *</label>
                <select name="id_type" value={formData.id_type} onChange={handleChange} className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  <option value="">Select ID type</option>
                  <optgroup label="Primary Government IDs">
                    <option value="Philippine National ID (PhilSys ID)">Philippine National ID (PhilSys ID)</option>
                    <option value="Passport (DFA)">Passport (DFA)</option>
                    <option value="Driver's License (LTO)">Driver's License (LTO)</option>
                    <option value="UMID">UMID (SSS / GSIS)</option>
                    <option value="PRC ID">PRC ID</option>
                    <option value="Voter's ID">Voter's ID</option>
                    <option value="Postal ID (PhilPost)">Postal ID (PhilPost)</option>
                    <option value="Senior Citizen ID">Senior Citizen ID</option>
                    <option value="PWD ID">PWD ID</option>
                  </optgroup>
                  <optgroup label="Secondary Government IDs">
                    <option value="SSS ID">SSS ID</option>
                    <option value="GSIS eCard">GSIS eCard</option>
                    <option value="PhilHealth ID">PhilHealth ID</option>
                    <option value="Pag-IBIG ID">Pag-IBIG ID</option>
                    <option value="TIN ID">TIN ID</option>
                    <option value="Barangay ID">Barangay ID</option>
                    <option value="NBI Clearance">NBI Clearance</option>
                  </optgroup>
                  <optgroup label="Other IDs">
                    <option value="School ID">School ID</option>
                    <option value="Company / Employee ID">Company / Employee ID</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Valid ID Number</label>
                <input type="text" name="id_number" value={formData.id_number} onChange={handleChange} placeholder="ID Number" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Remarks / Description</label>
                <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="3" placeholder="Additional remarks or building description" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Required Documents</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                  Valid ID (Government-issued) *
                </label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input type="file" name="valid_id_file" onChange={handleChange} accept="image/*" className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" style={{ fontFamily: COLORS.font }} />
                </div>
                {errors.valid_id_file && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.valid_id_file}</p>}

                {formData.valid_id_file && (
                  <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900" style={{ fontFamily: COLORS.font }}>AI Document Verification</h4>
                      </div>
                      {!verificationStatus.isVerifying && !verificationStatus.isVerified && (
                        <button
                          type="button"
                          onClick={verifyDocument}
                          disabled={!formData.first_name || !formData.last_name || !formData.id_number || !formData.id_type}
                          className="px-4 py-2 rounded-lg font-medium text-white transition-colors duration-300 flex items-center gap-2"
                          style={{
                            background: (!formData.first_name || !formData.last_name || !formData.id_number || !formData.id_type) ? '#9CA3AF' : COLORS.primary,
                            cursor: (!formData.first_name || !formData.last_name || !formData.id_number || !formData.id_type) ? 'not-allowed' : 'pointer'
                          }}
                          onMouseEnter={e => { if (formData.first_name && formData.last_name && formData.id_number && formData.id_type) e.currentTarget.style.background = COLORS.accent; }}
                          onMouseLeave={e => { if (formData.first_name && formData.last_name && formData.id_number && formData.id_type) e.currentTarget.style.background = COLORS.primary; }}
                        >
                          <Shield className="w-4 h-4" />
                          Verify ID
                        </button>
                      )}
                    </div>

                    {verificationStatus.isVerifying && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          <p className="text-sm text-blue-800" style={{ fontFamily: COLORS.font }}>Verifying document... {verificationStatus.progress}%</p>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${verificationStatus.progress}%` }} />
                        </div>
                      </div>
                    )}

                    {verificationStatus.verificationError && !verificationStatus.isVerifying && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800" style={{ fontFamily: COLORS.font }}>Verification Failed</p>
                          <p className="text-xs text-red-600 mt-1" style={{ fontFamily: COLORS.font }}>{verificationStatus.verificationError}</p>
                        </div>
                      </div>
                    )}

                    {verificationStatus.verificationResults && !verificationStatus.isVerifying && (
                      <div className="space-y-2">
                        <div className={`p-4 rounded-lg border-2 ${verificationStatus.isVerified ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            {verificationStatus.isVerified ? (
                              <>
                                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-7 h-7 text-white" /></div>
                                <div>
                                  <p className="text-xl font-bold text-green-800" style={{ fontFamily: COLORS.font }}>VALID</p>
                                  <p className="text-sm text-green-700" style={{ fontFamily: COLORS.font }}>ID verification successful</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center"><X className="w-7 h-7 text-white" /></div>
                                <div>
                                  <p className="text-xl font-bold text-red-800" style={{ fontFamily: COLORS.font }}>INVALID</p>
                                  <p className="text-sm text-red-700" style={{ fontFamily: COLORS.font }}>Information does not match ID</p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="border-t pt-3 space-y-1 text-xs" style={{ fontFamily: COLORS.font, borderColor: verificationStatus.isVerified ? '#22c55e' : '#ef4444' }}>
                            <p className="font-semibold mb-2" style={{ color: verificationStatus.isVerified ? '#166534' : '#991b1b' }}>Verification Details:</p>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">ID Type:</span>
                                <div className="text-[10px] mt-0.5">
                                  <div>Selected: {verificationStatus.verificationResults.idType.selected}</div>
                                  <div>Detected: {verificationStatus.verificationResults.idType.detected}</div>
                                </div>
                              </div>
                              {verificationStatus.verificationResults.idType.matched ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>First Name: {verificationStatus.verificationResults.firstName.value}</span>
                              {verificationStatus.verificationResults.firstName.matched ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Last Name: {verificationStatus.verificationResults.lastName.value}</span>
                              {verificationStatus.verificationResults.lastName.matched ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                            </div>
                            {verificationStatus.verificationResults.middleName && (
                              <div className="flex items-center justify-between">
                                <span>Middle Name: {verificationStatus.verificationResults.middleName.value}</span>
                                {verificationStatus.verificationResults.middleName.matched ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span>ID Number: {verificationStatus.verificationResults.idNumber.value}</span>
                              {verificationStatus.verificationResults.idNumber.matched ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                            </div>
                          </div>

                          {!verificationStatus.isVerified && (
                            <div className="mt-3 p-2 bg-red-100 rounded border border-red-300">
                              <p className="text-xs text-red-800 font-medium" style={{ fontFamily: COLORS.font }}>You cannot proceed until your ID is verified as VALID. Issues found:</p>
                              <ul className="text-xs text-red-700 mt-1 ml-4 list-disc" style={{ fontFamily: COLORS.font }}>
                                {!verificationStatus.verificationResults.idType.matched && (
                                  <li className="font-semibold">ID Type Mismatch: You selected "{verificationStatus.verificationResults.idType.selected}" but the system detected "{verificationStatus.verificationResults.idType.detected}".</li>
                                )}
                                {!verificationStatus.verificationResults.firstName.matched && <li>First Name does not match the ID</li>}
                                {!verificationStatus.verificationResults.lastName.matched && <li>Last Name does not match the ID</li>}
                                {verificationStatus.verificationResults.middleName && !verificationStatus.verificationResults.middleName.matched && <li>Middle Name does not match the ID</li>}
                                {!verificationStatus.verificationResults.idNumber.matched && <li>ID Number does not match the ID</li>}
                                <li className="mt-1">Ensure your ID image is clear and readable</li>
                                <li>Verify the information you entered exactly matches your ID</li>
                              </ul>
                            </div>
                          )}
                        </div>

                        <button type="button" onClick={verifyDocument} className="text-xs text-blue-600 hover:text-blue-800 underline font-medium" style={{ fontFamily: COLORS.font }}>
                          Re-verify Document
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {errors.verification_required && (
                  <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border-2 border-red-500 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-800" style={{ fontFamily: COLORS.font }}>Verification Required</p>
                      <p className="text-xs text-red-700 mt-1" style={{ fontFamily: COLORS.font }}>{errors.verification_required}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>Previous Permit Copy</label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input type="file" name="previous_permit_file" onChange={handleChange} className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" style={{ fontFamily: COLORS.font }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>Building Plan / Blueprint</label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input type="file" name="building_plan_file" onChange={handleChange} className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" style={{ fontFamily: COLORS.font }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>Applicant's Signature *</label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input type="file" name="signature_file" onChange={handleChange} className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" style={{ fontFamily: COLORS.font }} />
                </div>
                {errors.signature_file && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.signature_file}</p>}
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
                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Previous Permit Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center"><span className="font-medium w-40">Permit Number:</span><span className="flex-1">{formData.previous_permit_number}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Permit Expiry:</span><span className="flex-1">{formData.previous_permit_expiry}</span></div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Applicant Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center"><span className="font-medium w-40">First Name:</span><span className="flex-1">{formData.first_name}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Middle Name:</span><span className="flex-1">{formData.middle_name || 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Last Name:</span><span className="flex-1">{formData.last_name}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Suffix:</span><span className="flex-1">{formData.suffix || 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Contact Number:</span><span className="flex-1">{formData.contact_no}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Email:</span><span className="flex-1">{formData.email}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Birth Date:</span><span className="flex-1">{formData.birthdate}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Gender:</span><span className="flex-1">{formData.gender}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Civil Status:</span><span className="flex-1">{formData.civil_status}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Nationality:</span><span className="flex-1">{formData.nationality}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">TIN:</span><span className="flex-1">{formData.tin || 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Home Address:</span><span className="flex-1">{formData.home_address || 'N/A'}</span></div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Project Site</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center"><span className="font-medium w-40">Lot No.:</span><span className="flex-1">{formData.lot_no || 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Block No.:</span><span className="flex-1">{formData.blk_no || 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">TCT No.:</span><span className="flex-1">{formData.tct_no || 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Tax Dec. No.:</span><span className="flex-1">{formData.tax_dec_no || 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Street:</span><span className="flex-1">{formData.street}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Barangay:</span><span className="flex-1">{formData.barangay}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">City/Municipality:</span><span className="flex-1">{formData.city_municipality}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Province:</span><span className="flex-1">{formData.province}</span></div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Building Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center"><span className="font-medium w-40">Use/Purpose:</span><span className="flex-1">{formData.use_of_permit}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Ownership:</span><span className="flex-1">{formData.form_of_ownership}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">No. of Storeys:</span><span className="flex-1">{formData.number_of_storeys || 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">No. of Units:</span><span className="flex-1">{formData.number_of_units || 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Total Floor Area:</span><span className="flex-1">{formData.total_floor_area ? `${formData.total_floor_area} sqm` : 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Lot Area:</span><span className="flex-1">{formData.lot_area ? `${formData.lot_area} sqm` : 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">Estimated Cost:</span><span className="flex-1">{formData.total_estimated_cost ? `PHP ${formData.total_estimated_cost}` : 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">ID Type:</span><span className="flex-1">{formData.id_type || 'N/A'}</span></div>
                    <div className="flex items-center"><span className="font-medium w-40">ID Number:</span><span className="flex-1">{formData.id_number || 'N/A'}</span></div>
                    <div className="flex items-center md:col-span-2"><span className="font-medium w-40">Remarks:</span><span className="flex-1">{formData.remarks || 'N/A'}</span></div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Uploaded Documents</h5>
                  <div className="space-y-4">
                    <div className="p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {formData.valid_id_file ? <Check className="w-5 h-5 text-green-600 mr-3" /> : <X className="w-5 h-5 text-red-600 mr-3" />}
                          <div>
                            <span className="font-medium">Valid ID:</span>
                            <p className="text-sm text-gray-600">{formData.valid_id_file ? formData.valid_id_file.name : 'Not uploaded'}</p>
                          </div>
                        </div>
                        {formData.valid_id_file && (
                          <button type="button" onClick={() => previewFile(formData.valid_id_file)} className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300" style={{ color: COLORS.secondary }}>
                            <Eye className="w-4 h-4" /> Preview
                          </button>
                        )}
                      </div>
                      {formData.valid_id_file && (
                        <div className="mt-2">
                          {verificationStatus.isVerified ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border-2 border-green-500 rounded">
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                              <span className="text-sm text-green-800 font-bold" style={{ fontFamily: COLORS.font }}>VALID - AI Verified</span>
                            </div>
                          ) : verificationStatus.verificationResults ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-red-500 rounded">
                              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"><X className="w-4 h-4 text-white" /></div>
                              <span className="text-sm text-red-800 font-bold" style={{ fontFamily: COLORS.font }}>INVALID - Information does not match</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-red-500 rounded">
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <span className="text-sm text-red-800 font-bold" style={{ fontFamily: COLORS.font }}>NOT VERIFIED - Go back to step 4 to verify</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        {formData.previous_permit_file ? <Check className="w-5 h-5 text-green-600 mr-3" /> : <X className="w-5 h-5 text-gray-400 mr-3" />}
                        <div>
                          <span className="font-medium">Previous Permit Copy:</span>
                          <p className="text-sm text-gray-600">{formData.previous_permit_file ? formData.previous_permit_file.name : 'Optional'}</p>
                        </div>
                      </div>
                      {formData.previous_permit_file && (
                        <button type="button" onClick={() => previewFile(formData.previous_permit_file)} className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300" style={{ color: COLORS.secondary }}>
                          <Eye className="w-4 h-4" /> Preview
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        {formData.building_plan_file ? <Check className="w-5 h-5 text-green-600 mr-3" /> : <X className="w-5 h-5 text-gray-400 mr-3" />}
                        <div>
                          <span className="font-medium">Building Plan / Blueprint:</span>
                          <p className="text-sm text-gray-600">{formData.building_plan_file ? formData.building_plan_file.name : 'Optional'}</p>
                        </div>
                      </div>
                      {formData.building_plan_file && (
                        <button type="button" onClick={() => previewFile(formData.building_plan_file)} className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300" style={{ color: COLORS.secondary }}>
                          <Eye className="w-4 h-4" /> Preview
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        {formData.signature_file ? <Check className="w-5 h-5 text-green-600 mr-3" /> : <X className="w-5 h-5 text-red-600 mr-3" />}
                        <div>
                          <span className="font-medium">Signature:</span>
                          <p className="text-sm text-gray-600">{formData.signature_file ? formData.signature_file.name : 'Not uploaded'}</p>
                        </div>
                      </div>
                      {formData.signature_file && (
                        <button type="button" onClick={() => previewFile(formData.signature_file)} className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300" style={{ color: COLORS.secondary }}>
                          <Eye className="w-4 h-4" /> Preview
                        </button>
                      )}
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

  return (
    <div className="mx-1 mt-1 p-6 rounded-lg min-h-screen" style={{ background: COLORS.background, color: COLORS.secondary, fontFamily: COLORS.font }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary }}>BUILDING PERMIT RENEWAL</h1>
          <p className="mt-2" style={{ color: COLORS.secondary }}>
            Renew your existing building permit. Please provide your previous permit details and updated information.
          </p>
        </div>
        <button
          onClick={() => navigate('/user/building/type')}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
          onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
          style={{ background: COLORS.success }}
          className="px-4 py-2 rounded-lg font-medium text-white hover:bg-[#FDA811] transition-colors duration-300"
        >
          Change Type
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center rounded-full border-2 font-semibold transition-all duration-300 ${currentStep >= step.id ? 'text-white' : 'text-gray-500'}`}
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
                <p className="text-sm font-medium" style={{ color: currentStep >= step.id ? COLORS.success : COLORS.secondary, fontFamily: COLORS.font }}>{step.title}</p>
                <p className="text-xs" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block w-16 h-0.5 mx-4" style={{ background: currentStep > step.id ? COLORS.success : '#9CA3AF' }} />
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
              onMouseEnter={e => { if (isStepValid(currentStep)) e.currentTarget.style.background = COLORS.accent; }}
              onMouseLeave={e => { if (isStepValid(currentStep)) e.currentTarget.style.background = COLORS.success; }}
              className={`px-6 py-3 rounded-lg font-semibold text-white ${!isStepValid(currentStep) ? 'cursor-not-allowed' : 'transition-colors duration-300'}`}
            >
              {currentStep === steps.length - 1 ? 'Review Application' : 'Next'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
              style={{ background: COLORS.success }}
              className="px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Renewal'}
            </button>
          )}
        </div>
      </form>

      {/* File Preview Modal */}
      {showPreview.url && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div
            className="rounded-lg shadow-lg w-full max-w-4xl border border-gray-200 overflow-hidden"
            style={{ background: 'rgba(255, 255, 255, 0.95)', fontFamily: COLORS.font, backdropFilter: 'blur(10px)', maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold" style={{ color: COLORS.primary }}>Preview Document</h2>
              <button onClick={closePreview} className="text-gray-500 hover:text-gray-700 transition-colors duration-300">
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
                    <img src={showPreview.url} alt="Preview" className="max-w-full h-auto max-h-[500px]" />
                  </div>
                ) : showPreview.type === 'application' && showPreview.name?.includes('.pdf') ? (
                  <iframe src={showPreview.url} className="w-full h-[500px] rounded" title="PDF Preview" />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8">
                    <FileText className="w-24 h-24 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">File: {showPreview.name}</p>
                    <p className="text-gray-500 mb-6">Preview not available for this file type</p>
                    <a href={showPreview.url} download={showPreview.name} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300">
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
    </div>
  );
}