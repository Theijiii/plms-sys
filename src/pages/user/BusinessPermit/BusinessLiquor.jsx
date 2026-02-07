import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ArrowLeft, Building, FileText, MapPin, User, 
  CheckCircle, AlertCircle, FileCheck, Upload, Check, X, Eye, 
  XCircle, Info, FileSignature, Calendar, Clock, Wine, Shield, 
  Store, CreditCard, Home, Package, Truck, Users, RefreshCw, Edit,
  ClipboardCheck, FileSearch, CalendarDays, AlertTriangle, Loader2
} from "lucide-react";
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
  warning: '#FF9800',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

export default function LiquorPermitApplication() {
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
  const [permitInfo, setPermitInfo] = useState(null);
  const [isCheckingPermit, setIsCheckingPermit] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [existingLiquorPermitInfo, setExistingLiquorPermitInfo] = useState(null);
  const [ageValid, setAgeValid] = useState(true);
  const [verifyingApplicantId, setVerifyingApplicantId] = useState(false);
  const [applicantIdVerified, setApplicantIdVerified] = useState(false);
  const navigate = useNavigate();

  // Document verification states
  const [documentVerification, setDocumentVerification] = useState({
    barangay_clearance_id_copy: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    owner_valid_id: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    renewal_permit_copy: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    previous_permit_copy: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 }
  });

  // Verification modal states
  const [showVerifyingModal, setShowVerifyingModal] = useState(false);
  const [verifyingProgress, setVerifyingProgress] = useState(0);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationModalData, setVerificationModalData] = useState(null);

  // Barangay Clearance ID verification states
  const [verifyingBarangayId, setVerifyingBarangayId] = useState(false);
  const [barangayVerificationResult, setBarangayVerificationResult] = useState(null);
  const [showBarangayModal, setShowBarangayModal] = useState(false);
  const [validatedBarangayIds, setValidatedBarangayIds] = useState({});

  // Get current date for submission
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
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
    { id: 1, title: 'Application Type', description: 'Select type of application' },
    { id: 2, title: 'Business Info', description: 'Business details and validation' },
    { id: 3, title: 'Owner Information', description: 'Owner details (18+ only)' },
    { id: 4, title: 'Documents', description: 'Upload required documents' },
    { id: 5, title: 'Review & Submit', description: 'Review and submit application' }
  ];

  const [formData, setFormData] = useState({
    // Application Type
    application_type: 'NEW',
    existing_permit_number: '',
    applicant_id_input: '',
    
    // For RENEWAL: Renewal details
    renewal_permit_number: '',
    previous_permit_validity: '',
    renewal_reason: '',
    
    // For AMENDMENT: Amendment details
    amendment_type: 'CHANGE_OWNER',
    amendment_details: '',
    amendment_reason: '',
    
    // Business Information (from permit validation)
    business_name: '',
    business_address: '',
    business_email: '',
    business_phone: '',
    business_type: '',
    business_nature: '',
    
    // Owner Information
    owner_first_name: '',
    owner_last_name: '',
    owner_middle_name: '',
    owner_address: '',
    id_type: 'GOVERNMENT_ID',
    id_number: '',
    date_of_birth: '',
    citizenship: 'FILIPINO',
    
    // Document uploads
    barangay_clearance_id: '', // Barangay clearance ID number
    barangay_clearance_liquor: null, // Document file
    barangay_clearance_id_copy: null, // Copy of barangay clearance
    
    owner_valid_id: null, // Owner valid ID
    
    // Additional documents based on application type
    renewal_permit_copy: null, // For RENEWAL
    previous_permit_copy: null, // For AMENDMENT
    
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

  // Validate age whenever date_of_birth changes
  useEffect(() => {
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setAgeValid(age >= 18);
    }
  }, [formData.date_of_birth]);

  const applicationTypes = [
    { id: 'NEW', name: 'New Application', description: 'First time application for liquor permit' },
    { id: 'RENEWAL', name: 'Renewal', description: 'Renew existing liquor permit' },
    { id: 'AMENDMENT', name: 'Amendment', description: 'Modify existing liquor permit' }
  ];

  const amendmentTypes = [
    { id: 'CHANGE_OWNER', name: 'Change of Owner' },
    { id: 'CHANGE_BUSINESS_NAME', name: 'Change Business Name' },
    { id: 'CHANGE_BUSINESS_ADDRESS', name: 'Change Business Address' },
    { id: 'CHANGE_BUSINESS_NATURE', name: 'Change Business Nature' },
    { id: 'CHANGE_OPERATING_HOURS', name: 'Change Operating Hours' }
  ];

  const businessTypes = [
    'Restaurant/Bar',
    'Night Club/Disco',
    'Hotel/Resort',
    'Convenience Store',
    'Supermarket',
    'Liquor Store',
    'Catering Service',
    'Events Place',
    'Others'
  ];

  const businessNatures = [
    'Retail Sale of Liquor',
    'Wholesale of Liquor',
    'Sale of Liquor for On-Site Consumption',
    'Sale of Liquor for Off-Site Consumption',
    'Manufacturing of Liquor',
    'Import/Export of Liquor',
    'Distribution of Liquor'
  ];

  const idTypes = [
    { id: 'PASSPORT', name: 'Passport' },
    { id: 'DRIVERS_LICENSE', name: "Driver's License" },
    { id: 'GOVERNMENT_ID', name: 'Government ID' },
    { id: 'UMID', name: 'UMID' },
    { id: 'PRC_ID', name: 'PRC ID' },
    { id: 'POSTAL_ID', name: 'Postal ID' },
    { id: 'VOTERS_ID', name: "Voter's ID" },
    { id: 'SENIOR_CITIZEN_ID', name: 'Senior Citizen ID' }
  ];

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file || null
      }));
      
      // Reset verification status when file changes
      if (documentVerification[name]) {
        setDocumentVerification(prev => ({
          ...prev,
          [name]: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 }
        }));
      }
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

  // Document type patterns for verification
  const DOCUMENT_PATTERNS = {
    barangay_clearance_id_copy: [
      "barangay clearance", "brgy clearance", "barangay certification",
      "clearance", "certification", "punong barangay", "barangay captain",
      "lupon", "katarungang pambarangay", "liquor", "alcoholic"
    ],
    owner_valid_id: [
      "philippine", "national id", "passport", "driver", "license",
      "umid", "sss", "gsis", "philhealth", "pag-ibig", "voter",
      "postal", "senior citizen", "pwd", "tin", "prc"
    ],
    renewal_permit_copy: [
      "liquor permit", "alcoholic", "beverage", "permit", "license",
      "business", "mayor", "city", "municipality"
    ],
    previous_permit_copy: [
      "liquor permit", "alcoholic", "beverage", "permit", "license",
      "business", "mayor", "city", "municipality"
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
    
    const confidence = patterns.length > 0 ? matchCount / patterns.length : 0;
    
    return {
      matched: matchCount > 0,
      confidence: confidence,
      matchCount: matchCount,
      expectedType: expectedType
    };
  };

  // Check if owner name appears in document
  const verifyOwnerNameInDoc = (extractedText) => {
    const firstName = formData.owner_first_name?.trim();
    const lastName = formData.owner_last_name?.trim();
    const middleName = formData.owner_middle_name?.trim();
    
    if (!firstName || !lastName) return null;
    
    const textLower = extractedText.toLowerCase();
    const firstNameLower = firstName.toLowerCase();
    const lastNameLower = lastName.toLowerCase();
    
    const firstNameFuzzy = fuzzyMatch(firstName, extractedText);
    const lastNameFuzzy = fuzzyMatch(lastName, extractedText);
    const middleNameFuzzy = middleName ? fuzzyMatch(middleName, extractedText) : 0;
    
    const firstNameFound = firstNameFuzzy > 0 || textLower.includes(firstNameLower);
    const lastNameFound = lastNameFuzzy > 0 || textLower.includes(lastNameLower);
    const middleNameFound = middleName ? (middleNameFuzzy > 0 || textLower.includes(middleName.toLowerCase())) : false;
    
    const hasRequiredMatch = firstNameFound && lastNameFound;
    
    return {
      firstName: { matched: firstNameFound, confidence: firstNameFuzzy, value: firstName },
      lastName: { matched: lastNameFound, confidence: lastNameFuzzy, value: lastName },
      middleName: middleName ? { matched: middleNameFound, confidence: middleNameFuzzy, value: middleName } : null,
      anyMatch: hasRequiredMatch,
      allMatch: hasRequiredMatch && (!middleName || middleNameFound)
    };
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

  // Convert PDF to images for OCR processing
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

  // Generic document verification function using AI OCR
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

    setShowVerifyingModal(true);
    setVerifyingProgress(0);
    
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
      
      if (file.type === 'application/pdf') {
        setDocumentVerification(prev => ({
          ...prev,
          [documentType]: { ...prev[documentType], progress: 20 }
        }));
        
        const images = await convertPdfToImages(file);
        
        setDocumentVerification(prev => ({
          ...prev,
          [documentType]: { ...prev[documentType], progress: 40 }
        }));
        
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
        const { data: { text: imageText } } = await worker.recognize(file);
        text = imageText;
      }
      
      await worker.terminate();

      setDocumentVerification(prev => ({
        ...prev,
        [documentType]: { ...prev[documentType], progress: 90 }
      }));

      const extractedText = text.toLowerCase();
      
      const docTypeCheck = detectDocumentType(text, documentType);
      const businessNameCheck = verifyBusinessNameInDoc(extractedText);
      const ownerNameCheck = verifyOwnerNameInDoc(extractedText);
      
      const results = {
        documentType: {
          detected: docTypeCheck.matched,
          confidence: docTypeCheck.confidence,
          matchCount: docTypeCheck.matchCount
        },
        businessName: businessNameCheck,
        ownerName: ownerNameCheck,
        extractedText: text
      };

      let isVerified = false;
      let invalidReasons = [];
      
      const documentTypeMatched = docTypeCheck.matched;
      
      if (!documentTypeMatched) {
        const docTypeLabels = {
          'barangay_clearance_id_copy': 'Barangay Clearance for Liquor',
          'owner_valid_id': 'Valid ID',
          'renewal_permit_copy': 'Copy of Existing Liquor Permit',
          'previous_permit_copy': 'Copy of Previous Liquor Permit'
        };
        const expectedDoc = docTypeLabels[documentType] || documentType;
        invalidReasons = [`Wrong document type uploaded. Expected: ${expectedDoc}. Please upload the correct document.`];
        isVerified = false;
      }
      
      if (documentType === 'barangay_clearance_id_copy' && docTypeCheck.matched) {
        const hasOwnerName = ownerNameCheck?.anyMatch;
        if (hasOwnerName) {
          isVerified = true;
        } else {
          invalidReasons = ['Document may be unreadable or owner name not found. Please re-upload a clear copy.'];
          isVerified = false;
        }
      }
      
      if (documentType === 'owner_valid_id' && docTypeCheck.matched) {
        const hasOwnerName = ownerNameCheck?.anyMatch;
        if (hasOwnerName) {
          isVerified = true;
        } else {
          invalidReasons = ['Document may be unreadable or name not found. Please re-upload a clear copy.'];
          isVerified = false;
        }
      }
      
      if ((documentType === 'renewal_permit_copy' || documentType === 'previous_permit_copy') && docTypeCheck.matched) {
        const hasBusinessName = businessNameCheck?.matched;
        if (hasBusinessName) {
          isVerified = true;
        } else {
          invalidReasons = ['Document may be unreadable. Please re-upload a clear copy.'];
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

      setShowVerifyingModal(false);
      
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
      
      setShowVerifyingModal(false);
      
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

  // Verify Applicant ID for existing business permit
  const verifyApplicantId = async () => {
    const applicantId = formData.applicant_id_input.trim();
    
    if (!applicantId) {
      setErrors({ ...errors, applicant_id_input: 'Applicant ID is required' });
      return;
    }

    setVerifyingApplicantId(true);
    setApplicantIdVerified(false);
    
    try {
      const response = await fetch(`/backend/business_permit/admin_fetch.php`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const permitData = data.data.find(item => 
          item.applicant_id === applicantId
        );
        
        if (permitData) {
          setPermitInfo(permitData);
          setApplicantIdVerified(true);
          
          setFormData(prev => ({
            ...prev,
            applicant_id: applicantId,
            business_name: permitData.business_name || '',
            business_address: permitData.business_address || 
              `${permitData.barangay || ''}, ${permitData.city_municipality || ''}, ${permitData.province || ''}`.trim(),
            business_email: permitData.email_address || '',
            business_phone: permitData.contact_number || '',
            business_nature: permitData.business_nature || '',
            business_type: permitData.business_category || '',
            owner_first_name: permitData.owner_first_name || '',
            owner_last_name: permitData.owner_last_name || '',
            owner_middle_name: permitData.owner_middle_name || '',
            owner_address: permitData.home_address || '',
            id_type: permitData.valid_id_type || 'GOVERNMENT_ID',
            id_number: permitData.valid_id_number || ''
          }));
          
          setErrors({ ...errors, applicant_id_input: '' });
          setSubmitStatus({ 
            type: 'success', 
            message: `Business permit found for Applicant ID: ${applicantId}! Business information has been auto-filled.` 
          });
        } else {
          setApplicantIdVerified(false);
          setErrors({ ...errors, applicant_id_input: 'No business permit found for this Applicant ID' });
          setSubmitStatus({ 
            type: 'error', 
            message: 'No business permit found for this Applicant ID. Please verify and try again.' 
          });
        }
      } else {
        setApplicantIdVerified(false);
        setErrors({ ...errors, applicant_id_input: 'Unable to verify Applicant ID' });
        setSubmitStatus({ 
          type: 'error', 
          message: 'Unable to verify Applicant ID. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Error verifying applicant ID:', error);
      setApplicantIdVerified(false);
      setErrors({ ...errors, applicant_id_input: 'Error verifying Applicant ID' });
      setSubmitStatus({ 
        type: 'error', 
        message: 'Error verifying Applicant ID. Please try again.' 
      });
    } finally {
      setVerifyingApplicantId(false);
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
      const response = await fetch('/backend/barangay_permit/admin_fetch.php');
      
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
        message: "❌ Error verifying barangay clearance ID. Please try again.",
        data: null
      });
    } finally {
      setVerifyingBarangayId(false);
      setShowBarangayModal(true);
    }
  };

  // Check existing permit
  const checkExistingPermit = async () => {
    if (!formData.existing_permit_number.trim()) {
      setErrors({ ...errors, existing_permit_number: 'Please enter a permit number' });
      return;
    }

    setIsCheckingPermit(true);
    try {
      // For NEW application: Check business permit
      if (formData.application_type === 'NEW') {
        let response = await fetch(`/backend/business_permit/admin_fetch.php?permit_number=${formData.existing_permit_number}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let data = await response.json();
        
        if (!data.success || !data.data || data.data.length === 0) {
          response = await fetch(`/backend/business_permit/admin_fetch.php?search=${formData.existing_permit_number}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          data = await response.json();
        }
        
        if (data.success && data.data && data.data.length > 0) {
          const permitData = data.data.find(item => 
            item.permit_id === formData.existing_permit_number || 
            item.applicant_id === formData.existing_permit_number
          ) || data.data[0];
          
          setPermitInfo(permitData);
          
          setFormData(prev => ({
            ...prev,
            business_name: permitData.business_name || '',
            business_address: permitData.business_address || 
              `${permitData.barangay || ''}, ${permitData.city_municipality || ''}, ${permitData.province || ''}`.trim(),
            business_email: permitData.email_address || '',
            business_phone: permitData.contact_number || '',
            business_nature: permitData.business_nature || '',
            owner_first_name: permitData.owner_first_name || '',
            owner_last_name: permitData.owner_last_name || '',
            owner_middle_name: permitData.owner_middle_name || '',
            owner_address: permitData.home_address || '',
            id_type: permitData.valid_id_type || 'GOVERNMENT_ID',
            id_number: permitData.valid_id_number || ''
          }));
          
          setErrors({ ...errors, existing_permit_number: '' });
          setSubmitStatus({ 
            type: 'success', 
            message: 'Business permit found! Information has been auto-filled.' 
          });
        } else {
          setPermitInfo(null);
          setErrors({ ...errors, existing_permit_number: 'Business permit not found' });
          setSubmitStatus({ 
            type: 'error', 
            message: 'Business permit not found. Please check and try again.' 
          });
        }
      } 
      // For RENEWAL or AMENDMENT: Check liquor permit
      else {
        // First try to check liquor permit
        let response = await fetch(`/backend/liquor_permit/check.php?permit_number=${formData.existing_permit_number}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let data = await response.json();
        
        if (data.success && data.data) {
          setExistingLiquorPermitInfo(data.data);
          
          setFormData(prev => ({
            ...prev,
            business_name: data.data.business_name || '',
            business_address: data.data.business_address || '',
            business_email: data.data.business_email || '',
            business_phone: data.data.business_phone || '',
            business_type: data.data.business_type || '',
            business_nature: data.data.business_nature || '',
            owner_first_name: data.data.owner_first_name || '',
            owner_last_name: data.data.owner_last_name || '',
            owner_middle_name: data.data.owner_middle_name || '',
            owner_address: data.data.owner_address || '',
            id_type: data.data.id_type || 'GOVERNMENT_ID',
            id_number: data.data.id_number || '',
            date_of_birth: data.data.date_of_birth || '',
            citizenship: data.data.citizenship || 'FILIPINO'
          }));
          
          setErrors({ ...errors, existing_permit_number: '' });
          setSubmitStatus({ 
            type: 'success', 
            message: `Existing liquor permit found! ${formData.application_type === 'RENEWAL' ? 'Renewal' : 'Amendment'} information has been loaded.` 
          });
        } else {
          setExistingLiquorPermitInfo(null);
          setErrors({ ...errors, existing_permit_number: 'Liquor permit not found' });
          setSubmitStatus({ 
            type: 'error', 
            message: 'Liquor permit not found. Please check and try again.' 
          });
        }
      }
    } catch (error) {
      console.error('Error checking permit:', error);
      setErrors({ ...errors, existing_permit_number: 'Error checking permit. Please try again.' });
      setSubmitStatus({ 
        type: 'error', 
        message: 'Error checking permit. Please try again.' 
      });
    } finally {
      setIsCheckingPermit(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.application_type) newErrors.application_type = 'Please select application type';
      
      if (formData.application_type !== 'NEW' && !formData.existing_permit_number.trim()) {
        newErrors.existing_permit_number = 'Existing liquor permit number is required';
      }
      
      if (formData.application_type === 'NEW' && !formData.existing_permit_number.trim()) {
        setSubmitStatus({
          type: 'warning',
          message: 'Note: Entering your business permit number will auto-fill your business information.'
        });
      }
    }
    
    if (step === 2) {
      if (!formData.business_name.trim()) newErrors.business_name = 'Business name is required';
      if (!formData.business_address.trim()) newErrors.business_address = 'Business address is required';
      if (!formData.business_email.trim()) newErrors.business_email = 'Business email is required';
      if (!formData.business_phone.trim()) newErrors.business_phone = 'Business phone is required';
      if (!formData.business_type) newErrors.business_type = 'Business type is required';
      if (!formData.business_nature) newErrors.business_nature = 'Business nature is required';
      
      if (formData.application_type === 'AMENDMENT') {
        if (!formData.amendment_type) newErrors.amendment_type = 'Amendment type is required';
        if (!formData.amendment_details.trim()) newErrors.amendment_details = 'Amendment details are required';
        if (!formData.amendment_reason.trim()) newErrors.amendment_reason = 'Amendment reason is required';
      }
      
      if (formData.application_type === 'RENEWAL') {
        if (!formData.renewal_reason.trim()) newErrors.renewal_reason = 'Renewal reason is required';
      }
    }
    
    if (step === 3) {
      if (!formData.owner_first_name.trim()) newErrors.owner_first_name = 'Owner first name is required';
      if (!formData.owner_last_name.trim()) newErrors.owner_last_name = 'Owner last name is required';
      if (!formData.owner_address.trim()) newErrors.owner_address = 'Owner address is required';
      if (!formData.id_type) newErrors.id_type = 'ID type is required';
      if (!formData.id_number.trim()) newErrors.id_number = 'ID number is required';
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
      if (!ageValid) newErrors.date_of_birth = 'Applicant must be 18 years or older';
      if (!formData.citizenship) newErrors.citizenship = 'Citizenship is required';
    }
    
    if (step === 4) {
      // Barangay clearance validation - ONLY ONE IS REQUIRED (ID OR FILE)
      if (!formData.barangay_clearance_id.trim() && !formData.barangay_clearance_id_copy) {
        newErrors.barangay_clearance = 'Barangay clearance ID or document is required (provide at least one)';
      } else if (formData.barangay_clearance_id.trim() && !validatedBarangayIds[formData.barangay_clearance_id]) {
        newErrors.barangay_clearance = 'Barangay clearance ID must be verified (click Verify button)';
      } else if (formData.barangay_clearance_id_copy && !documentVerification.barangay_clearance_id_copy?.isVerified) {
        if (documentVerification.barangay_clearance_id_copy?.isVerified === false) {
          newErrors.barangay_clearance = 'Barangay clearance document is INVALID - Please upload a valid document';
        } else {
          newErrors.barangay_clearance = 'Barangay clearance document must be verified (click Verify button)';
        }
      }
      
      // Valid ID validation (both sides)
      if (!formData.owner_valid_id) {
        newErrors.owner_valid_id = 'Owner valid ID is required';
      } else if (documentVerification.owner_valid_id?.isVerified === false) {
        newErrors.owner_valid_id = 'Owner Valid ID is INVALID - Please upload a valid document';
      } else if (!documentVerification.owner_valid_id?.isVerified) {
        newErrors.owner_valid_id = 'Owner Valid ID must be verified (click Verify button)';
      }
      
      // Additional documents for RENEWAL
      if (formData.application_type === 'RENEWAL') {
        if (!formData.renewal_permit_copy) {
          newErrors.renewal_permit_copy = 'Copy of existing liquor permit is required for renewal';
        } else if (documentVerification.renewal_permit_copy?.isVerified === false) {
          newErrors.renewal_permit_copy = 'Renewal permit copy is INVALID - Please upload a valid document';
        } else if (!documentVerification.renewal_permit_copy?.isVerified) {
          newErrors.renewal_permit_copy = 'Renewal permit copy must be verified (click Verify button)';
        }
      }
      
      // Additional documents for AMENDMENT
      if (formData.application_type === 'AMENDMENT') {
        if (!formData.previous_permit_copy) {
          newErrors.previous_permit_copy = 'Copy of previous liquor permit is required for amendment';
        } else if (documentVerification.previous_permit_copy?.isVerified === false) {
          newErrors.previous_permit_copy = 'Previous permit copy is INVALID - Please upload a valid document';
        } else if (!documentVerification.previous_permit_copy?.isVerified) {
          newErrors.previous_permit_copy = 'Previous permit copy must be verified (click Verify button)';
        }
      }
    }
    
    if (step === 5) {
      if (!formData.applicant_signature) newErrors.applicant_signature = 'Signature is required';
      if (!agreeDeclaration) newErrors.agreeDeclaration = 'You must agree to the declaration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (step) => {
    if (step === 1) {
      const baseValid = formData.application_type;
      if (formData.application_type === 'NEW') return baseValid;
      return baseValid && formData.existing_permit_number.trim();
    }
    
    if (step === 2) {
      const baseValid = formData.business_name.trim() && 
                       formData.business_address.trim() && 
                       formData.business_email.trim() && 
                       formData.business_phone.trim() &&
                       formData.business_type &&
                       formData.business_nature;
      
      if (formData.application_type === 'RENEWAL') {
        return baseValid && formData.renewal_reason.trim();
      }
      
      if (formData.application_type === 'AMENDMENT') {
        return baseValid && 
               formData.amendment_type &&
               formData.amendment_details.trim() &&
               formData.amendment_reason.trim();
      }
      
      return baseValid;
    }
    
    if (step === 3) {
      const ownerValid = formData.owner_first_name.trim() && 
                        formData.owner_last_name.trim() && 
                        formData.owner_address.trim() && 
                        formData.id_type && 
                        formData.id_number.trim() &&
                        formData.date_of_birth &&
                        ageValid &&
                        formData.citizenship;
      
      return ownerValid;
    }
    
    if (step === 4) {
      // Barangay clearance: EITHER ID OR FILE is required
      const barangayClearanceValid = formData.barangay_clearance_id.trim() || formData.barangay_clearance_id_copy;
      
      const ownerIdValid = formData.owner_valid_id;
      
      let typeSpecificValid = true;
      if (formData.application_type === 'RENEWAL') {
        typeSpecificValid = formData.renewal_permit_copy;
      } else if (formData.application_type === 'AMENDMENT') {
        typeSpecificValid = formData.previous_permit_copy;
      }
      
      return barangayClearanceValid && ownerIdValid && typeSpecificValid;
    }
    
    if (step === 5) {
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

      // Prepare form data based on application type
      const formFields = {
        applicant_id: applicantId,
        application_type: formData.application_type,
        existing_permit_number: formData.existing_permit_number || '',
        
        // Business Information
        business_name: formData.business_name,
        business_address: formData.business_address,
        business_email: formData.business_email,
        business_phone: formData.business_phone,
        business_type: formData.business_type,
        business_nature: formData.business_nature,
        
        // Owner Information
        owner_first_name: formData.owner_first_name,
        owner_last_name: formData.owner_last_name,
        owner_middle_name: formData.owner_middle_name || '',
        owner_address: formData.owner_address,
        id_type: formData.id_type,
        id_number: formData.id_number,
        date_of_birth: formData.date_of_birth,
        citizenship: formData.citizenship,
        
        // Barangay Clearance Information
        barangay_clearance_id: formData.barangay_clearance_id,
        
        // Application Type Specific Fields
        renewal_reason: formData.renewal_reason || '',
        amendment_type: formData.amendment_type || '',
        amendment_details: formData.amendment_details || '',
        amendment_reason: formData.amendment_reason || '',
        
        // Declaration
        applicant_signature: formData.applicant_signature,
        declaration_agreed: agreeDeclaration ? 1 : 0,
        date_submitted: formData.date_submitted,
        time_submitted: formData.time_submitted,
        status: 'PENDING',
        permit_type: 'LIQUOR'
      };

      // Append form fields
      Object.entries(formFields).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Append files
      const files = [
        'barangay_clearance_id_copy',
        'owner_valid_id',
        'renewal_permit_copy',
        'previous_permit_copy'
      ];

      files.forEach(fileName => {
        if (formData[fileName] instanceof File) {
          formDataToSend.append(fileName, formData[fileName]);
        }
      });

      // Send to backend
      const response = await fetch("/backend/liquor_permit/submit.php", {
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
        showSuccessMessage(data.message || "Liquor permit application submitted successfully!");
        
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            application_type: 'NEW',
            existing_permit_number: '',
            renewal_permit_number: '',
            previous_permit_validity: '',
            renewal_reason: '',
            amendment_type: 'CHANGE_OWNER',
            amendment_details: '',
            amendment_reason: '',
            business_name: '',
            business_address: '',
            business_email: '',
            business_phone: '',
            business_type: '',
            business_nature: '',
            owner_first_name: '',
            owner_last_name: '',
            owner_middle_name: '',
            owner_address: '',
            id_type: 'GOVERNMENT_ID',
            id_number: '',
            date_of_birth: '',
            citizenship: 'FILIPINO',
            barangay_clearance_id: '',
            barangay_clearance_liquor: null,
            barangay_clearance_id_copy: null,
            owner_valid_id: null,
            renewal_permit_copy: null,
            previous_permit_copy: null,
            applicant_signature: '',
            declaration_agreed: false,
            applicant_id: applicantId,
            date_submitted: getCurrentDate(),
            time_submitted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          setPermitInfo(null);
          setExistingLiquorPermitInfo(null);
          setAgreeDeclaration(false);
          setErrors({});
        }, 2000);

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

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Render different form sections based on application type
  const renderApplicationTypeSpecificFields = () => {
    switch (formData.application_type) {
      case 'RENEWAL':
        return (
          <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-3">
              <RefreshCw className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-semibold text-blue-800">Renewal Details</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-blue-700">
                  Reason for Renewal <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="renewal_reason"
                  value={formData.renewal_reason}
                  onChange={handleChange}
                  placeholder="Explain why you are renewing your liquor permit"
                  rows="3"
                  className={`w-full p-3 border border-blue-300 rounded-lg ${errors.renewal_reason ? 'border-red-500' : ''}`}
                />
                {errors.renewal_reason && <p className="text-red-600 text-sm mt-1">{errors.renewal_reason}</p>}
                <p className="text-xs text-gray-600 mt-1">
                  Please provide details about why you need to renew your liquor permit
                </p>
              </div>
            </div>
          </div>
        );

      case 'AMENDMENT':
        return (
          <div className="mt-4 p-4 border border-purple-200 bg-purple-50 rounded-lg">
            <div className="flex items-center mb-3">
              <Edit className="w-5 h-5 text-purple-600 mr-2" />
              <h4 className="font-semibold text-purple-800">Amendment Details</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-purple-700">
                  Type of Amendment <span className="text-red-600">*</span>
                </label>
                <select
                  name="amendment_type"
                  value={formData.amendment_type}
                  onChange={handleChange}
                  className={`w-full p-3 border border-purple-300 rounded-lg ${errors.amendment_type ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Amendment Type</option>
                  {amendmentTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {errors.amendment_type && <p className="text-red-600 text-sm mt-1">{errors.amendment_type}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-purple-700">
                  Amendment Details <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="amendment_details"
                  value={formData.amendment_details}
                  onChange={handleChange}
                  placeholder="Provide specific details of the amendment"
                  rows="3"
                  className={`w-full p-3 border border-purple-300 rounded-lg ${errors.amendment_details ? 'border-red-500' : ''}`}
                />
                {errors.amendment_details && <p className="text-red-600 text-sm mt-1">{errors.amendment_details}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-purple-700">
                  Reason for Amendment <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="amendment_reason"
                  value={formData.amendment_reason}
                  onChange={handleChange}
                  placeholder="Explain why you need to amend your liquor permit"
                  rows="3"
                  className={`w-full p-3 border border-purple-300 rounded-lg ${errors.amendment_reason ? 'border-red-500' : ''}`}
                />
                {errors.amendment_reason && <p className="text-red-600 text-sm mt-1">{errors.amendment_reason}</p>}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render different document requirements based on application type
  const renderApplicationTypeSpecificDocuments = () => {
    switch (formData.application_type) {
      case 'RENEWAL':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-3">
                <RefreshCw className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-800">Renewal Requirements</h4>
              </div>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Copy of existing liquor permit</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Proof of payment for current year</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Updated barangay clearance for liquor</span>
                </li>
              </ul>
            </div>
            
            <div className="border border-blue-300 rounded-lg bg-blue-50">
              <div className="flex items-center justify-between p-3 border-b border-blue-200">
                <div className="flex items-center">
                  <div className="mr-3">
                    {formData.renewal_permit_copy ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Copy of Existing Liquor Permit: <span className="text-red-500">*</span></span>
                    <p className="text-sm text-blue-700">
                      {formData.renewal_permit_copy ? formData.renewal_permit_copy.name : 'Required for renewal'}
                    </p>
                    <p className="text-xs text-red-500 font-semibold">
                      * Copy of your current liquor permit
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="renewal_permit_copy"
                      onChange={handleChange}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-blue-100 transition-colors duration-300 border ${
                      !formData.renewal_permit_copy ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
                    }`}>
                      <Upload className="w-4 h-4" />
                      {formData.renewal_permit_copy ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.renewal_permit_copy && (
                    <button
                      type="button"
                      onClick={() => previewFile(formData.renewal_permit_copy)}
                      className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-blue-100 transition-colors duration-300"
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

      case 'AMENDMENT':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center mb-3">
                <Edit className="w-5 h-5 text-purple-600 mr-2" />
                <h4 className="font-semibold text-purple-800">Amendment Requirements</h4>
              </div>
              <ul className="space-y-2 text-sm text-purple-700">
                <li className="flex items-start">
                  <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Copy of previous liquor permit</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Supporting documents for the amendment (e.g., deed of sale for change of ownership)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Updated barangay clearance reflecting changes</span>
                </li>
              </ul>
            </div>
            
            <div className="border border-purple-300 rounded-lg bg-purple-50">
              <div className="flex items-center justify-between p-3 border-b border-purple-200">
                <div className="flex items-center">
                  <div className="mr-3">
                    {formData.previous_permit_copy ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Copy of Previous Liquor Permit: <span className="text-red-500">*</span></span>
                    <p className="text-sm text-purple-700">
                      {formData.previous_permit_copy ? formData.previous_permit_copy.name : 'Required for amendment'}
                    </p>
                    <p className="text-xs text-red-500 font-semibold">
                      * Copy of your previous liquor permit before amendment
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      name="previous_permit_copy"
                      onChange={handleChange}
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                    />
                    <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-purple-100 transition-colors duration-300 border ${
                      !formData.previous_permit_copy ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
                    }`}>
                      <Upload className="w-4 h-4" />
                      {formData.previous_permit_copy ? 'Change' : 'Upload'}
                    </div>
                  </label>
                  {formData.previous_permit_copy && (
                    <button
                      type="button"
                      onClick={() => previewFile(formData.previous_permit_copy)}
                      className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-purple-100 transition-colors duration-300"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  )}
                </div>
              </div>
              
              {formData.amendment_type === 'CHANGE_OWNER' && (
                <div className="p-3 border-t border-purple-200">
                  <p className="text-sm font-medium text-purple-700 mb-2">Additional documents for Change of Owner:</p>
                  <ul className="text-xs text-purple-600 space-y-1">
                    <li>• Deed of Sale or Transfer Document</li>
                    <li>• Notarized Affidavit of Ownership Transfer</li>
                    <li>• Valid ID of new owner</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case 'NEW':
      default:
        return (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-3">
              <FileSearch className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-semibold text-green-800">New Application Requirements</h4>
            </div>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-start">
                <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Valid Business Permit (if existing business)</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Barangay Clearance specifically for liquor business</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Valid ID of owner (must be 18+ years old)</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Proof of business location ownership or lease agreement</span>
              </li>
            </ul>
          </div>
        );
    }
  };

  // Render review page (step 5)
  const renderReviewPage = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Review Application</h3>
          <p className="text-sm text-gray-600 mb-4">Please review all information before submitting your liquor permit application.</p>
        </div>

        <div className="space-y-6">
          {/* Application Summary Card */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg" style={{ color: COLORS.primary }}>Application Summary</h4>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                formData.application_type === 'NEW' ? 'bg-green-100 text-green-800' :
                formData.application_type === 'RENEWAL' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {formData.application_type === 'NEW' ? 'New Application' :
                 formData.application_type === 'RENEWAL' ? 'Renewal Application' :
                 'Amendment Application'}
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
              {formData.application_type !== 'NEW' && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Existing Permit No.</p>
                  <p className="font-medium">{formData.existing_permit_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>Business Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Business Name</p>
                <p className="font-medium">{formData.business_name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Business Type</p>
                <p className="font-medium">{formData.business_type || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Business Nature</p>
                <p className="font-medium">{formData.business_nature || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Email</p>
                <p className="font-medium">{formData.business_email || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Business Address</p>
                <p className="font-medium">{formData.business_address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>Owner Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="font-medium">{formData.owner_first_name} {formData.owner_middle_name} {formData.owner_last_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Birth / Age</p>
                <p className="font-medium">
                  {formData.date_of_birth ? `${formData.date_of_birth} (${calculateAge(formData.date_of_birth)} years old)` : 'Not provided'}
                  {!ageValid && formData.date_of_birth && (
                    <span className="ml-2 text-red-600 text-sm">
                      <AlertTriangle className="inline w-4 h-4 mr-1" />
                      Must be 18+
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Citizenship</p>
                <p className="font-medium">{formData.citizenship || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ID Type & Number</p>
                <p className="font-medium">{formData.id_type}: {formData.id_number}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Owner Address</p>
                <p className="font-medium">{formData.owner_address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Barangay Clearance Information */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>Barangay Clearance Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Clearance ID Number</p>
                <p className="font-medium">{formData.barangay_clearance_id || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Document Status</p>
                <p className="font-medium">
                  {formData.barangay_clearance_id_copy ? (
                    <span className="text-green-600 flex items-center">
                      <Check className="w-4 h-4 mr-1" /> Uploaded
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <X className="w-4 h-4 mr-1" /> Not uploaded
                    </span>
                  )}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Note</p>
                <p className="text-sm text-gray-600">
                  {formData.barangay_clearance_id || formData.barangay_clearance_id_copy 
                    ? '✓ Barangay clearance requirement satisfied (ID or Document provided)'
                    : '✗ Barangay clearance requirement not satisfied'}
                </p>
              </div>
            </div>
          </div>

          {/* Application Type Specific Information */}
          {formData.application_type === 'RENEWAL' && formData.renewal_reason && (
            <div className="bg-white border border-blue-300 rounded-lg p-6 shadow-sm">
              <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>Renewal Details</h4>
              <div>
                <p className="text-sm font-medium text-gray-500">Reason for Renewal</p>
                <p className="font-medium mt-1 p-3 bg-blue-50 rounded">{formData.renewal_reason}</p>
              </div>
            </div>
          )}

          {formData.application_type === 'AMENDMENT' && (
            <div className="bg-white border border-purple-300 rounded-lg p-6 shadow-sm">
              <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>Amendment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Amendment Type</p>
                  <p className="font-medium">{amendmentTypes.find(t => t.id === formData.amendment_type)?.name}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Amendment Details</p>
                  <p className="font-medium mt-1 p-3 bg-purple-50 rounded">{formData.amendment_details}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Amendment Reason</p>
                  <p className="font-medium mt-1 p-3 bg-purple-50 rounded">{formData.amendment_reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Documents Summary */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>Documents Uploaded</h4>
            <div className="space-y-3">
              {/* Barangay Clearance */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  {formData.barangay_clearance_id || formData.barangay_clearance_id_copy ? (
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 mr-3" />
                  )}
                  <div>
                    <p className="font-medium">Barangay Clearance for Liquor</p>
                    <p className="text-sm text-gray-600">
                      {formData.barangay_clearance_id ? `ID: ${formData.barangay_clearance_id}` : 'ID: Not provided'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Document: {formData.barangay_clearance_id_copy ? formData.barangay_clearance_id_copy.name : 'Not uploaded'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ✓ Either ID or Document is sufficient
                    </p>
                  </div>
                </div>
              </div>

              {/* Owner Valid ID */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  {formData.owner_valid_id ? (
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 mr-3" />
                  )}
                  <div>
                    <p className="font-medium">Owner Valid ID</p>
                    <p className="text-sm text-gray-600">
                      {formData.owner_valid_id ? formData.owner_valid_id.name : 'Not uploaded'}
                    </p>
                  </div>
                </div>
              </div>

              {formData.application_type === 'RENEWAL' && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <div className="flex items-center">
                    {formData.renewal_permit_copy ? (
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                    ) : (
                      <X className="w-5 h-5 text-red-600 mr-3" />
                    )}
                    <div>
                      <p className="font-medium">Copy of Existing Permit</p>
                      <p className="text-sm text-blue-700">
                        {formData.renewal_permit_copy ? formData.renewal_permit_copy.name : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {formData.application_type === 'AMENDMENT' && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                  <div className="flex items-center">
                    {formData.previous_permit_copy ? (
                      <Check className="w-5 h-5 text-green-600 mr-3" />
                    ) : (
                      <X className="w-5 h-5 text-red-600 mr-3" />
                    )}
                    <div>
                      <p className="font-medium">Copy of Previous Permit</p>
                      <p className="text-sm text-purple-700">
                        {formData.previous_permit_copy ? formData.previous_permit_copy.name : 'Not uploaded'}
                      </p>
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
              <h5 className="font-bold mb-3 text-red-700">LIQUOR PERMIT DECLARATION</h5>
              <div className="text-sm space-y-2">
                <p>I, <span className="font-bold">{formData.owner_first_name} {formData.owner_last_name}</span>, hereby solemnly declare that:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>All information provided in this application is true, complete, and correct;</li>
                  <li>I am at least 18 years of age;</li>
                  <li>I will comply with all liquor laws and regulations;</li>
                  <li>I will not serve alcohol to minors;</li>
                  <li>I accept full responsibility for any violations.</li>
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
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Type of Application</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[0].description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Application Type <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {applicationTypes.map(type => (
                    <div key={type.id} className="relative">
                      <input
                        type="radio"
                        id={`type-${type.id}`}
                        name="application_type"
                        value={type.id}
                        checked={formData.application_type === type.id}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <label
                        htmlFor={`type-${type.id}`}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                          formData.application_type === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 border rounded-full mr-3 flex items-center justify-center ${
                            formData.application_type === type.id
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-400'
                          }`}>
                            {formData.application_type === type.id && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{type.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                {errors.application_type && <p className="text-red-600 text-sm mt-1">{errors.application_type}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  {formData.application_type === 'NEW' 
                    ? 'Existing Business Permit Number (Optional)'
                    : 'Existing Liquor Permit Number'} 
                  {formData.application_type !== 'NEW' && <span className="text-red-600">*</span>}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="existing_permit_number" 
                    value={formData.existing_permit_number} 
                    onChange={handleChange} 
                    placeholder={formData.application_type === 'NEW' 
                      ? "Enter business permit number (recommended)"
                      : "Enter liquor permit number (required)"} 
                    className={`flex-1 p-3 border border-black rounded-lg ${errors.existing_permit_number ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  />
                  <button
                    type="button"
                    onClick={checkExistingPermit}
                    disabled={isCheckingPermit || (!formData.existing_permit_number.trim() && formData.application_type !== 'NEW')}
                    className={`px-4 py-3 rounded-lg font-medium text-white ${
                      isCheckingPermit || (!formData.existing_permit_number.trim() && formData.application_type !== 'NEW')
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 transition-colors duration-300'
                    }`}
                  >
                    {isCheckingPermit ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
                {errors.existing_permit_number && <p className="text-red-600 text-sm mt-1">{errors.existing_permit_number}</p>}
                <p className="text-sm text-gray-600 mt-1">
                  {formData.application_type === 'NEW' 
                    ? 'Enter your existing business permit number to auto-fill business information (recommended)' 
                    : `Enter your existing liquor permit number for ${formData.application_type.toLowerCase()}`}
                </p>
                
                {permitInfo && formData.application_type === 'NEW' && (
                  <div className="mt-4 p-4 border border-green-300 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-green-700">Business Permit Found!</p>
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-sm">
                      <p><span className="font-medium">Business:</span> {permitInfo.business_name}</p>
                      <p><span className="font-medium">Owner:</span> {permitInfo.owner_first_name} {permitInfo.owner_last_name}</p>
                      <p><span className="font-medium">Status:</span> <span className="text-green-600">{permitInfo.status}</span></p>
                      <p className="mt-2 text-green-600">Business information has been auto-filled</p>
                    </div>
                  </div>
                )}
                
                {existingLiquorPermitInfo && formData.application_type !== 'NEW' && (
                  <div className="mt-4 p-4 border border-blue-300 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-blue-700">Liquor Permit Found!</p>
                      <Check className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-sm">
                      <p><span className="font-medium">Business:</span> {existingLiquorPermitInfo.business_name}</p>
                      <p><span className="font-medium">Owner:</span> {existingLiquorPermitInfo.owner_first_name} {existingLiquorPermitInfo.owner_last_name}</p>
                      <p><span className="font-medium">Type:</span> {existingLiquorPermitInfo.business_type}</p>
                      <p><span className="font-medium">Status:</span> <span className="text-blue-600">{existingLiquorPermitInfo.status}</span></p>
                      <p className="mt-2 text-blue-600">Liquor permit information has been loaded</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Business Information</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[1].description}</p>
            </div>

            <div className="space-y-4">
              {/* Business Type and Nature */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Business Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleChange}
                    className={`w-full p-3 border border-black rounded-lg ${errors.business_type ? 'border-red-500' : ''}`}
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  >
                    <option value="">Select Business Type</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.business_type && <p className="text-red-600 text-sm mt-1">{errors.business_type}</p>}
                </div>
                
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Business Nature <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="business_nature"
                    value={formData.business_nature}
                    onChange={handleChange}
                    className={`w-full p-3 border border-black rounded-lg ${errors.business_nature ? 'border-red-500' : ''}`}
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  >
                    <option value="">Select Business Nature</option>
                    {businessNatures.map(nature => (
                      <option key={nature} value={nature}>{nature}</option>
                    ))}
                  </select>
                  {errors.business_nature && <p className="text-red-600 text-sm mt-1">{errors.business_nature}</p>}
                </div>
              </div>

              {/* Business Basic Info */}
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
                    placeholder="Registered business name" 
                    className={`w-full p-3 border border-black rounded-lg ${errors.business_name ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  />
                  {errors.business_name && <p className="text-red-600 text-sm mt-1">{errors.business_name}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Business Address <span className="text-red-600">*</span>
                  </label>
                  <textarea 
                    name="business_address" 
                    value={formData.business_address} 
                    onChange={handleChange} 
                    placeholder="Complete business address" 
                    rows="3"
                    className={`w-full p-3 border border-black rounded-lg ${errors.business_address ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                  ></textarea>
                  {errors.business_address && <p className="text-red-600 text-sm mt-1">{errors.business_address}</p>}
                </div>
                
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Business Email <span className="text-red-600">*</span>
                  </label>
                  <input 
                    type="email" 
                    name="business_email" 
                    value={formData.business_email} 
                    onChange={handleChange} 
                    placeholder="business@example.com" 
                    className={`w-full p-3 border border-black rounded-lg ${errors.business_email ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  />
                  {errors.business_email && <p className="text-red-600 text-sm mt-1">{errors.business_email}</p>}
                </div>
                
                <div>
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Business Phone <span className="text-red-600">*</span>
                  </label>
                  <input 
                    type="tel" 
                    name="business_phone" 
                    value={formData.business_phone} 
                    onChange={handleChange} 
                    placeholder="Phone number" 
                    className={`w-full p-3 border border-black rounded-lg ${errors.business_phone ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  />
                  {errors.business_phone && <p className="text-red-600 text-sm mt-1">{errors.business_phone}</p>}
                </div>
              </div>

              {/* Application Type Specific Fields */}
              {renderApplicationTypeSpecificFields()}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Owner Information</h3>
              <p className="text-sm text-gray-600 mb-4">{steps[2].description}</p>
            </div>

            {/* Age Requirement Notice */}
            {!ageValid && formData.date_of_birth && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="font-medium text-red-700">Age Requirement Not Met</p>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Applicant must be at least 18 years old to apply for a liquor permit. Current age: {calculateAge(formData.date_of_birth)} years.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Owner First Name <span className="text-red-600">*</span>
                </label>
                <input 
                  type="text" 
                  name="owner_first_name" 
                  value={formData.owner_first_name} 
                  onChange={handleChange} 
                  placeholder="First Name" 
                  className={`w-full p-3 border border-black rounded-lg ${errors.owner_first_name ? 'border-red-500' : ''}`} 
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
                  placeholder="Last Name" 
                  className={`w-full p-3 border border-black rounded-lg ${errors.owner_last_name ? 'border-red-500' : ''}`} 
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
                  placeholder="Middle Name" 
                  className="w-full p-3 border border-black rounded-lg" 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Date of Birth <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="date" 
                    name="date_of_birth" 
                    value={formData.date_of_birth} 
                    onChange={handleChange} 
                    className={`w-full p-3 border border-black rounded-lg pl-10 ${errors.date_of_birth ? 'border-red-500' : ''}`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  />
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {formData.date_of_birth && (
                    <div className={`text-xs mt-1 ${ageValid ? 'text-green-600' : 'text-red-600'}`}>
                      {ageValid ? '✓ Age requirement met (18+ years)' : '✗ Must be 18 years or older'}
                    </div>
                  )}
                </div>
                {errors.date_of_birth && <p className="text-red-600 text-sm mt-1">{errors.date_of_birth}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Citizenship <span className="text-red-600">*</span>
                </label>
                <select
                  name="citizenship"
                  value={formData.citizenship}
                  onChange={handleChange}
                  className={`w-full p-3 border border-black rounded-lg ${errors.citizenship ? 'border-red-500' : ''}`}
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                >
                  <option value="FILIPINO">Filipino</option>
                  <option value="DUAL_CITIZEN">Dual Citizen</option>
                  <option value="FOREIGNER">Foreigner</option>
                </select>
                {errors.citizenship && <p className="text-red-600 text-sm mt-1">{errors.citizenship}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Owner Address <span className="text-red-600">*</span>
                </label>
                <textarea 
                  name="owner_address" 
                  value={formData.owner_address} 
                  onChange={handleChange} 
                  placeholder="Complete owner address" 
                  rows="3"
                  className={`w-full p-3 border border-black rounded-lg ${errors.owner_address ? 'border-red-500' : ''}`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                ></textarea>
                {errors.owner_address && <p className="text-red-600 text-sm mt-1">{errors.owner_address}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Type of ID <span className="text-red-600">*</span>
                </label>
                <select 
                  name="id_type" 
                  value={formData.id_type} 
                  onChange={handleChange} 
                  className={`w-full p-3 border border-black rounded-lg ${errors.id_type ? 'border-red-500' : ''}`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                >
                  <option value="">Select ID Type</option>
                  {idTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {errors.id_type && <p className="text-red-600 text-sm mt-1">{errors.id_type}</p>}
              </div>
              
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  ID Number <span className="text-red-600">*</span>
                </label>
                <input 
                  type="text" 
                  name="id_number" 
                  value={formData.id_number} 
                  onChange={handleChange} 
                  placeholder="ID number" 
                  className={`w-full p-3 border border-black rounded-lg ${errors.id_number ? 'border-red-500' : ''}`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                />
                {errors.id_number && <p className="text-red-600 text-sm mt-1">{errors.id_number}</p>}
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
                  <p className="font-medium text-blue-800 mb-1">Important Note for Liquor Permit:</p>
                  <p className="text-sm text-blue-700">
                    • All documents marked with <span className="font-bold text-red-600">*</span> are <span className="font-bold text-red-600">MANDATORY</span> for liquor permit application.
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    • Ensure all documents are up-to-date and valid.
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    • Upload both front and back of valid IDs.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Application Type Specific Documents */}
              {renderApplicationTypeSpecificDocuments()}

              {/* Barangay Clearance Section - MODIFIED: Only one required */}
              <div className="border border-gray-300 rounded-lg bg-blue-50">
                <div className="p-4">
                  <div className="flex items-center mb-3">
                    <div className="mr-3">
                      {formData.barangay_clearance_id.trim() || formData.barangay_clearance_id_copy ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Barangay Clearance for Liquor: <span className="text-red-500">*</span></span>
                      <p className="text-xs text-red-500 font-semibold">* Provide EITHER ID number OR Document (one is enough)</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barangay Clearance ID Number
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          name="barangay_clearance_id"
                          value={formData.barangay_clearance_id}
                          onChange={handleChange}
                          placeholder="Enter Barangay Clearance ID (Optional)"
                          className="flex-1 p-3 border border-black rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={verifyBarangayClearanceId}
                          disabled={verifyingBarangayId || !formData.barangay_clearance_id.trim()}
                          className={`px-4 py-3 rounded-lg font-medium text-white ${
                            verifyingBarangayId || !formData.barangay_clearance_id.trim()
                              ? 'bg-gray-400 cursor-not-allowed'
                              : validatedBarangayIds[formData.barangay_clearance_id]
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}>
                          {verifyingBarangayId ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : validatedBarangayIds[formData.barangay_clearance_id] ? (
                            'Verified'
                          ) : (
                            'Verify'
                          )}
                        </button>
                      </div>
                      {validatedBarangayIds[formData.barangay_clearance_id] && (
                        <div className="text-xs text-green-600 flex items-center mb-1">
                          <Check className="w-3 h-3 mr-1" /> ID verified successfully
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Provide ID if you have the clearance number
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clearance Document (Alternative)
                      </label>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {formData.barangay_clearance_id_copy ? (
                            <>
                              <Check className="w-4 h-4 text-green-600 mr-2" />
                              <span className="text-sm truncate max-w-[150px]">
                                {formData.barangay_clearance_id_copy.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Optional - upload document</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              name="barangay_clearance_id_copy"
                              onChange={handleChange}
                              accept=".pdf,.jpg,.png,.jpeg"
                              className="hidden"
                            />
                            <div className={`flex items-center gap-1 px-3 py-2 text-sm rounded border ${
                              !formData.barangay_clearance_id_copy 
                                ? 'border-gray-300 bg-white text-gray-700' 
                                : 'border-green-200 bg-green-50 text-green-700'
                            }`}>
                              <Upload className="w-4 h-4" />
                              {formData.barangay_clearance_id_copy ? 'Change' : 'Upload'}
                            </div>
                          </label>
                          {formData.barangay_clearance_id_copy && (
                            <>
                              <button
                                type="button"
                                onClick={() => previewFile(formData.barangay_clearance_id_copy)}
                                className="flex items-center gap-1 px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => verifyDocument('barangay_clearance_id_copy', formData.barangay_clearance_id_copy)}
                                disabled={documentVerification.barangay_clearance_id_copy?.isVerifying}
                                className={`flex items-center gap-1 px-3 py-2 text-sm rounded border ${
                                  documentVerification.barangay_clearance_id_copy?.isVerifying
                                    ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : documentVerification.barangay_clearance_id_copy?.isVerified
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}>
                                {documentVerification.barangay_clearance_id_copy?.isVerifying ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : documentVerification.barangay_clearance_id_copy?.isVerified ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Shield className="w-4 h-4" />
                                )}
                                {documentVerification.barangay_clearance_id_copy?.isVerifying
                                  ? 'Verifying...'
                                  : documentVerification.barangay_clearance_id_copy?.isVerified
                                  ? 'Verified'
                                  : 'Verify'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {documentVerification.barangay_clearance_id_copy?.isVerified && (
                        <div className="text-xs text-green-600 flex items-center">
                          <Check className="w-3 h-3 mr-1" /> Document verified successfully
                        </div>
                      )}
                      {documentVerification.barangay_clearance_id_copy?.isVerified === false && (
                        <div className="text-xs text-red-600 flex items-center">
                          <X className="w-3 h-3 mr-1" /> Verification failed - please check document
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {errors.barangay_clearance && (
                    <p className="text-red-600 text-sm mt-2">{errors.barangay_clearance}</p>
                  )}
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-700 font-medium">
                      <Info className="inline w-4 h-4 mr-1" />
                      Note: You only need to provide ONE of the following:
                    </p>
                    <ul className="text-xs text-yellow-700 mt-1 ml-5 list-disc">
                      <li>Barangay Clearance ID Number (if you know it)</li>
                      <li>OR Upload a copy of the Barangay Clearance document</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Owner Valid ID Section */}
              <div className="relative">
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
                        onChange={handleChange}
                        accept=".pdf,.jpg,.png,.doc,.docx"
                        className="hidden"
                        required
                      />
                      <div className={`flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors duration-300 border ${
                        !formData.owner_valid_id ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
                      }`} style={{ color: COLORS.secondary }}>
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
                          disabled={documentVerification.owner_valid_id?.isVerifying}
                          className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors duration-300 border ${
                            documentVerification.owner_valid_id?.isVerified 
                              ? 'bg-green-100 border-green-500 text-green-700' 
                              : 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {documentVerification.owner_valid_id?.isVerifying ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                          ) : documentVerification.owner_valid_id?.isVerified ? (
                            <><Check className="w-4 h-4" /> Verified</>
                          ) : (
                            <><Shield className="w-4 h-4" /> Verify</>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Verified ID Badge with Blur Background */}
                {documentVerification.owner_valid_id?.isVerified && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-600/90 backdrop-blur-md shadow-lg border border-green-400/50">
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-xs font-semibold text-white">Verified ID</span>
                  </div>
                )}
              </div>
              
              {/* Progress percentage for owner valid ID verification */}
              {formData.owner_valid_id && documentVerification.owner_valid_id?.isVerifying && (
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
              
              {errors.owner_valid_id && (
                <p className="text-red-600 text-sm mt-1">{errors.owner_valid_id}</p>
              )}
            </div>
          </div>
        );
        
      case 5:
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
            <div className="p-3 rounded-full bg-blue-100">
              <Wine className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary }}>
                LIQUOR PERMIT APPLICATION
              </h1>
              <p className="mt-1 text-lg font-semibold text-blue-700">
                Caloocan City Business Permit and Licensing Office
              </p>
            </div>
          </div>
          <p className="mt-2" style={{ color: COLORS.secondary }}>
            Complete the form below to apply for a liquor permit for your business
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              formData.application_type === 'NEW' ? 'bg-green-100 text-green-800' :
              formData.application_type === 'RENEWAL' ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {formData.application_type === 'NEW' ? 'New Application' :
               formData.application_type === 'RENEWAL' ? 'Renewal Application' :
               'Amendment Application'}
            </div>
            {existingLiquorPermitInfo && (
              <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                Existing Permit: {existingLiquorPermitInfo.permit_number}
              </div>
            )}
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
            
            <h2 className="text-xl font-bold text-center mb-4" style={{ color: COLORS.primary }}>Submit Liquor Permit Application?</h2>
            
            <div className="mb-6">
              <p className="text-sm text-center mb-3" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                Are you sure you want to submit your liquor permit application? Please ensure all information is correct before submitting.
              </p>
              
              <div className="p-4 bg-gray-50 rounded-lg border mt-4">
                <p className="text-sm font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Application Summary:</p>
                <ul className="text-xs space-y-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  <li>• Business: {formData.business_name}</li>
                  <li>• Owner: {formData.owner_first_name} {formData.owner_last_name}</li>
                  <li>• Application Type: {applicationTypes.find(t => t.id === formData.application_type)?.name}</li>
                  <li>• Owner Age: {calculateAge(formData.date_of_birth)} years old</li>
                  {!ageValid && (
                    <li className="text-red-600 font-semibold">• ⚠️ Age requirement not met (must be 18+)</li>
                  )}
                  <li>• Barangay Clearance: {formData.barangay_clearance_id ? `ID: ${formData.barangay_clearance_id}` : formData.barangay_clearance_id_copy ? 'Document uploaded' : 'Not provided'}</li>
                  {formData.application_type === 'RENEWAL' && (
                    <li>• Renewal Reason: {formData.renewal_reason.substring(0, 50)}...</li>
                  )}
                  {formData.application_type === 'AMENDMENT' && (
                    <>
                      <li>• Amendment Type: {amendmentTypes.find(t => t.id === formData.amendment_type)?.name}</li>
                      <li>• Amendment Details: {formData.amendment_details.substring(0, 50)}...</li>
                    </>
                  )}
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
                disabled={isSubmitting || !ageValid}
                style={{ background: (isSubmitting || !ageValid) ? '#9CA3AF' : COLORS.success }}
                onMouseEnter={e => {
                  if (!isSubmitting && ageValid) e.currentTarget.style.background = COLORS.accent;
                }}
                onMouseLeave={e => {
                  if (!isSubmitting && ageValid) e.currentTarget.style.background = COLORS.success;
                }}
                className={`px-6 py-2 rounded-lg font-semibold text-white ${
                  (isSubmitting || !ageValid) ? 'cursor-not-allowed' : 'transition-colors duration-300'
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

      {/* Verifying Modal */}
      {showVerifyingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Verifying Document...</h3>
              <p className="text-sm text-gray-600 mb-4">Please wait while we verify your document using AI technology</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${verifyingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{verifyingProgress}% Complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Result Modal */}
      {showVerificationModal && verificationModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {verificationModalData.isVerified ? (
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 mr-3" />
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {verificationModalData.isVerified ? 'Document Verified!' : 'Verification Failed'}
                  </h3>
                  <p className="text-sm text-gray-600">{verificationModalData.fileName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {verificationModalData.invalidReasons && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-red-800 mb-2">Issues Found:</p>
                <ul className="list-disc ml-5 space-y-1">
                  {verificationModalData.invalidReasons.map((reason, idx) => (
                    <li key={idx} className="text-sm text-red-700">{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {verificationModalData.isVerified && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">✓ All verification checks passed!</p>
                <p className="text-sm text-green-700 mt-1">The document has been successfully verified and matches the required criteria.</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowVerificationModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barangay Clearance ID Verification Modal */}
      {showBarangayModal && barangayVerificationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {barangayVerificationResult.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 mr-3" />
                )}
                <h3 className="text-xl font-bold">
                  {barangayVerificationResult.success ? 'ID Verified!' : 'Verification Failed'}
                </h3>
              </div>
              <button
                onClick={() => setShowBarangayModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-700 mb-4">{barangayVerificationResult.message}</p>

            {barangayVerificationResult.data && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-sm"><span className="font-medium">Permit ID:</span> {barangayVerificationResult.data.permit_id}</p>
                <p className="text-sm"><span className="font-medium">Applicant:</span> {barangayVerificationResult.data.first_name} {barangayVerificationResult.data.last_name}</p>
                <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-green-600 font-semibold">{barangayVerificationResult.data.status}</span></p>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowBarangayModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview.url && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closePreview}>
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-lg" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-4">
              {showPreview.type === 'image' ? (
                <img src={showPreview.url} alt={showPreview.name} className="max-w-full h-auto" />
              ) : showPreview.type === 'application' ? (
                <iframe src={showPreview.url} className="w-full h-[80vh]" title={showPreview.name} />
              ) : (
                <p>Preview not available for this file type</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Submission</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to submit this liquor permit application? Please ensure all information is correct.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">{modalTitle}</h3>
              <p className="text-gray-700 mb-6">{modalMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">{modalTitle}</h3>
              <p className="text-gray-700 mb-6">{modalMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}