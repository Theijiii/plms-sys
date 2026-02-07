import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

// Helper function to calculate age
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

export default function BarangayNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const permitType = location.state?.permitType || 'NEW';
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [showPreview, setShowPreview] = useState({});
  
  const [verificationStatus, setVerificationStatus] = useState({
    isVerifying: false,
    isVerified: false,
    verificationResults: null,
    verificationError: null,
    progress: 0
  });
  
  // Initialize form data
  const [formData, setFormData] = useState({
    // Permit Information
    permit_type: permitType,
    application_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    
    // Applicant Information
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    mobile_number: '',
    email: '',
    birthdate: '',
    gender: '',
    civil_status: '',
    nationality: '',
    
    // Address Information
    house_no: '',
    street: '',
    barangay: '',
    city_municipality: 'Caloocan City',
    province: 'Metro Manila',
    zip_code: '',
    
    // Clearance Details
    purpose: '',
    duration: '',
    id_type: '',
    id_number: '',
    
    // Additional fields
    clearance_fee: 0.00,
    receipt_number: '',
    user_id: null,
    applicant_signature: '',
    
    // File attachments
    valid_id_file: null,
    proof_of_residence_file: null,
    receipt_file: null,
    signature_file: null,
    photo_fingerprint_file: null,
    
    attachments: '',
  });

  const steps = [
    { id: 1, title: 'Applicant Information', description: 'Personal details' },
    { id: 2, title: 'Address Information', description: 'Where you live' },
    { id: 3, title: 'Clearance Details', description: 'Purpose, ID, Duration' },
    { id: 4, title: 'Uploads', description: 'Required documents' },
    { id: 5, title: 'Review', description: 'Review your application' }
  ];

  const handleChange = async (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file || null,
        ...(name === 'signature_file' && { applicant_signature: file?.name || '' })
      }));
      
      if (name === 'valid_id_file' && file) {
        setVerificationStatus({
          isVerifying: false,
          isVerified: false,
          verificationResults: null,
          verificationError: null,
          progress: 0
        });
      }
    } else if (name === "mobile_number") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      if (onlyNums.length <= 11) {
        setFormData(prev => ({
          ...prev,
          [name]: onlyNums
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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

  const normalizeText = (text) => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

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

  const ID_TYPE_PATTERNS = {
    "Philippine National ID (PhilSys ID)": ["philsys", "philippine national id", "national id", "phil id", "republic of the philippines", "pambansang pagkakakilanlan", "philippine identification card", "pcn"],
    "Passport (DFA)": ["passport", "dfa", "department of foreign affairs", "p <", "republic of the philippines passport"],
    "Driver's License (LTO)": ["driver", "license", "licence", "lto", "land transportation", "dl no", "department of transportation", "driver's license", "drivers license", "license no", "license number"],
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

  const verifyDocument = async () => {
    if (!formData.valid_id_file) {
      setVerificationStatus(prev => ({
        ...prev,
        verificationError: 'Please upload a valid ID first'
      }));
      return;
    }

    if (!formData.first_name || !formData.last_name || !formData.id_number) {
      setVerificationStatus(prev => ({
        ...prev,
        verificationError: 'Please fill in First Name, Last Name, and ID Number before verification'
      }));
      return;
    }

    if (!formData.id_type) {
      setVerificationStatus(prev => ({
        ...prev,
        verificationError: 'Please select an ID type before verification'
      }));
      return;
    }

    setVerificationStatus({
      isVerifying: true,
      isVerified: false,
      verificationResults: null,
      verificationError: null,
      progress: 0
    });

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setVerificationStatus(prev => ({
              ...prev,
              progress: Math.round(m.progress * 100)
            }));
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
      
      // Check middle name or initial - be flexible
      let middleNameMatch = null;
      if (formData.middle_name) {
        // Check if full middle name matches
        const fullMiddleMatch = fuzzyMatch(formData.middle_name, extractedText);
        // Check if middle initial exists in text
        const middleInitial = formData.middle_name.charAt(0).toLowerCase();
        const hasMiddleInitial = extractedText.includes(middleInitial);
        // Accept if either full name OR initial is found
        middleNameMatch = fullMiddleMatch > 0 || hasMiddleInitial;
      }
      
      const idNumberNormalized = normalizeText(formData.id_number);
      const extractedTextNormalized = normalizeText(extractedText);
      const idNumberMatch = extractedTextNormalized.includes(idNumberNormalized) || 
        extractedText.includes(idNumberNormalized) ||
        fuzzyMatch(formData.id_number, extractedText) > 0.8;

      let birthdateMatch = null;
      if (formData.birthdate) {
        const birthdate = new Date(formData.birthdate);
        const month = String(birthdate.getMonth() + 1).padStart(2, '0');
        const day = String(birthdate.getDate()).padStart(2, '0');
        const dayNoZero = String(birthdate.getDate());
        const year = birthdate.getFullYear();
        
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthNamesShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                                 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        
        const monthName = monthNames[birthdate.getMonth()];
        const monthNameShort = monthNamesShort[birthdate.getMonth()];
        
        const formats = [
          `${month}/${day}/${year}`,
          `${month}-${day}-${year}`,
          `${day}/${month}/${year}`,
          `${day}-${month}-${year}`,
          `${year}/${month}/${day}`,
          `${year}-${month}-${day}`,
          `${month}${day}${year}`,
          `${day}${month}${year}`,
          `${year}${month}${day}`,
          `${monthName} ${day}, ${year}`,
          `${monthName} ${dayNoZero}, ${year}`,
          `${day} ${monthName} ${year}`,
          `${dayNoZero} ${monthName} ${year}`,
          `${monthNameShort} ${day}, ${year}`,
          `${monthNameShort} ${dayNoZero}, ${year}`,
          `${day} ${monthNameShort} ${year}`,
          `${dayNoZero} ${monthNameShort} ${year}`,
          `${monthName} ${day} ${year}`,
          `${monthName} ${dayNoZero} ${year}`,
          `${day} ${monthName}, ${year}`,
          `${dayNoZero} ${monthName}, ${year}`,
          `${monthNameShort} ${day} ${year}`,
          `${monthNameShort} ${dayNoZero} ${year}`,
          `${day} ${monthNameShort}, ${year}`,
          `${dayNoZero} ${monthNameShort}, ${year}`
        ];
        
        birthdateMatch = formats.some(format => 
          text.includes(format) || extractedText.includes(format.toLowerCase())
        );
      }

      const detectedID = detectIDType(text);
      const idTypeMatch = detectedID && detectedID.type === formData.id_type;

      // Check for expiration date
      let expirationDate = null;
      let isExpired = false;
      const expirationKeywords = ['expiry', 'expiration', 'valid until', 'expires', 'exp date', 'expiry date', 'expiration date'];
      const hasExpirationKeyword = expirationKeywords.some(keyword => extractedText.includes(keyword));
      
      if (hasExpirationKeyword) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Common date patterns for expiration dates
        const datePatterns = [
          /(?:expiry|expiration|valid until|expires|exp date)\s*:?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i,
          /(?:expiry|expiration|valid until|expires|exp date)\s*:?\s*(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/i,
          /(?:expiry|expiration|valid until|expires|exp date)\s*:?\s*(\w+)\s+(\d{1,2}),?\s+(\d{4})/i,
          /(?:expiry|expiration|valid until|expires|exp date)\s*:?\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i,
          /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?=\s*(?:expiry|expiration|exp))/i,
          /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?=\s*(?:expiry|expiration|exp))/i
        ];
        
        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            try {
              let expDate;
              if (match[0].includes('/') || match[0].includes('-')) {
                // Try different date formats
                const parts = match[0].split(/[\/-]/);
                if (parts[0].length === 4) {
                  // YYYY-MM-DD or YYYY/MM/DD
                  expDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else {
                  // MM-DD-YYYY or DD-MM-YYYY (assume MM-DD-YYYY for US-style dates)
                  expDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                }
              } else {
                // Month name format
                const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                                   'july', 'august', 'september', 'october', 'november', 'december'];
                const monthNamesShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                                         'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                
                const monthStr = match[1].toLowerCase();
                let monthIndex = monthNames.indexOf(monthStr);
                if (monthIndex === -1) {
                  monthIndex = monthNamesShort.indexOf(monthStr.substring(0, 3));
                }
                
                if (monthIndex !== -1) {
                  expDate = new Date(parseInt(match[3]), monthIndex, parseInt(match[2]));
                }
              }
              
              if (expDate && !isNaN(expDate.getTime())) {
                expirationDate = expDate;
                isExpired = expDate < today;
                break;
              }
            } catch (e) {
              console.log('Error parsing expiration date:', e);
            }
          }
        }
      }

      const results = {
        firstName: {
          matched: firstNameMatch > 0,
          confidence: firstNameMatch,
          value: formData.first_name
        },
        lastName: {
          matched: lastNameMatch > 0,
          confidence: lastNameMatch,
          value: formData.last_name
        },
        middleName: formData.middle_name ? {
          matched: middleNameMatch === true || middleNameMatch > 0,
          confidence: middleNameMatch === true ? 1.0 : (middleNameMatch || 0),
          value: formData.middle_name
        } : null,
        idNumber: {
          matched: idNumberMatch,
          confidence: idNumberMatch ? 1.0 : 0,
          value: formData.id_number
        },
        birthdate: formData.birthdate ? {
          matched: birthdateMatch,
          value: formData.birthdate
        } : null,
        idType: {
          detected: detectedID ? detectedID.type : 'Unknown',
          selected: formData.id_type,
          matched: idTypeMatch,
          confidence: detectedID ? detectedID.confidence : 0
        },
        expiration: {
          date: expirationDate,
          isExpired: isExpired,
          found: expirationDate !== null
        },
        extractedText: text
      };

      const allMatched = results.firstName.matched && 
                        results.lastName.matched && 
                        results.idNumber.matched &&
                        results.idType.matched &&
                        (!formData.middle_name || results.middleName.matched) &&
                        (!formData.birthdate || results.birthdate.matched) &&
                        !results.expiration.isExpired;

      let errorMessage = null;
      if (!allMatched) {
        if (results.expiration.isExpired) {
          errorMessage = 'ID document has expired and cannot be used';
        } else {
          errorMessage = 'Some information does not match the ID';
        }
      }

      setVerificationStatus({
        isVerifying: false,
        isVerified: allMatched,
        verificationResults: results,
        verificationError: errorMessage,
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
      if (!formData.first_name || formData.first_name.trim() === '') newErrors.first_name = 'First name is required';
      if (!formData.last_name || formData.last_name.trim() === '') newErrors.last_name = 'Last name is required';
      if (!formData.mobile_number || formData.mobile_number.trim() === '') {
        newErrors.mobile_number = 'Mobile number is required';
      } else if (!formData.mobile_number.startsWith('09')) {
        newErrors.mobile_number = 'Mobile number must start with 09';
      } else if (formData.mobile_number.length !== 11) {
        newErrors.mobile_number = 'Mobile number must be exactly 11 digits';
      }
      if (!formData.birthdate) {
        newErrors.birthdate = 'Birth date is required';
      } else if (calculateAge(formData.birthdate) < 18) {
        newErrors.birthdate = 'You must be at least 18 years old to apply';
      }
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.civil_status) newErrors.civil_status = 'Civil status is required';
      if (!formData.nationality || formData.nationality.trim() === '') newErrors.nationality = 'Nationality is required';
    }
    if (step === 2) {
      if (!formData.house_no || formData.house_no.trim() === '') newErrors.house_no = 'House/Building No. is required';
      if (!formData.street || formData.street.trim() === '') newErrors.street = 'Street is required';
      if (!formData.barangay || formData.barangay.trim() === '') newErrors.barangay = 'Barangay is required';
      if (!formData.city_municipality || formData.city_municipality.trim() === '') newErrors.city_municipality = 'City/Municipality is required';
      if (!formData.province || formData.province.trim() === '') newErrors.province = 'Province is required';
    }
    if (step === 3) {
      if (!formData.purpose || formData.purpose.trim() === '') newErrors.purpose = 'Purpose is required';
      if (!formData.id_type || formData.id_type.trim() === '') newErrors.id_type = 'ID type is required';
      if (!formData.id_number || formData.id_number.trim() === '') newErrors.id_number = 'ID number is required';
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
      if (!formData.first_name || formData.first_name.trim() === '') return false;
      if (!formData.last_name || formData.last_name.trim() === '') return false;
      if (!formData.mobile_number || formData.mobile_number.trim() === '') return false;
      if (!formData.mobile_number.startsWith('09') || formData.mobile_number.length !== 11) return false;
      if (!formData.birthdate) return false;
      if (!formData.gender) return false;
      if (!formData.civil_status) return false;
      if (!formData.nationality || formData.nationality.trim() === '') return false;
      return true;
    }
    if (step === 2) {
      if (!formData.house_no || formData.house_no.trim() === '') return false;
      if (!formData.street || formData.street.trim() === '') return false;
      if (!formData.barangay || formData.barangay.trim() === '') return false;
      if (!formData.city_municipality || formData.city_municipality.trim() === '') return false;
      if (!formData.province || formData.province.trim() === '') return false;
      return true;
    }
    if (step === 3) {
      if (!formData.purpose || formData.purpose.trim() === '') return false;
      if (!formData.id_type || formData.id_type.trim() === '') return false;
      if (!formData.id_number || formData.id_number.trim() === '') return false;
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      // For steps 1-4, just go to next step
      nextStep();
    } else if (currentStep === steps.length - 1) {
      // For step 4, go to review (step 5)
      const ok = validateStep(currentStep);
      if (ok) {
        setCurrentStep(currentStep + 1);
        setErrors({});
      }
    } else {
      // On Step 5 (Review), show SweetAlert2 confirmation
      const result = await Swal.fire({
        title: 'Confirm Submission',
        html: `
          <div class="text-left">
            <p class="mb-3 text-sm">Are you sure you want to submit your barangay clearance application? Please review your information before submitting.</p>
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
        customClass: {
          popup: 'text-left',
          htmlContainer: 'text-left'
        }
      });

      if (result.isConfirmed) {
        await handleSubmit();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const showSuccessMessage = async (message) => {
    await Swal.fire({
      title: 'Success!',
      html: `
        <div class="text-center">
          <p class="mb-3">${message}</p>
          <p class="text-xs text-gray-500">You will be redirected to your dashboard...</p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Track Application',
      confirmButtonColor: COLORS.success,
      timer: 3000,
      timerProgressBar: true
    }).then((result) => {
      if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
        navigate("/user/permittracker");
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

    // Validate steps
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

    try {
      // Prepare FormData for backend
      const formDataToSend = new FormData();

      // Append all text fields
      Object.entries({
        user_id: formData.user_id || "",
        application_date: formData.application_date,
        first_name: formData.first_name,
        middle_name: formData.middle_name || "",
        last_name: formData.last_name,
        suffix: formData.suffix || "",
        birthdate: formData.birthdate,
        mobile_number: formData.mobile_number,
        email: formData.email || "",
        gender: formData.gender,
        civil_status: formData.civil_status,
        nationality: formData.nationality,
        house_no: formData.house_no,
        street: formData.street,
        barangay: formData.barangay,
        city_municipality: formData.city_municipality,
        province: formData.province,
        zip_code: formData.zip_code || "",
        purpose: formData.purpose,
        duration: formData.duration || "",
        id_type: formData.id_type,
        id_number: formData.id_number,
        clearance_fee: formData.clearance_fee || "0.00",
        receipt_number: formData.receipt_number || "",
        status: formData.status || "pending",
      }).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Attach file uploads
      const fileFields = [
        "valid_id_file",
        "proof_of_residence_file",
        "receipt_file",
        "signature_file",
        "photo_fingerprint_file",
      ];

      fileFields.forEach((field) => {
        if (formData[field] instanceof File) {
          formDataToSend.append(field, formData[field]);
        }
      });

      console.log("Submitting barangay permit application...");

      const response = await fetch("/backend/barangay_permit/barangay_permit.php", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseClone = response.clone();
      let data;

      try {
        data = await response.json();
      } catch {
        const rawText = await responseClone.text();
        console.error("Raw server response:", rawText);
        throw new Error("Server did not return valid JSON");
      }

      // Success
      if (data.success) {
        await showSuccessMessage(data.message || "Application submitted successfully!");
        logPermitSubmission("Barangay Permit", data.permit_id || "", { permit_type: formData.permit_type });
        
        // Reset form after successful submission
        setFormData({
          permit_type: permitType,
          application_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          first_name: '',
          middle_name: '',
          last_name: '',
          suffix: '',
          mobile_number: '',
          email: '',
          birthdate: '',
          gender: '',
          civil_status: '',
          nationality: '',
          house_no: '',
          street: '',
          barangay: '',
          city_municipality: '',
          province: '',
          zip_code: '',
          purpose: '',
          duration: '',
          id_type: '',
          id_number: '',
          clearance_fee: 0.00,
          receipt_number: '',
          user_id: null,
          applicant_signature: '',
          valid_id_file: null,
          proof_of_residence_file: null,
          receipt_file: null,
          signature_file: null,
          photo_fingerprint_file: null,
          attachments: '',
        });
        setCurrentStep(1);
        setAgreeDeclaration(false);
      } else {
        await showErrorMessage(data.message || "Failed to submit application.");
      }

    } catch (error) {
      console.error("Submission error:", error);
      showErrorMessage("Network error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
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
                <input type="text" name="suffix" value={formData.suffix} onChange={handleChange} placeholder="Suffix" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Mobile Number *</label>
                <input type="text" name="mobile_number" value={formData.mobile_number} onChange={handleChange} placeholder="09XXXXXXXXX" className={`w-full p-3 border border-black rounded-lg ${errors.mobile_number ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.mobile_number && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.mobile_number}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
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
                    ⚠️ You must be at least 18 years old to apply for a barangay clearance.
                  </p>
                )}
                {errors.birthdate && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.birthdate}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.gender ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.gender}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Civil Status *</label>
                <select name="civil_status" value={formData.civil_status} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.civil_status ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} >
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
                <select name="nationality" value={formData.nationality} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.nationality ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} >
                  <option value="">Select nationality</option>
                  {NATIONALITIES.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
                {errors.nationality && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.nationality}</p>}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>House/Building No. *</label>
                <input type="text" name="house_no" value={formData.house_no} onChange={handleChange} placeholder="House/Building No." className={`w-full p-3 border border-black rounded-lg ${errors.house_no ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.house_no && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.house_no}</p>}
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
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>ZIP Code</label>
                <input type="text" name="zip_code" value={formData.zip_code} onChange={handleChange} placeholder="ZIP Code" className="w-full p-3 border border-black rounded-lg" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Clearance Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Purpose of Clearance *</label>
                <select name="purpose" value={formData.purpose} onChange={handleChange} className={`w-full p-3 border border-black rounded-lg ${errors.purpose ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} >
                  <option value="">Select purpose</option>
                  <optgroup label="Personal Purposes">
                    <option value="For personal identification">For personal identification</option>
                    <option value="For residency verification">For residency verification</option>
                    <option value="For school requirement">For school requirement</option>
                    <option value="For scholarship application">For scholarship application</option>
                    <option value="For government assistance">For government assistance</option>
                    <option value="For medical assistance application">For medical assistance application</option>
                    <option value="For financial assistance or aid">For financial assistance or aid</option>
                    <option value="For barangay ID application">For barangay ID application</option>
                    <option value="For court requirement / affidavit / legal matter">For court requirement / affidavit / legal matter</option>
                    <option value="For police clearance / NBI clearance requirement">For police clearance / NBI clearance requirement</option>
                  </optgroup>
                  <optgroup label="Employment-Related Purposes">
                    <option value="For local employment">For local employment</option>
                    <option value="For job application (private company)">For job application (private company)</option>
                    <option value="For government employment">For government employment</option>
                    <option value="For on-the-job training (OJT)">For on-the-job training (OJT)</option>
                    <option value="For job order / contractual employment">For job order / contractual employment</option>
                    <option value="For agency employment requirement">For agency employment requirement</option>
                    <option value="For renewal of work contract">For renewal of work contract</option>
                    <option value="For employment abroad (POEA / OFW)">For employment abroad (POEA / OFW)</option>
                  </optgroup>
                  <optgroup label="Business-Related Purposes">
                    <option value="For new business permit application">For new business permit application</option>
                    <option value="For renewal of business permit">For renewal of business permit</option>
                    <option value="For DTI / SEC business registration">For DTI / SEC business registration</option>
                    <option value="For business tax application">For business tax application</option>
                    <option value="For stall rental or space lease">For stall rental or space lease</option>
                    <option value="For business name registration">For business name registration</option>
                    <option value="For operation of new establishment">For operation of new establishment</option>
                    <option value="For business closure / cancellation">For business closure / cancellation</option>
                    <option value="For relocation / change of business address">For relocation / change of business address</option>
                  </optgroup>
                  <optgroup label="Residency / Property Purposes">
                    <option value="For proof of residency">For proof of residency</option>
                    <option value="For transfer of residence">For transfer of residence</option>
                    <option value="For lot / land ownership verification">For lot / land ownership verification</option>
                    <option value="For construction permit requirement">For construction permit requirement</option>
                    <option value="For fencing / excavation / building permit application">For fencing / excavation / building permit application</option>
                    <option value="For utility connection">For utility connection</option>
                    <option value="For barangay boundary certification">For barangay boundary certification</option>
                  </optgroup>
                  <optgroup label="Other Official / Legal Purposes">
                    <option value="For marriage license application">For marriage license application</option>
                    <option value="For travel / local mobility clearance">For travel / local mobility clearance</option>
                    <option value="For firearm license application">For firearm license application</option>
                    <option value="For barangay mediation / complaint settlement record">For barangay mediation / complaint settlement record</option>
                    <option value="For notarization requirement">For notarization requirement</option>
                    <option value="For business closure or transfer">For business closure or transfer</option>
                    <option value="For franchise or transport operation permit">For franchise or transport operation permit</option>
                    <option value="For cooperative registration">For cooperative registration</option>
                    <option value="For loan application">For loan application</option>
                    <option value="For SSS / Pag-IBIG / PhilHealth registration">For SSS / Pag-IBIG / PhilHealth registration</option>
                  </optgroup>
                </select>
                {errors.purpose && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.purpose}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Valid ID Type *</label>
<select
  name="id_type"
  value={formData.id_type}
  onChange={handleChange}
  className={`w-full p-3 border border-black rounded-lg ${
    errors.id_type ? 'border-red-500' : ''
  }`}
  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
>
  <option value="">Select ID type</option>

  <optgroup label="Primary Valid Government-Issued IDs">
    <option value="Philippine National ID (PhilSys ID)">
      Philippine National ID (PhilSys ID)
    </option>
    <option value="Passport (DFA)">Passport (DFA)</option>
    <option value="Driver's License (LTO)">Driver's License (LTO)</option>
    <option value="UMID">UMID (SSS / GSIS)</option>
    <option value="PRC ID">PRC ID</option>
    <option value="Voter's ID">Voter's ID</option>
    <option value="COMELEC Voter's Certificate">
      COMELEC Voter's Certificate
    </option>
    <option value="Postal ID (PhilPost)">Postal ID (PhilPost)</option>
    <option value="Senior Citizen ID">Senior Citizen ID</option>
    <option value="PWD ID">PWD ID</option>
  </optgroup>

  <optgroup label="Secondary / Supporting Government IDs">
    <option value="SSS ID">SSS ID</option>
    <option value="GSIS eCard">GSIS eCard</option>
    <option value="PhilHealth ID">PhilHealth ID</option>
    <option value="Pag-IBIG ID">Pag-IBIG ID</option>
    <option value="TIN ID">Tax Identification Number (TIN) ID</option>
    <option value="Barangay ID">Barangay ID</option>
    <option value="Barangay Clearance">Barangay Clearance</option>
    <option value="Police Clearance">Police Clearance</option>
    <option value="NBI Clearance">NBI Clearance</option>
    <option value="Solo Parent ID">Solo Parent ID</option>
    <option value="Indigenous People's (IP) ID">
      Indigenous People's (IP) ID
    </option>
  </optgroup>

  <optgroup label="Other Acceptable IDs (Conditional)">
    <option value="School ID">School ID</option>
    <option value="Company / Employee ID">Company / Employee ID</option>
    <option value="Government Office ID">Government Office ID</option>
    <option value="Firearms License ID">Firearms License ID</option>
    <option value="Seafarer's Identification Record Book (SIRB)">
      Seafarer's Identification Record Book (SIRB)
    </option>
    <option value="OWWA ID">OWWA ID</option>
    <option value="Alien Certificate of Registration (ACR I-Card)">
      Alien Certificate of Registration (ACR I-Card)
    </option>
  </optgroup>
</select>

                {errors.id_type && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.id_type}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>Valid ID Number *</label>
                <input type="text" name="id_number" value={formData.id_number} onChange={handleChange} placeholder="ID Number" className={`w-full p-3 border border-black rounded-lg ${errors.id_number ? 'border-red-500' : ''}`} style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
                {errors.id_number && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.id_number}</p>}
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
                  Valid ID (Government-issued, school, company ID) *
                </label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input
                    type="file"
                    name="valid_id_file"
                    onChange={handleChange}
                    accept="image/*"
                    className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    style={{ fontFamily: COLORS.font }}
                  />
                </div>
                {errors.valid_id_file && <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>{errors.valid_id_file}</p>}
                
                {formData.valid_id_file && (
                  <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900" style={{ fontFamily: COLORS.font }}>
                          AI Document Verification
                        </h4>
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
                          onMouseEnter={e => {
                            if (formData.first_name && formData.last_name && formData.id_number && formData.id_type) {
                              e.currentTarget.style.background = COLORS.accent;
                            }
                          }}
                          onMouseLeave={e => {
                            if (formData.first_name && formData.last_name && formData.id_number && formData.id_type) {
                              e.currentTarget.style.background = COLORS.primary;
                            }
                          }}
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
                          <p className="text-sm text-blue-800" style={{ fontFamily: COLORS.font }}>
                            Verifying document... {verificationStatus.progress}%
                          </p>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${verificationStatus.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {verificationStatus.verificationError && !verificationStatus.isVerifying && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800" style={{ fontFamily: COLORS.font }}>
                            Verification Failed
                          </p>
                          <p className="text-xs text-red-600 mt-1" style={{ fontFamily: COLORS.font }}>
                            {verificationStatus.verificationError}
                          </p>
                        </div>
                      </div>
                    )}

                    {verificationStatus.verificationResults && !verificationStatus.isVerifying && (
                      <div className="space-y-2">
                        <div className={`p-4 rounded-lg border-2 ${verificationStatus.isVerified ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            {verificationStatus.isVerified ? (
                              <>
                                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                  <p className="text-xl font-bold text-green-800" style={{ fontFamily: COLORS.font }}>
                                    VALID
                                  </p>
                                  <p className="text-sm text-green-700" style={{ fontFamily: COLORS.font }}>
                                    ID verification successful
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                                  <X className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                  <p className="text-xl font-bold text-red-800" style={{ fontFamily: COLORS.font }}>
                                    INVALID
                                  </p>
                                  <p className="text-sm text-red-700" style={{ fontFamily: COLORS.font }}>
                                    Information does not match ID
                                  </p>
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
                              {verificationStatus.verificationResults.idType.matched ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-600" />
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span>First Name: {verificationStatus.verificationResults.firstName.value}</span>
                              {verificationStatus.verificationResults.firstName.matched ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Last Name: {verificationStatus.verificationResults.lastName.value}</span>
                              {verificationStatus.verificationResults.lastName.matched ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            {verificationStatus.verificationResults.middleName && (
                              <div className="flex items-center justify-between">
                                <span>Middle Name: {verificationStatus.verificationResults.middleName.value}</span>
                                {verificationStatus.verificationResults.middleName.matched ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <X className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span>ID Number: {verificationStatus.verificationResults.idNumber.value}</span>
                              {verificationStatus.verificationResults.idNumber.matched ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            {verificationStatus.verificationResults.birthdate && (
                              <div className="flex items-center justify-between">
                                <span>Birthdate: {new Date(verificationStatus.verificationResults.birthdate.value).toLocaleDateString()}</span>
                                {verificationStatus.verificationResults.birthdate.matched ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <X className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                            )}
                            {verificationStatus.verificationResults.expiration && verificationStatus.verificationResults.expiration.found && (
                              <div className="flex items-center justify-between">
                                <span className={verificationStatus.verificationResults.expiration.isExpired ? 'font-bold' : ''}>
                                  Expiration: {verificationStatus.verificationResults.expiration.date.toLocaleDateString()}
                                  {verificationStatus.verificationResults.expiration.isExpired && ' (EXPIRED)'}
                                </span>
                                {!verificationStatus.verificationResults.expiration.isExpired ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <X className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                            )}
                          </div>

                          {!verificationStatus.isVerified && (
                            <div className="mt-3 p-2 bg-red-100 rounded border border-red-300">
                              <p className="text-xs text-red-800 font-medium" style={{ fontFamily: COLORS.font }}>
                                ⚠️ You cannot proceed until your ID is verified as VALID. Issues found:
                              </p>
                              <ul className="text-xs text-red-700 mt-1 ml-4 list-disc" style={{ fontFamily: COLORS.font }}>
                                {verificationStatus.verificationResults.expiration && verificationStatus.verificationResults.expiration.isExpired && (
                                  <li className="font-semibold text-red-900">
                                    ⚠️ ID DOCUMENT HAS EXPIRED on {verificationStatus.verificationResults.expiration.date.toLocaleDateString()}. You must use a valid, non-expired ID.
                                  </li>
                                )}
                                {!verificationStatus.verificationResults.idType.matched && (
                                  <li className="font-semibold">
                                    ID Type Mismatch: You selected "{verificationStatus.verificationResults.idType.selected}" but the system detected "{verificationStatus.verificationResults.idType.detected}". Please select the correct ID type.
                                  </li>
                                )}
                                {!verificationStatus.verificationResults.firstName.matched && (
                                  <li>First Name does not match the ID</li>
                                )}
                                {!verificationStatus.verificationResults.lastName.matched && (
                                  <li>Last Name does not match the ID</li>
                                )}
                                {verificationStatus.verificationResults.middleName && !verificationStatus.verificationResults.middleName.matched && (
                                  <li>Middle Name does not match the ID</li>
                                )}
                                {!verificationStatus.verificationResults.idNumber.matched && (
                                  <li>ID Number does not match the ID</li>
                                )}
                                {verificationStatus.verificationResults.birthdate && !verificationStatus.verificationResults.birthdate.matched && (
                                  <li>Birthdate does not match the ID</li>
                                )}
                                {!verificationStatus.verificationResults.expiration.isExpired && (
                                  <>
                                    <li className="mt-1">Ensure your ID image is clear and readable</li>
                                    <li>Verify the information you entered exactly matches your ID</li>
                                  </>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          onClick={verifyDocument}
                          className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                          style={{ fontFamily: COLORS.font }}
                        >
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
                      <p className="text-sm font-bold text-red-800" style={{ fontFamily: COLORS.font }}>
                        Verification Required
                      </p>
                      <p className="text-xs text-red-700 mt-1" style={{ fontFamily: COLORS.font }}>
                        {errors.verification_required}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                  Proof of Residence (Utility bill, barangay certificate)
                </label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input
                    type="file"
                    name="proof_of_residence_file"
                    onChange={handleChange}
                    className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    style={{ fontFamily: COLORS.font }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                  Official Receipt or Proof of Payment
                </label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input
                    type="file"
                    name="receipt_file"
                    onChange={handleChange}
                    className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    style={{ fontFamily: COLORS.font }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                  Applicant's Signature *
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

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary }}>
                  Photo and Fingerprint (if required)
                </label>
                <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                  <Upload className="w-5 h-5 text-gray-500" />
                  <input
                    type="file"
                    name="photo_fingerprint_file"
                    onChange={handleChange}
                    className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    style={{ fontFamily: COLORS.font }}
                  />
                </div>
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
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Applicant Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center">
                      <span className="font-medium w-32">First Name:</span>
                      <span className="flex-1">{formData.first_name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Middle Name:</span>
                      <span className="flex-1">{formData.middle_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Last Name:</span>
                      <span className="flex-1">{formData.last_name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Suffix:</span>
                      <span className="flex-1">{formData.suffix || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Mobile Number:</span>
                      <span className="flex-1">{formData.mobile_number}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Email:</span>
                      <span className="flex-1">{formData.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Birth Date:</span>
                      <span className="flex-1">{formData.birthdate}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Gender:</span>
                      <span className="flex-1">{formData.gender}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Civil Status:</span>
                      <span className="flex-1">{formData.civil_status}</span>
                    </div>
                    <div className="flex items-center md:col-span-2">
                      <span className="font-medium w-32">Nationality:</span>
                      <span className="flex-1">{formData.nationality}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Address Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center">
                      <span className="font-medium w-32">House/Building No.:</span>
                      <span className="flex-1">{formData.house_no}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Street:</span>
                      <span className="flex-1">{formData.street}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Barangay:</span>
                      <span className="flex-1">{formData.barangay}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">City/Municipality:</span>
                      <span className="flex-1">{formData.city_municipality}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Province:</span>
                      <span className="flex-1">{formData.province}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">ZIP Code:</span>
                      <span className="flex-1">{formData.zip_code || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Clearance Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Purpose:</span>
                      <span className="flex-1">{formData.purpose}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">Duration:</span>
                      <span className="flex-1">{formData.duration || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">ID Type:</span>
                      <span className="flex-1">{formData.id_type}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-32">ID Number:</span>
                      <span className="flex-1">{formData.id_number}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>Uploaded Documents</h5>
                  <div className="space-y-4">
                    {/* Valid ID */}
                    <div className="p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {formData.valid_id_file ? (
                            <Check className="w-5 h-5 text-green-600 mr-3" />
                          ) : (
                            <X className="w-5 h-5 text-red-600 mr-3" />
                          )}
                          <div>
                            <span className="font-medium">Valid ID:</span>
                            <p className="text-sm text-gray-600">
                              {formData.valid_id_file ? formData.valid_id_file.name : 'Not uploaded'}
                            </p>
                          </div>
                        </div>
                        {formData.valid_id_file && (
                          <button
                            type="button"
                            onClick={() => previewFile(formData.valid_id_file)}
                            className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                            style={{ color: COLORS.secondary }}
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                        )}
                      </div>
                      
                      {formData.valid_id_file && (
                        <div className="mt-2">
                          {verificationStatus.isVerified ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border-2 border-green-500 rounded">
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm text-green-800 font-bold" style={{ fontFamily: COLORS.font }}>
                                VALID - AI Verified
                              </span>
                            </div>
                          ) : verificationStatus.verificationResults ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-red-500 rounded">
                              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                                <X className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm text-red-800 font-bold" style={{ fontFamily: COLORS.font }}>
                                INVALID - Information does not match
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-red-500 rounded">
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <span className="text-sm text-red-800 font-bold" style={{ fontFamily: COLORS.font }}>
                                NOT VERIFIED - Go back to step 4 to verify
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Proof of Residence */}
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        {formData.proof_of_residence_file ? (
                          <Check className="w-5 h-5 text-green-600 mr-3" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 mr-3" />
                        )}
                        <div>
                          <span className="font-medium">Proof of Residence:</span>
                          <p className="text-sm text-gray-600">
                            {formData.proof_of_residence_file ? formData.proof_of_residence_file.name : 'Optional'}
                          </p>
                        </div>
                      </div>
                      {formData.proof_of_residence_file && (
                        <button
                          type="button"
                          onClick={() => previewFile(formData.proof_of_residence_file)}
                          className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                          style={{ color: COLORS.secondary }}
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                      )}
                    </div>

                    {/* Official Receipt */}
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        {formData.receipt_file ? (
                          <Check className="w-5 h-5 text-green-600 mr-3" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 mr-3" />
                        )}
                        <div>
                          <span className="font-medium">Official Receipt:</span>
                          <p className="text-sm text-gray-600">
                            {formData.receipt_file ? formData.receipt_file.name : 'Optional'}
                          </p>
                        </div>
                      </div>
                      {formData.receipt_file && (
                        <button
                          type="button"
                          onClick={() => previewFile(formData.receipt_file)}
                          className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                          style={{ color: COLORS.secondary }}
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                      )}
                    </div>

                    {/* Signature */}
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        {formData.signature_file ? (
                          <Check className="w-5 h-5 text-green-600 mr-3" />
                        ) : (
                          <X className="w-5 h-5 text-red-600 mr-3" />
                        )}
                        <div>
                          <span className="font-medium">Signature:</span>
                          <p className="text-sm text-gray-600">
                            {formData.signature_file ? formData.signature_file.name : 'Not uploaded'}
                          </p>
                        </div>
                      </div>
                      {formData.signature_file && (
                        <button
                          type="button"
                          onClick={() => previewFile(formData.signature_file)}
                          className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300"
                          style={{ color: COLORS.secondary }}
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                      )}
                    </div>

                    {/* Photo & Fingerprint */}
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        {formData.photo_fingerprint_file ? (
                          <Check className="w-5 h-5 text-green-600 mr-3" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 mr-3" />
                        )}
                        <div>
                          <span className="font-medium">Photo & Fingerprint:</span>
                          <p className="text-sm text-gray-600">
                            {formData.photo_fingerprint_file ? formData.photo_fingerprint_file.name : 'Optional'}
                          </p>
                        </div>
                      </div>
                      {formData.photo_fingerprint_file && (
                        <button
                          type="button"
                          onClick={() => previewFile(formData.photo_fingerprint_file)}
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
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary }}>BARANGAY CLEARANCE APPLICATION</h1>
          <p className="mt-2" style={{ color: COLORS.secondary }}>
            Apply for a barangay clearance for various personal, employment, or business purposes.
          </p>
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

    </div>
  );
}