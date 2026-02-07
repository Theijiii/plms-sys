import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, Check, X, Eye, FileText, Calendar, Search, AlertCircle, Loader2, Shield } from "lucide-react";
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

const COLORS = {
  primary: '#4A90E2',
  secondary: '#000000',
  accent: '#FDA811',
  success: '#4CAF50',
  danger: '#E53935',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

const API_BUS = "/backend/business_permit/submit_renewal.php";
const BARANGAY_API = "/backend/barangay_permit/admin_fetch.php";
const BUSINESS_TAX_API = "https://revenuetreasury.goserveph.com/api/business/fetch_business_paid.php";
const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguans", "Argentinean", "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Barbudans", "Batswana", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djibouti", "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian", "Herzegovinian", "Honduran", "Hungarian", "I-Kiribati", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan", "Kittian and Nevisian", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivan", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Moroccan", "Mosotho", "Motswana", "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan", "San Marinese", "Sao Tomean", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian", "Slovenian", "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamer", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian or Tobagonian", "Tunisian", "Turkish", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbekistani", "Venezuelan", "Vietnamese", "Welsh", "Yemenite", "Zambian", "Zimbabwean"
];

export default function BusinessRenewal() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentDate = new Date().toISOString().split('T')[0];

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [showPreview, setShowPreview] = useState({});
  const [existingPermitId, setExistingPermitId] = useState(null);

  // State for attachment checkboxes
  const [attachmentChecks, setAttachmentChecks] = useState({
    barangay_clearance: true,
    owner_valid_id: true,
    official_receipt_file: false,
    business_tax_receipt: true,
    fire_safety_certificate: true,
    sanitation_permit: false,
  });

  const [applicantId, setApplicantId] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Barangay Clearance verification states
  const [verifyingBarangayId, setVerifyingBarangayId] = useState(false);
  const [barangayVerificationResult, setBarangayVerificationResult] = useState(null);
  const [showBarangayModal, setShowBarangayModal] = useState(false);
  const [validatedBarangayIds, setValidatedBarangayIds] = useState({});
  const [barangayClearanceMethod, setBarangayClearanceMethod] = useState('upload');

  // Business Tax Receipt verification states
  const [verifyingBusinessId, setVerifyingBusinessId] = useState(false);
  const [businessVerificationResult, setBusinessVerificationResult] = useState(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [validatedBusinessIds, setValidatedBusinessIds] = useState({});
  const [businessTaxMethod, setBusinessTaxMethod] = useState('upload');

  // Document verification states for AI OCR
  const [documentVerification, setDocumentVerification] = useState({
    barangay_clearance_file: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    owner_valid_id_file: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    business_tax_receipt: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    fire_safety_certificate: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
  });

  // Verification result modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationModalData, setVerificationModalData] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Renewal Info
    permit_type: 'Renewal',
    application_date: currentDate,
    permit_expiry: '',
    official_receipt_no: '',
    owner_type: 'Individual',

    // Owner Information
    owner_last_name: '',
    owner_first_name: '',
    owner_middle_name: '',
    citizenship: 'Filipino',
    contact_number: '',
    email_address: '',
    home_address: '',
    valid_id_type: 'Passport',
    valid_id_number: '',

    // Business Information
    business_name: '',
    trade_name: '',
    gross_sale: '',
    total_employees: '0',
    male_employees: '0',
    female_employees: '0',
    business_nature: '',
    
    // Business Address
    house_bldg_no: '',
    street: '',
    barangay: '',
    city_municipality: 'Caloocan City',
    province: 'Metro Manila',
    zip_code: '',
    business_area: '',
    total_floor_area: '',
    building_type: 'Commercial',
    capital_investment: '',
    
    // Documents
    barangay_clearance_file: null,
    barangay_clearance_id: '',
    owner_valid_id_file: null,
    official_receipt_file: null,
    business_tax_receipt: null,
    business_tax_receipt_id: '',
    fire_safety_certificate: null,
    sanitation_permit: null,
    
    // Declaration
    date_submitted: currentDate,
    applicant_signature: '',
  });

  // Pre-populate form with existing permit data if available
  useEffect(() => {
    if (location.state?.existingPermit) {
      const existing = location.state.existingPermit;
      setExistingPermitId(existing.permit_id);
      
      setFormData(prev => ({
        ...prev,
        business_name: existing.business_name || '',
        trade_name: existing.trade_name || '',
        owner_last_name: existing.owner_last_name || '',
        owner_first_name: existing.owner_first_name || '',
        owner_middle_name: existing.owner_middle_name || '',
        contact_number: existing.contact_number || '',
        email_address: existing.email_address || '',
        home_address: existing.home_address || '',
        business_nature: existing.business_nature || '',
        gross_sale: existing.gross_sale || '',
        total_employees: existing.total_employees?.toString() || '0',
        male_employees: existing.male_employees?.toString() || '0',
        female_employees: existing.female_employees?.toString() || '0',
        house_bldg_no: existing.house_bldg_no || '',
        street: existing.street || '',
        barangay: existing.barangay || '',
        zip_code: existing.zip_code || '',
        business_area: existing.business_area || '',
        total_floor_area: existing.total_floor_area || '',
        building_type: existing.building_type || 'Commercial',
        capital_investment: existing.capital_investment || '',
        valid_id_type: existing.valid_id_type || 'Passport',
        valid_id_number: existing.valid_id_number || '',
        citizenship: existing.citizenship || 'Filipino',
      }));
    }
  }, [location.state]);

  // Helper function to get full name
  const getFullName = () => {
    const parts = [
      formData.owner_first_name,
      formData.owner_middle_name,
      formData.owner_last_name
    ].filter(Boolean);
    return parts.join(' ');
  };

  // Fetch applicant data based on applicant_id
  const fetchApplicantData = async () => {
    if (!applicantId.trim()) {
      setFetchError('Please enter an Applicant ID');
      return;
    }

    setIsFetching(true);
    setFetchError('');

    try {
      const response = await fetch(`/backend/business_permit/fetch_by_applicant.php?applicant_id=${applicantId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        
        // Auto-fill form with fetched data
        setFormData(prev => ({
          ...prev,
          owner_last_name: data.owner_last_name || '',
          owner_first_name: data.owner_first_name || '',
          owner_middle_name: data.owner_middle_name || '',
          citizenship: data.citizenship || 'Filipino',
          contact_number: data.contact_number || '',
          email_address: data.email_address || '',
          home_address: data.home_address || '',
          valid_id_type: data.valid_id_type || 'Passport',
          valid_id_number: data.valid_id_number || '',
          business_name: data.business_name || '',
          trade_name: data.trade_name || '',
          business_nature: data.business_nature || '',
          gross_sale: data.gross_sale || '',
          total_employees: data.total_employees?.toString() || '0',
          male_employees: data.male_employees?.toString() || '0',
          female_employees: data.female_employees?.toString() || '0',
          house_bldg_no: data.house_bldg_no || '',
          street: data.street || '',
          barangay: data.barangay || '',
          zip_code: data.zip_code || '',
          business_area: data.business_area || '',
          total_floor_area: data.total_floor_area || '',
          building_type: data.building_type || 'Commercial',
          capital_investment: data.capital_investment || '',
        }));
        
        setExistingPermitId(data.permit_id);
        showSuccessMessage('Applicant data loaded successfully!');
      } else {
        throw new Error(result.message || 'No data found for this Applicant ID');
      }
    } catch (err) {
      console.error('Error fetching applicant data:', err);
      setFetchError(err.message || 'Failed to fetch applicant data');
    } finally {
      setIsFetching(false);
    }
  };

  // Steps array for renewal (combined Business Details and Address)
  const steps = [
    { id: 1, title: 'Renewal Information', description: 'Basic renewal details and permit information' },
    { id: 2, title: 'Owner Information', description: 'Personal details of the business owner' },
    { id: 3, title: 'Business Details & Address', description: 'Updated business information and location' },
    { id: 4, title: 'Required Documents', description: 'Upload renewal documents' },
    { id: 5, title: 'Declaration & Submit', description: 'Finalize and submit your renewal' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (['total_employees', 'male_employees', 'female_employees', 'business_area', 
         'total_floor_area', 'capital_investment', 'gross_sale'].includes(name)) {
      // Only allow numbers
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFile = (e) => {
    const { name, files } = e.target;
    const file = files?.[0] || null;
    setFormData((prev) => ({ ...prev, [name]: file }));
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

  const handleCheckboxChange = (field) => {
    setAttachmentChecks(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const previewFile = (file) => {
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setShowPreview({
        url: fileUrl,
        type: file.type.split('/')[0],
        name: file.name
      });
    }
  };

  const closePreview = () => {
    if (showPreview.url) {
      URL.revokeObjectURL(showPreview.url);
    }
    setShowPreview({});
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

  // Check if business is health-related
  const isHealthRelatedBusiness = () => {
    const healthBusinesses = [
      'Health / Clinic / Pharmacy',
      'Restaurant / Eatery / Food Service',
      'Catering Services',
      'Bakery / Pastry / Cake Shop',
      'Water Refilling Station'
    ];
    return healthBusinesses.includes(formData.business_nature);
  };

  const verifyBarangayClearanceId = async () => {
    const barangayId = formData.barangay_clearance_id.trim();
    
    if (!barangayId) {
      setBarangayVerificationResult({
        success: false,
        message: "Please enter a barangay clearance ID to verify"
      });
      setShowBarangayModal(true);
      return;
    }

    if (validatedBarangayIds[barangayId]) {
      setBarangayVerificationResult({
        success: true,
        message: "Barangay clearance ID is already verified and valid!",
        data: validatedBarangayIds[barangayId]
      });
      setShowBarangayModal(true);
      return;
    }

    setVerifyingBarangayId(true);

    try {
      const response = await fetch(BARANGAY_API);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      let permits = [];
      if (data.success && data.data) {
        permits = data.data;
      } else if (Array.isArray(data)) {
        permits = data;
      } else {
        permits = data.permits || [];
      }

      const foundPermit = permits.find(permit => {
        const permitApplicantId = permit.applicant_id ? permit.applicant_id.toString() : '';
        const permitPermitId = permit.permit_id ? permit.permit_id.toString() : '';
        const searchId = barangayId.toString();
        
        return (permitApplicantId === searchId || permitPermitId === searchId) && permit.status === 'approved';
      });

      if (foundPermit) {
        setBarangayVerificationResult({
          success: true,
          message: `Barangay clearance ID is VALID! Status: approved`,
          data: foundPermit
        });
        
        setValidatedBarangayIds(prev => ({
          ...prev,
          [barangayId]: foundPermit
        }));
        
        if (foundPermit.permit_id) {
          setFormData(prev => ({
            ...prev,
            barangay_permit_id: foundPermit.permit_id
          }));
        }
      } else {
        setBarangayVerificationResult({
          success: false,
          message: "❌ Barangay clearance ID not found or not approved. Please check the ID and try again.",
          data: null
        });
      }
    } catch (error) {
      console.error("Error verifying barangay clearance ID:", error);
      setBarangayVerificationResult({
        success: false,
        message: "❌ Error connecting to verification service. Please try again later."
      });
    } finally {
      setVerifyingBarangayId(false);
      setShowBarangayModal(true);
    }
  };

  const verifyBusinessTaxReceiptId = async () => {
    const businessId = formData.business_tax_receipt_id?.trim();
    
    if (!businessId) {
      setBusinessVerificationResult({
        success: false,
        message: "Please enter a business ID to verify"
      });
      setShowBusinessModal(true);
      return;
    }

    if (validatedBusinessIds[businessId]) {
      setBusinessVerificationResult({
        success: true,
        message: "Business tax receipt is already verified and paid!",
        data: validatedBusinessIds[businessId]
      });
      setShowBusinessModal(true);
      return;
    }

    setVerifyingBusinessId(true);

    try {
      const response = await fetch(`${BUSINESS_TAX_API}?business_id=${businessId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const business = data.data;
        
        // Check if status is "paid"
        if (business.status && business.status.toLowerCase() === 'paid') {
          setBusinessVerificationResult({
            success: true,
            message: `Business tax receipt is VALID and PAID!`,
            data: business
          });
          
          setValidatedBusinessIds(prev => ({
            ...prev,
            [businessId]: business
          }));
        } else {
          setBusinessVerificationResult({
            success: false,
            message: `❌ Business found but payment status is: ${business.status || 'unknown'}. Only paid receipts are accepted.`,
            data: business
          });
        }
      } else {
        setBusinessVerificationResult({
          success: false,
          message: "❌ Business ID not found in revenue system. Please check the ID and try again.",
          data: null
        });
      }
    } catch (error) {
      console.error("Error verifying business tax receipt:", error);
      setBusinessVerificationResult({
        success: false,
        message: "❌ Error connecting to revenue treasury service. Please try again later."
      });
    } finally {
      setVerifyingBusinessId(false);
      setShowBusinessModal(true);
    }
  };

  const convertPdfToImages = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images = [];
      
      const numPages = Math.min(pdf.numPages, 3);
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        images.push(canvas);
      }
      
      return images;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw error;
    }
  };

  const verifyDocument = async (documentType, file) => {
    if (!file) {
      setDocumentVerification(prev => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          error: 'Please upload the document first',
          isVerified: false
        }
      }));
      return;
    }

    setDocumentVerification(prev => ({
      ...prev,
      [documentType]: {
        isVerifying: true,
        isVerified: false,
        results: null,
        error: null,
        progress: 0
      }
    }));

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            setDocumentVerification(prev => ({
              ...prev,
              [documentType]: {
                ...prev[documentType],
                progress: progress
              }
            }));
          }
        }
      });

      let text = '';
      
      if (file.type === 'application/pdf') {
        const images = await convertPdfToImages(file);
        
        for (let i = 0; i < images.length; i++) {
          const { data: { text: pageText } } = await worker.recognize(images[i]);
          text += pageText + '\n';
        }
      } else {
        const { data: { text: imageText } } = await worker.recognize(file);
        text = imageText;
      }
      
      await worker.terminate();

      const extractedText = text.toLowerCase();
      
      // Simple verification - check if document contains relevant keywords
      let isValid = false;
      let verificationMessage = '';
      
      if (documentType === 'barangay_clearance_file') {
        isValid = extractedText.includes('barangay') || extractedText.includes('clearance');
        verificationMessage = isValid ? 'Document appears to be a valid Barangay Clearance' : 'Document may not be a Barangay Clearance';
      } else if (documentType === 'business_tax_receipt') {
        isValid = extractedText.includes('tax') || extractedText.includes('receipt') || extractedText.includes('business');
        verificationMessage = isValid ? 'Document appears to be a valid Business Tax Receipt' : 'Document may not be a Business Tax Receipt';
      } else if (documentType === 'fire_safety_certificate') {
        isValid = extractedText.includes('fire') || extractedText.includes('safety') || extractedText.includes('fsic');
        verificationMessage = isValid ? 'Document appears to be a valid Fire Safety Certificate' : 'Document may not be a Fire Safety Certificate';
      } else if (documentType === 'owner_valid_id_file') {
        isValid = extractedText.includes('id') || extractedText.includes('license') || extractedText.includes('passport');
        verificationMessage = isValid ? 'Document appears to be a valid ID' : 'Document may not be a valid ID';
      }

      setDocumentVerification(prev => ({
        ...prev,
        [documentType]: {
          isVerifying: false,
          isVerified: isValid,
          results: { text, message: verificationMessage },
          error: null,
          progress: 100
        }
      }));

      setVerificationModalData({
        documentType,
        isValid,
        message: verificationMessage,
        extractedText: text.substring(0, 500)
      });
      setShowVerificationModal(true);

    } catch (err) {
      console.error("Document verification error:", err);
      setDocumentVerification(prev => ({
        ...prev,
        [documentType]: {
          isVerifying: false,
          isVerified: false,
          results: null,
          error: err.message || 'Verification failed',
          progress: 0
        }
      }));
    }
  };

  const validateStep = (step) => {
    const isEmpty = (val) => val === undefined || val === null || (typeof val === "string" && val.trim() === "");

    if (step === 1) {
      const missing = [];
      if (isEmpty(formData.permit_expiry)) missing.push("Permit Expiry Date");
      if (isEmpty(formData.official_receipt_no)) missing.push("Official Receipt Number");
      
      if (missing.length) return { ok: false, message: "Missing: " + missing.join(", ") };
      return { ok: true };
    }

    if (step === 2) {
      const missing = [];
      if (isEmpty(formData.owner_first_name)) missing.push("First Name");
      if (isEmpty(formData.owner_last_name)) missing.push("Last Name");
      if (isEmpty(formData.citizenship)) missing.push("Citizenship");
      if (isEmpty(formData.contact_number)) missing.push("Contact Number");
      if (isEmpty(formData.email_address)) missing.push("Email Address");
      if (isEmpty(formData.home_address)) missing.push("Home Address");
      if (isEmpty(formData.valid_id_type)) missing.push("Valid ID Type");
      if (isEmpty(formData.valid_id_number)) missing.push("Valid ID Number");

      if (missing.length) return { ok: false, message: "Missing: " + missing.join(", ") };
      return { ok: true };
    }

    if (step === 3) {
      const missing = [];
      // Business Details validation
      if (isEmpty(formData.business_name)) missing.push("Business Name");
      if (isEmpty(formData.trade_name)) missing.push("Trade Name");
      if (isEmpty(formData.business_nature)) missing.push("Nature of Business");
      if (isEmpty(formData.gross_sale)) missing.push("Gross Sale");
      if (isEmpty(formData.total_employees) || formData.total_employees === '0') missing.push("Total Employees");
      
      // Validate employee counts
      const total = parseInt(formData.total_employees) || 0;
      const male = parseInt(formData.male_employees) || 0;
      const female = parseInt(formData.female_employees) || 0;
      
      if (male + female !== total) {
        return { 
          ok: false, 
          message: "Male + Female employees must equal Total Employees" 
        };
      }

      // Business Address validation
      if (isEmpty(formData.house_bldg_no)) missing.push("House/Bldg. No");
      if (isEmpty(formData.street)) missing.push("Street");
      if (isEmpty(formData.barangay)) missing.push("Barangay");
      if (isEmpty(formData.business_area) || formData.business_area === '0') missing.push("Business Area");
      if (isEmpty(formData.total_floor_area) || formData.total_floor_area === '0') missing.push("Total Floor Area");
      if (isEmpty(formData.capital_investment) || formData.capital_investment === '0') missing.push("Capital Investment");
      
      if (missing.length) return { ok: false, message: "Missing: " + missing.join(", ") };
      return { ok: true };
    }

    if (step === 4) {
      const missing = [];
      
      // Check mandatory documents - according to database, barangay clearance is required
      if (isEmpty(formData.barangay_clearance_file) && isEmpty(formData.barangay_clearance_id)) {
        missing.push("Barangay Clearance (file or ID)");
      }
      
      if (isEmpty(formData.owner_valid_id_file)) {
        missing.push("Owner Valid ID");
      }
      
      if (attachmentChecks.official_receipt_file && isEmpty(formData.official_receipt_file)) {
        missing.push("Official Receipt of Payment");
      }

      if (missing.length) return { ok: false, message: "Missing required documents: " + missing.join(", ") };
      return { ok: true };
    }

    if (step === 5) {
      const missing = [];
      
      if (isEmpty(formData.applicant_signature)) {
        missing.push("Applicant's Signature");
      }
      
      if (!agreeDeclaration) {
        missing.push("Agreement to Declaration");
      }

      if (missing.length) return { ok: false, message: "Missing: " + missing.join(", ") };
      return { ok: true };
    }

    return { ok: true };
  };

  const nextStep = () => {
    const res = validateStep(currentStep);
    if (!res.ok) {
      setSubmitStatus({ type: 'error', message: res.message || 'Please complete required fields for this step.' });
      return;
    }
    setSubmitStatus(null);
    setCurrentStep(s => Math.min(s + 1, steps.length));
  };

  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentStep === 5) {
      const res = validateStep(5);
      if (!res.ok) {
        setSubmitStatus({ type: 'error', message: res.message || 'Please complete required fields for this step.' });
        return;
      }
      setSubmitStatus(null);
      setShowDeclarationModal(true);
    } else {
      const res = validateStep(currentStep);
      if (!res.ok) {
        setSubmitStatus({ type: 'error', message: res.message || 'Please complete required fields for this step.' });
        return;
      }
      setSubmitStatus(null);
      setCurrentStep(s => Math.min(s + 1, steps.length));
    }
  };

  const confirmDeclaration = async () => {
    if (!agreeDeclaration) {
      setSubmitStatus({ type: 'error', message: 'You must agree to the declaration to proceed.' });
      setShowDeclarationModal(false);
      return;
    }
    
    setIsSubmitting(true);
    setShowDeclarationModal(false);

    try {
      const formDataToSend = new FormData();
      
      // Get current date and time
      const now = new Date();
      const currentDateTime = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];
      const currentTime = now.toTimeString().split(' ')[0];
      
      // Add all form data according to database structure
      // Required fields based on business_permit_applications table
      // NOTE: Do NOT send permit_id - it's auto-generated by backend as RBUS-YYYY-XXXXXX
      formDataToSend.append('permit_type', 'RENEWAL');
      formDataToSend.append('application_date', formData.application_date);
      formDataToSend.append('owner_last_name', formData.owner_last_name);
      formDataToSend.append('owner_first_name', formData.owner_first_name);
      formDataToSend.append('owner_middle_name', formData.owner_middle_name || '');
      formDataToSend.append('owner_type', formData.owner_type);
      formDataToSend.append('citizenship', formData.citizenship);
      formDataToSend.append('contact_number', formData.contact_number);
      formDataToSend.append('email_address', formData.email_address);
      formDataToSend.append('home_address', formData.home_address);
      formDataToSend.append('valid_id_type', formData.valid_id_type);
      formDataToSend.append('valid_id_number', formData.valid_id_number);
      formDataToSend.append('business_name', formData.business_name);
      formDataToSend.append('trade_name', formData.trade_name || '');
      formDataToSend.append('business_nature', formData.business_nature);
      formDataToSend.append('building_type', formData.building_type);
      formDataToSend.append('capital_investment', formData.capital_investment || '0');
      formDataToSend.append('gross_sale', formData.gross_sale || '0');
      formDataToSend.append('house_bldg_no', formData.house_bldg_no);
      formDataToSend.append('street', formData.street);
      formDataToSend.append('province', formData.province);
      formDataToSend.append('city_municipality', formData.city_municipality);
      formDataToSend.append('barangay', formData.barangay);
      formDataToSend.append('zip_code', formData.zip_code || '');
      formDataToSend.append('business_area', formData.business_area || '0');
      formDataToSend.append('total_floor_area', formData.total_floor_area || '0');
      formDataToSend.append('total_employees', formData.total_employees || '0');
      formDataToSend.append('male_employees', formData.male_employees || '0');
      formDataToSend.append('female_employees', formData.female_employees || '0');
      formDataToSend.append('barangay_clearance_id', formData.barangay_clearance_id || '');
      formDataToSend.append('official_receipt_no', formData.official_receipt_no);
      formDataToSend.append('permit_expiry', formData.permit_expiry || '');
      
      // Add optional fields
      formDataToSend.append('owner_type_declaration', 'Business Owner');
      formDataToSend.append('date_submitted', formData.application_date);
      formDataToSend.append('date_submitted_time', currentTime);
      
      // Add document flags according to database column names
      formDataToSend.append('has_barangay_clearance', formData.barangay_clearance_file || formData.barangay_clearance_id ? '1' : '0');
      formDataToSend.append('has_owner_valid_id', formData.owner_valid_id_file ? '1' : '0');
      formDataToSend.append('has_official_receipt', formData.official_receipt_file ? '1' : '0');
      formDataToSend.append('has_fsic', formData.fire_safety_certificate ? '1' : '0');
      formDataToSend.append('has_business_tax_receipt', formData.business_tax_receipt ? '1' : '0');
      formDataToSend.append('has_sanitation_permit', formData.sanitation_permit ? '1' : '0');
      
      // Add existing permit ID if available (for renewal tracking) - this is the OLD permit being renewed
      if (existingPermitId && existingPermitId !== '0') {
        formDataToSend.append('previous_permit_id', existingPermitId);
      }
      
      // Add files
      const files = [
        { field: 'barangay_clearance_file', name: 'barangay_clearance_file' },
        { field: 'owner_valid_id_file', name: 'owner_valid_id_file' },
        { field: 'official_receipt_file', name: 'official_receipt_file' },
        { field: 'business_tax_receipt', name: 'business_tax_receipt' },
        { field: 'fire_safety_certificate', name: 'fire_safety_certificate' },
        { field: 'sanitation_permit', name: 'sanitation_permit' }
      ];
      
      files.forEach(fileInfo => {
        const file = formData[fileInfo.field];
        if (file instanceof File) {
          formDataToSend.append(fileInfo.name, file, file.name);
        }
      });
      
      // Add signature if available
      if (formData.applicant_signature && formData.applicant_signature.startsWith('data:image')) {
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
      }
      
      // Add action for renewal
      formDataToSend.append('action', 'submit_business_renewal');

      console.log('FormData entries for renewal:');
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.type})`);
        } else {
          console.log(`${key}:`, value);
        }
      }

      const response = await fetch(API_BUS, {
        method: "POST",
        body: formDataToSend,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseClone = response.clone();
      console.log('Response status:', response.status);

      const raw = await response.text();
      console.log('Raw response:', raw);
      
      if (!raw.trim()) {
        throw new Error('Server returned an empty response');
      }
      
      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Raw response that failed to parse:', raw);
        
        if (raw.includes('<?php') || raw.includes('Fatal error') || raw.includes('Parse error')) {
          throw new Error('PHP error detected. Please check server logs.');
        }
        
        throw new Error('Server returned invalid JSON. Check console for details.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || `Submission failed with status: ${response.status}`);
      }

      showSuccessMessage(data.message || "Business permit renewal submitted successfully!");
      
      setTimeout(() => {
        navigate("/user/permittracker");
      }, 3000);

    } catch (err) {
      console.error("Submission error:", err);
      
      let userMessage = err.message;
      if (err.message.includes('Failed to fetch') || err.message.includes('Network error')) {
        userMessage = `Network error. Please check:
          1. Server is running
          2. API endpoint is correct: ${API_BUS}
          3. No CORS issues`;
      }
      
      showErrorMessage(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Renewal Information</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[0].description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Permit Type
                </label>
                <input
                  type="text"
                  value="Renewal"
                  readOnly
                  className="p-3 border border-black rounded-lg w-full bg-gray-100"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Application Date
                </label>
                <input
                  type="text"
                  value={formData.application_date}
                  readOnly
                  className="p-3 border border-black rounded-lg w-full bg-gray-100"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Current Permit Expiry Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="permit_expiry"
                    value={formData.permit_expiry}
                    onChange={handleChange}
                    min={currentDate}
                    className="p-3 border border-black rounded-lg w-full pl-10"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Official Receipt Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="official_receipt_no"
                  value={formData.official_receipt_no}
                  onChange={handleChange}
                  placeholder="Enter official receipt number"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Owner Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="owner_type"
                  value={formData.owner_type}
                  onChange={handleChange}
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                >
                  <option value="Individual">Individual</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Corporation">Corporation</option>
                </select>
              </div>
            </div>

            {/* Auto-fill Section */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
              <h4 className="text-lg font-semibold mb-3 text-blue-800" style={{ fontFamily: COLORS.font }}>
                Quick Fill from Previous Application
              </h4>
              <p className="text-sm text-gray-600 mb-3">Enter your Applicant ID to auto-fill your information from previous records</p>
              
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={applicantId}
                    onChange={(e) => {
                      setApplicantId(e.target.value);
                      setFetchError('');
                    }}
                    placeholder="Enter Applicant ID (e.g., AP-0001)"
                    className="p-3 border border-blue-300 rounded-lg w-full"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  />
                  {fetchError && (
                    <p className="text-red-500 text-sm mt-1">{fetchError}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchApplicantData}
                  disabled={isFetching || !applicantId.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ fontFamily: COLORS.font }}
                >
                  {isFetching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    'Auto-Fill'
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Owner Information</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[1].description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="owner_last_name"
                  value={formData.owner_last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="owner_first_name"
                  value={formData.owner_first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Middle Name
                </label>
                <input
                  name="owner_middle_name"
                  value={formData.owner_middle_name}
                  onChange={handleChange}
                  placeholder="Enter middle name"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Citizenship <span className="text-red-500">*</span>
                </label>
                <select
                  name="citizenship"
                  value={formData.citizenship}
                  onChange={handleChange}
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                >
                  <option value="Filipino">Filipino</option>
                  {NATIONALITIES.map(nationality => (
                    <option key={nationality} value={nationality}>{nationality}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="09123456789"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  pattern="[0-9]{11}"
                  maxLength="11"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email_address"
                  value={formData.email_address}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Home Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="home_address"
                  value={formData.home_address}
                  onChange={handleChange}
                  placeholder="Enter complete home address"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Valid ID Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="valid_id_type"
                  value={formData.valid_id_type}
                  onChange={handleChange}
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                >
                  <option value="Passport">Passport</option>
                  <option value="Driver's License">Driver's License</option>
                  <option value="PhilSys ID">PhilSys ID</option>
                  <option value="UMID">UMID</option>
                  <option value="Voter's ID">Voter's ID</option>
                  <option value="Postal ID">Postal ID</option>
                  <option value="PRC ID">PRC ID</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Valid ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="valid_id_number"
                  value={formData.valid_id_number}
                  onChange={handleChange}
                  placeholder="Enter ID number"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Business Details & Address</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[2].description}</p>
            </div>

            {/* Business Information Section */}
            <div className="border-t-4 border-blue-500 pt-4">
              <h4 className="text-lg font-semibold mb-3 text-blue-700" style={{ fontFamily: COLORS.font }}>Business Information</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="Enter registered business name"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Trade Name
                </label>
                <input
                  name="trade_name"
                  value={formData.trade_name}
                  onChange={handleChange}
                  placeholder="Enter trade name (if different)"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Gross Annual Sale (₱) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="gross_sale"
                  value={formData.gross_sale}
                  onChange={handleChange}
                  placeholder="Enter gross sale amount"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Nature of Business <span className="text-red-500">*</span>
                </label>
                <select
                  name="business_nature"
                  value={formData.business_nature}
                  onChange={handleChange}
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                >
                  <option value="">Select Nature of Business</option>
                  <option value="Retail / Sari-sari Store">Retail / Sari-sari Store</option>
                  <option value="Restaurant / Eatery / Food Service">Restaurant / Eatery / Food Service</option>
                  <option value="Manufacturing (Light Industry)">Manufacturing (Light Industry)</option>
                  <option value="Health / Clinic / Pharmacy">Health / Clinic / Pharmacy</option>
                  <option value="Education / Tutorial Center">Education / Tutorial Center</option>
                  <option value="Real Estate / Leasing">Real Estate / Leasing</option>
                  <option value="Construction / Contractor">Construction / Contractor</option>
                  <option value="Automotive Services">Automotive Services</option>
                  <option value="Water Refilling Station">Water Refilling Station</option>
                  <option value="Online Business / E-commerce">Online Business / E-commerce</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Total Employees <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="total_employees"
                  value={formData.total_employees}
                  onChange={handleChange}
                  placeholder="Enter total number of employees"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Male Employees
                </label>
                <input
                  type="text"
                  name="male_employees"
                  value={formData.male_employees}
                  onChange={handleChange}
                  placeholder="Enter number of male employees"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Female Employees
                </label>
                <input
                  type="text"
                  name="female_employees"
                  value={formData.female_employees}
                  onChange={handleChange}
                  placeholder="Enter number of female employees"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>
            </div>

            {/* Business Address Section */}
            <div className="border-t-4 border-green-500 pt-4 mt-8">
              <h4 className="text-lg font-semibold mb-3 text-green-700" style={{ fontFamily: COLORS.font }}>Business Address & Property Details</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  House/Bldg. No <span className="text-red-500">*</span>
                </label>
                <input
                  name="house_bldg_no"
                  value={formData.house_bldg_no}
                  onChange={handleChange}
                  placeholder="Enter house/building number"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Street <span className="text-red-500">*</span>
                </label>
                <input
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Enter street name"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Barangay <span className="text-red-500">*</span>
                </label>
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                >
                  <option value="">Select Barangay</option>
                  {Array.from({length: 175}, (_, i) => (
                    <option key={`Barangay ${i+1}`} value={`Barangay ${i+1}`}>
                      Barangay {i+1}
                    </option>
                  ))}
                  {['A', 'B', 'C', 'D', 'E', 'F'].map(letter => (
                    <option key={`Barangay 176-${letter}`} value={`Barangay 176-${letter}`}>
                      Barangay 176-{letter}
                    </option>
                  ))}
                  {Array.from({length: 12}, (_, i) => (
                    <option key={`Barangay ${177 + i}`} value={`Barangay ${177 + i}`}>
                      Barangay {177 + i}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  City/Municipality
                </label>
                <input
                  type="text"
                  value="Caloocan City"
                  readOnly
                  className="p-3 border border-black rounded-lg w-full bg-gray-100"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Province
                </label>
                <input
                  type="text"
                  value="Metro Manila"
                  readOnly
                  className="p-3 border border-black rounded-lg w-full bg-gray-100"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  placeholder="Enter ZIP code"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  maxLength="4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Business Area (sq.m.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="business_area"
                  value={formData.business_area}
                  onChange={handleChange}
                  placeholder="Enter business area"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Total Floor Area (sq.m.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="total_floor_area"
                  value={formData.total_floor_area}
                  onChange={handleChange}
                  placeholder="Enter total floor area"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Building Type
                </label>
                <select
                  name="building_type"
                  value={formData.building_type}
                  onChange={handleChange}
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                >
                  <option value="Commercial">Commercial</option>
                  <option value="Residential">Residential</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed Use">Mixed Use</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Capital Investment (₱) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="capital_investment"
                  value={formData.capital_investment}
                  onChange={handleChange}
                  placeholder="Enter capital investment"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Check className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 mb-1">Important Note for Renewal:</p>
                  <p className="text-sm text-blue-700">
                    • All documents marked with <span className="font-bold text-red-600">*</span> are <span className="font-bold text-red-600">MANDATORY</span> for permit renewal.
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    • Ensure all documents are up-to-date and valid.
                  </p>
                </div>
              </div>
            </div>
      
      <div className="space-y-4">
        {/* Barangay Clearance with AI & API Verification */}
        <div className="border border-gray-300 rounded-lg bg-blue-50">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center">
              <div className="mr-3">
                {(formData.barangay_clearance_file || formData.barangay_clearance_id) ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <span className="font-medium">Barangay Clearance: <span className="text-red-500">*</span></span>
                <p className="text-sm text-gray-600">
                  {formData.barangay_clearance_file ? formData.barangay_clearance_file.name : 
                   formData.barangay_clearance_id ? 'ID Provided' : 'File or ID required'}
                </p>
                <p className="text-xs text-red-500 font-semibold">
                  * Either file upload OR ID number must be provided
                </p>
              </div>
            </div>
          </div>
          
          {/* Radio buttons to choose method */}
          <div className="p-3 bg-gray-50 border-b">
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
              Choose verification method:
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="barangay_method"
                  value="upload"
                  checked={barangayClearanceMethod === 'upload'}
                  onChange={(e) => setBarangayClearanceMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Upload Document (AI Verification)
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="barangay_method"
                  value="id"
                  checked={barangayClearanceMethod === 'id'}
                  onChange={(e) => setBarangayClearanceMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Enter ID Number (API Verification)
                </span>
              </label>
            </div>
          </div>

          {/* File Upload Section */}
          {barangayClearanceMethod === 'upload' && (
            <>
              <div className="p-3 bg-white">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="barangay_clearance_file"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                    />
                    <div className={`flex items-center gap-1 px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                      !formData.barangay_clearance_file ? 'border-gray-300' : 'border-green-200 bg-green-50'
                    }`} style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.barangay_clearance_file ? 'Change File' : 'Upload Document'}
                    </div>
                  </label>
                  {formData.barangay_clearance_file && (
                    <>
                      <span className="text-sm text-gray-600">{formData.barangay_clearance_file.name}</span>
                      <button
                        type="button"
                        onClick={() => previewFile(formData.barangay_clearance_file)}
                        className="flex items-center gap-1 px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border border-gray-300"
                        style={{ color: COLORS.secondary }}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => verifyDocument('barangay_clearance_file', formData.barangay_clearance_file)}
                        disabled={documentVerification.barangay_clearance_file.isVerifying}
                        className={`flex items-center gap-1 px-3 py-2 text-sm rounded transition-colors duration-300 border ${
                          documentVerification.barangay_clearance_file.isVerified 
                            ? 'bg-green-100 border-green-500 text-green-700' 
                            : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {documentVerification.barangay_clearance_file.isVerifying ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                        ) : documentVerification.barangay_clearance_file.isVerified ? (
                          <><Check className="w-4 h-4" /> Verified</>
                        ) : (
                          <><Shield className="w-4 h-4" /> Verify with AI</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {formData.barangay_clearance_file && documentVerification.barangay_clearance_file.isVerifying && (
                <div className="px-3 pb-3">
                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span>Verifying document with AI...</span>
                    <span>{documentVerification.barangay_clearance_file.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${documentVerification.barangay_clearance_file.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ID Input Section */}
          {barangayClearanceMethod === 'id' && (
            <div className="p-3 bg-white">
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                Barangay Clearance ID/Applicant ID:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="barangay_clearance_id"
                  value={formData.barangay_clearance_id}
                  onChange={handleChange}
                  placeholder="Enter Barangay Clearance Applicant ID"
                  className="flex-1 p-2 border border-gray-300 rounded"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {formData.barangay_clearance_id && (
                  <button
                    type="button"
                    onClick={verifyBarangayClearanceId}
                    disabled={verifyingBarangayId}
                    className={`flex items-center gap-1 px-4 py-2 text-sm rounded transition-colors duration-300 border ${
                      validatedBarangayIds[formData.barangay_clearance_id]
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {verifyingBarangayId ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                    ) : validatedBarangayIds[formData.barangay_clearance_id] ? (
                      <><Check className="w-4 h-4" /> Verified</>
                    ) : (
                      <><Search className="w-4 h-4" /> Verify with API</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="p-3 bg-gray-50">
            <p className="text-xs">
              <span className={`font-medium ${
                (documentVerification.barangay_clearance_file?.isVerified || validatedBarangayIds[formData.barangay_clearance_id]) ? 'text-green-600' : 'text-red-600'
              }`}>
                {(documentVerification.barangay_clearance_file?.isVerified || validatedBarangayIds[formData.barangay_clearance_id])
                  ? '✓ Requirement satisfied - Verified' 
                  : (formData.barangay_clearance_file || formData.barangay_clearance_id)
                    ? '⚠ Please verify the document or ID to proceed'
                    : '⚠ Please provide either the document or ID number'}
              </span>
            </p>
          </div>
        </div>

        {/* Owner Valid ID */}
        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-blue-50">
          <div className="flex items-center">
            {formData.owner_valid_id_file ? (
              <Check className="w-5 h-5 text-green-600 mr-3" />
            ) : (
              <X className="w-5 h-5 text-red-600 mr-3" />
            )}
            <div>
              <span className="font-medium">Owner Valid ID: <span className="text-red-500">*</span></span>
              <p className="text-sm text-gray-600">
                {formData.owner_valid_id_file ? formData.owner_valid_id_file.name : 'Required'}
              </p>
              <p className="text-xs text-red-500 font-semibold">* This document is mandatory</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                name="owner_valid_id_file"
                onChange={handleFile}
                accept=".pdf,.jpg,.png,.doc,.docx"
                className="hidden"
              />
              <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                !formData.owner_valid_id_file ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
              }`} style={{ color: COLORS.secondary }}>
                <Upload className="w-4 h-4" />
                {formData.owner_valid_id_file ? 'Change' : 'Upload'}
              </div>
            </label>
            {formData.owner_valid_id_file && (
              <button
                type="button"
                onClick={() => previewFile(formData.owner_valid_id_file)}
                className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                style={{ color: COLORS.secondary }}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            )}
          </div>
        </div>

        {/* Business Tax Receipt */}
        <div className="border border-gray-300 rounded-lg bg-blue-50">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center">
              <div className="mr-3">
                {(formData.business_tax_receipt || formData.business_tax_receipt_id) ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <span className="font-medium">Business Tax Receipt (Previous Year): <span className="text-red-500">*</span></span>
                <p className="text-sm text-gray-600">
                  {formData.business_tax_receipt ? formData.business_tax_receipt.name : 
                   formData.business_tax_receipt_id ? 'ID Provided' : 'File or ID required'}
                </p>
                <p className="text-xs text-red-500 font-semibold">
                  * Either file upload OR Business ID must be provided
                </p>
              </div>
            </div>
          </div>
          
          {/* Radio buttons to choose method */}
          <div className="p-3 bg-gray-50 border-b">
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
              Choose verification method:
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="business_tax_method"
                  value="upload"
                  checked={businessTaxMethod === 'upload'}
                  onChange={(e) => setBusinessTaxMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Upload Document (AI Verification)
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="business_tax_method"
                  value="id"
                  checked={businessTaxMethod === 'id'}
                  onChange={(e) => setBusinessTaxMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Enter Business ID (API Verification - Paid Status)
                </span>
              </label>
            </div>
          </div>

          {/* File Upload Section */}
          {businessTaxMethod === 'upload' && (
            <>
              <div className="p-3 bg-white">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="business_tax_receipt"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                    />
                    <div className={`flex items-center gap-1 px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                      !formData.business_tax_receipt ? 'border-gray-300' : 'border-green-200 bg-green-50'
                    }`} style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.business_tax_receipt ? 'Change File' : 'Upload Document'}
                    </div>
                  </label>
                  {formData.business_tax_receipt && (
                    <>
                      <span className="text-sm text-gray-600">{formData.business_tax_receipt.name}</span>
                      <button
                        type="button"
                        onClick={() => previewFile(formData.business_tax_receipt)}
                        className="flex items-center gap-1 px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border border-gray-300"
                        style={{ color: COLORS.secondary }}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => verifyDocument('business_tax_receipt', formData.business_tax_receipt)}
                        disabled={documentVerification.business_tax_receipt.isVerifying}
                        className={`flex items-center gap-1 px-3 py-2 text-sm rounded transition-colors duration-300 border ${
                          documentVerification.business_tax_receipt.isVerified 
                            ? 'bg-green-100 border-green-500 text-green-700' 
                            : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {documentVerification.business_tax_receipt.isVerifying ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                        ) : documentVerification.business_tax_receipt.isVerified ? (
                          <><Check className="w-4 h-4" /> Verified</>
                        ) : (
                          <><Shield className="w-4 h-4" /> Verify with AI</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {formData.business_tax_receipt && documentVerification.business_tax_receipt.isVerifying && (
                <div className="px-3 pb-3">
                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span>Verifying document with AI...</span>
                    <span>{documentVerification.business_tax_receipt.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${documentVerification.business_tax_receipt.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ID Input Section */}
          {businessTaxMethod === 'id' && (
            <div className="p-3 bg-white">
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                Business ID (from Revenue Treasury):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="business_tax_receipt_id"
                  value={formData.business_tax_receipt_id}
                  onChange={handleChange}
                  placeholder="Enter Business ID"
                  className="flex-1 p-2 border border-gray-300 rounded"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
                {formData.business_tax_receipt_id && (
                  <button
                    type="button"
                    onClick={verifyBusinessTaxReceiptId}
                    disabled={verifyingBusinessId}
                    className={`flex items-center gap-1 px-4 py-2 text-sm rounded transition-colors duration-300 border ${
                      validatedBusinessIds[formData.business_tax_receipt_id]
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {verifyingBusinessId ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                    ) : validatedBusinessIds[formData.business_tax_receipt_id] ? (
                      <><Check className="w-4 h-4" /> Verified & Paid</>
                    ) : (
                      <><Search className="w-4 h-4" /> Verify Payment Status</>
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                * System will verify that the business tax has been paid
              </p>
            </div>
          )}

          <div className="p-3 bg-gray-50">
            <p className="text-xs">
              <span className={`font-medium ${
                (documentVerification.business_tax_receipt?.isVerified || validatedBusinessIds[formData.business_tax_receipt_id]) ? 'text-green-600' : 'text-red-600'
              }`}>
                {(documentVerification.business_tax_receipt?.isVerified || validatedBusinessIds[formData.business_tax_receipt_id])
                  ? '✓ Requirement satisfied - Verified' 
                  : (formData.business_tax_receipt || formData.business_tax_receipt_id)
                    ? '⚠ Please verify the document or payment status to proceed'
                    : '⚠ Please provide either the document or Business ID'}
              </span>
            </p>
          </div>
        </div>

        {/* Fire Safety Certificate */}
        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-blue-50">
          <div className="flex items-center">
            {formData.fire_safety_certificate ? (
              <Check className="w-5 h-5 text-green-600 mr-3" />
            ) : (
              <X className="w-5 h-5 text-red-600 mr-3" />
            )}
            <div>
              <span className="font-medium">Fire Safety Inspection Certificate: <span className="text-red-500">*</span></span>
              <p className="text-sm text-gray-600">
                {formData.fire_safety_certificate ? formData.fire_safety_certificate.name : 'Required'}
              </p>
              <p className="text-xs text-red-500 font-semibold">* This document is mandatory</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                name="fire_safety_certificate"
                onChange={handleFile}
                accept=".pdf,.jpg,.png,.doc,.docx"
                className="hidden"
              />
              <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                !formData.fire_safety_certificate ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
              }`} style={{ color: COLORS.secondary }}>
                <Upload className="w-4 h-4" />
                {formData.fire_safety_certificate ? 'Change' : 'Upload'}
              </div>
            </label>
            {formData.fire_safety_certificate && (
              <button
                type="button"
                onClick={() => previewFile(formData.fire_safety_certificate)}
                className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                style={{ color: COLORS.secondary }}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            )}
          </div>
        </div>

        {/* Sanitation Permit (Optional for health-related businesses) */}
        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-blue-50">
          <div className="flex items-center">
            {formData.sanitation_permit ? (
              <Check className="w-5 h-5 text-green-600 mr-3" />
            ) : (
              <X className="w-5 h-5 text-red-600 mr-3" />
            )}
            <div>
              <span className="font-medium">Sanitation Permit:</span>
              <p className="text-sm text-gray-600">
                {formData.sanitation_permit ? formData.sanitation_permit.name : 'Optional (Recommended for health/food businesses)'}
              </p>
              {isHealthRelatedBusiness() && (
                <p className="text-xs text-blue-600">* Recommended for health/food related businesses</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                name="sanitation_permit"
                onChange={handleFile}
                accept=".pdf,.jpg,.png,.doc,.docx"
                className="hidden"
              />
              <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                !formData.sanitation_permit ? 'border-gray-300' : 'border-green-200 bg-green-50'
              }`} style={{ color: COLORS.secondary }}>
                <Upload className="w-4 h-4" />
                {formData.sanitation_permit ? 'Change' : 'Upload'}
              </div>
            </label>
            {formData.sanitation_permit && (
              <button
                type="button"
                onClick={() => previewFile(formData.sanitation_permit)}
                className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                style={{ color: COLORS.secondary }}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            )}
          </div>
        </div>

        {/* Official Receipt */}
        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-blue-50">
          <div className="flex items-center">
            {formData.official_receipt_file ? (
              <Check className="w-5 h-5 text-green-600 mr-3" />
            ) : (
              <X className="w-5 h-5 text-red-600 mr-3" />
            )}
            <div>
              <span className="font-medium">Official Receipt of Payment: <span className="text-red-500">*</span></span>
              <p className="text-sm text-gray-600">
                {formData.official_receipt_file ? formData.official_receipt_file.name : 'Required'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                name="official_receipt_file"
                onChange={handleFile}
                accept=".pdf,.jpg,.png,.doc,.docx"
                className="hidden"
              />
              <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                !formData.official_receipt_file ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
              }`} style={{ color: COLORS.secondary }}>
                <Upload className="w-4 h-4" />
                {formData.official_receipt_file ? 'Change' : 'Upload'}
              </div>
            </label>
            {formData.official_receipt_file && (
              <button
                type="button"
                onClick={() => previewFile(formData.official_receipt_file)}
                className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                style={{ color: COLORS.secondary }}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
        return (
          <div className="space-y-6">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Check className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 mb-1">Important Note for Renewal:</p>
                  <p className="text-sm text-blue-700">
                    • All documents marked with <span className="font-bold text-red-600">*</span> are <span className="font-bold text-red-600">MANDATORY</span> for permit renewal.
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    • Ensure all documents are up-to-date and valid.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Barangay Clearance */}
              <div className="border border-gray-300 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {(formData.barangay_clearance_file || formData.barangay_clearance_id) ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Barangay Clearance: <span className="text-red-500">*</span></span>
                      <p className="text-sm text-gray-600">
                        {formData.barangay_clearance_file ? formData.barangay_clearance_file.name : 
                         formData.barangay_clearance_id ? 'ID Provided' : 'File or ID required'}
                      </p>
                      <p className="text-xs text-red-500 font-semibold">
                        * Either file upload OR ID number must be provided
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        name="barangay_clearance_file"
                        onChange={handleFile}
                        accept=".pdf,.jpg,.png,.doc,.docx"
                        className="hidden"
                      />
                      <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                        !formData.barangay_clearance_file ? 'border-gray-300' : 'border-green-200 bg-green-50'
                      }`} style={{ color: COLORS.secondary }}>
                        <Upload className="w-4 h-4" />
                        {formData.barangay_clearance_file ? 'Change' : 'Upload'}
                      </div>
                    </label>
                    {formData.barangay_clearance_file && (
                      <button
                        type="button"
                        onClick={() => previewFile(formData.barangay_clearance_file)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                        style={{ color: COLORS.secondary }}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-gray-50">
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Barangay Clearance ID/Number (Alternative to file upload):
                  </label>
                  <input
                    type="text"
                    name="barangay_clearance_id"
                    value={formData.barangay_clearance_id}
                    onChange={handleChange}
                    placeholder="Enter Barangay Clearance ID or Reference Number"
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  />
                </div>
              </div>

              {/* Owner Valid ID */}
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-blue-50">
                <div className="flex items-center">
                  {formData.owner_valid_id_file ? (
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 mr-3" />
                  )}
                  <div>
                    <span className="font-medium">Owner Valid ID: <span className="text-red-500">*</span></span>
                    <p className="text-sm text-gray-600">
                      {formData.owner_valid_id_file ? formData.owner_valid_id_file.name : 'Required'}
                    </p>
                    <p className="text-xs text-red-500 font-semibold">* This document is mandatory</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="owner_valid_id_file"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                      !formData.owner_valid_id_file ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
                    }`} style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.owner_valid_id_file ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.owner_valid_id_file && (
                    <button
                      type="button"
                      onClick={() => previewFile(formData.owner_valid_id_file)}
                      className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                      style={{ color: COLORS.secondary }}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  )}
                </div>
              </div>

              {/* Business Tax Receipt */}
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={attachmentChecks.business_tax_receipt}
                    onChange={() => handleCheckboxChange('business_tax_receipt')}
                    className="mr-3 h-5 w-5"
                  />
                  <div>
                    <span className="font-medium">Business Tax Receipt (Previous Year):</span>
                    <p className="text-sm text-gray-600">
                      {formData.business_tax_receipt ? formData.business_tax_receipt.name : 
                       attachmentChecks.business_tax_receipt ? 'Required' : 'Optional'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="business_tax_receipt"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                      disabled={!attachmentChecks.business_tax_receipt}
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                      !formData.business_tax_receipt ? 'border-gray-300' : 'border-green-200 bg-green-50'
                    } ${!attachmentChecks.business_tax_receipt ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.business_tax_receipt ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.business_tax_receipt && (
                    <button
                      type="button"
                      onClick={() => previewFile(formData.business_tax_receipt)}
                      className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                      style={{ color: COLORS.secondary }}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  )}
                </div>
              </div>

              {/* Fire Safety Certificate */}
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={attachmentChecks.fire_safety_certificate}
                    onChange={() => handleCheckboxChange('fire_safety_certificate')}
                    className="mr-3 h-5 w-5"
                  />
                  <div>
                    <span className="font-medium">Fire Safety Inspection Certificate:</span>
                    <p className="text-sm text-gray-600">
                      {formData.fire_safety_certificate ? formData.fire_safety_certificate.name : 
                       attachmentChecks.fire_safety_certificate ? 'Required' : 'Optional'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="fire_safety_certificate"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                      disabled={!attachmentChecks.fire_safety_certificate}
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                      !formData.fire_safety_certificate ? 'border-gray-300' : 'border-green-200 bg-green-50'
                    } ${!attachmentChecks.fire_safety_certificate ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.fire_safety_certificate ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.fire_safety_certificate && (
                    <button
                      type="button"
                      onClick={() => previewFile(formData.fire_safety_certificate)}
                      className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                      style={{ color: COLORS.secondary }}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  )}
                </div>
              </div>

              {/* Sanitation Permit (Optional for health-related businesses) */}
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={attachmentChecks.sanitation_permit}
                    onChange={() => handleCheckboxChange('sanitation_permit')}
                    className="mr-3 h-5 w-5"
                  />
                  <div>
                    <span className="font-medium">Sanitation Permit:</span>
                    <p className="text-sm text-gray-600">
                      {formData.sanitation_permit ? formData.sanitation_permit.name : 
                       attachmentChecks.sanitation_permit ? 'Required' : 'Optional'}
                    </p>
                    {isHealthRelatedBusiness() && (
                      <p className="text-xs text-blue-600">* Recommended for health/food related businesses</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="sanitation_permit"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                      disabled={!attachmentChecks.sanitation_permit}
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                      !formData.sanitation_permit ? 'border-gray-300' : 'border-green-200 bg-green-50'
                    } ${!attachmentChecks.sanitation_permit ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.sanitation_permit ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.sanitation_permit && (
                    <button
                      type="button"
                      onClick={() => previewFile(formData.sanitation_permit)}
                      className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                      style={{ color: COLORS.secondary }}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  )}
                </div>
              </div>

              {/* Official Receipt (Optional) */}
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={attachmentChecks.official_receipt_file}
                    onChange={() => handleCheckboxChange('official_receipt_file')}
                    className="mr-3 h-5 w-5"
                  />
                  <div>
                    <span className="font-medium">Official Receipt of Payment: <span className="text-red-500">*</span></span>
                    <p className="text-sm text-gray-600">
                      {formData.official_receipt_file ? formData.official_receipt_file.name : 
                       attachmentChecks.official_receipt_file ? 'Required' : 'Required'}
                    </p>
                    <p className="text-xs text-red-500 font-semibold">* This document is mandatory for renewal</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="official_receipt_file"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                      disabled={!attachmentChecks.official_receipt_file}
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                      !formData.official_receipt_file ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
                    } ${!attachmentChecks.official_receipt_file ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.official_receipt_file ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.official_receipt_file && (
                    <button
                      type="button"
                      onClick={() => previewFile(formData.official_receipt_file)}
                      className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                      style={{ color: COLORS.secondary }}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

            case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Declaration and Signature</h3>
            
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <div className="mb-8 p-6 border-2 border-red-200 bg-red-50 rounded-lg">
                <h4 className="font-bold text-lg mb-4 text-red-700">BUSINESS PERMIT RENEWAL DECLARATION</h4>
                <div className="space-y-3 text-sm" style={{ fontFamily: COLORS.font }}>
                  <p>I, <span className="font-bold">{getFullName() || '[Full Name]'}</span>, hereby solemnly declare that:</p>
                  
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>All information provided in this renewal application is true, complete, and correct;</li>
                    <li>I am the registered owner/authorized representative of the business described in this application;</li>
                    <li>The business remains compliant with all safety, sanitation, and environmental standards;</li>
                    <li>I have secured all necessary clearances, permits, and paid all business taxes;</li>
                    <li>I shall continue to abide by all business regulations, rules, and ordinances of Caloocan City;</li>
                    <li>I understand that any false statement or misrepresentation shall be grounds for:</li>
                    <ul className="list-disc ml-8 mt-2 space-y-1">
                      <li>Immediate cancellation of the permit renewal</li>
                      <li>Administrative and criminal liability</li>
                      <li>Fines and penalties as per existing laws</li>
                    </ul>
                    <li>I agree to the processing of my personal data for renewal purposes in accordance with the Data Privacy Act of 2012;</li>
                    <li>I consent to inspections and monitoring by authorized personnel.</li>
                  </ol>
                  
                  <p className="mt-4 font-semibold">Republic Act No. 11032 - Ease of Doing Business and Efficient Government Service Delivery Act of 2018</p>
                  <p className="text-xs italic">"Any person who makes any false statement in any business permit renewal application shall be subject to penalties under existing laws."</p>
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
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Date of Submission <span className="text-red-600">*</span>
                  </label>
                  <div className="w-full p-3 border border-black rounded-lg bg-gray-50">
                    <p style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                      {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically set to current date and time upon submission
                    </p>
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
                    className={`w-5 h-5 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500`}
                  />
                  <label htmlFor="final-declaration" className="ml-3">
                    <span className="font-bold text-red-700">FINAL DECLARATION AND CONSENT *</span>
                    <p className="text-sm mt-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                      I, <span className="font-semibold">{getFullName() || '[Full Name]'}</span>, have read, understood, and agree to all terms and conditions stated in this declaration. I certify that all information provided is accurate and I accept full responsibility for its veracity.
                    </p>
                  </label>
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
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>BUSINESS PERMIT RENEWAL APPLICATION</h1>
          <p className="mt-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Permit Type: <span className="font-semibold" style={{ color: COLORS.success }}>Renewal</span></p>
          {existingPermitId && (
            <p className="text-sm text-gray-600 mt-1">Renewing Permit ID: {existingPermitId}</p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/user/business/type')}
            className="px-4 py-2 rounded-lg font-semibold text-white hover:bg-[#FDA811] transition-colors duration-300"
            style={{ background: COLORS.success, fontFamily: COLORS.font }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
          >
            Back to Permit Type
          </button>
        </div>
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

      {submitStatus && <div className="p-4 mb-6 rounded" style={{ 
        background: submitStatus.type === 'success' ? '#e6f9ed' : '#fdecea', 
        color: submitStatus.type === 'success' ? COLORS.success : COLORS.danger,
        fontFamily: COLORS.font,
        border: '1px solid ' + (submitStatus.type === 'success' ? COLORS.success : COLORS.danger)
      }}>{submitStatus.message}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {renderStepContent()}

        <div className="flex justify-between pt-6">
          {currentStep > 1 && (
            <button 
              type="button" 
              onClick={prevStep}
              className="px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#FDA811] transition-colors duration-300" 
              style={{ 
                background: COLORS.success, 
                fontFamily: COLORS.font
              }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
            >
              Previous
            </button>
          )}
          
          {currentStep < steps.length ? (
            <button 
              type="submit"
              className="px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#FDA811] transition-colors duration-300" 
              style={{ 
                background: COLORS.success, 
                fontFamily: COLORS.font
              }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
            >
              {currentStep === steps.length - 1 ? 'Review & Submit' : 'Next'}
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit}
              className="px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#FDA811] transition-colors duration-300" 
              style={{ 
                background: COLORS.success, 
                fontFamily: COLORS.font
              }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
            >
              Submit Renewal Application
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

      {/* Declaration Modal */}
      {showDeclarationModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="p-8 rounded-lg shadow-lg w-full max-w-lg border border-gray-200"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font,
              backdropFilter: 'blur(10px)'
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>Final Submission</h2>
            
            <div className="mb-6">
              <div className="p-4 bg-gray-50 rounded-lg border mb-4">
                <p className="text-sm font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Final Confirmation:</p>
                <p className="text-sm mb-3" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Are you sure you want to submit your business permit renewal application? Please review all information before submitting.
                </p>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="final-confirmation-checkbox"
                    checked={agreeDeclaration}
                    onChange={(e) => setAgreeDeclaration(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="final-confirmation-checkbox" className="ml-2 text-sm" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    I confirm that all information is correct and I agree to the terms *
                  </label>
                </div>
              </div>
              
              <p className="text-sm" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                By submitting, you confirm that all information provided is accurate and complete.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeclarationModal(false)}
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
                onClick={confirmDeclaration}
                disabled={isSubmitting || !agreeDeclaration}
                style={{ background: (!agreeDeclaration || isSubmitting) ? '#9CA3AF' : COLORS.success }}
                onMouseEnter={e => {
                  if (!isSubmitting && agreeDeclaration) e.currentTarget.style.background = COLORS.accent;
                }}
                onMouseLeave={e => {
                  if (!isSubmitting && agreeDeclaration) e.currentTarget.style.background = COLORS.success;
                }}
                className={`px-6 py-2 rounded-lg font-semibold text-white ${
                  (isSubmitting || !agreeDeclaration) ? 'cursor-not-allowed' : 'transition-colors duration-300'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Renewal'}
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

      {/* Barangay Clearance Verification Modal */}
      {showBarangayModal && barangayVerificationResult && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="p-8 rounded-lg shadow-lg w-full max-w-lg border border-gray-200"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                barangayVerificationResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {barangayVerificationResult.success ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <X className="w-8 h-8 text-red-600" />
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-center mb-4" style={{ 
              color: barangayVerificationResult.success ? COLORS.success : COLORS.danger 
            }}>
              {barangayVerificationResult.success ? 'Verification Successful' : 'Verification Failed'}
            </h2>
            
            <p className="text-sm text-center mb-6" style={{ color: COLORS.secondary }}>
              {barangayVerificationResult.message}
            </p>

            <div className="flex justify-center">
              <button
                onClick={() => setShowBarangayModal(false)}
                style={{ background: COLORS.success }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business Tax Receipt Verification Modal */}
      {showBusinessModal && businessVerificationResult && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="p-8 rounded-lg shadow-lg w-full max-w-lg border border-gray-200"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                businessVerificationResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {businessVerificationResult.success ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <X className="w-8 h-8 text-red-600" />
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-center mb-4" style={{ 
              color: businessVerificationResult.success ? COLORS.success : COLORS.danger 
            }}>
              {businessVerificationResult.success ? 'Payment Verified' : 'Verification Failed'}
            </h2>
            
            <p className="text-sm text-center mb-6" style={{ color: COLORS.secondary }}>
              {businessVerificationResult.message}
            </p>

            <div className="flex justify-center">
              <button
                onClick={() => setShowBusinessModal(false)}
                style={{ background: COLORS.success }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Verification Result Modal */}
      {showVerificationModal && verificationModalData && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="p-8 rounded-lg shadow-lg w-full max-w-2xl border border-gray-200"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                verificationModalData.isValid ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {verificationModalData.isValid ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-center mb-4" style={{ 
              color: verificationModalData.isValid ? COLORS.success : '#D97706'
            }}>
              {verificationModalData.isValid ? 'AI Verification Complete' : 'Please Review Document'}
            </h2>
            
            <p className="text-sm text-center mb-4" style={{ color: COLORS.secondary }}>
              {verificationModalData.message}
            </p>

            {verificationModalData.extractedText && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold mb-2 text-gray-700">Extracted Text Sample:</p>
                <p className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                  {verificationModalData.extractedText}...
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => setShowVerificationModal(false)}
                style={{ background: COLORS.success }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                Close
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
              
              <button
                onClick={() => setShowErrorModal(false)}
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