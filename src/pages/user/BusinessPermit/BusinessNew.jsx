import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, Check, X, Eye, FileText, Search, AlertCircle, Loader2, Shield } from "lucide-react";
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use the bundled worker from node_modules
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

const API_BUS = "/backend/business_permit/business_permit.php";
const ZONING_API = "https://urbanplanning.goserveph.com/api/zoning-applications";
const BARANGAY_API = "/backend/barangay_permit/admin_fetch.php";
const SANITATION_API = "https://health.goserveph.com/api/licensing_export.php";
const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguans", "Argentinean", "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Barbudans", "Batswana", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djibouti", "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian", "Herzegovinian", "Honduran", "Hungarian", "I-Kiribati", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan", "Kittian and Nevisian", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivan", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Moroccan", "Mosotho", "Motswana", "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan", "San Marinese", "Sao Tomean", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian", "Slovenian", "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamer", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian or Tobagonian", "Tunisian", "Turkish", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbekistani", "Venezuelan", "Vietnamese", "Welsh", "Yemenite", "Zambian", "Zimbabwean"
];

export default function BusinessNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const permitType = location.state?.permitType || 'NEW';

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
  const [showVerifyingModal, setShowVerifyingModal] = useState(false);
  const [verifyingProgress, setVerifyingProgress] = useState(0);
  
  // Zoning ID verification states
  const [verifyingZoningId, setVerifyingZoningId] = useState(false);
  const [zoningVerificationResult, setZoningVerificationResult] = useState(null);
  const [showZoningModal, setShowZoningModal] = useState(false);
  const [validatedZoningIds, setValidatedZoningIds] = useState({});
  const [zoningApplications, setZoningApplications] = useState([]);

  // Barangay Clearance ID verification states
  const [verifyingBarangayId, setVerifyingBarangayId] = useState(false);
  const [barangayVerificationResult, setBarangayVerificationResult] = useState(null);
  const [showBarangayModal, setShowBarangayModal] = useState(false);
  const [validatedBarangayIds, setValidatedBarangayIds] = useState({});
  const [barangayClearanceMethod, setBarangayClearanceMethod] = useState('upload'); // 'upload' or 'id'

  // Sanitation Permit ID verification states
  const [verifyingSanitationId, setVerifyingSanitationId] = useState(false);
  const [sanitationVerificationResult, setSanitationVerificationResult] = useState(null);
  const [showSanitationModal, setShowSanitationModal] = useState(false);
  const [validatedSanitationIds, setValidatedSanitationIds] = useState({});
  const [sanitationPermits, setSanitationPermits] = useState([]);

  // Document verification states
  const [documentVerification, setDocumentVerification] = useState({
    barangay_clearance: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    bir_certificate: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    lease_or_title: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    fsic: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    owner_valid_id: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    dti_registration: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    sec_registration: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 }
  });

  // Verification result modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationModalData, setVerificationModalData] = useState(null);

  // State for attachment checkboxes
  const [attachmentChecks, setAttachmentChecks] = useState({
    barangay_clearance: true,
    bir_certificate: true,
    lease_or_title: true,
    fsic: true,
    owner_valid_id: true,
    id_picture: true,
    official_receipt_file: false,
  });

  const [formData, setFormData] = useState({
    permit_type: permitType,
    application_date: new Date().toISOString().split('T')[0],
    gross_sale: "0",

    // Owner Information
    owner_last_name: "",
    owner_first_name: "",
    owner_middle_name: "",
    owner_type: "",
    citizenship: "",
    corp_filipino_percent: 0,
    corp_foreign_percent: 0,
    date_of_birth: "",
    contact_number: "",
    email_address: "",
    home_address: "",
    valid_id_type: "",
    valid_id_number: "",

    // Business Information
    business_name: "",
    trade_name: "",
    business_nature: "",
    building_type: "",
    capital_investment: 0,

    // Business Address
    house_bldg_no: "",
    building_name: "",
    block_no: "",
    lot_no: "",
    street: "",
    subdivision: "",
    province: "Metro Manila",
    city_municipality: "Caloocan City",
    barangay: "",
    zip_code: "",
    district: "",

    // Operations Details
    zoning_permit_id: "",
    sanitation_permit_id: "",
    barangay_clearance_id: "",
    business_area: 0,
    total_floor_area: 0,
    operation_time_from: "",
    operation_time_to: "",
    total_employees: 0,
    male_employees: 0,
    female_employees: 0,
    employees_in_qc: 0,
    delivery_van_truck: 0,
    delivery_motorcycle: 0,
    
    
    // Operations
    operation_type: "",

    // Attachments
    attachments_applicable: false,
    barangay_clearance: null,
    bir_certificate: null,
    lease_or_title: null,
    fsic: null,
    owner_valid_id: null,
    id_picture: null,
    official_receipt_file: null,
    owner_scanned_id: null,
    dti_registration: null,
    sec_registration: null,
    representative_scanned_id: null,

    // Declaration & Approval
    owner_type_declaration: "Business Owner",
    owner_representative_name: "",
    date_submitted: "", // Will be set during submission
    official_receipt_no: "",
    applicant_signature: "",
  });

  // Fetch zoning applications and sanitation permits on component mount
  useEffect(() => {
    fetchZoningApplications();
    fetchSanitationPermits();
  }, []);

  const fetchZoningApplications = async () => {
    try {
      const response = await fetch(ZONING_API);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setZoningApplications(data.data);
      }
    } catch (error) {
      console.error("Error fetching zoning applications:", error);
    }
  };

  const fetchSanitationPermits = async () => {
    try {
      const response = await fetch(SANITATION_API);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setSanitationPermits(data.data);
      } else if (Array.isArray(data)) {
        setSanitationPermits(data);
      }
    } catch (error) {
      console.error("Error fetching sanitation permits:", error);
    }
  };

  // Helper function to get full name
  const getFullName = () => {
    const parts = [
      formData.owner_first_name,
      formData.owner_middle_name,
      formData.owner_last_name
    ].filter(Boolean);
    return parts.join(' ');
  };

  // Steps array
  const steps = [
    { id: 1, title: 'Owner Information', description: 'Personal details of the business owner' },
    { id: 2, title: 'Business Information', description: 'Details about your business establishment' },
    { id: 3, title: 'Location & Operations', description: 'Business address and operational information' },
    { id: 4, title: 'Attachments', description: 'Upload required documents' },
    { id: 5, title: 'Declaration & Submit', description: 'Finalize and submit your application' },
    { id: 6, title: 'Review Application', description: 'Review your application details' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e) => {
    const { name, files } = e.target;
    const file = files?.[0] || null;
    setFormData((prev) => ({ ...prev, [name]: file }));
    
    // Reset verification status when file changes
    if (documentVerification[name]) {
      setDocumentVerification(prev => ({
        ...prev,
        [name]: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 }
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

  const handleCheckboxChange = (field) => {
    if (['barangay_clearance', 'bir_certificate', 'lease_or_title', 'fsic', 'owner_valid_id', 'id_picture'].includes(field)) {
      return;
    }
    
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

  // ====== DOCUMENT VERIFICATION HELPER FUNCTIONS ======
  const normalizeText = (text) => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const fuzzyMatch = (str1, str2, threshold = 0.5) => {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.95;
    
    // Check for partial matches with lower threshold
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

  // Month name recognition for birth date extraction from documents
  const MONTH_NAMES = {
    january: ['january', 'jan', 'enero', 'ene'],
    february: ['february', 'feb', 'febrero', 'pebrero'],
    march: ['march', 'mar', 'marzo'],
    april: ['april', 'apr', 'abril', 'abr'],
    may: ['may', 'mayo'],
    june: ['june', 'jun', 'junio'],
    july: ['july', 'jul', 'julio'],
    august: ['august', 'aug', 'agosto', 'agos'],
    september: ['september', 'sept', 'sep', 'septiembre', 'septyembre'],
    october: ['october', 'oct', 'octubre', 'oktubre'],
    november: ['november', 'nov', 'noviembre', 'nobyembre'],
    december: ['december', 'dec', 'diciembre', 'disyembre']
  };

  // Normalize month name to standard format (recognizes English and Filipino variants)
  const normalizeMonthName = (text) => {
    const textLower = text.toLowerCase().trim();
    
    for (const [standardMonth, variations] of Object.entries(MONTH_NAMES)) {
      for (const variant of variations) {
        if (textLower === variant || textLower.includes(variant)) {
          return standardMonth;
        }
      }
    }
    return null;
  };

  // Extract dates with month names from text (handles multiple formats)
  const extractDatesWithMonthNames = (text) => {
    const dates = [];
    
    // Pattern: Day Month Year (e.g., "15 January 1990", "15 JAN 1990")
    const pattern1 = /(\d{1,2})\s+(january|jan|enero|ene|february|feb|febrero|pebrero|march|mar|marzo|april|apr|abril|abr|may|mayo|june|jun|junio|july|jul|julio|august|aug|agosto|agos|september|sept|sep|septiembre|septyembre|october|oct|octubre|oktubre|november|nov|noviembre|nobyembre|december|dec|diciembre|disyembre)\s+(\d{2,4})/gi;
    
    // Pattern: Month Day, Year (e.g., "January 15, 1990")
    const pattern2 = /(january|jan|enero|ene|february|feb|febrero|pebrero|march|mar|marzo|april|apr|abril|abr|may|mayo|june|jun|junio|july|jul|julio|august|aug|agosto|agos|september|sept|sep|septiembre|septyembre|october|oct|octubre|oktubre|november|nov|noviembre|nobyembre|december|dec|diciembre|disyembre)\s+(\d{1,2}),?\s+(\d{2,4})/gi;
    
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      const monthName = normalizeMonthName(match[2]);
      if (monthName) {
        dates.push({
          raw: match[0],
          month: monthName,
          day: match[1],
          year: match[3]
        });
      }
    }
    
    while ((match = pattern2.exec(text)) !== null) {
      const monthName = normalizeMonthName(match[1]);
      if (monthName) {
        dates.push({
          raw: match[0],
          month: monthName,
          day: match[2],
          year: match[3]
        });
      }
    }
    
    return dates;
  };

  // Document type patterns for verification
  const DOCUMENT_PATTERNS = {
    barangay_clearance: [
      "barangay clearance", "brgy clearance", "barangay certification",
      "clearance", "certification", "punong barangay", "barangay captain",
      "lupon", "katarungang pambarangay"
    ],
    bir_certificate: [
      "bir", "bureau of internal revenue", "certificate of registration",
      "bir form", "tin", "tax identification", "bir cert", "revenue"
    ],
    lease_or_title: [
      "lease", "contract", "land title", "transfer certificate of title",
      "tct", "original certificate of title", "oct", "lease agreement",
      "rental agreement", "deed"
    ],
    fsic: [
      "fire safety", "fsic", "fire safety inspection certificate",
      "bureau of fire", "bfp", "fire protection", "fire certificate",
      "inspection certificate", "fire clearance"
    ],
    owner_valid_id: [
      "philippine", "national id", "passport", "driver", "license",
      "umid", "sss", "gsis", "philhealth", "pag-ibig", "voter",
      "postal", "senior citizen", "pwd", "tin", "prc"
    ],
    dti_registration: [
      "dti", "department of trade", "trade and industry",
      "business name registration", "certificate of business",
      "sole proprietor", "dti registration"
    ],
    sec_registration: [
      "sec", "securities and exchange commission",
      "certificate of incorporation", "articles of incorporation",
      "corporation", "partnership", "sec registration"
    ]
  };

  const detectDocumentType = (extractedText, expectedType) => {
    const textLower = extractedText.toLowerCase();
    const patterns = DOCUMENT_PATTERNS[expectedType] || [];
    
    let matchCount = 0;
    for (const keyword of patterns) {
      if (textLower.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    // Strict - require at least one keyword match to verify correct document type
    const confidence = patterns.length > 0 ? matchCount / patterns.length : 0;
    
    return {
      matched: matchCount > 0,
      confidence: confidence,
      matchCount: matchCount,
      expectedType: expectedType
    };
  };

  // ID Type patterns for verification
  const ID_TYPE_PATTERNS = {
    "Philippine National ID (PhilSys ID)": ["philsys", "philippine national id", "national id", "phil id", "republic of the philippines", "pambansang pagkakakilanlan", "philippine identification card", "pcn"],
    "Passport (DFA)": ["passport", "dfa", "department of foreign affairs", "p <", "republic of the philippines passport"],
    "Driver's License (LTO)": ["driver", "license", "licence", "lto", "land transportation", "department of transportation", "dl no"],
    "UMID": ["umid", "unified multi-purpose id", "sss", "gsis"],
    "PRC ID": ["prc", "professional regulation commission", "professional id"],
    "Voter's ID": ["voter", "comelec", "commission on elections", "voter's identification"],
    "COMELEC Voter's Certificate": ["comelec", "voter", "certificate", "commission on elections"],
    "Postal ID (PhilPost)": ["postal", "philpost", "philippine postal"],
    "Senior Citizen ID": ["senior citizen", "osca", "office of senior citizen"],
    "PWD ID": ["pwd", "person with disability", "disabled"],
    "SSS ID": ["sss", "social security system", "social security"],
    "GSIS eCard": ["gsis", "government service insurance", "ecard"],
    "PhilHealth ID": ["philhealth", "philippine health", "health insurance"],
    "Pag-IBIG ID": ["pag-ibig", "pagibig", "hdmf", "home development mutual fund"],
    "TIN ID": ["tin", "tax identification number", "bir", "bureau of internal revenue"],
    "Barangay ID": ["barangay id", "barangay identification", "brgy id"],
    "Barangay Clearance": ["barangay clearance", "brgy clearance"],
    "Police Clearance": ["police clearance", "pnp clearance", "philippine national police"],
    "NBI Clearance": ["nbi clearance", "national bureau of investigation"],
    "Solo Parent ID": ["solo parent", "single parent"],
    "Indigenous People's (IP) ID": ["indigenous people", "ip id", "ncip", "national commission on indigenous"],
    "School ID": ["school id", "student id", "university", "college", "student number"],
    "Company / Employee ID": ["company id", "employee id", "employee no", "emp no"],
    "Government Office ID": ["government", "office id", "gov id"],
    "Firearms License ID": ["firearms", "license to own and possess firearms", "ltopf"],
    "Seafarer's Identification Record Book (SIRB)": ["seafarer", "sirb", "marina", "maritime"],
    "OWWA ID": ["owwa", "overseas workers welfare", "ofw"],
    "Alien Certificate of Registration (ACR I-Card)": ["acr", "alien certificate", "i-card", "bureau of immigration"]
  };

  // Detect ID type from extracted text
  const detectIDType = (extractedText) => {
    const textLower = extractedText.toLowerCase();
    const detectedTypes = [];

    for (const [idType, keywords] of Object.entries(ID_TYPE_PATTERNS)) {
      let matchCount = 0;
      for (const keyword of keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        detectedTypes.push({
          type: idType,
          confidence: matchCount / keywords.length,
          matchCount: matchCount
        });
      }
    }

    detectedTypes.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return b.confidence - a.confidence;
    });

    return detectedTypes.length > 0 ? detectedTypes[0] : null;
  };

  // Check if business name appears in document
  const verifyBusinessNameInDoc = (extractedText) => {
    if (!formData.business_name) return null;
    const businessName = formData.business_name.trim();
    if (!businessName) return null;
    
    const match = fuzzyMatch(businessName, extractedText);
    return {
      matched: match > 0.6,
      confidence: match,
      value: businessName
    };
  };

  // Check if owner name appears in document (checks first_name, last_name, middle_name is optional)
  const verifyOwnerNameInDoc = (extractedText) => {
    const firstName = formData.owner_first_name?.trim();
    const lastName = formData.owner_last_name?.trim();
    const middleName = formData.owner_middle_name?.trim();
    
    if (!firstName || !lastName) return null;
    
    // More lenient matching - check both fuzzy match and simple substring
    const textLower = extractedText.toLowerCase();
    const firstNameLower = firstName.toLowerCase();
    const lastNameLower = lastName.toLowerCase();
    
    const firstNameFuzzy = fuzzyMatch(firstName, extractedText);
    const lastNameFuzzy = fuzzyMatch(lastName, extractedText);
    const middleNameFuzzy = middleName ? fuzzyMatch(middleName, extractedText) : 0;
    
    // Accept if either fuzzy match works OR simple substring match
    const firstNameFound = firstNameFuzzy > 0 || textLower.includes(firstNameLower);
    const lastNameFound = lastNameFuzzy > 0 || textLower.includes(lastNameLower);
    const middleNameFound = middleName ? (middleNameFuzzy > 0 || textLower.includes(middleName.toLowerCase())) : false;
    
    // Only require first name AND last name to match
    // Middle name is optional - doesn't fail validation if not found
    const hasRequiredMatch = firstNameFound && lastNameFound;
    
    return {
      firstName: { matched: firstNameFound, confidence: firstNameFuzzy, value: firstName },
      lastName: { matched: lastNameFound, confidence: lastNameFuzzy, value: lastName },
      middleName: middleName ? { matched: middleNameFound, confidence: middleNameFuzzy, value: middleName } : null,
      anyMatch: hasRequiredMatch,
      allMatch: hasRequiredMatch && (!middleName || middleNameFound)
    };
  };


  // Convert PDF to images for OCR processing
  const convertPdfToImages = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images = [];
      
      // Process first 3 pages only (to avoid long processing time)
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

  // Generic document verification function
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

    // Show verifying modal
    setShowVerifyingModal(true);
    setVerifyingProgress(0);
    
    // Reset verification status
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
            setVerifyingProgress(progress);
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

      setDocumentVerification(prev => ({
        ...prev,
        [documentType]: { ...prev[documentType], progress: 10 }
      }));

      let text = '';
      
      // Check if file is PDF
      if (file.type === 'application/pdf') {
        setDocumentVerification(prev => ({
          ...prev,
          [documentType]: { ...prev[documentType], progress: 20 }
        }));
        
        // Convert PDF to images
        const images = await convertPdfToImages(file);
        
        setDocumentVerification(prev => ({
          ...prev,
          [documentType]: { ...prev[documentType], progress: 40 }
        }));
        
        // Process each image
        for (let i = 0; i < images.length; i++) {
          const { data: { text: pageText } } = await worker.recognize(images[i]);
          text += pageText + '\n';
          
          setDocumentVerification(prev => ({
            ...prev,
            [documentType]: { 
              ...prev[documentType], 
              progress: 40 + Math.round((i + 1) / images.length * 40)
            }
          }));
        }
      } else {
        // Process image file directly
        const { data: { text: imageText } } = await worker.recognize(file);
        text = imageText;
      }
      
      await worker.terminate();

      setDocumentVerification(prev => ({
        ...prev,
        [documentType]: { ...prev[documentType], progress: 90 }
      }));

      const extractedText = text.toLowerCase();
      
      // Detect document type
      const docTypeCheck = detectDocumentType(text, documentType);
      
      // Check for business name
      const businessNameCheck = verifyBusinessNameInDoc(extractedText);
      
      // Check for owner name
      const ownerNameCheck = verifyOwnerNameInDoc(extractedText);
      
      // For owner_valid_id and owner_scanned_id, check ID number and ID type
      let idNumberCheck = null;
      let idTypeCheck = null;
      let isValidIDDocument = false;
      
      if (documentType === 'owner_valid_id' || documentType === 'owner_scanned_id') {
        // Check if ID number exists in the document
        if (formData.valid_id_number) {
          const idNumberNormalized = normalizeText(formData.valid_id_number);
          let idNumberInText = extractedText.includes(idNumberNormalized) || 
            fuzzyMatch(formData.valid_id_number, extractedText) > 0.8;
          
          // Also check for "license no" pattern which commonly appears on driver's licenses
          if (!idNumberInText) {
            const licenseNoPatterns = [
              /license\s*no\.?\s*:?\s*(\S+)/i,
              /dl\s*no\.?\s*:?\s*(\S+)/i,
              /license\s*number\s*:?\s*(\S+)/i,
              /dl\s*number\s*:?\s*(\S+)/i
            ];
            
            for (const pattern of licenseNoPatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                const extractedNumber = normalizeText(match[1]);
                if (extractedNumber === idNumberNormalized || 
                    extractedNumber.includes(idNumberNormalized) ||
                    idNumberNormalized.includes(extractedNumber)) {
                  idNumberInText = true;
                  break;
                }
              }
            }
          }
          
          idNumberCheck = {
            value: formData.valid_id_number,
            found: idNumberInText
          };
        }
        
        // Detect ID type from document - this serves as document type verification for IDs
        const detectedIDType = detectIDType(extractedText);
        if (detectedIDType) {
          isValidIDDocument = true; // Any valid ID type detected means it's an ID document
          if (formData.valid_id_type) {
            // Flexible matching to handle variations like "Driver's License" vs "Driver's License (LTO)"
            const expectedLower = formData.valid_id_type.toLowerCase();
            const detectedLower = detectedIDType.type.toLowerCase();
            const isMatch = expectedLower === detectedLower || 
                           expectedLower.includes(detectedLower) || 
                           detectedLower.includes(expectedLower) ||
                           // Match key words (e.g., "driver" and "license" both present)
                           (expectedLower.includes('driver') && detectedLower.includes('driver')) ||
                           (expectedLower.includes('passport') && detectedLower.includes('passport')) ||
                           (expectedLower.includes('national id') && detectedLower.includes('national id')) ||
                           (expectedLower.includes('philsys') && detectedLower.includes('philsys'));
            
            idTypeCheck = {
              expected: formData.valid_id_type,
              detected: detectedIDType.type,
              matched: isMatch,
              confidence: detectedIDType.confidence,
              matchCount: detectedIDType.matchCount
            };
          }
        }
      }
      
      const results = {
        documentType: {
          detected: docTypeCheck.matched,
          confidence: docTypeCheck.confidence,
          matchCount: docTypeCheck.matchCount
        },
        businessName: businessNameCheck,
        ownerName: ownerNameCheck,
        idNumber: idNumberCheck,
        idType: idTypeCheck,
        extractedText: text
      };

      // Determine if verification passed and track invalid reasons
      let isVerified = false;
      let invalidReasons = [];
      
      // CRITICAL: Check if correct document type was uploaded
      // For IDs, use ID type detection instead of generic DOCUMENT_PATTERNS
      const isIDDocument = documentType === 'owner_valid_id' || documentType === 'owner_scanned_id';
      const documentTypeMatched = isIDDocument ? isValidIDDocument : docTypeCheck.matched;
      
      if (!documentTypeMatched) {
        const docTypeLabels = {
          'owner_valid_id': 'Valid ID',
          'owner_scanned_id': 'Valid ID',
          'bir_certificate': 'BIR Certificate',
          'dti_registration': 'DTI Registration',
          'sec_registration': 'SEC Registration',
          'lease_or_title': 'Lease Agreement or Property Title',
          'fsic': 'Fire Safety Inspection Certificate',
          'barangay_clearance': 'Barangay Clearance'
        };
        const expectedDoc = docTypeLabels[documentType] || documentType;
        invalidReasons = [`Wrong document type uploaded. Expected: ${expectedDoc}. Please upload the correct document.`];
        isVerified = false;
      }
      
      // For owner_valid_id and owner_scanned_id, require valid ID detected, name, ID number, and ID type match
      if ((documentType === 'owner_valid_id' || documentType === 'owner_scanned_id') && isValidIDDocument) {
        const hasOwnerName = ownerNameCheck?.anyMatch;
        const hasIdNumber = idNumberCheck?.found;
        const hasCorrectIdType = idTypeCheck?.matched;
        
        // All three must match: name, ID number, and ID type
        if (hasOwnerName && hasIdNumber && hasCorrectIdType) {
          isVerified = true;
        } else {
          // Build detailed checklist of what didn't match
          invalidReasons = ['The following information could not be verified:'];
          
          if (!hasOwnerName) {
            const firstNameMatch = ownerNameCheck?.firstName?.matched;
            const lastNameMatch = ownerNameCheck?.lastName?.matched;
            if (!firstNameMatch && !lastNameMatch) {
              invalidReasons.push('❌ Owner name not found in ID');
            } else if (!firstNameMatch) {
              invalidReasons.push('❌ First name not found in ID');
            } else if (!lastNameMatch) {
              invalidReasons.push('❌ Last name not found in ID');
            }
          } else {
            invalidReasons.push('✓ Owner name verified');
          }
          
          if (!hasIdNumber) {
            invalidReasons.push('❌ ID number not found in document');
          } else {
            invalidReasons.push('✓ ID number verified');
          }
          
          if (!hasCorrectIdType) {
            if (idTypeCheck) {
              invalidReasons.push(`❌ ID type mismatch (Expected: ${idTypeCheck.expected}, Detected: ${idTypeCheck.detected})`);
            } else {
              invalidReasons.push('❌ ID type could not be detected');
            }
          } else {
            invalidReasons.push('✓ ID type verified');
          }
          
          invalidReasons.push('Please ensure the ID image is clear and all information is visible.');
          isVerified = false;
        }
      }
      
      // For business documents (BIR, DTI, SEC), require document type match AND owner name
      if (['bir_certificate', 'dti_registration', 'sec_registration'].includes(documentType) && docTypeCheck.matched) {
        const hasBusinessName = businessNameCheck?.matched;
        const hasOwnerName = ownerNameCheck?.anyMatch;
        
        // Require owner name match and correct document type
        if (hasOwnerName) {
          isVerified = true;
        } else {
          invalidReasons = ['Document may be unreadable or unclear. Please re-upload a clear copy.'];
          isVerified = false;
        }
      }
      
      // For lease/title and FSIC, require document type match AND owner name
      if (['lease_or_title', 'fsic'].includes(documentType) && docTypeCheck.matched) {
        const hasOwnerName = ownerNameCheck?.anyMatch;
        
        if (hasOwnerName) {
          isVerified = true;
        } else {
          invalidReasons = ['Document may be unreadable or unclear. Please re-upload a clear copy.'];
          isVerified = false;
        }
      }
      
      // For barangay_clearance, require document type match AND owner name
      if (documentType === 'barangay_clearance' && docTypeCheck.matched) {
        const hasOwnerName = ownerNameCheck?.anyMatch;
        
        if (hasOwnerName) {
          isVerified = true;
        } else {
          invalidReasons = ['Document may be unreadable or unclear. Please re-upload a clear copy.'];
          isVerified = false;
        }
      }

      setDocumentVerification(prev => ({
        ...prev,
        [documentType]: {
          isVerifying: false,
          isVerified: isVerified,
          results: results,
          error: isVerified ? null : 'Document verification failed. Please check the document.',
          progress: 100
        }
      }));

      // Hide verifying modal and show result modal
      setShowVerifyingModal(false);
      
      // Show verification result modal
      setVerificationModalData({
        documentType: documentType,
        isVerified: isVerified,
        results: results,
        fileName: file.name,
        invalidReasons: invalidReasons.length > 0 ? invalidReasons : null
      });
      setShowVerificationModal(true);

    } catch (error) {
      console.error('Verification error:', error);
      setDocumentVerification(prev => ({
        ...prev,
        [documentType]: {
          isVerifying: false,
          isVerified: false,
          results: null,
          error: 'Failed to verify document: ' + error.message,
          progress: 0
        }
      }));
      
      // Hide verifying modal
      setShowVerifyingModal(false);
      
      // Show error modal for invalid or unreadable documents
      setVerificationModalData({
        documentType: documentType,
        isVerified: false,
        results: null,
        fileName: file.name,
        invalidReasons: ['Document may be unreadable or unclear. Please re-upload a clear copy.']
      });
      setShowVerificationModal(true);
    }
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

  // Verify Zoning ID - UPDATED TO ACCEPT BOTH 'approved' AND 'active' STATUS
  const verifyZoningId = async () => {
    const zoningId = formData.zoning_permit_id.trim();
    
    if (!zoningId) {
      setZoningVerificationResult({
        success: false,
        message: "Please enter a zoning permit ID to verify"
      });
      setShowZoningModal(true);
      return;
    }

    // Check if already validated
    if (validatedZoningIds[zoningId]) {
      setZoningVerificationResult({
        success: true,
        message: "Zoning permit ID is already verified and valid!",
        data: validatedZoningIds[zoningId]
      });
      setShowZoningModal(true);
      return;
    }

    setVerifyingZoningId(true);

    try {
      // Search in fetched applications
      const foundApplication = zoningApplications.find(app => 
        app.applicationNumber === zoningId || app.referenceNo === zoningId
      );

      if (foundApplication) {
        // ACCEPT BOTH 'approved' AND 'active' STATUS
        if (foundApplication.status === 'approved' || foundApplication.status === 'active') {
          setZoningVerificationResult({
            success: true,
            message: `Zoning permit ID is VALID! Status: ${foundApplication.status}`,
            data: foundApplication
          });
          
          // Store validated ID
          setValidatedZoningIds(prev => ({
            ...prev,
            [zoningId]: foundApplication
          }));
        } else {
          setZoningVerificationResult({
            success: false,
            message: `⚠ Zoning permit ID exists but is NOT APPROVED. Status: ${foundApplication.status}`,
            data: foundApplication
          });
        }
      } else {
        setZoningVerificationResult({
          success: false,
          message: "❌ Zoning permit ID not found in the system. Please check the ID and try again.",
          data: null
        });
      }
    } catch (error) {
      console.error("Error verifying zoning ID:", error);
      setZoningVerificationResult({
        success: false,
        message: "❌ Error connecting to verification service. Please try again later."
      });
    } finally {
      setVerifyingZoningId(false);
      setShowZoningModal(true);
    }
  };

  // Verify Barangay Clearance ID
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
      
      console.log('Barangay API Response:', data);
      
      let permits = [];
      if (data.success && data.data) {
        permits = data.data;
      } else if (Array.isArray(data)) {
        permits = data;
      } else {
        // If data is an object with permits array
        permits = data.permits || [];
      }

      console.log('Searching for ID:', barangayId);
      console.log('Available permits:', permits);

      // Search by both applicant_id AND permit_id
      const foundPermit = permits.find(permit => {
        const permitApplicantId = permit.applicant_id ? permit.applicant_id.toString() : '';
        const permitPermitId = permit.permit_id ? permit.permit_id.toString() : '';
        const searchId = barangayId.toString();
        
        // Match if either applicant_id or permit_id matches and status is approved
        return (permitApplicantId === searchId || permitPermitId === searchId) && permit.status === 'approved';
      });
      
      console.log('Found permit:', foundPermit);

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
        
        // Store permit_id in formData
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

  // Verify Sanitation Permit ID
  const verifySanitationPermitId = async () => {
    const sanitationId = formData.sanitation_permit_id.trim();
    
    if (!sanitationId) {
      setSanitationVerificationResult({
        success: false,
        message: "Please enter a sanitation permit ID to verify"
      });
      setShowSanitationModal(true);
      return;
    }

    if (validatedSanitationIds[sanitationId]) {
      setSanitationVerificationResult({
        success: true,
        message: "Sanitation permit ID is already verified and valid!",
        data: validatedSanitationIds[sanitationId]
      });
      setShowSanitationModal(true);
      return;
    }

    setVerifyingSanitationId(true);

    try {
      console.log('Sanitation permits available:', sanitationPermits);
      console.log('Searching for sanitation ID:', sanitationId);
      
      const foundPermit = sanitationPermits.find(permit => {
        const permitId = permit.id ? permit.id.toString() : '';
        const licenseNum = permit.license_number ? permit.license_number.toString() : '';
        const searchId = sanitationId.toString();
        
        return (permitId === searchId || licenseNum === searchId) &&
               (permit.status === 'completed' || permit.status === 'pending');
      });
      
      console.log('Found permit:', foundPermit);

      if (foundPermit) {
        setSanitationVerificationResult({
          success: true,
          message: `Sanitation permit ID is VALID! Status: ${foundPermit.status}`,
          data: foundPermit
        });
        
        setValidatedSanitationIds(prev => ({
          ...prev,
          [sanitationId]: foundPermit
        }));
      } else {
        setSanitationVerificationResult({
          success: false,
          message: "❌ Sanitation permit ID not found or invalid status. Please check the ID and try again.",
          data: null
        });
      }
    } catch (error) {
      console.error("Error verifying sanitation permit ID:", error);
      setSanitationVerificationResult({
        success: false,
        message: "❌ Error verifying sanitation permit. Please try again later."
      });
    } finally {
      setVerifyingSanitationId(false);
      setShowSanitationModal(true);
    }
  };

  const validateStep = (step) => {
    const isEmpty = (val) => val === undefined || val === null || (typeof val === "string" && val.trim() === "");

    if (step === 1) {
      const missing = [];
      if (isEmpty(formData.owner_first_name)) missing.push("First Name");
      if (isEmpty(formData.owner_last_name)) missing.push("Last Name");
      if (isEmpty(formData.owner_type)) missing.push("Owner Type");
      if (isEmpty(formData.citizenship)) missing.push("Citizenship");

      if (formData.owner_type === "Corporation") {
        if (isEmpty(formData.corp_filipino_percent)) missing.push("Filipino % (Corporation)");
        if (isEmpty(formData.corp_foreign_percent)) missing.push("Foreign % (Corporation)");
      }

      if (isEmpty(formData.date_of_birth)) missing.push("Date of Birth");
      if (isEmpty(formData.contact_number)) missing.push("Contact Number");
      if (isEmpty(formData.email_address)) missing.push("Email Address");
      if (isEmpty(formData.home_address)) missing.push("Home Address");
      if (isEmpty(formData.valid_id_type)) missing.push("Valid ID Type");
      if (isEmpty(formData.valid_id_number)) missing.push("Valid ID Number");

      if (missing.length) return { ok: false, message: "Missing: " + missing.join(", ") };
      return { ok: true };
    }

    if (step === 2) {
      const missing = [];
      if (isEmpty(formData.business_name)) missing.push("Registered Business Name");
      if (isEmpty(formData.business_nature)) missing.push("Nature of Business");
      if (isEmpty(formData.building_type)) missing.push("Building Type");
      if (isEmpty(formData.capital_investment) || formData.capital_investment <= 0) 
        missing.push("Capital Investment (₱)");

      if (missing.length) return { ok: false, message: "Missing: " + missing.join(", ") };
      return { ok: true };
    }

    if (step === 3) {
      const missing = [];
      if (isEmpty(formData.house_bldg_no)) missing.push("House/Bldg. No");
      if (isEmpty(formData.street)) missing.push("Street");
      if (isEmpty(formData.barangay)) missing.push("Barangay");
      if (isEmpty(formData.zoning_permit_id)) missing.push("Zoning Permit ID");
      if (isEmpty(formData.operation_type)) missing.push("Type of Operation");
      if (isEmpty(formData.business_area) || formData.business_area <= 0) missing.push("Business Area");
      if (isEmpty(formData.total_floor_area) || formData.total_floor_area <= 0) missing.push("Total Floor/Building Area");
      if (isEmpty(formData.operation_time_from)) missing.push("Operation Time From");
      if (isEmpty(formData.operation_time_to)) missing.push("Operation Time To");
      if (isEmpty(formData.total_employees) || formData.total_employees < 0) missing.push("Total No. of Employees");

      // Check if zoning ID is validated
      if (formData.zoning_permit_id && !validatedZoningIds[formData.zoning_permit_id]) {
        missing.push("Zoning Permit ID needs to be verified (click Verify button)");
      }

      // Check sanitation permit for health-related businesses
      if (isHealthRelatedBusiness()) {
        if (isEmpty(formData.sanitation_permit_id)) {
          missing.push("Sanitation Permit ID (required for health-related businesses)");
        } else if (!validatedSanitationIds[formData.sanitation_permit_id]) {
          missing.push("Sanitation Permit ID needs to be verified (click Verify button)");
        }
      }

      if (missing.length) return { ok: false, message: "Missing: " + missing.join(", ") };
      return { ok: true };
    }

    if (step === 4) {
      const missing = [];
      
      // BIR Certificate
      if (isEmpty(formData.bir_certificate)) {
        missing.push("BIR Certificate of Registration");
      } else if (documentVerification.bir_certificate?.isVerified === false) {
        missing.push("BIR Certificate is INVALID - Please upload a valid document");
      } else if (formData.bir_certificate && !documentVerification.bir_certificate?.isVerified) {
        missing.push("BIR Certificate must be verified (click Verify button)");
      }

      // Lease or Title
      if (isEmpty(formData.lease_or_title)) {
        missing.push("Lease Agreement or Property Title");
      } else if (documentVerification.lease_or_title?.isVerified === false) {
        missing.push("Lease/Title is INVALID - Please upload a valid document");
      } else if (formData.lease_or_title && !documentVerification.lease_or_title?.isVerified) {
        missing.push("Lease/Title must be verified (click Verify button)");
      }

      // FSIC
      if (isEmpty(formData.fsic)) {
        missing.push("Fire Safety Inspection Certificate (FSIC)");
      } else if (documentVerification.fsic?.isVerified === false) {
        missing.push("FSIC is INVALID - Please upload a valid document");
      } else if (formData.fsic && !documentVerification.fsic?.isVerified) {
        missing.push("FSIC must be verified (click Verify button)");
      }

      // Owner valid ID
      if (isEmpty(formData.owner_valid_id)) {
        missing.push("Owner Valid ID");
      } else if (documentVerification.owner_valid_id?.isVerified === false) {
        missing.push("Owner Valid ID is INVALID - Please upload a valid document");
      } else if (formData.owner_valid_id && !documentVerification.owner_valid_id?.isVerified) {
        missing.push("Owner Valid ID must be verified (click Verify button)");
      }

      // Barangay clearance (file or ID)
      if (isEmpty(formData.barangay_clearance) && isEmpty(formData.barangay_clearance_id)) {
        missing.push("Barangay Clearance (file or ID)");
      } else if (formData.barangay_clearance && documentVerification.barangay_clearance?.isVerified === false) {
        missing.push("Barangay Clearance is INVALID - Please upload a valid document or use ID verification");
      } else if (formData.barangay_clearance && !documentVerification.barangay_clearance?.isVerified) {
        missing.push("Barangay Clearance must be verified (click Verify button)");
      } else if (formData.barangay_clearance_id && !validatedBarangayIds[formData.barangay_clearance_id]) {
        missing.push("Barangay Clearance ID must be verified (click Verify button)");
      }

      // DTI registration for Individual owner type
      if (formData.owner_type === "Individual") {
        if (isEmpty(formData.dti_registration)) {
          missing.push("DTI Registration (required for Individual)");
        } else if (documentVerification.dti_registration?.isVerified === false) {
          missing.push("DTI Registration is INVALID - Please upload a valid document");
        } else if (!documentVerification.dti_registration?.isVerified) {
          missing.push("DTI Registration must be verified (click Verify button)");
        }
      }

      // SEC registration for Partnership owner type
      if (formData.owner_type === "Partnership") {
        if (isEmpty(formData.sec_registration)) {
          missing.push("SEC Registration (required for Partnership)");
        } else if (documentVerification.sec_registration?.isVerified === false) {
          missing.push("SEC Registration is INVALID - Please upload a valid document");
        } else if (!documentVerification.sec_registration?.isVerified) {
          missing.push("SEC Registration must be verified (click Verify button)");
        }
      }
      
      if (attachmentChecks.official_receipt_file && isEmpty(formData.official_receipt_file)) {
        missing.push("Official Receipt of Payment");
      }

      if (missing.length) return { ok: false, message: "Missing required attachments: " + missing.join(", ") };
      return { ok: true };
    }

    if (step === 5) {
      const missing = [];
      
      if (isEmpty(formData.owner_type_declaration)) missing.push("Owner / Representative");
      if (isEmpty(formData.owner_representative_name)) missing.push("Owner / Representative Name");
      
      // Owner scanned ID only required for Representative, not for Business Owner
      if (formData.owner_type_declaration === "Representative" && isEmpty(formData.representative_scanned_id)) {
        missing.push("Representative's Scanned ID");
      }
      
      // Signature required
      if (isEmpty(formData.applicant_signature)) {
        missing.push("Applicant's Signature");
      }
      
      // Declaration agreement
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
    
    if (currentStep === 6) {
      const res = validateStep(6);
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
      
      // Add all form data
      Object.keys(formData).forEach((fieldName) => {
        const value = formData[fieldName];
        
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'number') {
            formDataToSend.append(fieldName, value.toString());
          } else if (value instanceof File) {
            formDataToSend.append(fieldName, value, value.name);
          } else if (fieldName === 'applicant_signature' && value.startsWith('data:image')) {
            // Convert data URL to blob
            const byteString = atob(value.split(',')[1]);
            const mimeString = value.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const signatureFile = new File([blob], 'signature.png', { type: mimeString });
            formDataToSend.append(fieldName, signatureFile);
          } else {
            formDataToSend.append(fieldName, String(value));
          }
        }
      });

      // Always use current date and time for submission
      formDataToSend.append('date_submitted', currentDateTime);

      // Add action and applicant_id
      formDataToSend.append('action', 'submit_business_permit');
      
      // Add document flags
      const documentFlags = {
        'has_barangay_clearance': !!(formData.barangay_clearance || formData.barangay_clearance_id),
        'has_bir_certificate': !!formData.bir_certificate,
        'has_lease_or_title': !!formData.lease_or_title,
        'has_fsic': !!formData.fsic,
        'has_owner_valid_id': !!formData.owner_valid_id,
        'has_id_picture': !!formData.id_picture,
        'has_official_receipt': !!formData.official_receipt_file,
        'has_owner_scanned_id': !!formData.owner_scanned_id,
        'has_representative_scanned_id': !!formData.representative_scanned_id,
        'has_dti_registration': !!formData.dti_registration,
        'has_sec_registration': !!formData.sec_registration
      };

      Object.entries(documentFlags).forEach(([key, value]) => {
        formDataToSend.append(key, value ? '1' : '0');
      });

      // Add barangay clearance status
      const barangayClearanceStatus = formData.barangay_clearance || formData.barangay_clearance_id ? 'ID_PROVIDED' : 'PENDING';
      formDataToSend.append('barangay_clearance_status', barangayClearanceStatus);

      // Add gross_sale (required by DB)
      formDataToSend.append('gross_sale', formData.gross_sale || "0");

      console.log('FormData entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await fetch(API_BUS, {
        method: "POST",
        body: formDataToSend,
        headers: {
          'Accept': 'application/json',
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

      showSuccessMessage(data.message || "Business permit application submitted successfully!");
      
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
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Owner Information</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[0].description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Middle Name
                </label>
                <input
                  type="text"
                  name="owner_middle_name"
                  value={formData.owner_middle_name}
                  onChange={handleChange}
                  placeholder="Middle Name"
                  className="w-full p-3 border border-black rounded-lg"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
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
                  <option value="">Select owner type</option>
                  <option value="Individual">Individual</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Corporation">Corporation</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Citizenship <span className="text-red-500">*</span>
                  </label>
                  <input
                    list="nationalities"
                    name="citizenship"
                    value={formData.citizenship}
                    onChange={handleChange}
                    placeholder="Enter citizenship"
                    className="p-3 border border-black rounded-lg w-full"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    required
                  />
                  <datalist id="nationalities">
                    {NATIONALITIES.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>

                {formData.owner_type === "Corporation" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                        Filipino (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="corp_filipino_percent"
                        value={formData.corp_filipino_percent}
                        onChange={handleChange}
                        placeholder="%"
                        className="p-3 border border-black rounded-lg w-full"
                        style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                        Foreign (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="corp_foreign_percent"
                        value={formData.corp_foreign_percent}
                        onChange={handleChange}
                        placeholder="%"
                        className="p-3 border border-black rounded-lg w-full"
                        style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                  </>
                )}

                {formData.owner_type === "Individual" && (
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        {formData.dti_registration ? (
                          <Check className="w-5 h-5 text-green-600 mr-3" />
                        ) : (
                          <X className="w-5 h-5 text-red-600 mr-3" />
                        )}
                        <div>
                          <span className="font-medium">DTI Registration:</span>
                          <p className="text-sm text-gray-600">
                            {formData.dti_registration ? formData.dti_registration.name : 'Required for Individual'}
                          </p>
                          <p className="text-xs text-red-500">* Required for Individual owner type</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            name="dti_registration"
                            onChange={handleFile}
                            accept=".pdf,.jpg,.png,.doc,.docx"
                            className="hidden"
                            required={formData.owner_type === "Individual"}
                          />
                          <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${!formData.dti_registration ? 'border-gray-300' : 'border-green-200 bg-green-50'}`} style={{ color: COLORS.secondary }}>
                            <Upload className="w-4 h-4" />
                            Upload
                          </div>
                        </label>
                        {formData.dti_registration && (
                          <>
                            <button
                              type="button"
                              onClick={() => previewFile(formData.dti_registration)}
                              className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                              style={{ color: COLORS.secondary }}
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => verifyDocument('dti_registration', formData.dti_registration)}
                              disabled={documentVerification.dti_registration.isVerifying}
                              className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors duration-300 border ${
                                documentVerification.dti_registration.isVerified 
                                  ? 'bg-green-100 border-green-500 text-green-700' 
                                  : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {documentVerification.dti_registration.isVerifying ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                              ) : documentVerification.dti_registration.isVerified ? (
                                <><Check className="w-4 h-4" /> Verified</>
                              ) : (
                                <><Shield className="w-4 h-4" /> Verify</>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress percentage for DTI registration verification */}
                    {formData.dti_registration && documentVerification.dti_registration.isVerifying && (
                      <div className="p-3 border-l border-r border-b border-gray-300 rounded-b-lg">
                        <div className="flex items-center justify-between text-xs text-blue-600">
                          <span>Verifying document...</span>
                          <span>{documentVerification.dti_registration.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${documentVerification.dti_registration.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.owner_type === "Partnership" && (
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        {formData.sec_registration ? (
                          <Check className="w-5 h-5 text-green-600 mr-3" />
                        ) : (
                          <X className="w-5 h-5 text-red-600 mr-3" />
                        )}
                        <div>
                          <span className="font-medium">SEC Registration:</span>
                          <p className="text-sm text-gray-600">
                            {formData.sec_registration ? formData.sec_registration.name : 'Required for Partnership'}
                          </p>
                          <p className="text-xs text-red-500">* Required for Partnership owner type</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            name="sec_registration"
                            onChange={handleFile}
                            accept=".pdf,.jpg,.png,.doc,.docx"
                            className="hidden"
                            required={formData.owner_type === "Partnership"}
                          />
                          <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${!formData.sec_registration ? 'border-gray-300' : 'border-green-200 bg-green-50'}`} style={{ color: COLORS.secondary }}>
                            <Upload className="w-4 h-4" />
                            Upload
                          </div>
                        </label>
                        {formData.sec_registration && (
                          <>
                            <button
                              type="button"
                              onClick={() => previewFile(formData.sec_registration)}
                              className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                              style={{ color: COLORS.secondary }}
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => verifyDocument('sec_registration', formData.sec_registration)}
                              disabled={documentVerification.sec_registration.isVerifying}
                              className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors duration-300 border ${
                                documentVerification.sec_registration.isVerified 
                                  ? 'bg-green-100 border-green-500 text-green-700' 
                                  : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {documentVerification.sec_registration.isVerifying ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                              ) : documentVerification.sec_registration.isVerified ? (
                                <><Check className="w-4 h-4" /> Verified</>
                              ) : (
                                <><Shield className="w-4 h-4" /> Verify</>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress percentage for SEC registration verification */}
                    {formData.sec_registration && documentVerification.sec_registration.isVerifying && (
                      <div className="p-3 border-l border-r border-b border-gray-300 rounded-b-lg">
                        <div className="flex items-center justify-between text-xs text-blue-600">
                          <span>Verifying document...</span>
                          <span>{documentVerification.sec_registration.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${documentVerification.sec_registration.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  placeholder="(e.g. 09123456789)"
                  onChange={handleChange}
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
                  placeholder="Enter email address"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Home Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="home_address"
                  value={formData.home_address}
                  onChange={handleChange}
                  placeholder="Enter home address"
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
                  <option value="">Select Valid ID Type</option>
                  <optgroup label="Primary Valid Government-Issued IDs">
                    <option value="PhilSys ID">Philippine National ID (PhilSys ID)</option>
                    <option value="Driver's License">Driver's License (LTO)</option>
                    <option value="Passport">Passport (DFA)</option>
                    <option value="UMID">UMID</option>
                    <option value="Voter's ID">Voter's ID / COMELEC</option>
                    <option value="Postal ID">Postal ID (PhilPost)</option>
                    <option value="PRC ID">PRC ID</option>
                    <option value="Senior Citizen ID">Senior Citizen ID</option>
                    <option value="PWD ID">PWD ID</option>
                    <option value="Barangay ID">Barangay ID</option>
                  </optgroup>
                  <optgroup label="Secondary / Supporting IDs">
                    <option value="School ID">School ID</option>
                    <option value="Company ID">Company / Employee ID</option>
                    <option value="Police Clearance">Police Clearance / NBI Clearance</option>
                    <option value="TIN ID">Tax Identification Number (TIN) ID</option>
                    <option value="PhilHealth ID">PhilHealth ID</option>
                    <option value="Pag-IBIG ID">Pag-IBIG ID</option>
                    <option value="GSIS eCard">GSIS eCard</option>
                    <option value="Solo Parent ID">Solo Parent ID</option>
                    <option value="IP ID">Indigenous People's (IP) ID</option>
                    <option value="Firearms License ID">Firearms License ID</option>
                  </optgroup>
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
                  placeholder="Enter valid ID number"
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                Business Information
              </h3>
              <p className="text-sm text-gray-600 mb-4">{steps[1].description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Registered Business Name <span className="text-red-500">*</span>
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
                  Trade / Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="trade_name"
                  value={formData.trade_name}
                  onChange={handleChange}
                  placeholder="Enter trade or brand name"
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
                  <option value="">Select Business Nature</option>
                  <option value="Retail / Sari-sari Store">Retail / Sari-sari Store</option>
                  <option value="Grocery / Mini Grocery">Grocery / Mini Grocery</option>
                  <option value="Restaurant / Eatery / Food Service">Restaurant / Eatery / Food Service</option>
                  <option value="Catering Services">Catering Services</option>
                  <option value="Wholesale Trade">Wholesale Trade</option>
                  <option value="Manufacturing (Light Industry)">Manufacturing (Light Industry)</option>
                  <option value="Repairs / Technical Services">Repairs / Technical Services (Electronics, Appliances)</option>
                  <option value="Printing / Publishing">Printing / Publishing</option>
                  <option value="Beauty / Barber / Salon / Spa">Beauty / Barber / Salon / Spa</option>
                  <option value="Health / Clinic / Pharmacy">Health / Clinic / Pharmacy</option>
                  <option value="Education / Tutorial Center">Education / Tutorial Center</option>
                  <option value="Office / Administrative Services">Office / Administrative Services</option>
                  <option value="Logistics / Transport / Courier">Logistics / Transport / Courier</option>
                  <option value="Real Estate / Leasing / Rental Services">Real Estate / Leasing / Rental Services</option>
                  <option value="Construction / Contractor">Construction / Contractor</option>
                  <option value="Workshops (Metal, Carpentry, Furniture)">Workshops (Metal, Carpentry, Furniture)</option>
                  <option value="Bakery / Pastry / Cake Shop">Bakery / Pastry / Cake Shop</option>
                  <option value="Laundry / Dry Cleaning">Laundry / Dry Cleaning</option>
                  <option value="Automotive (Repair, Car Wash)">Automotive (Repair, Car Wash)</option>
                  <option value="Water Refilling Station">Water Refilling Station</option>
                  <option value="Entertainment / Recreation">Entertainment / Recreation</option>
                  <option value="Advertising / Signage">Advertising / Signage</option>
                  <option value="Online Business / E-commerce">Online Business / E-commerce</option>
                  <option value="Agricultural / Farming">Agricultural / Farming</option>
                </select>
              </div>


              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Building Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="building_type"
                  value={formData.building_type}
                  onChange={handleChange}
                  className="p-3 border border-black rounded-lg w-full"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required
                >
                  <option value="">Select Building Type</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Residential">Residential</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  Capital Investment (₱) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capital_investment"
                  value={formData.capital_investment}
                  onChange={handleChange}
                  placeholder="Enter capital investment amount"
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
          <div className="space-y-10">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Location & Operations</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[2].description}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Business Address</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    House/Bldg. No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="house_bldg_no"
                    value={formData.house_bldg_no}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter house or building number"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Name of Building
                  </label>
                  <input
                    type="text"
                    name="building_name"
                    value={formData.building_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter building name (if applicable)"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Block No.
                  </label>
                  <input
                    type="text"
                    name="block_no"
                    value={formData.block_no}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter block number"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Lot No.
                  </label>
                  <input
                    type="text"
                    name="lot_no"
                    value={formData.lot_no}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter lot number"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Street <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter street name"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Subdivision
                  </label>
                  <input
                    type="text"
                    name="subdivision"
                    value={formData.subdivision}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter subdivision name"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="province"
                    value="Metro Manila"
                    readOnly
                    className="w-full p-3 border border-black rounded-lg bg-gray-100"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Fixed as Metro Manila</p>
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    City/Municipality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city_municipality"
                    value="Caloocan City"
                    readOnly
                    className="w-full p-3 border border-black rounded-lg bg-gray-100"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Fixed as Caloocan City</p>
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium mb-1" 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  >
                    Barangay <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    className="p-3 border border-black rounded-lg w-full focus:ring-1 focus:border-black-400 focus:outline-none"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    required
                  >
                    <option value="">Select a barangay</option>
                    
                    {/* Barangay 1 to 175 */}
                    {Array.from({length: 175}, (_, i) => (
                      <option key={`Barangay ${i+1}`} value={`Barangay ${i+1}`}>
                        Barangay {i+1}
                      </option>
                    ))}
                    
                    {/* Barangay 176-A to 176-F */}
                    {['A', 'B', 'C', 'D', 'E', 'F'].map(letter => (
                      <option key={`Barangay 176-${letter}`} value={`Barangay 176-${letter}`}>
                        Barangay 176-{letter}
                      </option>
                    ))}
                    
                    {/* Barangay 177 to 188 */}
                    {Array.from({length: 12}, (_, i) => (
                      <option key={`Barangay ${177 + i}`} value={`Barangay ${177 + i}`}>
                        Barangay {177 + i}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter ZIP code"
                    maxLength="4"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    District
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  >
                    <option value="">Select District</option>
                    <option value="District 1">District 1</option>
                    <option value="District 2">District 2</option>
                    <option value="District 3">District 3</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Operations Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Zoning Permit ID Field with Verification */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                      Zoning Permit ID / Number <span className="text-red-500">*</span>
                    </label>
                    {formData.zoning_permit_id && validatedZoningIds[formData.zoning_permit_id] && (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="zoning_permit_id"
                      value={formData.zoning_permit_id}
                      onChange={handleChange}
                      className="w-full p-3 border border-black rounded-lg"
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                      placeholder="Enter zoning permit ID/number (e.g., ZC-2026-01-0001)"
                      required
                    />
                    <button
                      type="button"
                      onClick={verifyZoningId}
                      disabled={verifyingZoningId}
                      className={`px-4 py-3 rounded-lg font-semibold text-white transition-colors duration-300 flex items-center gap-2 ${
                        verifyingZoningId ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      style={{ fontFamily: COLORS.font }}
                    >
                      {verifyingZoningId ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Verify
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-xs mt-1 text-gray-600">
                    {validatedZoningIds[formData.zoning_permit_id] ? 
                      " Zoning ID verified and valid" : 
                      "Enter your zoning permit ID and click Verify to check status"}
                  </p>
                </div>

                {/* Sanitation Permit ID Field with Verification (for health-related businesses) */}
                {isHealthRelatedBusiness() && (
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                        Sanitation Permit ID / License Number <span className="text-red-500">*</span>
                      </label>
                      {formData.sanitation_permit_id && validatedSanitationIds[formData.sanitation_permit_id] && (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="sanitation_permit_id"
                      value={formData.sanitation_permit_id}
                      onChange={handleChange}
                      className="w-full p-3 border border-black rounded-lg"
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                      placeholder="Enter sanitation permit ID/license number"
                      required
                    />
                    <button
                      type="button"
                      onClick={verifySanitationPermitId}
                      disabled={verifyingSanitationId || !formData.sanitation_permit_id}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {verifyingSanitationId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Verify Sanitation Permit ID
                        </>
                      )}
                    </button>
                    <p className="text-xs mt-1 text-gray-600">
                      {validatedSanitationIds[formData.sanitation_permit_id] ? 
                        "Sanitation permit verified and valid" : 
                        "Enter your sanitation permit ID and click Verify to check status (required for health-related businesses)"}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Type of Operation <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="operation_type"
                    value={formData.operation_type}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    required
                  >
                    <option value="">Select Type of Operation</option>
                    <option value="Main Office">Main Office</option>
                    <option value="Branch">Branch</option>
                    <option value="Franchise">Franchise</option>
                    <option value="Headquarters">Headquarters</option>
                    <option value="Satellite Office">Satellite Office</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Factory">Factory</option>
                    <option value="Retail Store">Retail Store</option>
                    <option value="Food Establishment">Food Establishment</option>
                    <option value="Service Center">Service Center</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Business Area (in sq. m.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="business_area"
                    value={formData.business_area}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter business area"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Total Floor/Building Area (in sq.m.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="total_floor_area"
                    value={formData.total_floor_area}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter total floor area"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Time of Operation <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">From</label>
                      <input
                        type="time"
                        name="operation_time_from"
                        value={formData.operation_time_from}
                        onChange={handleChange}
                        className="w-full p-3 border border-black rounded-lg"
                        style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">To</label>
                      <input
                        type="time"
                        name="operation_time_to"
                        value={formData.operation_time_to}
                        onChange={handleChange}
                        className="w-full p-3 border border-black rounded-lg"
                        style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Total No. of Employees in Establishment <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="total_employees"
                    value={formData.total_employees}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter total employees"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Male Employees
                  </label>
                  <input
                    type="number"
                    name="male_employees"
                    value={formData.male_employees}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter number of male employees"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Female Employees
                  </label>
                  <input
                    type="number"
                    name="female_employees"
                    value={formData.female_employees}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter number of female employees"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    No. of Employees Residing within LGU
                  </label>
                  <input
                    type="number"
                    name="employees_in_qc"
                    value={formData.employees_in_qc}
                    onChange={handleChange}
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    placeholder="Enter number of employees in QC"
                  />
                </div>

                <div className="md:col-span-2">
                  <h5 className="font-medium mb-3" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    No. of Delivery Vehicle (if applicable)
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Van/Truck</label>
                      <input
                        type="number"
                        name="delivery_van_truck"
                        value={formData.delivery_van_truck}
                        onChange={handleChange}
                        className="w-full p-3 border border-black rounded-lg"
                        style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                        placeholder="Enter number of vans/trucks"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Motorcycle</label>
                      <input
                        type="number"
                        name="delivery_motorcycle"
                        value={formData.delivery_motorcycle}
                        onChange={handleChange}
                        className="w-full p-3 border border-black rounded-lg"
                        style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                        placeholder="Enter number of motorcycles"
                      />
                    </div>
                  </div>
                </div>
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
                  <p className="font-medium text-blue-800 mb-1">Important Note:</p>
                  <p className="text-sm text-blue-700">
                    • All documents marked with <span className="font-bold text-red-600">*</span> are <span className="font-bold text-red-600">MANDATORY</span> for business permit applications.
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    • Official Receipt of Payment is optional unless you have already paid.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="border border-gray-300 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {(formData.barangay_clearance || formData.barangay_clearance_id) ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Barangay Clearance: <span className="text-red-500">*</span></span>
                      <p className="text-sm text-gray-600">
                        {formData.barangay_clearance ? formData.barangay_clearance.name : 
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

                {/* File Upload Section - shown when 'upload' is selected */}
                {barangayClearanceMethod === 'upload' && (
                  <>
                    <div className="p-3 bg-white">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            name="barangay_clearance"
                            onChange={handleFile}
                            accept=".pdf,.jpg,.png,.doc,.docx"
                            className="hidden"
                          />
                          <div className={`flex items-center gap-1 px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                            !formData.barangay_clearance ? 'border-gray-300' : 'border-green-200 bg-green-50'
                          }`} style={{ color: COLORS.secondary }}>
                            <Upload className="w-4 h-4" />
                            {formData.barangay_clearance ? 'Change File' : 'Upload Document'}
                          </div>
                        </label>
                        {formData.barangay_clearance && (
                          <>
                            <span className="text-sm text-gray-600">{formData.barangay_clearance.name}</span>
                            <button
                              type="button"
                              onClick={() => previewFile(formData.barangay_clearance)}
                              className="flex items-center gap-1 px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border border-gray-300"
                              style={{ color: COLORS.secondary }}
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => verifyDocument('barangay_clearance', formData.barangay_clearance)}
                              disabled={documentVerification.barangay_clearance.isVerifying}
                              className={`flex items-center gap-1 px-3 py-2 text-sm rounded transition-colors duration-300 border ${
                                documentVerification.barangay_clearance.isVerified 
                                  ? 'bg-green-100 border-green-500 text-green-700' 
                                  : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {documentVerification.barangay_clearance.isVerifying ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                              ) : documentVerification.barangay_clearance.isVerified ? (
                                <><Check className="w-4 h-4" /> Verified</>
                              ) : (
                                <><Shield className="w-4 h-4" /> Verify with AI</>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress percentage for barangay clearance file verification */}
                    {formData.barangay_clearance && documentVerification.barangay_clearance.isVerifying && (
                      <div className="px-3 pb-3">
                        <div className="flex items-center justify-between text-xs text-blue-600">
                          <span>Verifying document with AI...</span>
                          <span>{documentVerification.barangay_clearance.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${documentVerification.barangay_clearance.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ID Input Section - shown when 'id' is selected */}
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
                      (documentVerification.barangay_clearance?.isVerified || validatedBarangayIds[formData.barangay_clearance_id]) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(documentVerification.barangay_clearance?.isVerified || validatedBarangayIds[formData.barangay_clearance_id])
                        ? '✓ Requirement satisfied - Verified' 
                        : (formData.barangay_clearance || formData.barangay_clearance_id)
                          ? '⚠ Please verify the document or ID to proceed'
                          : '⚠ Please provide either the document or ID number'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-blue-50">
                <div className="flex items-center">
                  <div>
                    <span className="font-medium">BIR Certificate of Registration: <span className="text-red-500">*</span></span>
                    <p className="text-sm text-gray-600">
                      {formData.bir_certificate ? formData.bir_certificate.name : 'Required'}
                    </p>
                    <p className="text-xs text-red-500 font-semibold">* This document is mandatory</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="bir_certificate"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                      required
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${!formData.bir_certificate ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`} style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.bir_certificate ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.bir_certificate && (
                    <>
                      <button
                        type="button"
                        onClick={() => previewFile(formData.bir_certificate)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                        style={{ color: COLORS.secondary }}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => verifyDocument('bir_certificate', formData.bir_certificate)}
                        disabled={documentVerification.bir_certificate.isVerifying}
                        className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors duration-300 border ${
                          documentVerification.bir_certificate.isVerified 
                            ? 'bg-green-100 border-green-500 text-green-700' 
                            : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {documentVerification.bir_certificate.isVerifying ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                        ) : documentVerification.bir_certificate.isVerified ? (
                          <><Check className="w-4 h-4" /> Verified</>
                        ) : (
                          <><Shield className="w-4 h-4" /> Verify</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Progress percentage for BIR certificate verification */}
              {formData.bir_certificate && documentVerification.bir_certificate.isVerifying && (
                <div className="p-3 border-l border-r border-b border-gray-300 rounded-b-lg bg-blue-50">
                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span>Verifying document...</span>
                    <span>{documentVerification.bir_certificate.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${documentVerification.bir_certificate.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-blue-50">
                <div className="flex items-center">
                  <div>
                    <span className="font-medium">Lease Contract / Land Title: <span className="text-red-500">*</span></span>
                    <p className="text-sm text-gray-600">
                      {formData.lease_or_title ? formData.lease_or_title.name : 'Required'}
                    </p>
                    <p className="text-xs text-red-500 font-semibold">* This document is mandatory</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="lease_or_title"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                      required
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${!formData.lease_or_title ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`} style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.lease_or_title ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.lease_or_title && (
                    <>
                      <button
                        type="button"
                        onClick={() => previewFile(formData.lease_or_title)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                        style={{ color: COLORS.secondary }}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => verifyDocument('lease_or_title', formData.lease_or_title)}
                        disabled={documentVerification.lease_or_title.isVerifying}
                        className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors duration-300 border ${
                          documentVerification.lease_or_title.isVerified 
                            ? 'bg-green-100 border-green-500 text-green-700' 
                            : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {documentVerification.lease_or_title.isVerifying ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                        ) : documentVerification.lease_or_title.isVerified ? (
                          <><Check className="w-4 h-4" /> Verified</>
                        ) : (
                          <><Shield className="w-4 h-4" /> Verify</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Progress percentage for lease/title verification */}
              {formData.lease_or_title && documentVerification.lease_or_title.isVerifying && (
                <div className="p-3 border-l border-r border-b border-gray-300 rounded-b-lg bg-blue-50">
                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span>Verifying document...</span>
                    <span>{documentVerification.lease_or_title.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${documentVerification.lease_or_title.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-blue-50">
                <div className="flex items-center">
                  <div>
                    <span className="font-medium">Fire Safety Inspection Certificate (FSIC): <span className="text-red-500">*</span></span>
                    <p className="text-sm text-gray-600">
                      {formData.fsic ? formData.fsic.name : 'Required'}
                    </p>
                    <p className="text-xs text-red-500 font-semibold">* This document is mandatory</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="fsic"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                      required
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${!formData.fsic ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`} style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.fsic ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.fsic && (
                    <>
                      <button
                        type="button"
                        onClick={() => previewFile(formData.fsic)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                        style={{ color: COLORS.secondary }}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => verifyDocument('fsic', formData.fsic)}
                        disabled={documentVerification.fsic.isVerifying}
                        className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors duration-300 border ${
                          documentVerification.fsic.isVerified 
                            ? 'bg-green-100 border-green-500 text-green-700' 
                            : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {documentVerification.fsic.isVerifying ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                        ) : documentVerification.fsic.isVerified ? (
                          <><Check className="w-4 h-4" /> Verified</>
                        ) : (
                          <><Shield className="w-4 h-4" /> Verify</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Progress percentage for FSIC verification */}
              {formData.fsic && documentVerification.fsic.isVerifying && (
                <div className="p-3 border-l border-r border-b border-gray-300 rounded-b-lg bg-blue-50">
                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span>Verifying document...</span>
                    <span>{documentVerification.fsic.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${documentVerification.fsic.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-blue-50">
                <div className="flex items-center">
                  <div>
                    <span className="font-medium">Owner Valid ID: <span className="text-red-500">*</span></span>
                    <p className="text-sm text-gray-600">
                      {formData.owner_valid_id ? formData.owner_valid_id.name : 'Required'}
                    </p>
                    <p className="text-xs text-red-500 font-semibold">* This document is mandatory</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="owner_valid_id"
                      onChange={handleFile}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                      required
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${!formData.owner_valid_id ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`} style={{ color: COLORS.secondary }}>
                      <Upload className="w-4 h-4" />
                      {formData.owner_valid_id ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.owner_valid_id && (
                    <>
                      <button
                        type="button"
                        onClick={() => previewFile(formData.owner_valid_id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                        style={{ color: COLORS.secondary }}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => verifyDocument('owner_valid_id', formData.owner_valid_id)}
                        disabled={documentVerification.owner_valid_id.isVerifying}
                        className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors duration-300 border ${
                          documentVerification.owner_valid_id.isVerified 
                            ? 'bg-green-100 border-green-500 text-green-700' 
                            : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {documentVerification.owner_valid_id.isVerifying ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                        ) : documentVerification.owner_valid_id.isVerified ? (
                          <><Check className="w-4 h-4" /> Verified</>
                        ) : (
                          <><Shield className="w-4 h-4" /> Verify</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Progress percentage for owner valid ID verification */}
              {formData.owner_valid_id && documentVerification.owner_valid_id.isVerifying && (
                <div className="p-3 border-l border-r border-b border-gray-300 rounded-b-lg bg-blue-50">
                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span>Verifying document...</span>
                    <span>{documentVerification.owner_valid_id.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${documentVerification.owner_valid_id.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={attachmentChecks.official_receipt_file}
                    onChange={() => handleCheckboxChange('official_receipt_file')}
                    className="mr-3 h-5 w-5"
                  />
                  <div>
                    <span className="font-medium">Official Receipt of Payment:</span>
                    <p className="text-sm text-gray-600">
                      {formData.official_receipt_file ? formData.official_receipt_file.name : attachmentChecks.official_receipt_file ? 'Required' : 'Optional'}
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
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${!formData.official_receipt_file ? 'border-gray-300' : 'border-green-200 bg-green-50'}`} style={{ color: COLORS.secondary }}>
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
                <h4 className="font-bold text-lg mb-4 text-red-700">BUSINESS PERMIT DECLARATION</h4>
                <div className="space-y-3 text-sm" style={{ fontFamily: COLORS.font }}>
                  <p>I, <span className="font-bold">{getFullName() || '[Full Name]'}</span>, hereby solemnly declare that:</p>
                  
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>All information provided in this application is true, complete, and correct;</li>
                    <li>I am the registered owner/authorized representative of the business described in this application;</li>
                    <li>The business remains compliant with all safety, sanitation, and environmental standards;</li>
                    <li>I have secured all necessary clearances, permits, and tax payments;</li>
                    <li>I shall continue to abide by all business regulations, rules, and ordinances of Caloocan City;</li>
                    <li>I understand that any false statement or misrepresentation shall be grounds for:</li>
                    <ul className="list-disc ml-8 mt-2 space-y-1">
                      <li>Immediate cancellation of the permit</li>
                      <li>Administrative and criminal liability</li>
                      <li>Blacklisting from future applications</li>
                      <li>Fines and penalties as per existing laws</li>
                    </ul>
                    <li>I agree to the processing of my personal data for application purposes in accordance with the Data Privacy Act of 2012;</li>
                    <li>I consent to inspections and monitoring by authorized personnel.</li>
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

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    <input
                      type="radio"
                      name="owner_type_declaration"
                      value="Business Owner"
                      checked={formData.owner_type_declaration === "Business Owner"}
                      onChange={handleChange}
                      className="accent-blue-600"
                    />
                    Business Owner
                  </label>

                  <label className="flex items-center gap-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    <input
                      type="radio"
                      name="owner_type_declaration"
                      value="Representative"
                      checked={formData.owner_type_declaration === "Representative"}
                      onChange={handleChange}
                      className="accent-blue-600"
                    />
                    Representative
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    Name: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="owner_representative_name"
                    value={formData.owner_representative_name}
                    onChange={handleChange}
                    placeholder={
                      formData.owner_type_declaration === "Business Owner" 
                        ? "Enter full name of business owner" 
                        : "Enter full name of representative"
                    }
                    className="w-full p-3 border border-black rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    required
                  />
                </div>

                {/* Representative Scanned ID - Required only for Representative */}
                {formData.owner_type_declaration === "Representative" && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        {formData.representative_scanned_id ? (
                          <Check className="w-5 h-5 text-green-600 mr-3" />
                        ) : (
                          <X className="w-5 h-5 text-red-600 mr-3" />
                        )}
                        <div>
                          <span className="font-medium">Scanned ID of Representative: <span className="text-red-500">*</span></span>
                          <p className="text-sm text-gray-600">
                            {formData.representative_scanned_id ? formData.representative_scanned_id.name : 'Required'}
                          </p>
                          <p className="text-xs text-gray-500">Scanned ID of the person submitting on behalf of the owner</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            name="representative_scanned_id"
                            onChange={handleFile}
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="hidden"
                            required={formData.owner_type_declaration === "Representative"}
                          />
                          <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${!formData.representative_scanned_id ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`} style={{ color: COLORS.secondary }}>
                            <Upload className="w-4 h-4" />
                            {formData.representative_scanned_id ? 'Change' : 'Upload'}
                          </div>
                        </label>
                        {formData.representative_scanned_id && (
                          <button
                            type="button"
                            onClick={() => previewFile(formData.representative_scanned_id)}
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
                )}
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

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                Review Your Application
              </h3>
              <p className="text-sm text-gray-600 mb-4">{steps[5].description}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <div className="space-y-8">
                <div>
                  <h5 className="font-semibold mb-4 text-lg border-b pb-2" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>
                    Owner Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>First Name:</span>
                      <p>{formData.owner_first_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Middle Name:</span>
                      <p>{formData.owner_middle_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Last Name:</span>
                      <p>{formData.owner_last_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Owner Type:</span>
                      <p>{formData.owner_type || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Citizenship:</span>
                      <p>{formData.citizenship || 'Not provided'}</p>
                    </div>
                    {formData.owner_type === "Corporation" && (
                      <>
                        <div>
                          <span className="font-medium" style={{ color: COLORS.secondary }}>Filipino %:</span>
                          <p>{formData.corp_filipino_percent || '0'}%</p>
                        </div>
                        <div>
                          <span className="font-medium" style={{ color: COLORS.secondary }}>Foreign %:</span>
                          <p>{formData.corp_foreign_percent || '0'}%</p>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Date of Birth:</span>
                      <p>{formData.date_of_birth || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Contact Number:</span>
                      <p>{formData.contact_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Email Address:</span>
                      <p>{formData.email_address || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Home Address:</span>
                      <p>{formData.home_address || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Valid ID Type:</span>
                      <p>{formData.valid_id_type || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Valid ID Number:</span>
                      <p>{formData.valid_id_number || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-4 text-lg border-b pb-2" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>
                    Business Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Business Name:</span>
                      <p>{formData.business_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Trade Name:</span>
                      <p>{formData.trade_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Nature of Business:</span>
                      <p>{formData.business_nature || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Building Type:</span>
                      <p>{formData.building_type || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Capital Investment:</span>
                      <p>₱{formData.capital_investment || '0'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Gross Sale:</span>
                      <p>₱{formData.gross_sale || '0'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-4 text-lg border-b pb-2" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>
                    Location Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>House/Bldg. No:</span>
                      <p>{formData.house_bldg_no || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Building Name:</span>
                      <p>{formData.building_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Block No:</span>
                      <p>{formData.block_no || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Lot No:</span>
                      <p>{formData.lot_no || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Street:</span>
                      <p>{formData.street || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Subdivision:</span>
                      <p>{formData.subdivision || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Province:</span>
                      <p>{formData.province || 'Metro Manila'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>City/Municipality:</span>
                      <p>{formData.city_municipality || 'Caloocan City'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Barangay:</span>
                      <p>{formData.barangay || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Zip Code:</span>
                      <p>{formData.zip_code || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>District:</span>
                      <p>{formData.district || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-4 text-lg border-b pb-2" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>
                    Operations Details
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Zoning Permit ID:</span>
                      <p>{formData.zoning_permit_id || 'Not provided'}</p>
                      {validatedZoningIds[formData.zoning_permit_id] ? (
                        <span className="text-sm text-green-600"> Verified and Valid</span>
                      ) : (
                        <span className="text-sm text-yellow-600">⚠ Needs verification</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Sanitation Permit ID:</span>
                      <p>{formData.sanitation_permit_id || 'Not provided'}</p>
                      {isHealthRelatedBusiness() && !formData.sanitation_permit_id && (
                        <p className="text-sm text-blue-500">Note: Recommended for this type of business</p>
                      )}
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Type of Operation:</span>
                      <p>{formData.operation_type || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Business Area:</span>
                      <p>{formData.business_area || '0'} sq. m.</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Total Floor Area:</span>
                      <p>{formData.total_floor_area || '0'} sq. m.</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Time of Operation:</span>
                      <p>{formData.operation_time_from && formData.operation_time_to ? 
                        `${formData.operation_time_from} to ${formData.operation_time_to}` : 
                        'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Total Employees:</span>
                      <p>{formData.total_employees || '0'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Male Employees:</span>
                      <p>{formData.male_employees || '0'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Female Employees:</span>
                      <p>{formData.female_employees || '0'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Employees in QC:</span>
                      <p>{formData.employees_in_qc || '0'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Delivery Van/Truck:</span>
                      <p>{formData.delivery_van_truck || '0'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Delivery Motorcycle:</span>
                      <p>{formData.delivery_motorcycle || '0'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-4 text-lg border-b pb-2" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>
                    Declaration & Signature
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Submitted by:</span>
                      <p>{formData.owner_type_declaration || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Name:</span>
                      <p>{formData.owner_representative_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Date Submitted:</span>
                      <p>Current date and time upon submission</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Application Date:</span>
                      <p>{formData.application_date || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Permit Type:</span>
                      <p>{formData.permit_type || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: COLORS.secondary }}>Signature:</span>
                      <p>{formData.applicant_signature ? '✓ Uploaded' : 'Missing'}</p>
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
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>Business Permit Application</h1>
          <p className="mt-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Permit Type: <span className="font-semibold" style={{ color: COLORS.success }}>{permitType}</span></p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/user/business/type')}
            className="px-4 py-2 rounded-lg font-semibold text-white hover:bg-[#FDA811] transition-colors duration-300"
            style={{ background: COLORS.success, fontFamily: COLORS.font }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
          >
            Change Type
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
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
              {currentStep === steps.length - 1 ? 'Review' : 'Next'}
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
              Submit Application
            </button>
          )}
        </div>
      </form>

      {/* Zoning ID Verification Modal */}
      {showZoningModal && zoningVerificationResult && (
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
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                zoningVerificationResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {zoningVerificationResult.success ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-4" style={{ 
              color: zoningVerificationResult.success ? COLORS.success : COLORS.danger 
            }}>
              {zoningVerificationResult.success ? 'VALID DOCUMENT' : 'INVALID DOCUMENT'}
            </h2>
            
            <div className="mb-6">
              <p className="text-center text-base" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                {zoningVerificationResult.success 
                  ? 'The zoning permit ID has been successfully verified and is valid for use in this application.'
                  : 'The zoning permit ID could not be verified. Please check the ID number or ensure the document is readable and approved.'}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowZoningModal(false)}
                style={{ 
                  background: zoningVerificationResult.success ? COLORS.success : COLORS.danger 
                }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = zoningVerificationResult.success ? COLORS.success : COLORS.danger}
                className="px-8 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                {zoningVerificationResult.success ? 'Continue Application' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barangay Clearance ID Verification Modal */}
      {showBarangayModal && barangayVerificationResult && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="rounded-lg shadow-lg max-w-lg w-full border border-gray-200 p-8"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                barangayVerificationResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {barangayVerificationResult.success ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-4" style={{ 
              color: barangayVerificationResult.success ? COLORS.success : COLORS.danger 
            }}>
              {barangayVerificationResult.success ? 'VALID DOCUMENT' : 'INVALID DOCUMENT'}
            </h2>
            
            <div className="mb-6">
              <p className="text-center text-base" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                {barangayVerificationResult.success 
                  ? 'The barangay clearance ID has been successfully verified and is valid for use in this application.'
                  : 'The barangay clearance ID could not be verified. Please check the ID number or ensure the document is readable and approved.'}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowBarangayModal(false)}
                style={{ 
                  background: barangayVerificationResult.success ? COLORS.success : COLORS.danger 
                }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = barangayVerificationResult.success ? COLORS.success : COLORS.danger}
                className="px-8 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                {barangayVerificationResult.success ? 'Continue Application' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sanitation Permit ID Verification Modal */}
      {showSanitationModal && sanitationVerificationResult && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="rounded-lg shadow-lg max-w-lg w-full border border-gray-200 p-8"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                sanitationVerificationResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {sanitationVerificationResult.success ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-4" style={{ 
              color: sanitationVerificationResult.success ? COLORS.success : COLORS.danger 
            }}>
              {sanitationVerificationResult.success ? 'VALID DOCUMENT' : 'INVALID DOCUMENT'}
            </h2>
            
            <div className="mb-6">
              <p className="text-center text-base" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                {sanitationVerificationResult.success 
                  ? 'The sanitation permit ID has been successfully verified and is valid for use in this application.'
                  : 'The sanitation permit ID could not be verified. Please check the ID number or ensure the document is readable and approved.'}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowSanitationModal(false)}
                style={{ 
                  background: sanitationVerificationResult.success ? COLORS.success : COLORS.danger 
                }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = sanitationVerificationResult.success ? COLORS.success : COLORS.danger}
                className="px-8 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                {sanitationVerificationResult.success ? 'Continue Application' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Verifying Modal - Shows during processing */}
      {showVerifyingModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="rounded-lg shadow-lg max-w-md w-full border border-gray-200 p-8"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-4" style={{ color: COLORS.primary }}>
              Verifying Document
            </h2>
            
            <div className="mb-6">
              <p className="text-center text-base mb-4" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                Please wait while we verify your document...
              </p>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${verifyingProgress}%` }}
                ></div>
              </div>
              
              <p className="text-center text-sm mt-2" style={{ color: COLORS.secondary }}>
                {verifyingProgress}% complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Document Verification Result Modal */}
      {showVerificationModal && verificationModalData && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div 
            className="rounded-lg shadow-lg max-w-lg w-full border border-gray-200 p-8"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              fontFamily: COLORS.font,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                verificationModalData.isVerified ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {verificationModalData.isVerified ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-4" style={{ 
              color: verificationModalData.isVerified ? COLORS.success : COLORS.danger 
            }}>
              {verificationModalData.isVerified ? 'VALID DOCUMENT' : 'INVALID DOCUMENT'}
            </h2>
            
            <div className="mb-6">
              {verificationModalData.isVerified ? (
                <p className="text-center text-base mb-4" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  The document has been successfully verified and is valid for use in this application.
                </p>
              ) : (
                <div className="text-left">
                  {verificationModalData.invalidReasons && verificationModalData.invalidReasons.length > 0 ? (
                    <div>
                      {verificationModalData.invalidReasons.map((reason, index) => (
                        <p key={index} className={`mb-2 ${index === 0 ? 'font-semibold text-base' : 'text-sm ml-4'}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                          {reason}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-base mb-4" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                      Document may be unreadable or unclear. Please re-upload a clear copy.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              {!verificationModalData.isVerified && (
                <button
                  onClick={() => {
                    setShowVerificationModal(false);
                    // Clear the invalid document from formData
                    if (verificationModalData.documentType) {
                      setFormData(prev => ({
                        ...prev,
                        [verificationModalData.documentType]: null
                      }));
                      // Reset verification state
                      setDocumentVerification(prev => ({
                        ...prev,
                        [verificationModalData.documentType]: {
                          isVerifying: false,
                          isVerified: false,
                          results: null,
                          error: null,
                          progress: 0
                        }
                      }));
                    }
                  }}
                  style={{ background: COLORS.primary }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                  onMouseLeave={e => e.currentTarget.style.background = COLORS.primary}
                  className="px-8 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
                >
                  Re-upload Document
                </button>
              )}
              <button
                onClick={() => setShowVerificationModal(false)}
                style={{ 
                  background: verificationModalData.isVerified ? COLORS.success : COLORS.danger 
                }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = verificationModalData.isVerified ? COLORS.success : COLORS.danger}
                className="px-8 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                {verificationModalData.isVerified ? 'Continue Application' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Are you sure you want to submit your business permit application? Please review all information before submitting.
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
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
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