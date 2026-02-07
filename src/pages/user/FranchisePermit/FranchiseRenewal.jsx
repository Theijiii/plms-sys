import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, Check, X, Eye, FileText, AlertCircle, Shield, Key, RefreshCw, Calendar, Receipt, UserCheck, Loader2 } from "lucide-react";
import Swal from 'sweetalert2';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/webpack';

// Design constants
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

const NATIONALITIES = ["Filipino", "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguans", "Argentinean", "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Barbudans", "Batswana", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djibouti", "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian", "Herzegovinian", "Honduran", "Hungarian", "I-Kiribati", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan", "Kittian and Nevisian", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivan", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Moroccan", "Mosotho", "Motswana", "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan", "San Marinese", "Sao Tomean", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian", "Slovenian", "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamer", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian or Tobagonian", "Tunisian", "Turkish", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbekistani", "Venezuelan", "Vietnamese", "Welsh", "Yemenite", "Zambian", "Zimbabwean"];

export default function FranchiseRenewal() {
  const location = useLocation();
  const navigate = useNavigate();
  const permitType = location.state?.permitType || 'RENEWAL';
  
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
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [existingPermit, setExistingPermit] = useState(null);
  const [autoFilledFields, setAutoFilledFields] = useState({});
  const [renewalType, setRenewalType] = useState('MTOP');
  const [isLoadingPermit, setIsLoadingPermit] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({
    isPaid: false,
    paymentMethod: '',
    paymentDate: '',
    transactionId: '',
    receiptNumber: ''
  });
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [showPaymentCompletionModal, setShowPaymentCompletionModal] = useState(false);
  
  // Mayor's Permit Verification
  const [verifyingMayorsPermit, setVerifyingMayorsPermit] = useState(false);
  const [mayorsPermitVerificationResult, setMayorsPermitVerificationResult] = useState(null);
  const [showMayorsPermitModal, setShowMayorsPermitModal] = useState(false);
  const [validatedMayorsPermitIds, setValidatedMayorsPermitIds] = useState({});

  // Barangay Clearance Verification
  const [isVerifyingBarangay, setIsVerifyingBarangay] = useState(false);
  const [barangayClearanceData, setBarangayClearanceData] = useState(null);

  const [documentVerification, setDocumentVerification] = useState({
    old_permit_copy: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    lto_cr_copy: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    lto_or_copy: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    community_tax_certificate: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    drivers_license: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    barangay_business_clearance: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 }
  });
  const [showVerifyingModal, setShowVerifyingModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifyingProgress, setVerifyingProgress] = useState(0);
  const [verificationModalData, setVerificationModalData] = useState({ success: false, documentType: '', details: {}, invalidReasons: [] });
  
  const [formData, setFormData] = useState({
    renewal_type: 'MTOP',
    existing_permit_id: '',
    existing_plate_number: '',
    mayors_permit_id: '',
    mayors_permit_applicant_id: '',
    
    // Applicant Information
    first_name: '',
    last_name: '',
    middle_initial: '',
    home_address: '',
    contact_number: '',
    email: '',
    citizenship: 'Filipino',
    birth_date: '',
    id_type: '',
    id_number: '',
    
    // Vehicle Information
    make_brand: '',
    model: '',
    engine_number: '',
    chassis_number: '',
    plate_number: '',
    year_acquired: '',
    color: '',
    vehicle_type: '',
    lto_or_number: '',
    lto_cr_number: '',
    lto_expiration_date: '',
    mv_file_number: '',
    district: '',
    
    // Operation Information
    route_zone: '',
    barangay_of_operation: '',
    toda_name: '',
    operator_type: '',
    company_name: '',
    
    // Required Documents for Renewal
    old_permit_copy: null,
    lto_cr_copy: null,
    lto_or_copy: null,
    community_tax_certificate: null,
    drivers_license: null,
    inspection_report: null,
    
    // Additional Documents for Mayor's Permit Renewal
    barangay_business_clearance: null,
    barangay_clearance_id: '',
    
    // Payment Information
    payment_method: 'online',
    renewal_fee_checked: false,
    sticker_fee_checked: false,
    inspection_fee_checked: false,
    business_tax_fee_checked: false,
    renewal_fee_or: '',
    sticker_fee_or: '',
    inspection_fee_or: '',
    business_tax_fee_or: '',
    renewal_fee_receipt: null,
    sticker_fee_receipt: null,
    inspection_fee_receipt: null,
    business_tax_fee_receipt: null,
    
    // Declaration
    applicant_signature: '',
    date_submitted: '',
    barangay_captain_signature: '',
    remarks: '',
    notes: '',
    
    // Original permit details
    original_permit_id: '',
    original_issue_date: '',
    original_expiry_date: '',
    permit_status: ''
  });

  const steps = [
    { id: 1, title: 'Renewal Type', description: 'Select permit to renew' },
    { id: 2, title: 'Existing Permit', description: 'Verify existing permit' },
    { id: 3, title: 'Applicant Information', description: 'Personal details' },
    { id: 4, title: 'Vehicle Information', description: 'Vehicle details' },
    { id: 5, title: 'Required Documents', description: 'Upload renewal documents' },
    { id: 6, title: 'Payment Information', description: 'Fees and payment' },
    { id: 7, title: 'Declaration', description: 'Sign and submit' },
    { id: 8, title: 'Review', description: 'Review your renewal' }
  ];

  const barangaysCaloocan = ["Bagong Barrio", "Grace Park East", "Grace Park West", "Barangay 28", "Barangay 35", "Barangay 63", "Barangay 71", "Barangay 75", "Barangay 120", "Barangay 122", "Barangay 126", "Barangay 129", "Barangay 132", "Barangay 134", "Barangay 136", "Barangay 143", "Barangay 146", "Barangay 148", "Barangay 151", "Barangay 155", "Barangay 160", "Barangay 162", "Barangay 164", "Barangay 167", "Barangay 171", "Barangay 172", "Barangay 175", "Barangay 176", "Barangay 177", "Barangay 178", "Barangay 179", "Barangay 180", "Barangay 181", "Barangay 182", "Barangay 183", "Barangay 184", "Barangay 185", "Barangay 186", "Barangay 187", "Barangay 188", "Deparo", "Bagumbong", "Tala", "Camarin", "Bagong Silang", "Pangarap Village"];

  const TODA_NAMES = ["Bagong Barrio TODA", "Grace Park TODA", "Camarin TODA", "Barangay 120 TODA", "Barangay 177 TODA", "Barangay 178 TODA", "Barangay 188 TODA", "Tala TODA", "Deparo TODA", "Bagumbong TODA", "Phase 1 TODA", "Phase 8 TODA", "Pangarap TODA", "Camarin East TODA", "Bagong Silang TODA", "Barangay 176 TODA", "Barangay 175 TODA", "Barangay 170 TODA", "Barangay 171 TODA", "Barangay 172 TODA"];

  const ROUTES = [
    { label: "Bagong Barrio TODA – Bagong Barrio Terminal – EDSA – Monumento Circle", value: "Bagong Barrio – Bagong Barrio Terminal – EDSA – Monumento Circle" },
    { label: "Grace Park TODA – Grace Park – Rizal Avenue – MCU – Monumento", value: "Grace Park – Rizal Avenue – MCU – Monumento" },
    { label: "Camarin TODA – Camarin Road – Zabarte – SM Fairview", value: "Camarin Road – Zabarte – SM Fairview" },
    { label: "Barangay 120 TODA – Barangay 120 – Camarin Road – Zabarte – SM Fairview", value: "Barangay 120 – Camarin Road – Zabarte – SM Fairview" },
    { label: "Barangay 177 TODA – Barangay 177 – Susano Road – Zabarte – Quirino Highway", value: "Barangay 177 – Susano Road – Zabarte – Quirino Highway" },
    { label: "Barangay 178 TODA – Barangay 178 – Mindanao Avenue Extension – Zabarte", value: "Barangay 178 – Mindanao Avenue Extension – Zabarte" },
    { label: "Barangay 188 TODA – Barangay 188 – Camarin – Novaliches Bayan", value: "Barangay 188 – Camarin – Novaliches Bayan" },
    { label: "Tala TODA – Tala Hospital – Phase 8 – Phase 7 – Camarin", value: "Tala Hospital – Phase 8 – Phase 7 – Camarin" },
    { label: "Deparo TODA – Deparo Road – Bagumbong – Quirino Highway", value: "Deparo Road – Bagumbong – Quirino Highway" },
    { label: "Bagumbong TODA – Bagumbong Road – Deparo – Camarin – Zabarte", value: "Bagumbong Road – Deparo – Camarin – Zabarte" },
    { label: "Phase 1 TODA – Phase 1 – Phase 2 – Zabarte – Camarin", value: "Phase 1 – Phase 2 – Zabarte – Camarin" },
    { label: "Phase 8 TODA – Phase 8 – Tala Hospital – Camarin Road", value: "Phase 8 – Tala Hospital – Camarin Road" },
    { label: "Pangarap TODA – Pangarap Village – Quirino Highway – Zabarte", value: "Pangarap Village – Quirino Highway – Zabarte" },
    { label: "Camarin East TODA – Camarin East – Zabarte – Fairview", value: "Camarin East – Zabarte – Fairview" },
    { label: "Bagong Silang TODA – Bagong Silang Phases 1–12 – Zabarte – Camarin", value: "Bagong Silang Phases 1–12 – Zabarte – Camarin" },
    { label: "Barangay 176 TODA – Barangay 176 – Susano Road – Zabarte", value: "Barangay 176 – Susano Road – Zabarte" },
    { label: "Barangay 175 TODA – Barangay 175 – Camarin Road – Zabarte", value: "Barangay 175 – Camarin Road – Zabarte" },
    { label: "Barangay 170 TODA – Barangay 170 – Zabarte – Quirino Highway", value: "Barangay 170 – Zabarte – Quirino Highway" },
    { label: "Barangay 171 TODA – Barangay 171 – Zabarte – SM Fairview", value: "Barangay 171 – Zabarte – SM Fairview" },
    { label: "Barangay 172 TODA – Barangay 172 – Quirino Highway – Zabarte", value: "Barangay 172 – Quirino Highway – Zabarte" }
  ];

  const OPERATOR_TYPES = ["Individual Operator", "TODA Member", "Transport Cooperative", "Corporation"];
  
  // Renewal Fees
  const RENEWAL_FEES = {
    mtop: { renewal_fee: 200.00, sticker_fee: 100.00, inspection_fee: 100.00 },
    mayor: { renewal_fee: 300.00, sticker_fee: 100.00, inspection_fee: 100.00 }
  };

  // Validation functions
  const validatePlateNumber = (plate) => {
    if (!plate) return { valid: false, error: '' };
    const cleanPlate = plate.replace(/\s/g, '').toUpperCase();
    const platePattern = /^[A-Z]{3}\d{4}$/;
    const valid = platePattern.test(cleanPlate);
    return {
      valid,
      formatted: cleanPlate,
      error: valid ? '' : 'Plate number must be in 3-letter, 4-digit format (e.g., ABC1234)'
    };
  };

  const validateChassisNumber = (chassis) => {
    if (!chassis) return { valid: false, error: '' };
    const cleanChassis = chassis.replace(/\s/g, '').toUpperCase();
    const valid = cleanChassis.length === 17;
    return {
      valid,
      formatted: cleanChassis,
      error: valid ? '' : 'Chassis number must be exactly 17 characters'
    };
  };

  const validateEngineNumber = (engine) => {
    if (!engine) return { valid: false, error: '' };
    const cleanEngine = engine.replace(/\s/g, '').toUpperCase();
    const valid = cleanEngine.length >= 8 && cleanEngine.length <= 12;
    return {
      valid,
      formatted: cleanEngine,
      error: valid ? '' : 'Engine number must be between 8-12 characters'
    };
  };

  const validateORNumber = (orNumber) => {
    if (!orNumber) return { valid: false, error: '' };
    const cleanOR = orNumber.replace(/\s/g, '');
    const orPattern = /^\d{7,8}$/;
    const valid = orPattern.test(cleanOR);
    return {
      valid,
      formatted: cleanOR,
      error: valid ? '' : 'OR number must be 7-8 digits'
    };
  };

  const validateCRNumber = (crNumber) => {
    if (!crNumber) return { valid: false, error: '' };
    const cleanCR = crNumber.replace(/\s/g, '');
    const crPattern = /^\d{7,8}$/;
    const valid = crPattern.test(cleanCR);
    return {
      valid,
      formatted: cleanCR,
      error: valid ? '' : 'CR number must be 7-8 digits'
    };
  };

  const validateIDNumber = (idNumber) => {
    if (!idNumber) return { valid: false, error: '' };
    const cleanID = idNumber.replace(/\s/g, '');
    const valid = cleanID.length > 0;
    return {
      valid,
      formatted: cleanID,
      error: ''
    };
  };

  const validateYearAcquired = (year) => {
    if (!year) return { valid: false, error: '' };
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year);
    const valid = /^\d{4}$/.test(year) && yearNum <= currentYear && yearNum >= 1900;
    return {
      valid,
      formatted: year,
      error: valid ? '' : 'Year must be a valid 4-digit year (1900-present)'
    };
  };

  // ====== AI DOCUMENT VERIFICATION HELPER FUNCTIONS ======
  const normalizeText = (text) => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const fuzzyMatch = (str1, str2, threshold = 0.5) => {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.95;
    
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

  const fuzzyMatchOld = (str1, str2, threshold = 0.5) => {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
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

  const DOCUMENT_PATTERNS = {
    drivers_license: [
      "driver", "license", "licence", "lto", "land transportation office",
      "restriction", "dl no", "license no", "philippine", "republic of the philippines"
    ]
  };

  const ID_TYPE_PATTERNS = {
    "Driver's License (LTO)": ["driver", "license", "licence", "lto", "land transportation", "department of transportation", "dl no"],
    "Driver's License": ["driver", "license", "licence", "lto", "land transportation"]
  };

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

    if (detectedTypes.length === 0) return null;
    detectedTypes.sort((a, b) => b.matchCount - a.matchCount || b.confidence - a.confidence);
    return detectedTypes[0];
  };

  const detectDocumentType = (text) => {
    const normalizedText = text.toLowerCase();
    let bestMatch = { type: null, score: 0, matchedKeywords: [] };
    
    for (const [docType, keywords] of Object.entries(DOCUMENT_PATTERNS)) {
      let matchCount = 0;
      const matched = [];
      
      keywords.forEach(keyword => {
        if (normalizedText.includes(keyword.toLowerCase())) {
          matchCount++;
          matched.push(keyword);
        }
      });
      
      const score = matchCount / keywords.length;
      if (score > bestMatch.score) {
        bestMatch = { type: docType, score, matchedKeywords: matched };
      }
    }
    
    return bestMatch.score > 0.1 ? bestMatch : { type: null, score: 0, matchedKeywords: [] };
  };

  const verifyOwnerNameInDoc = (extractedText) => {
    const firstName = formData.first_name?.trim();
    const lastName = formData.last_name?.trim();
    const middleInitial = formData.middle_initial?.trim();
    
    if (!firstName || !lastName) return null;
    
    const textLower = extractedText.toLowerCase();
    const firstNameLower = firstName.toLowerCase();
    const lastNameLower = lastName.toLowerCase();
    
    const firstNameFuzzy = fuzzyMatch(firstName, extractedText);
    const lastNameFuzzy = fuzzyMatch(lastName, extractedText);
    const middleInitialFuzzy = middleInitial ? fuzzyMatch(middleInitial, extractedText) : 0;
    
    const firstNameFound = firstNameFuzzy > 0 || textLower.includes(firstNameLower);
    const lastNameFound = lastNameFuzzy > 0 || textLower.includes(lastNameLower);
    const middleInitialFound = middleInitial ? (middleInitialFuzzy > 0 || textLower.includes(middleInitial.toLowerCase())) : false;
    
    const hasRequiredMatch = firstNameFound && lastNameFound;
    
    return {
      firstName: { matched: firstNameFound, confidence: firstNameFuzzy, value: firstName },
      lastName: { matched: lastNameFound, confidence: lastNameFuzzy, value: lastName },
      middleInitial: middleInitial ? { matched: middleInitialFound, confidence: middleInitialFuzzy, value: middleInitial } : null,
      anyMatch: hasRequiredMatch,
      allMatch: hasRequiredMatch && (!middleInitial || middleInitialFound)
    };
  };

  const convertPdfToImages = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images = [];
      
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport }).promise;
        images.push(canvas.toDataURL('image/png'));
      }
      
      return images;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      return [];
    }
  };

  // Main AI Document Verification Function for Driver's License
  const verifyDocument = async (documentType, file) => {
    if (!file) {
      showErrorMessage('Please upload a document first');
      return;
    }

    setDocumentVerification(prev => ({
      ...prev,
      [documentType]: { ...prev[documentType], isVerifying: true, isVerified: false, progress: 0 }
    }));

    Swal.fire({
      title: 'Verifying Document',
      html: '<p>Please wait while we verify your driver\'s license using AI...</p>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      let imagesToProcess = [];
      
      if (file.type === 'application/pdf') {
        setVerifyingProgress(10);
        imagesToProcess = await convertPdfToImages(file);
        if (imagesToProcess.length === 0) {
          throw new Error('Failed to process PDF');
        }
      } else {
        imagesToProcess = [URL.createObjectURL(file)];
      }

      setVerifyingProgress(30);
      
      const worker = await createWorker('eng');
      let extractedText = '';
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        const result = await worker.recognize(imagesToProcess[i]);
        extractedText += result.data.text + '\n';
        setVerifyingProgress(30 + (40 * (i + 1) / imagesToProcess.length));
        
        setDocumentVerification(prev => ({
          ...prev,
          [documentType]: { ...prev[documentType], progress: 30 + (40 * (i + 1) / imagesToProcess.length) }
        }));
      }
      
      await worker.terminate();
      setVerifyingProgress(80);

      const docTypeCheck = detectDocumentType(extractedText);
      const ownerNameCheck = verifyOwnerNameInDoc(extractedText);

      let isVerified = false;
      let invalidReasons = [];
      
      let idNumberCheck = null;
      let idTypeCheck = null;
      let isValidIDDocument = false;
      
      if (documentType === 'drivers_license') {
        if (formData.id_number) {
          const idNumberNormalized = normalizeText(formData.id_number);
          const extractedTextLower = extractedText.toLowerCase();
          let idNumberInText = extractedTextLower.includes(idNumberNormalized) || 
            fuzzyMatch(formData.id_number, extractedText) > 0.8;
          
          if (!idNumberInText) {
            const licenseNoPatterns = [
              /license\s*no\.?\s*:?\s*(\S+)/i,
              /dl\s*no\.?\s*:?\s*(\S+)/i,
              /license\s*number\s*:?\s*(\S+)/i,
              /dl\s*number\s*:?\s*(\S+)/i
            ];
            
            for (const pattern of licenseNoPatterns) {
              const match = extractedText.match(pattern);
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
            value: formData.id_number,
            found: idNumberInText
          };
        }
        
        const detectedIDType = detectIDType(extractedText);
        if (detectedIDType) {
          isValidIDDocument = true;
          if (formData.id_type) {
            const expectedLower = formData.id_type.toLowerCase();
            const detectedLower = detectedIDType.type.toLowerCase();
            const isMatch = expectedLower === detectedLower || 
                           expectedLower.includes(detectedLower) || 
                           detectedLower.includes(expectedLower) ||
                           (expectedLower.includes('driver') && detectedLower.includes('driver')) ||
                           (expectedLower.includes('license') && detectedLower.includes('license'));
            
            idTypeCheck = {
              expected: formData.id_type,
              detected: detectedIDType.type,
              matched: isMatch,
              confidence: detectedIDType.confidence,
              matchCount: detectedIDType.matchCount
            };
          }
        }
      }
      
      const documentTypeMatched = documentType === 'drivers_license' ? isValidIDDocument : docTypeCheck.type === documentType;
      
      if (!documentTypeMatched) {
        invalidReasons = ['Wrong document type uploaded. Expected: Driver\'s License'];
        isVerified = false;
      } else if (documentType === 'drivers_license' && isValidIDDocument) {
        const hasOwnerName = ownerNameCheck?.anyMatch;
        const hasIdNumber = idNumberCheck?.found;
        const hasCorrectIdType = idTypeCheck?.matched;
        
        if (hasOwnerName && hasIdNumber && hasCorrectIdType) {
          isVerified = true;
        } else {
          invalidReasons = ['The following information could not be verified:'];
          
          if (!hasOwnerName) {
            const firstNameMatch = ownerNameCheck?.firstName?.matched;
            const lastNameMatch = ownerNameCheck?.lastName?.matched;
            if (!firstNameMatch && !lastNameMatch) {
              invalidReasons.push('❌ Owner name not found in license');
            } else if (!firstNameMatch) {
              invalidReasons.push('❌ First name not found in license');
            } else if (!lastNameMatch) {
              invalidReasons.push('❌ Last name not found in license');
            }
          } else {
            invalidReasons.push('✓ Owner name verified');
          }
          
          if (!hasIdNumber) {
            invalidReasons.push('❌ License number not found in document');
          } else {
            invalidReasons.push('✓ License number verified');
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
          
          invalidReasons.push('Please ensure the license image is clear and all information is visible.');
          isVerified = false;
        }
      }

      setVerifyingProgress(100);
      
      setDocumentVerification(prev => ({
        ...prev,
        [documentType]: {
          isVerifying: false,
          isVerified: isVerified,
          results: {
            documentType: documentType === 'drivers_license' ? 'drivers_license' : docTypeCheck.type,
            documentTypeMatched,
            ownerName: ownerNameCheck,
            idNumber: idNumberCheck,
            idType: idTypeCheck,
            extractedText: extractedText.substring(0, 500)
          },
          error: isVerified ? null : invalidReasons.join(', '),
          progress: 100
        }
      }));

      setVerificationModalData({
        success: isVerified,
        documentType,
        details: {
          documentTypeMatched,
          ownerNameFound: ownerNameCheck?.anyMatch,
          idNumberFound: idNumberCheck?.found,
          idTypeMatched: idTypeCheck?.matched
        },
        invalidReasons
      });

      Swal.fire({
        icon: isVerified ? 'success' : 'error',
        title: isVerified ? 'VALID DOCUMENT' : 'INVALID DOCUMENT',
        html: isVerified 
          ? '<p style="font-size: 16px;">The driver\'s license has been successfully verified and is valid for use in this application.</p>'
          : `<div style="text-align: left;">${invalidReasons.map(reason => `<p style="margin: 8px 0;">${reason}</p>`).join('')}</div>`,
        confirmButtonText: isVerified ? 'Continue' : 'Close',
        confirmButtonColor: isVerified ? COLORS.success : COLORS.danger,
        allowOutsideClick: true
      });

    } catch (error) {
      console.error('Verification error:', error);
      setDocumentVerification(prev => ({
        ...prev,
        [documentType]: {
          isVerifying: false,
          isVerified: false,
          results: null,
          error: error.message,
          progress: 0
        }
      }));
      
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: `Verification failed: ${error.message}`,
        confirmButtonColor: COLORS.danger
      });
    }
  };

const verifyBarangayClearance = async () => {
  if (!formData.barangay_clearance_id) {
    Swal.fire({
      icon: 'warning',
      title: 'Input Required',
      text: 'Please enter Barangay Clearance ID',
      confirmButtonColor: COLORS.primary
    });
    return;
  }
  
  setIsVerifyingBarangay(true);
  
  try {
    const response = await fetch('/backend/barangay_permit/check_barangay_clearance.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barangay_clearance_id: formData.barangay_clearance_id
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      setBarangayClearanceData(data.data);
      Swal.fire({
        icon: 'success',
        title: 'Verification Successful',
        html: `
          <div style="text-align: left;">
            <p><strong>Barangay Clearance ID:</strong> ${data.data.clearance_id || formData.barangay_clearance_id}</p>
            <p><strong>Permit ID:</strong> ${data.data.permit_id || 'N/A'}</p>
            <p><strong>Status:</strong> <span style="color: green;">${data.data.status || 'Valid'}</span></p>
            ${data.data.business_name ? `<p><strong>Business Name:</strong> ${data.data.business_name}</p>` : ''}
            ${data.data.owner_name ? `<p><strong>Owner:</strong> ${data.data.owner_name}</p>` : ''}
          </div>
        `,
        confirmButtonColor: COLORS.primary
      });
    } else {
      setBarangayClearanceData(null);
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: data.message || 'Barangay Clearance ID not found or invalid',
        confirmButtonColor: COLORS.danger
      });
    }
  } catch (error) {
    console.error('Barangay verification error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Verification Error',
      text: 'Failed to verify Barangay Clearance ID. Please try again.',
      confirmButtonColor: COLORS.danger
    });
  } finally {
    setIsVerifyingBarangay(false);
  }
};

const checkExistingPermit = async () => {
  if (!formData.existing_permit_id || !formData.existing_plate_number) {
    showErrorMessage("Please enter your existing Permit ID and Plate Number for validation.");
    return false;
  }
  
  setIsCheckingExisting(true);
  
  try {
    const response = await fetch('/backend/franchise_permit/check_existing_permit.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permit_id: formData.existing_permit_id,
        plate_number: formData.existing_plate_number,
        renewal_type: renewalType
      })
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return false;
    }
    
    if (data.success && data.existingPermit) {
      setExistingPermit(data.existingPermit);
      autoFillFromExistingPermit(data.existingPermit);
      
      // Check if permit is expired
      const expiryDate = new Date(data.existingPermit.expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      let message = '';
      if (data.existingPermit.status === 'EXPIRED') {
        message = ' Your permit has expired. Please renew immediately.';
      } else if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        message = ` Your permit expires in ${daysUntilExpiry} days.`;
      } else if (daysUntilExpiry <= 0) {
        message = ' Your permit has expired. Please renew immediately.';
      } else {
        message = 'Valid permit found. You may proceed with renewal.';
      }
      
      // Show success message and proceed
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Existing ${renewalType === 'MTOP' ? 'MTOP' : 'Mayor\'s'} permit found! ${message}`,
        confirmButtonColor: COLORS.primary,
        timer: 3000,
        timerProgressBar: true
      }).then(() => {
        setCurrentStep(3); // Proceed to Step 3 (Applicant Information)
      });
      
      return true;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message || 'No existing permit found with the provided details.',
        confirmButtonColor: COLORS.danger
      });
      return false;
    }
  } catch (error) {
    console.error('Error checking existing permit:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: "Error checking existing permit. Please check your connection.",
      confirmButtonColor: COLORS.danger
    });
    return false;
  } finally {
    setIsCheckingExisting(false);
  }
};

  const autoFillFromExistingPermit = (permitData) => {
    if (!permitData) return;
    
    const fieldsToAutoFill = {};
    const updatedData = { ...formData };
    
    // Define which fields should be auto-filled
    const autoFillableFields = [
      'first_name', 'last_name', 'middle_initial',
      'home_address', 'contact_number', 'email',
      'citizenship', 'birth_date', 'id_type', 'id_number',
      'make_brand', 'model', 'engine_number', 'chassis_number',
      'plate_number', 'year_acquired', 'color', 'vehicle_type',
      'lto_or_number', 'lto_cr_number', 'lto_expiration_date',
      'mv_file_number', 'district', 'route_zone',
      'barangay_of_operation', 'toda_name', 'operator_type',
      'company_name'
    ];
    
    autoFillableFields.forEach(field => {
      if (permitData[field]) {
        updatedData[field] = permitData[field];
        fieldsToAutoFill[field] = true;
      }
    });
    
    // Set original permit details
    if (permitData.application_id) {
      updatedData.original_permit_id = permitData.application_id;
      updatedData.existing_permit_id = permitData.application_id;
    }
    if (permitData.date_approved) {
      updatedData.original_issue_date = permitData.date_approved;
    }
    if (permitData.expiry_date) {
      updatedData.original_expiry_date = permitData.expiry_date;
    }
    if (permitData.status) {
      updatedData.permit_status = permitData.status;
    }
    
    // Format specific fields
    if (updatedData.plate_number) {
      const plateValidation = validatePlateNumber(updatedData.plate_number);
      if (plateValidation.valid) {
        updatedData.plate_number = plateValidation.formatted;
      }
    }
    
    if (updatedData.chassis_number) {
      const chassisValidation = validateChassisNumber(updatedData.chassis_number);
      if (chassisValidation.valid) {
        updatedData.chassis_number = chassisValidation.formatted;
      }
    }
    
    if (updatedData.engine_number) {
      const engineValidation = validateEngineNumber(updatedData.engine_number);
      if (engineValidation.valid) {
        updatedData.engine_number = engineValidation.formatted;
      }
    }
    
    if (updatedData.lto_or_number) {
      const orValidation = validateORNumber(updatedData.lto_or_number);
      if (orValidation.valid) {
        updatedData.lto_or_number = orValidation.formatted;
      }
    }
    
    if (updatedData.lto_cr_number) {
      const crValidation = validateCRNumber(updatedData.lto_cr_number);
      if (crValidation.valid) {
        updatedData.lto_cr_number = crValidation.formatted;
      }
    }
    
    if (updatedData.id_number) {
      const idValidation = validateIDNumber(updatedData.id_number);
      if (idValidation.valid) {
        updatedData.id_number = idValidation.formatted;
      }
    }
    
    if (updatedData.year_acquired) {
      const yearValidation = validateYearAcquired(updatedData.year_acquired);
      if (yearValidation.valid) {
        updatedData.year_acquired = yearValidation.formatted;
      }
    }
    
    setFormData(updatedData);
    setAutoFilledFields(fieldsToAutoFill);
  };

  const resetAutoFilledData = () => {
    const resetData = { ...formData };
    Object.keys(autoFilledFields).forEach(field => {
      resetData[field] = '';
    });
    resetData.original_permit_id = '';
    resetData.original_issue_date = '';
    resetData.original_expiry_date = '';
    resetData.permit_status = '';
    setFormData(resetData);
    setAutoFilledFields({});
    setExistingPermit(null);
    
    // Proceed to step 3 after clearing
    setCurrentStep(3);
  };

  const showErrorMessage = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonColor: COLORS.danger
    });
  };

  // Verify Mayor's Permit ID with applicant_id fetching
  const verifyMayorsPermitId = async () => {
    const mayorsPermitId = formData.mayors_permit_id.trim();
    
    if (!mayorsPermitId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: "Please enter a Mayor's Permit ID to verify",
        confirmButtonColor: COLORS.danger
      });
      return;
    }

    setVerifyingMayorsPermit(true);
    
    try {
      const response = await fetch(`/backend/business_permit/admin_fetch.php`);
      
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
        const searchId = mayorsPermitId.toString();
        
        return (permitApplicantId === searchId || permitPermitId === searchId) && permit.status === 'APPROVED';
      });

      if (foundPermit) {
        setValidatedMayorsPermitIds(prev => ({
          ...prev,
          [mayorsPermitId]: foundPermit
        }));
        
        if (foundPermit.applicant_id) {
          setFormData(prev => ({
            ...prev,
            mayors_permit_applicant_id: foundPermit.applicant_id
          }));
        }
        
        Swal.fire({
          icon: 'success',
          title: 'Verification Successful!',
          html: `
            <div style="text-align: left;">
              <p><strong>Business Name:</strong> ${foundPermit.business_name || 'N/A'}</p>
              <p><strong>Applicant ID:</strong> ${foundPermit.applicant_id || 'N/A'}</p>
              <p><strong>Owner:</strong> ${foundPermit.owner_first_name || ''} ${foundPermit.owner_last_name || ''}</p>
              <p><strong>Status:</strong> ${foundPermit.status}</p>
            </div>
          `,
          confirmButtonColor: COLORS.success
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: "Mayor's Permit ID not found or not approved. Please check the ID and try again.",
          confirmButtonColor: COLORS.danger
        });
      }
    } catch (error) {
      console.error("Error verifying Mayor's Permit ID:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: "Error verifying Mayor's Permit ID. Please try again.",
        confirmButtonColor: COLORS.danger
      });
    } finally {
      setVerifyingMayorsPermit(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    if (paymentStatus.isPaid) {
      showErrorMessage("Payment has already been completed. Payment method cannot be changed.");
      return;
    }
    setFormData(prev => ({ ...prev, payment_method: method }));
  };

  const handleOnlinePayment = () => {
    if (paymentStatus.isPaid) {
      showErrorMessage("Payment has already been completed. You cannot make another payment.");
      return;
    }
    
    const fees = renewalType === 'MTOP' ? RENEWAL_FEES.mtop : RENEWAL_FEES.mayor;
    let totalAmount = 0;
    if (formData.renewal_fee_checked) totalAmount += fees.renewal_fee;
    if (formData.sticker_fee_checked) totalAmount += fees.sticker_fee;
    if (formData.inspection_fee_checked) totalAmount += fees.inspection_fee;
    
    if (totalAmount <= 0) {
      showErrorMessage("Please select at least one fee to pay.");
      return;
    }
    
    // Generate unique reference ID
    const referenceId = `REN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      system: 'franchise_renewal',
      ref: referenceId,
      amount: totalAmount.toFixed(2),
      purpose: `${renewalType} Renewal - ${formData.plate_number || 'Renewal Application'}`,
      callback: "https://revenuetreasury.goserveph.com/citizen_dashboard/market/api/market_payment_api.php",
    };

    // Save payment reference locally
    localStorage.setItem('payment_reference', referenceId);
    localStorage.setItem('payment_amount', totalAmount.toFixed(2));
    localStorage.setItem('application_plate', formData.plate_number);
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://revenuetreasury.goserveph.com/citizen_dashboard/digital/index.php';
    form.target = '_blank';
    
    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
    
    // Show payment completion modal after a delay
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Payment Successful!',
        text: 'Your payment has been confirmed successfully! You can now proceed to the next step.',
        confirmButtonColor: COLORS.primary
      });
    }, 2000);
    
    // Start polling for payment status
    startPaymentPolling(referenceId);
  };

  const startPaymentPolling = (referenceId) => {
    console.log('Starting payment polling for:', referenceId);
    
    const checkPayment = async () => {
      try {
        const response = await fetch(`/backend/franchise_permit/get_payment_status.php?reference_id=${referenceId}`);
        
        if (!response.ok) {
          console.error('HTTP error! status:', response.status);
          return;
        }
        
        const text = await response.text();
        console.log('Payment check raw response:', text);
        
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse JSON:', text);
          return;
        }
        
        console.log('Payment status data:', data);
        
        // Show payment as successful
        if (data.success) {
          setPaymentStatus({
            isPaid: true,
            paymentMethod: 'online',
            paymentDate: new Date().toISOString(),
            transactionId: data.payment_id || referenceId,
            receiptNumber: data.receipt_number || 'N/A'
          });
          
          clearInterval(pollingInterval);
          
          // Show SweetAlert success modal
          Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            text: 'Your payment has been confirmed successfully! You can now proceed to the next step.',
            confirmButtonColor: COLORS.primary
          });
          
          setFormData(prev => ({
            ...prev,
            payment_method: 'online',
            payment_status: 'paid'
          }));
        }
        
      } catch (error) {
        console.error('Error checking payment:', error);
      }
    };
    
    const pollingInterval = setInterval(checkPayment, 5000);
    
    setTimeout(() => {
      clearInterval(pollingInterval);
      console.log('Payment polling stopped after 10 minutes');
    }, 10 * 60 * 1000);
    
    checkPayment();
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    // Prevent changes to auto-filled fields
    if (autoFilledFields[name]) {
      showErrorMessage("This field is auto-filled from your existing permit and cannot be modified.");
      return;
    }
    
    if (name === "contact_number") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      let finalValue = onlyNums;
      if (onlyNums.length > 0) {
        if (!onlyNums.startsWith('09')) {
          finalValue = '09' + onlyNums;
        }
        finalValue = finalValue.slice(0, 11);
      }
      
      setFormData(prev => ({ ...prev, [name]: finalValue }));
      
      if (finalValue.length > 0 && finalValue.length !== 11) {
        setErrors(prev => ({ ...prev, contact_number: 'Contact number must be 11 digits (09XXXXXXXXX)' }));
      } else if (errors.contact_number) {
        const newErrors = { ...errors };
        delete newErrors.contact_number;
        setErrors(newErrors);
      }
    } else if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file || null }));
      
      if (errors[name]) {
        const newErrors = { ...errors };
        delete newErrors[name];
        setErrors(newErrors);
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'renewal_type') {
      setRenewalType(value);
      setFormData(prev => ({ ...prev, [name]: value }));
      setExistingPermit(null);
      setAutoFilledFields({});
    } else {
      let finalValue = value;
      
      // Special handling for specific fields with validation
      switch(name) {
        case 'plate_number':
        case 'existing_plate_number':
          const cleanPlate = value.replace(/\s/g, '').toUpperCase();
          finalValue = cleanPlate;
          
          if (cleanPlate) {
            const validation = validatePlateNumber(cleanPlate);
            if (!validation.valid && cleanPlate.length >= 3) {
              setErrors(prev => ({ ...prev, [name]: validation.error }));
            } else if (errors[name]) {
              const newErrors = { ...errors };
              delete newErrors[name];
              setErrors(newErrors);
            }
          }
          break;
          
        case 'chassis_number':
          const cleanChassis = value.replace(/\s/g, '').toUpperCase();
          finalValue = cleanChassis;
          
          if (cleanChassis) {
            const validation = validateChassisNumber(cleanChassis);
            if (!validation.valid && cleanChassis.length >= 10) {
              setErrors(prev => ({ ...prev, [name]: validation.error }));
            } else if (errors[name]) {
              const newErrors = { ...errors };
              delete newErrors[name];
              setErrors(newErrors);
            }
          }
          break;
          
        case 'engine_number':
          const cleanEngine = value.replace(/\s/g, '').toUpperCase();
          finalValue = cleanEngine;
          
          if (cleanEngine) {
            const validation = validateEngineNumber(cleanEngine);
            if (!validation.valid && cleanEngine.length >= 6) {
              setErrors(prev => ({ ...prev, [name]: validation.error }));
            } else if (errors[name]) {
              const newErrors = { ...errors };
              delete newErrors[name];
              setErrors(newErrors);
            }
          }
          break;
          
        case 'lto_or_number':
          const cleanOR = value.replace(/\s/g, '');
          finalValue = cleanOR;
          
          if (cleanOR) {
            const validation = validateORNumber(cleanOR);
            if (!validation.valid && cleanOR.length >= 6) {
              setErrors(prev => ({ ...prev, [name]: validation.error }));
            } else if (errors[name]) {
              const newErrors = { ...errors };
              delete newErrors[name];
              setErrors(newErrors);
            }
          }
          break;
          
        case 'lto_cr_number':
          const cleanCR = value.replace(/\s/g, '');
          finalValue = cleanCR;
          
          if (cleanCR) {
            const validation = validateCRNumber(cleanCR);
            if (!validation.valid && cleanCR.length >= 6) {
              setErrors(prev => ({ ...prev, [name]: validation.error }));
            } else if (errors[name]) {
              const newErrors = { ...errors };
              delete newErrors[name];
              setErrors(newErrors);
            }
          }
          break;
          
        case 'id_number':
          const cleanID = value.replace(/\s/g, '');
          finalValue = cleanID;
          
          if (cleanID) {
            const validation = validateIDNumber(cleanID);
            if (!validation.valid) {
              setErrors(prev => ({ ...prev, [name]: validation.error }));
            } else if (errors[name]) {
              const newErrors = { ...errors };
              delete newErrors[name];
              setErrors(newErrors);
            }
          }
          break;
          
        case 'year_acquired':
          if (value) {
            const validation = validateYearAcquired(value);
            if (!validation.valid) {
              setErrors(prev => ({ ...prev, [name]: validation.error }));
            } else if (errors[name]) {
              const newErrors = { ...errors };
              delete newErrors[name];
              setErrors(newErrors);
            }
          }
          finalValue = value;
          break;
          
        default:
          finalValue = value;
      }
      
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const previewFile = (file) => {
    if (!file) return null;
    
    const url = URL.createObjectURL(file);
    const fileType = file.type.split('/')[0];
    
    Swal.fire({
      title: 'Preview Document',
      html: `
        <div style="text-align: center;">
          <p style="font-weight: bold;">File: ${file.name}</p>
          ${fileType === 'image' ? `
            <img src="${url}" alt="Preview" style="max-width: 100%; max-height: 500px; margin: 20px auto;">
          ` : fileType === 'application' && file.name?.includes('.pdf') ? `
            <iframe src="${url}" style="width: 100%; height: 500px; border: none;"></iframe>
          ` : `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
              <FileText style="font-size: 24px; color: #666;" />
              <p style="font-size: 14px; color: #666; margin-top: 10px;">Preview not available for this file type</p>
              <a href="${url}" download="${file.name}" style="font-size: 14px; color: #337ab7; margin-top: 10px;">Download File</a>
            </div>
          `}
        </div>
      `,
      confirmButtonColor: COLORS.primary
    });
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!renewalType) {
        newErrors.renewal_type = 'Please select renewal type';
      }
    }
    
    if (step === 2) {
      if (!formData.existing_permit_id) {
        newErrors.existing_permit_id = 'Existing permit ID is required';
      }
      if (!formData.existing_plate_number) {
        newErrors.existing_plate_number = 'Plate number is required';
      } else {
        const plateValidation = validatePlateNumber(formData.existing_plate_number);
        if (!plateValidation.valid) {
          newErrors.existing_plate_number = plateValidation.error;
        }
      }
      
      if (!existingPermit) {
        newErrors.existing_permit = 'Please verify your existing permit before proceeding';
      }
    }
    
    if (step === 3) {
      if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
      if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
      if (!formData.home_address.trim()) newErrors.home_address = 'Home address is required';
      if (!formData.contact_number.trim()) newErrors.contact_number = 'Contact number is required';
      else if (formData.contact_number.length !== 11) {
        newErrors.contact_number = 'Contact number must be 11 digits (09XXXXXXXXX)';
      }
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.citizenship) newErrors.citizenship = 'Citizenship is required';
      if (!formData.birth_date) newErrors.birth_date = 'Birth date is required';
      if (!formData.id_type) newErrors.id_type = 'ID type is required';
      if (!formData.id_number.trim()) newErrors.id_number = 'ID number is required';
      else {
        const idValidation = validateIDNumber(formData.id_number);
        if (!idValidation.valid) {
          newErrors.id_number = idValidation.error;
        }
      }
      if (!formData.operator_type) newErrors.operator_type = 'Operator type is required';
    }
    
    if (step === 4) {
      if (!formData.make_brand.trim()) newErrors.make_brand = 'Make/Brand is required';
      if (!formData.model.trim()) newErrors.model = 'Model is required';
      
      if (!formData.engine_number.trim()) {
        newErrors.engine_number = 'Engine number is required';
      } else {
        const engineValidation = validateEngineNumber(formData.engine_number);
        if (!engineValidation.valid) {
          newErrors.engine_number = engineValidation.error;
        }
      }
      
      if (!formData.chassis_number.trim()) {
        newErrors.chassis_number = 'Chassis number is required';
      } else {
        const chassisValidation = validateChassisNumber(formData.chassis_number);
        if (!chassisValidation.valid) {
          newErrors.chassis_number = chassisValidation.error;
        }
      }
      
      if (!formData.plate_number.trim()) {
        newErrors.plate_number = 'Plate number is required';
      } else {
        const plateValidation = validatePlateNumber(formData.plate_number);
        if (!plateValidation.valid) {
          newErrors.plate_number = plateValidation.error;
        }
      }
      
      if (!formData.year_acquired.trim()) {
        newErrors.year_acquired = 'Year acquired is required';
      } else {
        const yearValidation = validateYearAcquired(formData.year_acquired);
        if (!yearValidation.valid) {
          newErrors.year_acquired = yearValidation.error;
        }
      }
      
      if (!formData.color.trim()) newErrors.color = 'Color is required';
      if (!formData.vehicle_type.trim()) newErrors.vehicle_type = 'Vehicle type is required';
      
      if (!formData.lto_or_number.trim()) {
        newErrors.lto_or_number = 'LTO OR number is required';
      } else {
        const orValidation = validateORNumber(formData.lto_or_number);
        if (!orValidation.valid) {
          newErrors.lto_or_number = orValidation.error;
        }
      }
      
      if (!formData.lto_cr_number.trim()) {
        newErrors.lto_cr_number = 'LTO CR number is required';
      } else {
        const crValidation = validateCRNumber(formData.lto_cr_number);
        if (!crValidation.valid) {
          newErrors.lto_cr_number = crValidation.error;
        }
      }
      
      if (!formData.lto_expiration_date) {
        newErrors.lto_expiration_date = 'LTO expiration date is required';
      } else {
        const selectedDate = new Date(formData.lto_expiration_date);
        const selectedYear = selectedDate.getFullYear();
        
        if (selectedYear <= 2026) {
          newErrors.lto_expiration_date = 'LTO Expiration Date must be 2027 or later.';
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const selectedDate = new Date(formData.lto_expiration_date);
          
          if (selectedDate < today) {
            newErrors.lto_expiration_date = 'LTO Expiration Date cannot be in the past. Please select a future date.';
          }
        }
      }
      if (!formData.district.trim()) newErrors.district = 'District is required';
    }
    
    if (step === 5) {
      const requiredDocs = [];
      
      // Common documents for both renewal types
      requiredDocs.push(
        { name: 'old_permit_copy', label: 'Old Permit Copy' },
        { name: 'lto_cr_copy', label: 'LTO CR Copy' },
        { name: 'lto_or_copy', label: 'LTO OR Copy' },
        { name: 'community_tax_certificate', label: 'Community Tax Certificate' },
        { name: 'drivers_license', label: 'Driver\'s License' }
      );
      
      // Additional documents for Mayor's Permit
      if (renewalType === 'MAYOR') {
        requiredDocs.push(
          { name: 'barangay_business_clearance', label: 'Barangay Business Clearance' }
        );
      }
      
      // Optional documents
      const optionalDocs = [
        { name: 'inspection_report', label: 'Inspection Report' }
      ];
      
      let uploadedCount = 0;
      requiredDocs.forEach(doc => {
        if (!formData[doc.name]) {
          newErrors[doc.name] = `${doc.label} is required for ${renewalType === 'MTOP' ? 'MTOP' : 'Mayor\'s Permit'} renewal`;
        } else {
          uploadedCount++;
        }
      });
      
      if (uploadedCount < requiredDocs.length) {
        newErrors.min_documents = `All required documents must be uploaded`;
      }
    }
    
    if (step === 6) {
      const feeChecks = [
        { name: 'renewal_fee', checked: formData.renewal_fee_checked, receipt: formData.renewal_fee_receipt, or: formData.renewal_fee_or },
        { name: 'sticker_fee', checked: formData.sticker_fee_checked, receipt: formData.sticker_fee_receipt, or: formData.sticker_fee_or },
        { name: 'inspection_fee', checked: formData.inspection_fee_checked, receipt: formData.inspection_fee_receipt, or: formData.inspection_fee_or }
      ];
      
      const hasCheckedFee = feeChecks.some(fee => fee.checked);
      
      if (formData.payment_method === 'online') {
        // For online payment, only require at least one fee to be selected
        if (!hasCheckedFee) {
          newErrors.payment = 'At least one fee must be selected for payment';
        }
      } else {
        // For upload method, require OR number and receipt
        let hasValidFee = false;
        feeChecks.forEach(fee => {
          if (fee.checked) {
            if (!fee.or) {
              newErrors[`${fee.name}_or`] = 'OR Number is required';
            }
            if (!fee.receipt) {
              newErrors[`${fee.name}_receipt`] = 'Receipt is required';
            }
            if (fee.or && fee.receipt) {
              hasValidFee = true;
            }
          }
        });
        
        if (!hasValidFee) {
          newErrors.payment = 'At least one fee must be checked with valid OR number and receipt';
        }
      }
    }
    
    if (step === 7) {
      if (!formData.applicant_signature) {
        newErrors.applicant_signature = 'Applicant signature is required';
      }
      if (!formData.date_submitted) {
        newErrors.date_submitted = 'Date of submission is required';
      }
      if (!agreeDeclaration) {
        newErrors.declaration = 'You must agree to the declaration';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (step) => {
    const validators = {
      1: () => renewalType === 'MTOP' || renewalType === 'MAYOR',
      2: () => {
        if (!formData.existing_permit_id) return false;
        if (!formData.existing_plate_number) return false;
        const plateValidation = validatePlateNumber(formData.existing_plate_number);
        if (!plateValidation.valid) return false;
        return !!existingPermit;
      },
      3: () => {
        if (!formData.first_name.trim()) return false;
        if (!formData.last_name.trim()) return false;
        if (!formData.home_address.trim()) return false;
        if (!formData.contact_number.trim()) return false;
        if (formData.contact_number.length !== 11) return false;
        if (!formData.email.trim()) return false;
        if (!/\S+@\S+\.\S+/.test(formData.email)) return false;
        if (!formData.citizenship) return false;
        if (!formData.birth_date) return false;
        if (!formData.id_type) return false;
        if (!formData.id_number.trim()) return false;
        const idValidation = validateIDNumber(formData.id_number);
        if (!idValidation.valid) return false;
        if (!formData.operator_type) return false;
        return true;
      },
      4: () => {
        if (!formData.make_brand.trim()) return false;
        if (!formData.model.trim()) return false;
        if (!formData.engine_number.trim()) return false;
        const engineValidation = validateEngineNumber(formData.engine_number);
        if (!engineValidation.valid) return false;
        if (!formData.chassis_number.trim()) return false;
        const chassisValidation = validateChassisNumber(formData.chassis_number);
        if (!chassisValidation.valid) return false;
        if (!formData.plate_number.trim()) return false;
        const plateValidation = validatePlateNumber(formData.plate_number);
        if (!plateValidation.valid) return false;
        if (!formData.year_acquired.trim()) return false;
        const yearValidation = validateYearAcquired(formData.year_acquired);
        if (!yearValidation.valid) return false;
        if (!formData.color.trim()) return false;
        if (!formData.vehicle_type.trim()) return false;
        if (!formData.lto_or_number.trim()) return false;
        const orValidation = validateORNumber(formData.lto_or_number);
        if (!orValidation.valid) return false;
        if (!formData.lto_cr_number.trim()) return false;
        const crValidation = validateCRNumber(formData.lto_cr_number);
        if (!crValidation.valid) return false;
        if (!formData.lto_expiration_date) return false;
        const selectedDate = new Date(formData.lto_expiration_date);
        const selectedYear = selectedDate.getFullYear();
        
        if (selectedYear <= 2026) return false;
        if (!formData.district.trim()) return false;
        return true;
      },
      5: () => {
        const requiredDocs = ['old_permit_copy', 'lto_cr_copy', 'lto_or_copy', 'community_tax_certificate', 'drivers_license'];
        if (renewalType === 'MAYOR') {
          requiredDocs.push('barangay_business_clearance');
        }
        return requiredDocs.every(doc => formData[doc]);
      },
      6: () => {
        const feeChecks = [
          { checked: formData.renewal_fee_checked, receipt: formData.renewal_fee_receipt, or: formData.renewal_fee_or },
          { checked: formData.sticker_fee_checked, receipt: formData.sticker_fee_receipt, or: formData.sticker_fee_or },
          { checked: formData.inspection_fee_checked, receipt: formData.inspection_fee_receipt, or: formData.inspection_fee_or }
        ];
        
        if (formData.payment_method === 'online') {
          return feeChecks.some(fee => fee.checked);
        } else {
          return feeChecks.some(fee => fee.checked && fee.receipt && fee.or);
        }
      },
      7: () => {
        if (documentVerification.drivers_license.isVerified) return true;
        return formData.applicant_signature && formData.date_submitted && agreeDeclaration;
      },
      8: () => true
    };
    
    return validators[step] ? validators[step]() : true;
  };

  const getFullName = () => {
    return `${formData.first_name} ${formData.middle_initial ? formData.middle_initial + '.' : ''} ${formData.last_name}`.trim();
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      if (currentStep === 2 && !existingPermit) {
        showErrorMessage("Please verify your existing permit before proceeding.");
        return;
      }
      
      // Allow proceeding to Review step if driver's license is verified
      if (currentStep === 7 && documentVerification.drivers_license.isVerified) {
        setCurrentStep(currentStep + 1);
        setErrors({});
        return;
      }
      
      const ok = validateStep(currentStep);
      if (ok) {
        setCurrentStep(currentStep + 1);
        setErrors({});
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      nextStep();
    } else if (currentStep === steps.length - 1) {
      // Allow proceeding to Review step if driver's license is verified
      if (documentVerification.drivers_license.isVerified) {
        setCurrentStep(currentStep + 1);
        setErrors({});
        return;
      }
      
      const ok = validateStep(currentStep);
      if (ok) {
        setCurrentStep(currentStep + 1);
        setErrors({});
      }
    } else {
      Swal.fire({
        title: 'Confirm Renewal Submission',
        html: `
          <p>You are about to submit your ${renewalType === 'MTOP' ? 'MTOP' : 'Mayor\'s Permit'} renewal application.</p>
          ${existingPermit ? `
            <div style="margin-top: 10px; padding: 10px; background: #EFF6FF; border-radius: 8px; text-align: left;">
              <p style="font-weight: bold; color: #1E40AF;">✓ Existing Permit Verified</p>
              <p style="font-size: 12px; margin-top: 5px;"><strong>Permit ID:</strong> ${existingPermit.application_id}</p>
              <p style="font-size: 12px;"><strong>Status:</strong> ${existingPermit.status}</p>
              <p style="font-size: 12px;"><strong>Expiry:</strong> ${existingPermit.expiry_date}</p>
            </div>
          ` : ''}
          <div style="margin-top: 15px; padding: 10px; background: #F9FAFB; border-radius: 8px;">
            <p style="font-weight: bold; margin-bottom: 5px;">Renewal Declaration:</p>
            <p style="font-size: 13px;">I hereby declare that all information provided is true and correct to the best of my knowledge.</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: COLORS.success,
        cancelButtonColor: COLORS.danger,
        confirmButtonText: 'Confirm & Submit',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          handleSubmit();
        }
      });
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
      confirmButtonColor: COLORS.primary
    });
  };

  const handleBackConfirmation = () => {
    Swal.fire({
      title: 'Change Permit Type?',
      text: 'Are you sure you want to go back and change the permit type? Your current progress will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: COLORS.success,
      cancelButtonColor: COLORS.danger,
      confirmButtonText: 'Yes, Go Back',
      cancelButtonText: 'Cancel',
      customClass: {
        title: 'swal-title-center',
        htmlContainer: 'swal-text-center'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Redirecting...',
          html: '<p style="text-align: center;">Taking you back to permit type selection...</p>',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: false,
          customClass: {
            title: 'swal-title-center',
            htmlContainer: 'swal-text-center'
          },
          didOpen: () => {
            Swal.showLoading();
          },
          willClose: () => {
            navigate('/user/franchise/type');
          }
        });
      }
    });
  };

  const handleSubmit = async () => {
    if (!existingPermit) {
      showErrorMessage("Please verify your existing permit before submitting.");
      return;
    }

    setIsSubmitting(true);
    
    const backendUrl = "/backend/franchise_permit/franchise_permit.php";
    
    try {
      const formDataToSend = new FormData();
      
      // Add all form data (including files)
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        
        if (value === null || value === undefined) {
          return;
        }
        
        if (value instanceof File) {
          formDataToSend.append(key, value);
        } else if (typeof value === 'boolean') {
          formDataToSend.append(key, value ? '1' : '0');
        } else {
          formDataToSend.append(key, String(value));
        }
      });
      
      formDataToSend.append('permit_type', permitType);
      formDataToSend.append('renewal_type', renewalType);
      formDataToSend.append('original_permit_id', formData.original_permit_id);
      
      // Add checkbox values
      formDataToSend.append('renewal_fee_checked', formData.renewal_fee_checked ? '1' : '0');
      formDataToSend.append('sticker_fee_checked', formData.sticker_fee_checked ? '1' : '0');
      formDataToSend.append('inspection_fee_checked', formData.inspection_fee_checked ? '1' : '0');
      formDataToSend.append('business_tax_fee_checked', formData.business_tax_fee_checked ? '1' : '0');
      
      const response = await fetch(backendUrl, {
        method: "POST",
        body: formDataToSend
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        showErrorMessage("Invalid response from server");
        return;
      }
      
      if (data.success) {
        showSuccessMessage(`Renewal application submitted successfully! Application ID: ${data.data.application_id}`);
        
        setTimeout(() => {
          navigate("/user/permittracker");
        }, 3000);
      } else {
        showErrorMessage(`Error: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error("Submit error:", error);
      showErrorMessage("Failed to submit renewal application. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          applicant_signature: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderInputField = (name, label, type = 'text', options = [], required = false) => {
    const isAutoFilled = autoFilledFields[name];
    
    return (
      <div className="relative">
        <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
          {label} {required && '*'}
        </label>
        
        {type === 'select' ? (
          <select
            name={name}
            value={formData[name] || ''}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg ${
              errors[name] ? 'border-red-500' : 'border-black'
            } ${isAutoFilled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
            required={required}
            disabled={isAutoFilled}
          >
            <option value="">Select {label.replace('*', '').trim()}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name] || ''}
            onChange={handleChange}
            placeholder={label}
            className={`w-full p-3 border rounded-lg ${
              errors[name] ? 'border-red-500' : 'border-black'
            } ${isAutoFilled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
            required={required}
            readOnly={isAutoFilled}
          />
        )}
        
        {isAutoFilled && (
          <div className="absolute top-9 right-0 mt-1 mr-3">
            <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Check className="w-3 h-3 mr-1" />
              Auto-filled
            </div>
          </div>
        )}
        
        {errors[name] && (
          <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
            {errors[name]}
          </p>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Select Permit to Renew</h3>
            
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <div className="space-y-4">
                <div 
                  className="p-6 border-2 border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors duration-200 cursor-pointer" 
                  onClick={() => setRenewalType('MTOP')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="renewal_type"
                      value="MTOP"
                      checked={renewalType === 'MTOP'}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="ml-4">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-6 h-6 text-blue-600" />
                        <h4 className="font-bold text-xl" style={{ color: COLORS.primary }}>MTOP Renewal</h4>
                      </div>
                      <p className="text-sm mt-2" style={{ color: COLORS.secondary }}>
                        Motorized Tricycle Operator's Permit (MTOP) must be renewed annually so your tricycle can legally operate for hire.
                      </p>
                      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                        <p className="text-sm font-semibold text-blue-800 mb-2">Required Documents:</p>
                        <ul className="text-xs space-y-1 text-blue-700">
                          <li>• Old MTOP permit (for renewal) – photocopy</li>
                          <li>• LTO Certificate of Registration (CR) – photocopy</li>
                          <li>• Valid LTO Official Receipt (OR) – photocopy</li>
                          <li>• Barangay Clearance/Certification</li>
                          <li>• Community Tax Certificate (CTC/Cedula)</li>
                          <li>• Valid Driver's License (if applicable)</li>
                          <li>• Inspection report (if required)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="p-6 border-2 border-green-300 rounded-lg bg-green-50 hover:bg-green-100 transition-colors duration-200 cursor-pointer" 
                  onClick={() => setRenewalType('MAYOR')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="renewal_type"
                      value="MAYOR"
                      checked={renewalType === 'MAYOR'}
                      onChange={handleChange}
                      className="w-5 h-5 text-green-600"
                    />
                    <div className="ml-4">
                      <div className="flex items-center gap-3">
                        <Receipt className="w-6 h-6 text-green-600" />
                        <h4 className="font-bold text-xl" style={{ color: COLORS.success }}>Transport Mayor's Permit Renewal</h4>
                      </div>
                      <p className="text-sm mt-2" style={{ color: COLORS.secondary }}>
                        For Mayor's Permit renewal (business/transport category) — this applies if your tricycle operation is registered as a business.
                      </p>
                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-sm font-semibold text-green-800 mb-2">Required Documents:</p>
                        <ul className="text-xs space-y-1 text-green-700">
                          <li>• Official Receipt of Business Tax Payment</li>
                          <li>• Barangay Business Clearance</li>
                          <li>• Previous Mayor's Permit</li>
                          <li>• Old MTOP permit (photocopy)</li>
                          <li>• LTO CR and OR (photocopies)</li>
                          <li>• Barangay Clearance</li>
                          <li>• Community Tax Certificate</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium" style={{ color: COLORS.secondary }}>
                    Selected: <span className="font-bold">{renewalType === 'MTOP' ? 'MTOP Renewal' : 'Transport Mayor\'s Permit Renewal'}</span>
                  </p>
                  <p className="text-xs mt-2 text-gray-600">
                    {renewalType === 'MTOP' 
                      ? 'Caloocan City Tricycle Franchising Board and TTMD handle MTOP renewal, confirmed yearly with LTO.'
                      : 'Submit to City Treasurer\'s Office with completed renewal application.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Verify Existing Permit</h3>
            
            <div className="bg-white rounded-lg shadow p-6 border border-black mb-6">
              <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>
                Check {renewalType === 'MTOP' ? 'MTOP' : 'Mayor\'s'} Permit Status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Existing Permit ID *
                  </label>
                  <input
                    type="text"
                    name="existing_permit_id"
                    value={formData.existing_permit_id || ''}
                    onChange={handleChange}
                    placeholder="Enter your existing permit ID"
                    className={`w-full p-3 border rounded-lg ${
                      errors.existing_permit_id ? 'border-red-500' : 'border-black'
                    }`}
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  />
                  {errors.existing_permit_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.existing_permit_id}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Plate Number *
                  </label>
                  <input
                    type="text"
                    name="existing_plate_number"
                    value={formData.existing_plate_number || ''}
                    onChange={handleChange}
                    placeholder="ABC1234"
                    className={`w-full p-3 border rounded-lg ${
                      errors.existing_plate_number ? 'border-red-500' : 'border-black'
                    }`}
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font, textTransform: 'uppercase' }}
                  />
                  {errors.existing_plate_number && (
                    <p className="text-red-600 text-sm mt-1">{errors.existing_plate_number}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Format: 3 letters followed by 4 digits (e.g., ABC1234)</p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={checkExistingPermit}
                  disabled={isCheckingExisting || !formData.existing_permit_id || !formData.existing_plate_number}
                  style={{ 
                    background: (isCheckingExisting || !formData.existing_permit_id || !formData.existing_plate_number) 
                      ? '#9CA3AF' 
                      : COLORS.primary 
                  }}
                  className="px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
                >
                  {isCheckingExisting ? 'Checking...' : `Verify ${renewalType === 'MTOP' ? 'MTOP' : 'Mayor\'s'} Permit`}
                </button>
              </div>
            </div>
            
            {existingPermit && (
              <div className="bg-white rounded-lg shadow p-6 border border-black">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-lg" style={{ color: COLORS.success }}>
                    Existing Permit Verified
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={resetAutoFilledData}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Clear Data
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 mb-2">Permit Details</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Permit ID:</span> {existingPermit.application_id}</p>
                      <p><span className="font-medium">Type:</span> {existingPermit.permit_subtype || renewalType}</p>
                      <p><span className="font-medium">Status:</span> <span className={`font-semibold ${existingPermit.status === 'EXPIRED' ? 'text-red-600' : 'text-green-600'}`}>{existingPermit.status}</span></p>
                      <p><span className="font-medium">Issue Date:</span> {existingPermit.date_approved}</p>
                      <p><span className="font-medium">Expiry Date:</span> {existingPermit.expiry_date}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700 mb-2">Vehicle Details</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Plate:</span> {existingPermit.plate_number}</p>
                      <p><span className="font-medium">Make/Model:</span> {existingPermit.make_brand} {existingPermit.model}</p>
                      <p><span className="font-medium">Color:</span> {existingPermit.color}</p>
                      <p><span className="font-medium">Operator:</span> {existingPermit.operator_type}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Data Auto-filled</p>
                      <p className="text-xs mt-1 text-yellow-700">
                        Your information has been automatically filled from your existing permit. Fields marked with "Auto-filled" are read-only.
                        You can clear the data if you need to make changes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {formData.original_expiry_date && (
              <div className="mt-4">
                <div className={`p-4 rounded-lg border ${
                  new Date(formData.original_expiry_date) < new Date() 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-start">
                    <Calendar className={`w-5 h-5 mr-2 mt-0.5 ${
                      new Date(formData.original_expiry_date) < new Date() 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        new Date(formData.original_expiry_date) < new Date() 
                          ? 'text-red-700' 
                          : 'text-green-700'
                      }`}>
                        {new Date(formData.original_expiry_date) < new Date() 
                          ? ' PERMIT EXPIRED' 
                          : 'Permit Active'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                        Original expiry date: {formData.original_expiry_date}
                        {new Date(formData.original_expiry_date) < new Date() 
                          ? ' (Expired ' + Math.ceil((new Date() - new Date(formData.original_expiry_date)) / (1000 * 60 * 60 * 24)) + ' days ago)'
                          : ' (Expires in ' + Math.ceil((new Date(formData.original_expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) + ' days)'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Applicant Information</h3>
            
            {existingPermit && (
              <div className="p-4 rounded-lg border mb-4 bg-blue-50 border-blue-200">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">✓ Data Auto-filled from Existing Permit (READ-ONLY)</p>
                    <p className="text-xs mt-1 text-blue-600">
                      Your information has been automatically filled from your existing permit and cannot be modified.
                      Fields marked with "Auto-filled" are read-only.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInputField('first_name', 'First Name ', 'text', [], true)}
              {renderInputField('last_name', 'Last Name ', 'text', [], true)}
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Middle Initial</label>
                <input
                  type="text"
                  name="middle_initial"
                  value={formData.middle_initial || ''}
                  onChange={handleChange}
                  placeholder="M.I."
                  maxLength="1"
                  className={`w-full p-3 border rounded-lg border-black ${
                    autoFilledFields['middle_initial'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  readOnly={autoFilledFields['middle_initial']}
                />
                {autoFilledFields['middle_initial'] && (
                  <div className="absolute top-9 right-0 mt-1 mr-3">
                    <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3 mr-1" />
                      Auto-filled
                    </div>
                  </div>
                )}
              </div>
              
              {renderInputField('home_address', 'Home Address', 'text', [], true)}
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Contact Number *</label>
                <input 
                  type="tel" 
                  name="contact_number" 
                  value={formData.contact_number} 
                  onChange={handleChange} 
                  placeholder="09XXXXXXXXX" 
                  maxLength={11}
                  className={`w-full p-3 border rounded-lg ${errors.contact_number ? 'border-red-500' : 'border-black'} ${
                    autoFilledFields['contact_number'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  readOnly={autoFilledFields['contact_number']}
                />
                {errors.contact_number && (
                  <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.contact_number}</p>
                )}
              </div>
              
              {renderInputField('email', 'Email Address ', 'email', [], true)}
              {renderInputField('citizenship', 'Citizenship ', 'select', NATIONALITIES, true)}
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Date of Birth *</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date || ''}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg ${errors.birth_date ? 'border-red-500' : 'border-black'} ${
                    autoFilledFields['birth_date'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  readOnly={autoFilledFields['birth_date']}
                />
                {errors.birth_date && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.birth_date}</p>}
              </div>
              
              {renderInputField('id_type', 'Valid ID Type *', 'select', ["Driver's License", "Passport", "National ID", "UMID", "Postal ID", "Voter's ID"], true)}
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Valid ID Number *</label>
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number || ''}
                  onChange={handleChange}
                  placeholder="ID Number"
                  className={`w-full p-3 border rounded-lg ${errors.id_number ? 'border-red-500' : 'border-black'} ${
                    autoFilledFields['id_number'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required={true}
                  readOnly={autoFilledFields['id_number']}
                />
              </div>
              
              {renderInputField('operator_type', 'Operator Type', 'select', OPERATOR_TYPES, true)}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Vehicle Information</h3>
            
            {existingPermit && (
              <div className="p-4 rounded-lg border mb-4 bg-blue-50 border-blue-200">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">✓ Vehicle Data Auto-filled from Existing Permit (READ-ONLY)</p>
                    <p className="text-xs mt-1 text-blue-600">
                      Vehicle information has been automatically filled from your existing permit and cannot be modified.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInputField('make_brand', 'Make / Brand', 'text', [], true)}
              {renderInputField('model', 'Model', 'text', [], true)}
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Engine Number *</label>
                <input
                  type="text"
                  name="engine_number"
                  value={formData.engine_number || ''}
                  onChange={handleChange}
                  placeholder="Engine Number must be between 8-12 characters"
                  maxLength="12"
                  className={`w-full p-3 border rounded-lg ${errors.engine_number ? 'border-red-500' : 'border-black'} ${
                    autoFilledFields['engine_number'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font, textTransform: 'uppercase' }}
                  required={true}
                  readOnly={autoFilledFields['engine_number']}
                />
                <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>Engine number must be between 8-12 characters</p>
              </div>
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Chassis Number *</label>
                <input
                  type="text"
                  name="chassis_number"
                  value={formData.chassis_number || ''}
                  onChange={handleChange}
                  placeholder="Chassis Number must be exactly 17 characters"
                  maxLength="17"
                  className={`w-full p-3 border rounded-lg ${errors.chassis_number ? 'border-red-500' : 'border-black'} ${
                    autoFilledFields['chassis_number'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font, textTransform: 'uppercase' }}
                  required={true}
                  readOnly={autoFilledFields['chassis_number']}
                />
                <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>Chassis number must be exactly 17 characters</p>
              </div>
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Plate Number *</label>
                <input
                  type="text"
                  name="plate_number"
                  value={formData.plate_number || ''}
                  onChange={handleChange}
                  placeholder="ABC1234"
                  maxLength="7"
                  className={`w-full p-3 border rounded-lg ${errors.plate_number ? 'border-red-500' : 'border-black'} ${
                    autoFilledFields['plate_number'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font, textTransform: 'uppercase' }}
                  required={true}
                  readOnly={autoFilledFields['plate_number']}
                />
                <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>Plate number format: 3 letters, 4 digits (e.g., ABC1234)</p>
              </div>
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Year Acquired *</label>
                <input
                  type="text"
                  name="year_acquired"
                  value={formData.year_acquired || ''}
                  onChange={handleChange}
                  placeholder="YYYY"
                  maxLength="4"
                  className={`w-full p-3 border rounded-lg ${errors.year_acquired ? 'border-red-500' : 'border-black'} ${
                    autoFilledFields['year_acquired'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required={true}
                  readOnly={autoFilledFields['year_acquired']}
                />
                <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>Year must be a valid 4-digit year (1900-present)</p>
              </div>
              
              {renderInputField('color', 'Color', 'text', [], true)}
              {renderInputField('vehicle_type', 'Vehicle Type', 'select', ['Tricycle', 'Motorcycle', 'Pedicabs', 'E-Tricycle'], true)}
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>LTO OR Number *</label>
                <input
                  type="text"
                  name="lto_or_number"
                  value={formData.lto_or_number || ''}
                  onChange={handleChange}
                  placeholder="OR number must be 7-8 digits"
                  maxLength="8"
                  className={`w-full p-3 border rounded-lg ${errors.lto_or_number ? 'border-red-500' : 'border-black'} ${
                    autoFilledFields['lto_or_number'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required={true}
                  readOnly={autoFilledFields['lto_or_number']}
                />
                <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>OR number must be 7-8 digits</p>
              </div>
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>LTO CR Number *</label>
                <input
                  type="text"
                  name="lto_cr_number"
                  value={formData.lto_cr_number || ''}
                  onChange={handleChange}
                  placeholder="CR number must be 7-8 digits"
                  maxLength="8"
                  className={`w-full p-3 border rounded-lg ${errors.lto_cr_number ? 'border-red-500' : 'border-black'} ${
                    autoFilledFields['lto_cr_number'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  required={true}
                  readOnly={autoFilledFields['lto_cr_number']}
                />
                <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>CR number must be 7-8 digits</p>
              </div>
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>LTO Expiration Date *</label>
                <input
                  type="date"
                  name="lto_expiration_date"
                  value={formData.lto_expiration_date || ''}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg ${errors.lto_expiration_date ? 'border-red-500' : 'border-black'} ${
                    autoFilledFields['lto_expiration_date'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  readOnly={autoFilledFields['lto_expiration_date']}
                />
                <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>LTO Expiration Date must be 2027 or later</p>
                {errors.lto_expiration_date && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.lto_expiration_date}</p>}
              </div>
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>MV File Number</label>
                <input
                  type="text"
                  name="mv_file_number"
                  value={formData.mv_file_number || ''}
                  onChange={handleChange}
                  placeholder="MV File Number"
                  className={`w-full p-3 border border-black rounded-lg ${
                    autoFilledFields['mv_file_number'] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  readOnly={autoFilledFields['mv_file_number']}
                />
              </div>
              
              {renderInputField('district', 'District', 'text', [], true)}
              {renderInputField('route_zone', 'Route / Zone', 'text', [], true)}
              {renderInputField('barangay_of_operation', 'Barangay of Operation', 'text', [], true)}
              {renderInputField('toda_name', 'TODA Name', 'text', [], false)}
              {renderInputField('company_name', 'Company/Organization Name', 'text', [], false)}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Required Documents for Renewal</h3>
            <p className="text-sm mb-4 text-gray-600" style={{ fontFamily: COLORS.font }}>
              <span className="text-red-600 font-bold">* All required documents must be uploaded.</span> Documents marked with * are required for {renewalType === 'MTOP' ? 'MTOP' : 'Mayor\'s Permit'} renewal.
            </p>
            
            {errors.min_documents && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-600 font-medium" style={{ fontFamily: COLORS.font }}>
                  {errors.min_documents}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Mayor's Permit specific documents - AT THE TOP */}
              {renewalType === 'MAYOR' && (
                <div className="flex flex-col p-4 border border-gray-300 rounded-lg">
                  <div className="mb-3">
                    <label className="flex items-center font-medium">
                      <span className="text-red-600" style={{ fontFamily: COLORS.font }}>
                        Barangay Business Clearance *
                      </span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">Business clearance from your barangay</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block mb-2 text-sm font-medium" style={{ color: COLORS.secondary }}>
                        Barangay Clearance ID *
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          name="barangay_clearance_id" 
                          value={formData.barangay_clearance_id || ''} 
                          onChange={handleChange} 
                          placeholder="Enter Barangay Clearance ID" 
                          className="flex-1 p-3 border border-black rounded-lg" 
                          style={{ fontFamily: COLORS.font }}
                          required
                        />
                        <button
                          type="button"
                          onClick={verifyBarangayClearance}
                          disabled={isVerifyingBarangay || !formData.barangay_clearance_id}
                          className="px-4 py-3 rounded-lg font-semibold text-white transition-colors duration-300 flex items-center gap-2"
                          style={{ 
                            background: isVerifyingBarangay || !formData.barangay_clearance_id ? '#9CA3AF' : COLORS.primary,
                            cursor: isVerifyingBarangay || !formData.barangay_clearance_id ? 'not-allowed' : 'pointer'
                          }}
                          onMouseEnter={e => {
                            if (!isVerifyingBarangay && formData.barangay_clearance_id) {
                              e.currentTarget.style.background = COLORS.accent;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isVerifyingBarangay && formData.barangay_clearance_id) {
                              e.currentTarget.style.background = COLORS.primary;
                            }
                          }}
                        >
                          {isVerifyingBarangay ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              Verify
                            </>
                          )}
                        </button>
                      </div>
                      {barangayClearanceData && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700" style={{ fontFamily: COLORS.font }}>
                            Verified - Permit ID: {barangayClearanceData.permit_id}
                          </span>
                        </div>
                      )}
                      {errors.barangay_clearance_id && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.barangay_clearance_id}</p>}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium" style={{ color: COLORS.secondary }}>
                        Upload Barangay Clearance Document *
                      </label>
                      <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                        <Upload className="w-5 h-5 text-gray-500" />
                        <input 
                          type="file" 
                          name="barangay_business_clearance" 
                          onChange={handleChange} 
                          accept=".jpg,.jpeg,.png,.pdf" 
                          className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          style={{ fontFamily: COLORS.font }}
                          required
                        />
                      </div>
                      {errors.barangay_business_clearance && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.barangay_business_clearance}</p>}
                      {formData.barangay_business_clearance && (
                        <p className="text-green-600 text-xs mt-1 flex items-center">
                          <Check className="w-3 h-3 mr-1" />
                          Uploaded: {formData.barangay_business_clearance.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Common required documents */}
              {[
                { name: 'old_permit_copy', label: 'Old Permit Copy *', description: 'Photocopy of your existing permit for renewal' },
                { name: 'lto_cr_copy', label: 'LTO CR Copy *', description: 'Photocopy of LTO Certificate of Registration' },
                { name: 'lto_or_copy', label: 'LTO OR Copy *', description: 'Photocopy of valid LTO Official Receipt' },
                { name: 'community_tax_certificate', label: 'Community Tax Certificate *', description: 'CTC/Cedula' },
              ].map((doc) => (
                <div key={doc.name} className="flex flex-col p-4 border border-gray-300 rounded-lg">
                  <div className="mb-3">
                    <label className="flex items-center font-medium">
                      <span className="text-red-600" style={{ fontFamily: COLORS.font }}>
                        {doc.label}
                      </span>
                    </label>
                    {doc.description && <p className="text-sm text-gray-600 mt-1">{doc.description}</p>}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                      <Upload className="w-5 h-5 text-gray-500" />
                      <input 
                        type="file" 
                        name={doc.name} 
                        onChange={handleChange} 
                        accept=".jpg,.jpeg,.png,.pdf" 
                        className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        style={{ fontFamily: COLORS.font }}
                        required
                      />
                    </div>
                    {errors[doc.name] && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors[doc.name]}</p>}
                    {formData[doc.name] && (
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Uploaded: {formData[doc.name].name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Driver's License - Required */}
              <div className="flex flex-col p-4 border border-gray-300 rounded-lg">
                <div className="mb-3">
                  <label className="flex items-center font-medium">
                    <span className="text-red-600" style={{ fontFamily: COLORS.font }}>
                      Driver's License *
                    </span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">Valid driver's license of the operator</p>
                </div>
                <div>
                  <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                    <Upload className="w-5 h-5 text-gray-500" />
                    <input 
                      type="file" 
                      name="drivers_license" 
                      onChange={handleChange} 
                      accept=".jpg,.jpeg,.png,.pdf" 
                      className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      style={{ fontFamily: COLORS.font }}
                      required
                    />
                  </div>
                  {errors.drivers_license && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.drivers_license}</p>}
                  {formData.drivers_license && (
                    <div className="mt-2 space-y-2">
                      <p className="text-green-600 text-xs flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Uploaded: {formData.drivers_license.name}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => verifyDocument('drivers_license', formData.drivers_license)}
                          disabled={documentVerification.drivers_license?.isVerifying}
                          className={`flex items-center gap-1 px-3 py-1 text-sm rounded border ${
                            documentVerification.drivers_license?.isVerified 
                              ? 'bg-green-50 border-green-500 text-green-700' 
                              : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                          }`}
                          style={{ fontFamily: COLORS.font }}
                        >
                          {documentVerification.drivers_license?.isVerifying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Verifying...
                            </>
                          ) : documentVerification.drivers_license?.isVerified ? (
                            <>
                              <Check className="w-4 h-4" />
                              Verified
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              Verify with AI
                            </>
                          )}
                        </button>
                        
                        {documentVerification.drivers_license?.isVerifying && (
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${documentVerification.drivers_license?.progress || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {Math.round(documentVerification.drivers_license?.progress || 0)}% complete
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Optional documents */}
              {[
                { name: 'inspection_report', label: 'Inspection Report', description: 'Roadworthiness inspection report (if required)', optional: true },
              ].map((doc) => (
                <div key={doc.name} className="flex flex-col p-4 border border-gray-300 rounded-lg">
                  <div className="mb-3">
                    <label className="flex items-center font-medium">
                      <span style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                        {doc.label}
                      </span>
                      {doc.optional && <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Optional</span>}
                    </label>
                    {doc.description && <p className="text-sm text-gray-600 mt-1">{doc.description}</p>}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                      <Upload className="w-5 h-5 text-gray-500" />
                      <input 
                        type="file" 
                        name={doc.name} 
                        onChange={handleChange} 
                        accept=".jpg,.jpeg,.png,.pdf" 
                        className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        style={{ fontFamily: COLORS.font }}
                      />
                    </div>
                    {formData[doc.name] && (
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Uploaded: {formData[doc.name].name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 6:
        const fees = renewalType === 'MTOP' ? RENEWAL_FEES.mtop : RENEWAL_FEES.mayor;
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>
              Payment Information
            </h3>
            <p className="text-sm mb-4 text-gray-600" style={{ fontFamily: COLORS.font }}>
              <span className="text-red-600 font-bold">* Please select your payment method and choose which fees to pay.</span>
            </p>
            
            {errors.payment && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-600 font-medium" style={{ fontFamily: COLORS.font }}>
                  {errors.payment}
                </p>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow p-6 border border-black mb-6">
              <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>
                Select Payment Method
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                    formData.payment_method === 'upload' ? 
                    'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                  }`} 
                  onClick={() => handlePaymentMethodChange('upload')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                      formData.payment_method === 'upload' ? 
                      'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                      {formData.payment_method === 'upload' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="font-semibold">Upload Receipts</h5>
                      <p className="text-sm text-gray-600">
                        Upload payment receipts from offline payment
                      </p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                    formData.payment_method === 'online' ? 
                    'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`} 
                  onClick={() => handlePaymentMethodChange('online')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                      formData.payment_method === 'online' ? 
                      'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {formData.payment_method === 'online' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="font-semibold">Pay Online Now</h5>
                      <p className="text-sm text-gray-600">
                        Pay securely via Revenue Treasury portal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>
                Select Fees to Pay
              </h4>
              <div className="space-y-4">
                {[
                  { 
                    name: 'renewal_fee', 
                    label: `Renewal Fee`, 
                    amount: fees.renewal_fee, 
                    checked: formData.renewal_fee_checked 
                  },
                  { 
                    name: 'sticker_fee', 
                    label: 'Sticker Fee', 
                    amount: fees.sticker_fee, 
                    checked: formData.sticker_fee_checked 
                  },
                  { 
                    name: 'inspection_fee', 
                    label: 'Inspection Fee', 
                    amount: fees.inspection_fee, 
                    checked: formData.inspection_fee_checked 
                  }
                ].map((fee) => (
                  <div key={fee.name} className="flex flex-col p-4 border border-gray-300 rounded-lg">
                    <label className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          name={`${fee.name}_checked`} 
                          checked={fee.checked} 
                          onChange={handleChange} 
                          className="w-5 h-5 mr-2" 
                          style={{ color: COLORS.primary }} 
                        />
                        <span className="font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                          {fee.label}
                        </span>
                      </div>
                      <span className="font-bold" style={{ color: COLORS.primary }}>
                        ₱{fee.amount.toFixed(2)}
                      </span>
                    </label>
                    
                    {fee.checked && formData.payment_method === 'online' && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-700">
                          This fee will be included in your online payment. You will be redirected to the Revenue Treasury portal to complete payment.
                        </p>
                      </div>
                    )}
                    
                    {fee.checked && formData.payment_method === 'upload' && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                              OR Number
                            </label>
                            <input 
                              type="text" 
                              name={`${fee.name}_or`} 
                              value={formData[`${fee.name}_or`] || ''} 
                              onChange={handleChange} 
                              placeholder="OR Number" 
                              className="w-full p-2 border border-black rounded" 
                              style={{ fontFamily: COLORS.font }}
                              required={fee.checked}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                              Receipt *
                            </label>
                            <div className="flex items-center gap-3 p-2 border border-black rounded w-full bg-white">
                              <Upload className="w-4 h-4 text-gray-500" />
                              <input 
                                type="file" 
                                name={`${fee.name}_receipt`} 
                                onChange={handleChange} 
                                accept=".jpg,.jpeg,.png,.pdf" 
                                className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                style={{ fontFamily: COLORS.font }}
                                required={fee.checked}
                              />
                            </div>
                            {formData[`${fee.name}_receipt`] && (
                              <p className="text-green-600 text-xs mt-1 flex items-center">
                                <Check className="w-3 h-3 mr-1" />
                                Uploaded: {formData[`${fee.name}_receipt`].name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {errors[`${fee.name}_receipt`] && (
                      <p className="text-red-600 text-sm mt-2">
                        {errors[`${fee.name}_receipt`]}
                      </p>
                    )}
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold" style={{ color: COLORS.secondary }}>
                        Total Amount:
                      </p>
                      <p className="text-sm text-gray-600">
                        Selected {formData.payment_method === 'online' ? 'for online payment' : 'for receipt upload'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                        ₱{(
                          (formData.renewal_fee_checked ? fees.renewal_fee : 0) + 
                          (formData.sticker_fee_checked ? fees.sticker_fee : 0) + 
                          (formData.inspection_fee_checked ? fees.inspection_fee : 0)
                        ).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {[
                          formData.renewal_fee_checked, 
                          formData.sticker_fee_checked, 
                          formData.inspection_fee_checked
                        ].filter(Boolean).length} fee(s) selected
                      </p>
                    </div>
                  </div>
                </div>
                
                {paymentStatus.isPaid && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <Check className="w-6 h-6 text-green-600 mr-3" />
                      <div>
                        <p className="font-semibold text-green-700">
                          ✓ Payment Completed
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Payment Method: {paymentStatus.paymentMethod === 'online' ? 'Online Payment' : 'Receipt Upload'}
                        </p>
                        {paymentStatus.paymentDate && (
                          <p className="text-xs text-green-600 mt-1">
                            Paid on: {paymentStatus.paymentDate}
                          </p>
                        )}
                        {paymentStatus.transactionId && (
                          <p className="text-xs text-green-600 mt-1">
                            Transaction ID: {paymentStatus.transactionId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.payment_method === 'online' && (
                  <div className="mt-6">
                    <button 
                      type="button" 
                      onClick={handleOnlinePayment} 
                      disabled={!formData.renewal_fee_checked && !formData.sticker_fee_checked && !formData.inspection_fee_checked} 
                      style={{ 
                        background: (!formData.renewal_fee_checked && !formData.sticker_fee_checked && !formData.inspection_fee_checked) ? 
                        '#9CA3AF' : COLORS.primary 
                      }} 
                      className="w-full py-3 rounded-lg font-semibold text-white transition-colors duration-300 flex items-center justify-center gap-3"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Pay Now via Revenue Treasury (Opens in New Tab)
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      You will be redirected to the Revenue Treasury secure payment portal in a new tab
                    </p>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    Payment Instructions:
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Select at least one fee to proceed</li>
                    <li>• For online payment: Click "Pay Now" to complete payment in a new tab</li>
                    <li>• For receipt upload: Upload clear photos/scans of official receipts</li>
                    <li>• All fees are non-refundable once paid</li>
                    <li>• Keep your payment references for verification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Declaration and Signature</h3>
            
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <div className="mb-8 p-6 border-2 border-red-200 bg-red-50 rounded-lg">
                <h4 className="font-bold text-lg mb-4 text-red-700">RENEWAL DECLARATION</h4>
                <div className="space-y-3 text-sm" style={{ fontFamily: COLORS.font }}>
                  <p>I, <span className="font-bold">{getFullName() || '[Full Name]'}</span>, hereby solemnly declare that:</p>
                  
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>All information provided in this renewal application is true, complete, and correct;</li>
                    <li>I am the registered owner/authorized representative of the tricycle unit described in this renewal application;</li>
                    <li>The vehicle remains roadworthy and complies with all safety and emission standards;</li>
                    <li>I have secured all necessary clearances, permits, and insurance coverage for renewal;</li>
                    <li>I shall continue to abide by all traffic rules, regulations, and ordinances of Caloocan City;</li>
                    <li>I understand that any false statement or misrepresentation shall be grounds for:</li>
                    <ul className="list-disc ml-8 mt-2 space-y-1">
                      <li>Immediate cancellation of the permit renewal</li>
                      <li>Administrative and criminal liability</li>
                      <li>Blacklisting from future applications</li>
                      <li>Fines and penalties as per existing laws</li>
                    </ul>
                    <li>I agree to the processing of my personal data for renewal purposes in accordance with the Data Privacy Act of 2012;</li>
                    <li>I consent to inspections and monitoring by authorized personnel.</li>
                  </ol>
                  
                  <p className="mt-4 font-semibold">Republic Act No. 4136 - Land Transportation and Traffic Code</p>
                  <p className="text-xs italic">"Any person who makes any false statement in any document required by this Act shall, upon conviction, be punished by a fine of not less than ₱5,000 nor more than ₱20,000 or imprisonment of not less than 6 months nor more than 1 year, or both."</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {errors.applicant_signature && (
                          <p className="text-red-600 text-sm mt-1">{errors.applicant_signature}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Date of Submission <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_submitted"
                    value={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-black rounded-lg bg-gray-100 cursor-not-allowed"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Date is automatically set to today</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Barangay Captain/Authorized Signatory (For office use only)
                  </label>
                  <input
                    type="text"
                    name="barangay_captain_signature"
                    value={formData.barangay_captain_signature}
                    onChange={handleChange}
                    placeholder="Will be filled by Barangay Office"
                    className="w-full p-3 border border-gray-300 bg-gray-50 rounded-lg"
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                    disabled
                  />
                </div>

              </div>

              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="final-declaration"
                    checked={agreeDeclaration}
                    onChange={(e) => setAgreeDeclaration(e.target.checked)}
                    className={`w-5 h-5 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500 ${errors.declaration ? 'border-red-500' : ''}`}
                  />
                  <label htmlFor="final-declaration" className="ml-3">
                    <span className="font-bold text-red-700">FINAL DECLARATION AND CONSENT *</span>
                    <p className="text-sm mt-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                      I, <span className="font-semibold">{getFullName() || '[Full Name]'}</span>, have read, understood, and agree to all terms and conditions stated in this renewal declaration. I certify that all information provided is accurate and I accept full responsibility for its veracity.
                    </p>
                    {errors.declaration && (
                      <p className="text-red-600 text-sm mt-1">{errors.declaration}</p>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Review Your Renewal Application</h3>
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg mb-4">
                  <h5 className="font-bold text-lg mb-2" style={{ color: COLORS.primary }}>
                    {renewalType === 'MTOP' ? 'MTOP Renewal Application' : 'Mayor\'s Permit Renewal Application'}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <p><span className="font-medium">Original Permit ID:</span> {formData.original_permit_id}</p>
                    <p><span className="font-medium">Issue Date:</span> {formData.original_issue_date}</p>
                    <p><span className="font-medium">Expiry Date:</span> {formData.original_expiry_date}</p>
                    <p><span className="font-medium">Status:</span> <span className={`font-semibold ${formData.permit_status === 'EXPIRED' ? 'text-red-600' : 'text-green-600'}`}>{formData.permit_status}</span></p>
                  </div>
                </div>
                
                {existingPermit && (
                  <div className="p-4 rounded-lg border mb-4 bg-blue-50 border-blue-200">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Check className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700"> Data Auto-filled from Existing Permit</p>
                        <p className="text-xs mt-1 text-blue-600">
                          Your application has been pre-filled with data from your existing permit
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                    Applicant Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Full Name:</span>
                      <p className="font-semibold text-gray-900 mt-1">{getFullName()}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Contact Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.contact_number}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                      <span className="font-medium text-gray-600">Home Address:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.home_address}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.email}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Citizenship:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.citizenship}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Birth Date:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.birth_date}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">ID Type:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.id_type}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">ID Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.id_number}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Operator Type:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.operator_type}</p>
                    </div>
                    {formData.company_name && (
                      <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                        <span className="font-medium text-gray-600">Company Name:</span>
                        <p className="font-semibold text-gray-900 mt-1">{formData.company_name}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                    Vehicle Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Make/Brand:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.make_brand}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Model:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.model}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Plate Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.plate_number}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Engine Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.engine_number}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Chassis Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.chassis_number}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Year Acquired:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.year_acquired}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Color:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.color}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Vehicle Type:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.vehicle_type}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">LTO OR Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.lto_or_number}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">LTO CR Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.lto_cr_number}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">LTO Expiration Date:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.lto_expiration_date}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">MV File Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.mv_file_number || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">District:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.district}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                    Operation Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                      <span className="font-medium text-gray-600">Route/Zone:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.route_zone}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Barangay of Operation:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.barangay_of_operation}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">TODA Name:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.toda_name}</p>
                    </div>
                    {renewalType === 'MAYOR' && formData.mayors_permit_id && (
                      <>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-600">Mayor's Permit ID:</span>
                          <p className="font-semibold text-gray-900 mt-1">{formData.mayors_permit_id}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-600">Barangay Clearance ID:</span>
                          <p className="font-semibold text-gray-900 mt-1">{formData.barangay_clearance_id || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                    Uploaded Documents
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.old_permit_copy && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-700">Old Permit Copy</p>
                              <p className="text-xs text-gray-500">{formData.old_permit_copy.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPreview({ url: URL.createObjectURL(formData.old_permit_copy), type: formData.old_permit_copy.type })}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    )}
                    {formData.lto_cr_copy && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-700">LTO CR Copy</p>
                              <p className="text-xs text-gray-500">{formData.lto_cr_copy.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPreview({ url: URL.createObjectURL(formData.lto_cr_copy), type: formData.lto_cr_copy.type })}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    )}
                    {formData.lto_or_copy && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-700">LTO OR Copy</p>
                              <p className="text-xs text-gray-500">{formData.lto_or_copy.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPreview({ url: URL.createObjectURL(formData.lto_or_copy), type: formData.lto_or_copy.type })}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    )}
                    {formData.community_tax_certificate && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-700">Community Tax Certificate</p>
                              <p className="text-xs text-gray-500">{formData.community_tax_certificate.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPreview({ url: URL.createObjectURL(formData.community_tax_certificate), type: formData.community_tax_certificate.type })}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    )}
                    {formData.drivers_license && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-700">Driver's License</p>
                              <p className="text-xs text-gray-500">{formData.drivers_license.name}</p>
                              {documentVerification.drivers_license.isVerified && (
                                <span className="inline-flex items-center text-xs text-green-600 mt-1">
                                  <Check className="w-3 h-3 mr-1" />
                                  AI Verified
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPreview({ url: URL.createObjectURL(formData.drivers_license), type: formData.drivers_license.type })}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    )}
                    {formData.inspection_report && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-700">Inspection Report</p>
                              <p className="text-xs text-gray-500">{formData.inspection_report.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPreview({ url: URL.createObjectURL(formData.inspection_report), type: formData.inspection_report.type })}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    )}
                    {renewalType === 'MAYOR' && formData.barangay_business_clearance && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-700">Barangay Business Clearance</p>
                              <p className="text-xs text-gray-500">{formData.barangay_business_clearance.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPreview({ url: URL.createObjectURL(formData.barangay_business_clearance), type: formData.barangay_business_clearance.type })}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {formData.payment_method === 'upload' && (
                  <div>
                    <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                      Payment Receipts
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.renewal_fee_checked && formData.renewal_fee_receipt && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Receipt className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-medium text-gray-700">Renewal Fee Receipt</p>
                                <p className="text-xs text-gray-500">OR: {formData.renewal_fee_or}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowPreview({ url: URL.createObjectURL(formData.renewal_fee_receipt), type: formData.renewal_fee_receipt.type })}
                              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                        </div>
                      )}
                      {formData.sticker_fee_checked && formData.sticker_fee_receipt && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Receipt className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-medium text-gray-700">Sticker Fee Receipt</p>
                                <p className="text-xs text-gray-500">OR: {formData.sticker_fee_or}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowPreview({ url: URL.createObjectURL(formData.sticker_fee_receipt), type: formData.sticker_fee_receipt.type })}
                              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                        </div>
                      )}
                      {formData.inspection_fee_checked && formData.inspection_fee_receipt && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Receipt className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-medium text-gray-700">Inspection Fee Receipt</p>
                                <p className="text-xs text-gray-500">OR: {formData.inspection_fee_or}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowPreview({ url: URL.createObjectURL(formData.inspection_fee_receipt), type: formData.inspection_fee_receipt.type })}
                              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                    Payment Summary
                  </h5>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-2">Payment Method: <span className={`font-bold ${formData.payment_method === 'online' ? 'text-blue-600' : 'text-green-600'}`}>{formData.payment_method === 'online' ? 'Online Payment' : 'Receipt Upload'}</span></p>
                    <div className="space-y-2 mb-3">
                      {formData.renewal_fee_checked && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Renewal Fee:</span>
                          <span className="font-semibold">₱{(renewalType === 'MTOP' ? RENEWAL_FEES.mtop.renewal_fee : RENEWAL_FEES.mayor.renewal_fee).toFixed(2)}</span>
                        </div>
                      )}
                      {formData.sticker_fee_checked && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Sticker Fee:</span>
                          <span className="font-semibold">₱{(renewalType === 'MTOP' ? RENEWAL_FEES.mtop.sticker_fee : RENEWAL_FEES.mayor.sticker_fee).toFixed(2)}</span>
                        </div>
                      )}
                      {formData.inspection_fee_checked && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Inspection Fee:</span>
                          <span className="font-semibold">₱{(renewalType === 'MTOP' ? RENEWAL_FEES.mtop.inspection_fee : RENEWAL_FEES.mayor.inspection_fee).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <p className="font-medium">Total Amount: <span className="text-2xl font-bold" style={{ color: COLORS.primary }}>₱{(
                        (formData.renewal_fee_checked ? (renewalType === 'MTOP' ? RENEWAL_FEES.mtop.renewal_fee : RENEWAL_FEES.mayor.renewal_fee) : 0) + 
                        (formData.sticker_fee_checked ? (renewalType === 'MTOP' ? RENEWAL_FEES.mtop.sticker_fee : RENEWAL_FEES.mayor.sticker_fee) : 0) + 
                        (formData.inspection_fee_checked ? (renewalType === 'MTOP' ? RENEWAL_FEES.mtop.inspection_fee : RENEWAL_FEES.mayor.inspection_fee) : 0)
                      ).toFixed(2)}</span></p>
                    </div>
                  </div>
                </div>

                {formData.applicant_signature && (
                  <div>
                    <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                      Declaration & Signature
                    </h5>
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div>
                        <span className="font-medium text-gray-600">Signature:</span>
                        <div className="mt-2 border border-gray-300 rounded-lg p-2 bg-white">
                          <img src={formData.applicant_signature} alt="Signature" className="h-24 object-contain" />
                        </div>
                      </div>
                      {formData.date_submitted && (
                        <div>
                          <span className="font-medium text-gray-600">Date Submitted:</span>
                          <p className="font-semibold text-gray-900 mt-1">{formData.date_submitted}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(formData.remarks || formData.notes) && (
                  <div>
                    <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                      Additional Information
                    </h5>
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      {formData.remarks && (
                        <div>
                          <span className="font-medium text-gray-600">Remarks:</span>
                          <p className="text-gray-900 mt-1">{formData.remarks}</p>
                        </div>
                      )}
                      {formData.notes && (
                        <div>
                          <span className="font-medium text-gray-600">Notes:</span>
                          <p className="text-gray-900 mt-1">{formData.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary }}>PERMIT RENEWAL APPLICATION</h1>
          <p className="mt-2" style={{ color: COLORS.secondary }}>
            Renew your {renewalType === 'MTOP' ? 'Motorized Tricycle Operator\'s Permit (MTOP)' : 'Transport Mayor\'s Permit'}.
          </p>
        </div>
        <button
          onClick={handleBackConfirmation}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
          onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
          style={{ background: COLORS.success }}
          className="px-4 py-2 rounded-lg font-medium text-white hover:bg-[#FDA811] transition-colors duration-300"
        >
          Change Type
        </button>
      </div>

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
              style={{ 
                background: !isStepValid(currentStep) ? '#9CA3AF' : COLORS.success 
              }}
              onMouseEnter={e => {
                if (isStepValid(currentStep)) {
                  e.currentTarget.style.background = COLORS.accent;
                }
              }}
              onMouseLeave={e => {
                if (isStepValid(currentStep)) {
                  e.currentTarget.style.background = COLORS.success;
                }
              }}
              className={`px-6 py-3 rounded-lg font-semibold text-white ${
                !isStepValid(currentStep) ? 'cursor-not-allowed' : 'transition-colors duration-300'
              }`}
            >
              {currentStep === steps.length - 1 ? 'Review Application' : 'Next'}
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const result = await Swal.fire({
                  title: 'Confirm Renewal Submission',
                  html: `
                    <div style="text-align: left;">
                      <p style="margin-bottom: 15px;">You are about to submit your ${renewalType === 'MTOP' ? 'MTOP' : 'Mayor\'s Permit'} renewal application.</p>
                      ${existingPermit ? `
                        <div style="background-color: #EFF6FF; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #BFDBFE;">
                          <p style="margin: 0; font-weight: 600; color: #1E40AF; margin-bottom: 8px;">✓ Existing Permit Verified</p>
                          <p style="margin: 0; font-size: 0.875rem;"><strong>Permit ID:</strong> ${existingPermit.application_id}</p>
                          <p style="margin: 0; font-size: 0.875rem;"><strong>Status:</strong> ${existingPermit.status}</p>
                          <p style="margin: 0; font-size: 0.875rem;"><strong>Expiry:</strong> ${existingPermit.expiry_date}</p>
                        </div>
                      ` : ''}
                      <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="margin: 0; font-weight: 600; margin-bottom: 8px;">Renewal Declaration:</p>
                        <p style="margin: 0; font-size: 0.875rem;">I hereby declare that all information provided is true and correct to the best of my knowledge. I understand that any false information may result in the rejection of my renewal application.</p>
                      </div>
                      <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #3B82F6;">
                        <div style="display: flex; align-items: start;">
                          <input type="checkbox" id="swal-confirm-checkbox" style="margin-top: 3px; margin-right: 10px; width: 18px; height: 18px; cursor: pointer;" />
                          <label for="swal-confirm-checkbox" style="cursor: pointer; font-weight: 600; color: #1E40AF; margin: 0;">
                            I confirm that I have reviewed all information and documents, and I am ready to submit this renewal application.
                          </label>
                        </div>
                      </div>
                      <p style="font-size: 0.875rem; color: #6B7280; margin: 0;">Please check the box above to proceed with submission.</p>
                    </div>
                  `,
                  icon: 'question',
                  showCancelButton: true,
                  confirmButtonText: 'Confirm & Submit',
                  cancelButtonText: 'Cancel',
                  confirmButtonColor: COLORS.success,
                  cancelButtonColor: COLORS.danger,
                  reverseButtons: true,
                  preConfirm: () => {
                    const checkbox = document.getElementById('swal-confirm-checkbox');
                    if (!checkbox.checked) {
                      Swal.showValidationMessage('You must confirm that you have reviewed all information before submitting');
                      return false;
                    }
                    return true;
                  }
                });

                if (result.isConfirmed) {
                  handleSubmit();
                }
              }}
              disabled={isSubmitting || !existingPermit}
              onMouseEnter={e => {
                if (!isSubmitting && existingPermit) {
                  e.currentTarget.style.background = COLORS.accent;
                }
              }}
              onMouseLeave={e => {
                if (!isSubmitting && existingPermit) {
                  e.currentTarget.style.background = COLORS.success;
                }
              }}
              style={{ 
                background: (isSubmitting || !existingPermit) ? '#9CA3AF' : COLORS.success 
              }}
              className={`px-6 py-3 rounded-lg font-semibold text-white ${
                (isSubmitting || !existingPermit) ? 'cursor-not-allowed' : 'transition-colors duration-300'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm & Submit Renewal'}
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
    </div>
  );
}