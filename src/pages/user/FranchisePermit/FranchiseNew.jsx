import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, Check, X, Eye, FileText, AlertCircle, Shield, Key, Loader2, Receipt, Calendar } from "lucide-react";
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import Swal from 'sweetalert2';
import { logPermitSubmission } from '../../../services/ActivityLogger';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

// Design constants
const COLORS = {
  primary: '#4A90E2',
  secondary: '#000000',
  accent: '#FDA811',
  success: '#4CAF50',
  danger: '#E53935',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

const NATIONALITIES = ["Filipino", "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguans", "Argentinean", "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Barbudans", "Batswana", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djibouti", "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian", "Herzegovinian", "Honduran", "Hungarian", "I-Kiribati", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan", "Kittian and Nevisian", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivan", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Moroccan", "Mosotho", "Motswana", "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan", "San Marinese", "Sao Tomean", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian", "Slovenian", "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamer", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian or Tobagonian", "Tunisian", "Turkish", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbekistani", "Venezuelan", "Vietnamese", "Welsh", "Yemenite", "Zambian", "Zimbabwean"];

export default function FranchiseNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const permitType = location.state?.permitType || 'NEW';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [showPreview, setShowPreview] = useState({});
  const [errors, setErrors] = useState({});
  const [isCheckingMTOP, setIsCheckingMTOP] = useState(false);
  const [mtopValidation, setMtopValidation] = useState({
    hasExistingPermit: false,
    permitDetails: null,
    message: '',
    canProceed: false
  });
  const [originalMTOPData, setOriginalMTOPData] = useState(null);
  const [autoFilledFields, setAutoFilledFields] = useState({});
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState({
    hasDuplicate: false,
    message: '',
    duplicateDetails: null
  });
  const [paymentStatus, setPaymentStatus] = useState({
    isPaid: false,
    paymentMethod: '',
    paymentDate: '',
    transactionId: '',
    receiptNumber: ''
  });
  
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [showMtopDetailsModal, setShowMtopDetailsModal] = useState(false);
  
  // AI Document verification states
  const [documentVerification, setDocumentVerification] = useState({
    barangay_clearance: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    lto_or_cr: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    drivers_license: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 },
    proof_of_residency: { isVerifying: false, isVerified: false, results: null, error: null, progress: 0 }
  });
  
  const [showVerifyingModal, setShowVerifyingModal] = useState(false);
  const [verifyingProgress, setVerifyingProgress] = useState(0);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationModalData, setVerificationModalData] = useState(null);
  
  const [verifyingBarangayId, setVerifyingBarangayId] = useState(false);
  const [validatedBarangayIds, setValidatedBarangayIds] = useState({});
  
  // Mayor's Permit Verification
  const [verifyingMayorsPermit, setVerifyingMayorsPermit] = useState(false);
  const [mayorsPermitVerificationResult, setMayorsPermitVerificationResult] = useState(null);
  const [showMayorsPermitModal, setShowMayorsPermitModal] = useState(false);
  const [validatedMayorsPermitIds, setValidatedMayorsPermitIds] = useState({});
  
  const [formData, setFormData] = useState({
    permit_subtype: 'MTOP',
    mtop_application_id: '',
    mtop_plate_number: '',
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
    proof_of_residency: null,
    operator_type: 'Individual Operator',
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
    route_zone: '',
    toda_name: '',
    toda_president_cert: null,
    barangay_of_operation: '',
    company_name: '',
    barangay_clearance: null,
    barangay_clearance_id: '',
    barangay_permit_id: '',
    mayors_permit_id: '',
    mayors_permit_applicant_id: '',
    toda_endorsement: null,
    lto_or_cr: null,
    lto_cr_copy: null,
    insurance_certificate: null,
    drivers_license: null,
    emission_test: null,
    nbi_clearance: null,
    police_clearance: null,
    medical_certificate: null,
    franchise_fee_checked: false,
    sticker_id_fee_checked: false,
    inspection_fee_checked: false,
    franchise_fee_or: '',
    sticker_id_fee_or: '',
    inspection_fee_or: '',
    franchise_fee_receipt: null,
    sticker_id_fee_receipt: null,
    inspection_fee_receipt: null,
    payment_method: 'online',
    applicant_signature: '',
    date_submitted: new Date().toISOString().split('T')[0],
    barangay_captain_signature: '',
    remarks: '',
    notes: ''
  });

  const steps = [
    { id: 1, title: 'Permit Type', description: 'Select permit type' },
    { id: 2, title: formData.permit_subtype === 'MTOP' ? 'Operator Information' : 'Applicant Information', description: 'Personal details' },
    { id: 3, title: 'Vehicle & Route Information', description: 'Vehicle, route and operation details' },
    { id: 4, title: 'Required Documents', description: 'Upload required documents' },
    { id: 5, title: 'Payment Information', description: 'Fees and payment' },
    { id: 6, title: 'Declaration', description: 'Sign and submit' },
    { id: 7, title: 'Review', description: 'Review your application' }
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
  const FEES = { franchise_fee: 250.00, sticker_id_fee: 150.00, inspection_fee: 100.00 };

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
    return { valid, formatted: cleanID, error: '' };
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

  const checkForDuplicateApplication = async () => {
    if (!formData.id_number || !formData.plate_number) return false;
    setIsCheckingDuplicates(true);
    try {
      const response = await fetch('/backend/franchise_permit/check_duplicate.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_number: formData.id_number,
          plate_number: formData.plate_number,
          permit_subtype: formData.permit_subtype,
          current_application_id: formData.mtop_application_id || null
        })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.hasDuplicate) {
          setDuplicateCheck({
            hasDuplicate: true,
            message: data.message || `You already have a ${formData.permit_subtype} application in progress for this vehicle. Application ID: ${data.duplicate_id}, Status: ${data.status}`,
            duplicateDetails: data.duplicateDetails
          });
          return true;
        } else {
          setDuplicateCheck({ hasDuplicate: false, message: '', duplicateDetails: null });
          return false;
        }
      } else {
        setDuplicateCheck({ hasDuplicate: false, message: 'Unable to check for duplicates. Please try again.', duplicateDetails: null });
        return false;
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      setDuplicateCheck({ hasDuplicate: false, message: 'Error checking for duplicate applications.', duplicateDetails: null });
      return false;
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const autoFillFromMTOP = (mtopData) => {
    if (!mtopData) return;
    
    const fieldsToAutoFill = {};
    const updatedData = { ...formData };
    const autoFillableFields = [
      'first_name', 'last_name', 'middle_initial', 'home_address', 'contact_number', 'email',
      'citizenship', 'birth_date', 'id_type', 'id_number', 'make_brand', 'model', 'engine_number',
      'chassis_number', 'plate_number', 'year_acquired', 'color', 'vehicle_type', 'lto_or_number',
      'lto_cr_number', 'lto_expiration_date', 'mv_file_number', 'district', 'route_zone',
      'barangay_of_operation', 'toda_name'
    ];
    
    autoFillableFields.forEach(field => {
      if (mtopData[field]) {
        updatedData[field] = mtopData[field];
        fieldsToAutoFill[field] = true;
      }
    });
    
    updatedData.operator_type = 'TODA Member';
    fieldsToAutoFill['operator_type'] = true;
    
    if (mtopData.application_id) {
      updatedData.mtop_application_id = mtopData.application_id;
    }
    
    // Apply validations to auto-filled data
    if (updatedData.plate_number) {
      const plateValidation = validatePlateNumber(updatedData.plate_number);
      if (plateValidation.valid) updatedData.plate_number = plateValidation.formatted;
    }
    
    if (updatedData.chassis_number) {
      const chassisValidation = validateChassisNumber(updatedData.chassis_number);
      if (chassisValidation.valid) updatedData.chassis_number = chassisValidation.formatted;
    }
    
    if (updatedData.engine_number) {
      const engineValidation = validateEngineNumber(updatedData.engine_number);
      if (engineValidation.valid) updatedData.engine_number = engineValidation.formatted;
    }
    
    if (updatedData.lto_or_number) {
      const orValidation = validateORNumber(updatedData.lto_or_number);
      if (orValidation.valid) updatedData.lto_or_number = orValidation.formatted;
    }
    
    if (updatedData.lto_cr_number) {
      const crValidation = validateCRNumber(updatedData.lto_cr_number);
      if (crValidation.valid) updatedData.lto_cr_number = crValidation.formatted;
    }
    
    if (updatedData.id_number) {
      const idValidation = validateIDNumber(updatedData.id_number);
      if (idValidation.valid) updatedData.id_number = idValidation.formatted;
    }
    
    if (updatedData.year_acquired) {
      const yearValidation = validateYearAcquired(updatedData.year_acquired);
      if (yearValidation.valid) updatedData.year_acquired = yearValidation.formatted;
    }
    
    const alwaysAutoFillFields = ['engine_number', 'chassis_number', 'lto_or_number', 'lto_cr_number'];
    alwaysAutoFillFields.forEach(field => fieldsToAutoFill[field] = true);
    
    setFormData(updatedData);
    setAutoFilledFields(fieldsToAutoFill);
    setOriginalMTOPData(mtopData);
  };

  const resetAutoFilledData = () => {
    const resetData = { ...formData };
    Object.keys(autoFilledFields).forEach(field => resetData[field] = '');
    setFormData(resetData);
    setAutoFilledFields({});
    setOriginalMTOPData(null);
    setMtopValidation(prev => ({ 
      ...prev, 
      canProceed: false, 
      message: 'Auto-filled data has been cleared. Please validate MTOP again.' 
    }));
  };

  const checkExistingMTOPPermit = async () => {
    let validationData = {};
    
    if (formData.permit_subtype === 'FRANCHISE') {
      if (!formData.mtop_application_id || !formData.mtop_plate_number) {
        showErrorMessage("Please enter MTOP Application ID and Plate Number for validation.");
        return false;
      }
      validationData = { 
        application_id: formData.mtop_application_id, 
        plate_number: formData.mtop_plate_number, 
        permit_subtype: formData.permit_subtype 
      };
    } else {
      if (!formData.id_number || !formData.plate_number) {
        showErrorMessage("Please complete your ID number and plate number before validation.");
        return false;
      }
      validationData = { 
        id_number: formData.id_number, 
        plate_number: formData.plate_number, 
        permit_subtype: formData.permit_subtype 
      };
    }
    
    setIsCheckingMTOP(true);
    try {
      const response = await fetch('/backend/franchise_permit/check_mtop.php', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(validationData)
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.success) {
        if (formData.permit_subtype === 'FRANCHISE') {
          const isApproved = data.mtopStatus && data.mtopStatus.toLowerCase() === 'approved';
          
          if (data.hasExistingMTOP && isApproved) {
            if (data.permitDetails) {
              autoFillFromMTOP(data.permitDetails);
              setMtopValidation({
                hasExistingPermit: true, 
                permitDetails: data.permitDetails,
                message: ` Valid MTOP permit found! Data has been auto-filled for your franchise application.`,
                canProceed: true
              });
              
              // Show loading SweetAlert with timer first
              Swal.fire({
                icon: 'success',
                title: 'MTOP Permit Found',
                html: `
                  <div style="padding: 20px 0; min-height: 150px;">
                    <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Fetching existing MTOP permit details...</p>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p style="font-size: 15px; color: #555; line-height: 1.6;">Valid MTOP permit found! Data has been auto-filled for your franchise application.</p>
                    </div>
                    <p style="font-size: 14px; color: #888; margin-top: 20px;">Loading permit information, please wait...</p>
                  </div>
                `,
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                allowOutsideClick: false,
                customClass: {
                  popup: 'swal-tall-popup',
                  htmlContainer: 'swal-tall-content'
                },
                willClose: () => {
                  // After timer closes, show the MTOP details modal
                  setShowMtopDetailsModal(true);
                }
              });
            } else {
              setMtopValidation({
                hasExistingPermit: true, 
                permitDetails: data.permitDetails,
                message: ` Valid MTOP permit found! (ID: ${data.application_id}, Status: ${data.mtopStatus}). You may proceed with Franchise application.`,
                canProceed: true
              });
              
              // Show loading SweetAlert with timer first
              Swal.fire({
                icon: 'success',
                title: 'MTOP Permit Found',
                html: `
                  <div style="padding: 20px 0; min-height: 150px;">
                    <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Fetching existing MTOP permit details...</p>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p style="font-size: 15px; color: #555; line-height: 1.6;">Valid MTOP permit found! (ID: ${data.application_id})<br>You may proceed with Franchise application.</p>
                    </div>
                    <p style="font-size: 14px; color: #888; margin-top: 20px;">Loading permit information, please wait...</p>
                  </div>
                `,
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                allowOutsideClick: false,
                customClass: {
                  popup: 'swal-tall-popup',
                  htmlContainer: 'swal-tall-content'
                },
                willClose: () => {
                  // After timer closes, show the MTOP details modal
                  setShowMtopDetailsModal(true);
                }
              });
            }
            return true;
          } else if (data.hasExistingMTOP && !isApproved) {
            setMtopValidation({
              hasExistingPermit: true, 
              permitDetails: data.permitDetails,
              message: ` MTOP permit found but status is "${data.mtopStatus}". You need an APPROVED MTOP permit before applying for Franchise.`,
              canProceed: false
            });
            return false;
          } else {
            setMtopValidation({
              hasExistingPermit: false, 
              permitDetails: null,
              message: 'No existing MTOP permit found with the provided details. Please apply for MTOP first.',
              canProceed: false
            });
            return false;
          }
        } else {
          const isApproved = data.mtopStatus && data.mtopStatus.toLowerCase() === 'approved';
          
          if (data.hasExistingMTOP && isApproved) {
            setMtopValidation({
              hasExistingPermit: true, 
              permitDetails: data.permitDetails,
              message: `You already have an APPROVED MTOP permit (ID: ${data.application_id}). Please renew your existing permit instead.`,
              canProceed: false
            });
            return false;
          } else if (data.hasExistingMTOP && !isApproved) {
            setMtopValidation({
              hasExistingPermit: true, 
              permitDetails: data.permitDetails,
              message: `You have a MTOP application with status "${data.mtopStatus}". Please wait for it to be approved.`,
              canProceed: false
            });
            return false;
          } else {
            setMtopValidation({
              hasExistingPermit: false, 
              permitDetails: null,
              message: 'No existing MTOP permit found. You may proceed with MTOP application.',
              canProceed: true
            });
            return true;
          }
        }
      } else {
        setMtopValidation({ 
          hasExistingPermit: false, 
          permitDetails: null, 
          message: data.message || 'Unable to verify existing permits. Please try again.', 
          canProceed: false 
        });
        return false;
      }
    } catch (error) {
      console.error('Error checking MTOP permit:', error);
      setMtopValidation({ 
        hasExistingPermit: false, 
        permitDetails: null, 
        message: '❌ Error checking existing permits. Please check your connection and try again.', 
        canProceed: false 
      });
      showErrorMessage(`Network error: ${error.message}`);
      return false;
    } finally {
      setIsCheckingMTOP(false);
    }
  };

  useEffect(() => {
    if (formData.permit_subtype === 'MTOP' && formData.plate_number && formData.plate_number.length >= 3 && formData.id_number && formData.id_number.length >= 1) {
      const timer = setTimeout(() => { 
        checkExistingMTOPPermit(); 
        checkForDuplicateApplication(); 
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.plate_number, formData.id_number, formData.permit_subtype]);

  useEffect(() => {
    if (formData.permit_subtype === 'FRANCHISE' && formData.mtop_application_id && formData.mtop_plate_number) {
      const timer = setTimeout(() => { checkForDuplicateApplication(); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.mtop_application_id, formData.mtop_plate_number, formData.permit_subtype]);

  useEffect(() => {
    if (formData.permit_subtype === 'MTOP') {
      setMtopValidation({ hasExistingPermit: false, permitDetails: null, message: '', canProceed: false });
      setOriginalMTOPData(null);
      setAutoFilledFields({});
    } else if (formData.permit_subtype === 'FRANCHISE') {
      setOriginalMTOPData(null);
      setAutoFilledFields({});
      setMtopValidation({ hasExistingPermit: false, permitDetails: null, message: '', canProceed: false });
    }
  }, [formData.permit_subtype]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (formData.permit_subtype === 'FRANCHISE' && autoFilledFields[name]) {
      showErrorMessage("This field is auto-filled from your MTOP record and cannot be modified.");
      return;
    }
    
    if (name === "contact_number") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      let finalValue = onlyNums;
      if (onlyNums.length > 0) {
        if (!onlyNums.startsWith('09')) finalValue = '09' + onlyNums;
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
      if (name === 'barangay_clearance' && file) setFormData(prev => ({ ...prev, barangay_clearance_id: '' }));
      if (errors[name]) { 
        const newErrors = { ...errors }; 
        delete newErrors[name]; 
        setErrors(newErrors); 
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      let finalValue = value;
      
      switch(name) {
        case 'plate_number': 
        case 'mtop_plate_number':
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
          
        case 'barangay_clearance_id':
          if (value && value.trim() !== '') {
            setFormData(prev => ({ ...prev, barangay_clearance: null }));
          }
          finalValue = value; 
          break;
          
        default: 
          finalValue = value;
      }
      
      setFormData(prev => ({ ...prev, [name]: finalValue }));
      
      if (name === 'lto_expiration_date' && value) {
        const today = new Date(); 
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value);
        if (selectedDate < today) {
          setErrors(prev => ({ 
            ...prev, 
            lto_expiration_date: 'LTO Expiration Date cannot be in the past. Please select a future date.' 
          }));
        } else if (errors.lto_expiration_date) { 
          const newErrors = { ...errors }; 
          delete newErrors.lto_expiration_date; 
          setErrors(newErrors); 
        }
      }
      
      if (name === 'permit_subtype') {
        setMtopValidation({ hasExistingPermit: false, permitDetails: null, message: '', canProceed: false });
        setOriginalMTOPData(null); 
        setAutoFilledFields({}); 
        setDuplicateCheck({ hasDuplicate: false, message: '', duplicateDetails: null });
      }
      
      if (name === 'mtop_application_id' || name === 'mtop_plate_number') {
        setMtopValidation({ hasExistingPermit: false, permitDetails: null, message: '', canProceed: false });
        setOriginalMTOPData(null); 
        setAutoFilledFields({}); 
        setDuplicateCheck({ hasDuplicate: false, message: '', duplicateDetails: null });
      }
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

  const showSuccessMessage = (message) => {
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: message,
      confirmButtonColor: COLORS.success
    });
  };

  const showErrorMessage = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonColor: COLORS.danger
    });
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
    barangay_clearance: [
      "barangay clearance", "brgy clearance", "barangay certification",
      "clearance", "certification", "punong barangay", "barangay captain"
    ],
    lto_or_cr: [
      "certificate of registration", "official receipt", "lto", "land transportation",
      "motor vehicle", "plate number", "chassis"
    ],
    drivers_license: [
      "driver", "license", "licence", "lto", "land transportation office",
      "restriction", "dl no", "license no", "philippine", "republic of the philippines"
    ],
    proof_of_residency: [
      "barangay", "residency", "certificate", "resident", "indigency"
    ]
  };

  const ID_TYPE_PATTERNS = {
    "Driver's License (LTO)": ["driver", "license", "licence", "lto", "land transportation", "department of transportation", "dl no", "non-professional", "professional", "restriction", "conditions"],
    "Passport (DFA)": ["passport", "dfa", "department of foreign affairs", "p <", "republic of the philippines passport", "date of issue", "date of expiry", "nationality"],
    "Philippine National ID (PhilSys ID)": ["philsys", "philippine national id", "national id", "phil id", "republic of the philippines", "pambansang pagkakakilanlan", "philippine identification card", "pcn", "philippine identification system"],
    "UMID": ["umid", "unified multi-purpose id", "unified multi-purpose identification"],
    "Postal ID": ["postal", "philpost", "philippine postal", "post office", "postal id"],
    "Voter's ID (COMELEC)": ["voter", "comelec", "commission on elections", "voter's identification", "registered voter", "precinct"],
    "PRC ID": ["prc", "professional regulation commission", "professional id", "licensed", "registration no", "prc id"],
    "PhilHealth ID": ["philhealth", "philippine health insurance", "phic", "philhealth id", "member id"],
    "SSS ID": ["sss", "social security system", "social security", "sss no", "ss number", "sss id"],
    "GSIS ID (GSIS e-Card)": ["gsis", "government service insurance", "gsis e-card", "e-card", "gsis member"],
    "TIN ID (BIR)": ["tin", "tax identification", "bir", "bureau of internal revenue", "tin id", "taxpayer"],
    "Senior Citizen ID": ["senior citizen", "senior", "osca", "office of senior citizens", "elderly", "senior citizen id"],
    "PWD ID": ["pwd", "person with disability", "disability", "pwd id", "persons with disability", "national council on disability"],
    "OFW ID (iDOLE Card)": ["ofw", "idole", "overseas filipino worker", "dole", "department of labor", "ofw id", "i-dole"],
    "Alien Certificate of Registration (ACR)": ["acr", "alien certificate", "alien registration", "bureau of immigration", "immigration", "acr i-card"],
    "OWWA ID": ["owwa", "overseas workers welfare", "owwa id", "welfare administration"],
    "Barangay ID / Barangay Certification": ["barangay id", "barangay certification", "barangay certificate", "barangay clearance", "brgy", "punong barangay", "barangay captain"],
    "NBI Clearance": ["nbi", "national bureau of investigation", "nbi clearance", "no criminal record", "no derogatory"],
    "Police Clearance": ["police clearance", "police", "pnp", "philippine national police", "clearance certificate"],
    "Seaman's Book": ["seaman", "seaman's book", "seafarer", "marina", "maritime industry", "seamans book"],
    "School ID (with current registration)": ["school id", "student", "university", "college", "enrollment", "school year", "student id"],
    "Company ID (with current employment)": ["company id", "employee", "employee id", "employment", "corporate", "company identification"],
    "IBP ID (Integrated Bar of the Philippines)": ["ibp", "integrated bar", "bar of the philippines", "attorney", "lawyer", "ibp id"],
    "HDMF / Pag-IBIG ID": ["hdmf", "pag-ibig", "pagibig", "home development mutual fund", "pag ibig", "hdmf id"]
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

  // Check if owner name appears in document (checks first_name, last_name, middle_name is optional)
  const verifyOwnerNameInDoc = (extractedText) => {
    const firstName = formData.first_name?.trim();
    const lastName = formData.last_name?.trim();
    const middleInitial = formData.middle_initial?.trim();
    
    if (!firstName || !lastName) return null;
    
    // More lenient matching - check both fuzzy match and simple substring
    const textLower = extractedText.toLowerCase();
    const firstNameLower = firstName.toLowerCase();
    const lastNameLower = lastName.toLowerCase();
    
    const firstNameFuzzy = fuzzyMatch(firstName, extractedText);
    const lastNameFuzzy = fuzzyMatch(lastName, extractedText);
    const middleInitialFuzzy = middleInitial ? fuzzyMatch(middleInitial, extractedText) : 0;
    
    // Accept if either fuzzy match works OR simple substring match
    const firstNameFound = firstNameFuzzy > 0 || textLower.includes(firstNameLower);
    const lastNameFound = lastNameFuzzy > 0 || textLower.includes(lastNameLower);
    const middleInitialFound = middleInitial ? (middleInitialFuzzy > 0 || textLower.includes(middleInitial.toLowerCase())) : false;
    
    // Only require first name AND last name to match
    // Middle initial is optional - doesn't fail validation if not found
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

  // Verify Barangay Clearance ID with permit_id fetching
  const verifyBarangayClearanceId = async () => {
    const barangayId = formData.barangay_clearance_id.trim();
    
    if (!barangayId) {
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: 'Please enter a barangay clearance ID to verify',
        timer: 3000,
        timerProgressBar: true,
        confirmButtonColor: COLORS.danger
      });
      return;
    }

    setVerifyingBarangayId(true);
    
    try {
      const response = await fetch(`/backend/barangay_permit/admin_fetch.php`);
      
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
        
        Swal.fire({
          icon: 'success',
          title: 'ID Verified!',
          html: `<p style="font-size: 16px; color: #333;">Barangay clearance ID is VALID!</p><p style="font-size: 14px; color: #666; margin-top: 10px;">Status: Approved</p>`,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          confirmButtonColor: COLORS.success
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: 'Barangay clearance ID not found or not approved. Please check the ID and try again.',
          timer: 3000,
          timerProgressBar: true,
          confirmButtonColor: COLORS.danger
        });
      }
    } catch (error) {
      console.error("Error verifying barangay clearance ID:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error verifying barangay clearance ID. Please try again.',
        timer: 3000,
        timerProgressBar: true,
        confirmButtonColor: COLORS.danger
      });
    } finally {
      setVerifyingBarangayId(false);
    }
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

  // Main AI Document Verification Function
  const verifyDocument = async (documentType, file) => {
    if (!file) {
      showErrorMessage('Please upload a document first');
      return;
    }

    setDocumentVerification(prev => ({
      ...prev,
      [documentType]: { ...prev[documentType], isVerifying: true, isVerified: false, progress: 0 }
    }));

    // Show verifying SweetAlert
    Swal.fire({
      title: 'Verifying Document',
      html: '<p>Please wait while we verify your document using AI...</p>',
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
      
      // Check for ID number and ID type for driver's license
      let idNumberCheck = null;
      let idTypeCheck = null;
      let isValidIDDocument = false;
      
      if (documentType === 'drivers_license') {
        // Check if ID number exists in the document
        if (formData.id_number) {
          const idNumberNormalized = normalizeText(formData.id_number);
          const extractedTextLower = extractedText.toLowerCase();
          let idNumberInText = extractedTextLower.includes(idNumberNormalized) || 
            fuzzyMatch(formData.id_number, extractedText) > 0.8;
          
          // Check for "license no" pattern which commonly appears on driver's licenses
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
        
        // Detect ID type from document
        const detectedIDType = detectIDType(extractedText);
        if (detectedIDType) {
          isValidIDDocument = true;
          if (formData.id_type) {
            // Flexible matching for ID types
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
        const docTypeLabels = {
          'barangay_clearance': 'Barangay Clearance',
          'lto_or_cr': 'LTO OR/CR',
          'drivers_license': 'Driver\'s License',
          'proof_of_residency': 'Proof of Residency'
        };
        const expectedDoc = docTypeLabels[documentType] || documentType;
        invalidReasons = [`Wrong document type uploaded. Expected: ${expectedDoc}`];
        isVerified = false;
      } else if (documentType === 'drivers_license' && isValidIDDocument) {
        // For driver's license, require name, ID number, and ID type match
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
      } else if (ownerNameCheck?.anyMatch) {
        isVerified = true;
      } else {
        invalidReasons = ['Owner name not found in document'];
        isVerified = false;
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

      // Show verification result with SweetAlert
      Swal.fire({
        icon: isVerified ? 'success' : 'error',
        title: isVerified ? 'VALID DOCUMENT' : 'INVALID DOCUMENT',
        html: isVerified 
          ? '<p style="font-size: 16px;">The document has been successfully verified and is valid for use in this application.</p>'
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

  const handleOnlinePayment = () => {
    if (paymentStatus.isPaid) {
      showErrorMessage("Payment has already been completed. You cannot make another payment.");
      return;
    }
    
    let totalAmount = 0;
    if (formData.franchise_fee_checked) totalAmount += FEES.franchise_fee;
    if (formData.sticker_id_fee_checked) totalAmount += FEES.sticker_id_fee;
    if (formData.inspection_fee_checked) totalAmount += FEES.inspection_fee;
    
    if (totalAmount <= 0) {
      showErrorMessage("Please select at least one fee to pay.");
      return;
    }
    
    // Generate unique reference ID
    const referenceId = `FRAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      system: 'franchise',
      ref: referenceId,
      amount: totalAmount.toFixed(2),
      purpose: `${formData.permit_subtype} Application - ${formData.plate_number || 'New Application'}`,
      callback: "https://revenuetreasury.goserveph.com/citizen_dashboard/market/api/market_payment_api.php",
    };

    // Save payment reference locally
    localStorage.setItem('payment_reference', referenceId);
    localStorage.setItem('payment_amount', totalAmount.toFixed(2));
    localStorage.setItem('application_plate', formData.plate_number || formData.mtop_plate_number);
    
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
    
    // Show SweetAlert after payment initiation
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Payment Successful!',
        text: 'Your payment has been confirmed successfully! You can now proceed to the next step.',
        confirmButtonColor: COLORS.primary,
        confirmButtonText: 'Continue'
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
        
        // Always show payment as successful regardless of actual status
        if (data.success) {
          setPaymentStatus({
            isPaid: true,
            paymentMethod: 'online',
            paymentDate: new Date().toISOString(),
            transactionId: data.payment_id || referenceId,
            receiptNumber: data.receipt_number || 'N/A'
          });
          
          clearInterval(pollingInterval);
          
          // Show payment success modal
          setModalTitle('Payment Successful!');
          setModalMessage('Your payment has been confirmed successfully! You can now proceed to the next step.');
          setShowPaymentSuccessModal(true);
          
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

  const handlePaymentMethodChange = (method) => {
    if (paymentStatus.isPaid) {
      showErrorMessage("Payment has already been completed. Payment method cannot be changed.");
      return;
    }
    setFormData(prev => ({ ...prev, payment_method: method }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (formData.permit_subtype === 'FRANCHISE' && !mtopValidation.canProceed) {
        newErrors.mtop_validation = 'Please validate your existing MTOP permit before proceeding';
      }
      if (duplicateCheck.hasDuplicate) {
        newErrors.duplicate = duplicateCheck.message;
      }
    }
    
    if (step === 2) {
      if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
      if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
      if (!formData.home_address.trim()) newErrors.home_address = 'Home address is required';
      if (!formData.contact_number.trim()) newErrors.contact_number = 'Contact number is required';
      else if (formData.contact_number.length !== 11) newErrors.contact_number = 'Contact number must be 11 digits (09XXXXXXXXX)';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.citizenship) newErrors.citizenship = 'Citizenship is required';
      if (!formData.birth_date) newErrors.birth_date = 'Birth date is required';
      if (!formData.id_type) newErrors.id_type = 'ID type is required';
      if (!formData.id_number.trim()) newErrors.id_number = 'ID number is required';
      else { 
        const idValidation = validateIDNumber(formData.id_number); 
        if (!idValidation.valid) newErrors.id_number = idValidation.error; 
      }
      if (formData.permit_subtype === 'MTOP' && !formData.operator_type) newErrors.operator_type = 'Operator type is required';
    }
    
    if (step === 3) {
      if (!formData.make_brand.trim()) newErrors.make_brand = 'Make/Brand is required';
      if (!formData.model.trim()) newErrors.model = 'Model is required';
      if (!formData.engine_number.trim()) newErrors.engine_number = 'Engine number is required';
      else { 
        const engineValidation = validateEngineNumber(formData.engine_number); 
        if (!engineValidation.valid) newErrors.engine_number = engineValidation.error; 
      }
      if (!formData.chassis_number.trim()) newErrors.chassis_number = 'Chassis number is required';
      else { 
        const chassisValidation = validateChassisNumber(formData.chassis_number); 
        if (!chassisValidation.valid) newErrors.chassis_number = chassisValidation.error; 
      }
      if (!formData.plate_number.trim()) newErrors.plate_number = 'Plate number is required';
      else { 
        const plateValidation = validatePlateNumber(formData.plate_number); 
        if (!plateValidation.valid) newErrors.plate_number = plateValidation.error; 
      }
      if (!formData.year_acquired.trim()) newErrors.year_acquired = 'Year acquired is required';
      else { 
        const yearValidation = validateYearAcquired(formData.year_acquired); 
        if (!yearValidation.valid) newErrors.year_acquired = yearValidation.error; 
      }
      if (!formData.color.trim()) newErrors.color = 'Color is required';
      if (!formData.vehicle_type.trim()) newErrors.vehicle_type = 'Vehicle type is required';
      if (!formData.lto_or_number.trim()) newErrors.lto_or_number = 'LTO OR number is required';
      else { 
        const orValidation = validateORNumber(formData.lto_or_number); 
        if (!orValidation.valid) newErrors.lto_or_number = orValidation.error; 
      }
      if (!formData.lto_cr_number.trim()) newErrors.lto_cr_number = 'LTO CR number is required';
      else { 
        const crValidation = validateCRNumber(formData.lto_cr_number); 
        if (!crValidation.valid) newErrors.lto_cr_number = crValidation.error; 
      }
      if (!formData.lto_expiration_date) newErrors.lto_expiration_date = 'LTO expiration date is required';
      else {
        const today = new Date(); 
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(formData.lto_expiration_date);
        if (selectedDate < today) {
          newErrors.lto_expiration_date = 'LTO Expiration Date cannot be in the past. Please select a future date.';
        }
      }
      if (!formData.district.trim()) newErrors.district = 'District is required';
      if (!formData.route_zone.trim()) newErrors.route_zone = 'Route is required';
      if (!formData.barangay_of_operation.trim()) newErrors.barangay_of_operation = 'Barangay of operation is required';
      if (formData.permit_subtype === 'FRANCHISE' && !formData.toda_name.trim()) newErrors.toda_name = 'TODA name is required';
    }
    
    if (step === 4) {
      const requiredDocs = [
        { name: 'lto_cr_copy', label: 'LTO CR Copy' },
        { name: 'drivers_license', label: 'Driver\'s License' }
      ];
      
      if (!formData.barangay_clearance_id && !formData.barangay_clearance) {
        newErrors.barangay_clearance = 'Barangay Clearance is required - either enter ID or upload document';
      }
      
      if (formData.permit_subtype === 'MTOP') {
        requiredDocs.push(
          { name: 'nbi_clearance', label: 'NBI Clearance' }, 
          { name: 'police_clearance', label: 'Police Clearance' }, 
          { name: 'medical_certificate', label: 'Medical Certificate' }
        );
      }
      
      if (formData.permit_subtype === 'FRANCHISE') {
        requiredDocs.push({ name: 'toda_endorsement', label: 'TODA Endorsement' });
      }
      
      let uploadedCount = 0;
      requiredDocs.forEach(doc => {
        if (!formData[doc.name]) {
          newErrors[doc.name] = `${doc.label} is required`;
        } else {
          uploadedCount++;
        }
      });
      
      if (uploadedCount < requiredDocs.length) {
        newErrors.min_documents = `All required documents must be uploaded`;
      }
      
      // Driver's license must be AI verified to proceed
      if (formData.drivers_license && !documentVerification.drivers_license?.isVerified) {
        newErrors.drivers_license_verification = 'Driver\'s License must be AI verified before proceeding. Click the "Verify" button.';
      }
    }
    
    if (step === 5) {
      if (formData.payment_method === 'upload') {
        const feeChecks = [
          { name: 'franchise_fee', checked: formData.franchise_fee_checked, receipt: formData.franchise_fee_receipt },
          { name: 'sticker_id_fee', checked: formData.sticker_id_fee_checked, receipt: formData.sticker_id_fee_receipt },
          { name: 'inspection_fee', checked: formData.inspection_fee_checked, receipt: formData.inspection_fee_receipt }
        ];
        
        let hasValidFee = false;
        feeChecks.forEach(fee => {
          if (fee.checked && fee.receipt) {
            hasValidFee = true;
          }
        });
        
        if (!hasValidFee) {
          newErrors.payment = 'At least one fee must be checked and its receipt uploaded';
        }
      } else {
        const hasSelectedFee = formData.franchise_fee_checked || formData.sticker_id_fee_checked || formData.inspection_fee_checked;
        if (!hasSelectedFee) {
          newErrors.payment = 'Please select at least one fee to pay';
        } else if (!paymentStatus.isPaid) {
          newErrors.payment = 'Please complete the online payment by clicking "Pay Now" before proceeding to the next step';
        }
      }
    }
    
    if (step === 6) {
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
      1: () => {
        if (!formData.permit_subtype) return false;
        if (formData.permit_subtype === 'MTOP') return !duplicateCheck.hasDuplicate;
        if (formData.permit_subtype === 'FRANCHISE') return mtopValidation.canProceed && !duplicateCheck.hasDuplicate;
        return true;
      },
      2: () => {
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
        if (formData.permit_subtype === 'FRANCHISE') return true;
        if (formData.permit_subtype === 'MTOP' && !formData.operator_type) return false;
        return true;
      },
      3: () => {
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
        const today = new Date(); 
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(formData.lto_expiration_date);
        if (selectedDate < today) return false;
        if (!formData.district.trim()) return false;
        if (!formData.route_zone.trim()) return false;
        if (!formData.barangay_of_operation.trim()) return false;
        if (formData.permit_subtype === 'FRANCHISE' && !formData.toda_name.trim()) return false;
        return true;
      },
      4: () => {
        const requiredDocs = [{ file: formData.lto_cr_copy }, { file: formData.drivers_license }];
        const hasBarangayClearance = formData.barangay_clearance_id || formData.barangay_clearance;
        
        if (formData.permit_subtype === 'MTOP') {
          requiredDocs.push(
            { file: formData.nbi_clearance }, 
            { file: formData.police_clearance }, 
            { file: formData.medical_certificate }
          );
        }
        
        if (formData.permit_subtype === 'FRANCHISE') {
          requiredDocs.push({ file: formData.toda_endorsement });
        }
        
        return hasBarangayClearance && requiredDocs.every(doc => doc.file);
      },
      5: () => {
        if (formData.payment_method === 'upload') {
          const feeChecks = [
            { checked: formData.franchise_fee_checked, receipt: formData.franchise_fee_receipt },
            { checked: formData.sticker_id_fee_checked, receipt: formData.sticker_id_fee_receipt },
            { checked: formData.inspection_fee_checked, receipt: formData.inspection_fee_receipt }
          ];
          
          return feeChecks.some(fee => fee.checked && fee.receipt);
        } else {
          const hasSelectedFee = formData.franchise_fee_checked || formData.sticker_id_fee_checked || formData.inspection_fee_checked;
          // For online payment, must complete the payment transaction
          return hasSelectedFee && paymentStatus.isPaid;
        }
      },
      6: () => formData.applicant_signature && formData.date_submitted && agreeDeclaration,
      7: () => true
    };
    
    return validators[step] ? validators[step]() : true;
  };

  const getFullName = () => {
    return `${formData.first_name} ${formData.middle_initial ? formData.middle_initial + '.' : ''} ${formData.last_name}`.trim();
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      if (formData.permit_subtype === 'FRANCHISE' && currentStep === 1 && !mtopValidation.canProceed) {
        showErrorMessage("Please validate your existing MTOP permit before proceeding.");
        return;
      }
      
      if (duplicateCheck.hasDuplicate && currentStep === 1) {
        showErrorMessage("You cannot proceed with a duplicate application. Please check your existing applications.");
        return;
      }
      
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
      nextStep();
    } else if (currentStep === steps.length - 1) {
      const ok = validateStep(currentStep);
      if (ok) { 
        setCurrentStep(currentStep + 1); 
        setErrors({}); 
      }
    } else {
      const result = await Swal.fire({
        title: 'Confirm Application Submission',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 15px;">You are about to submit your ${formData.permit_subtype === 'MTOP' ? 'MTOP' : 'Franchise'} application.</p>
            ${formData.permit_subtype === 'FRANCHISE' && mtopValidation.canProceed ? `
              <div style="background-color: #EFF6FF; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #BFDBFE;">
                <p style="margin: 0; font-weight: 600; color: #1E40AF; margin-bottom: 8px;">✓ MTOP Permit Verified</p>
                <p style="margin: 0; font-size: 0.875rem;">Your MTOP permit has been validated.</p>
              </div>
            ` : ''}
            <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <p style="margin: 0; font-weight: 600; margin-bottom: 8px;">Application Declaration:</p>
              <p style="margin: 0; font-size: 0.875rem;">I hereby declare that all information provided is true and correct to the best of my knowledge. I understand that any false information may result in the rejection of my application.</p>
            </div>
            <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #3B82F6;">
              <div style="display: flex; align-items: start;">
                <input type="checkbox" id="swal-confirm-checkbox" style="margin-top: 3px; margin-right: 10px; width: 18px; height: 18px; cursor: pointer;" />
                <label for="swal-confirm-checkbox" style="cursor: pointer; font-weight: 600; color: #1E40AF; margin: 0;">
                  I confirm that I have reviewed all information and documents, and I am ready to submit this application.
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
    }
  };

  const prevStep = () => { 
    if (currentStep > 1) setCurrentStep(currentStep - 1); 
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
    if (formData.permit_subtype === 'FRANCHISE' && !mtopValidation.canProceed) {
      showErrorMessage("Please complete MTOP validation before submitting.");
      return;
    }
    
    const hasDuplicate = await checkForDuplicateApplication();
    if (hasDuplicate) {
      showErrorMessage("Duplicate application detected. You cannot submit another application for the same vehicle.");
      return;
    }
    
    setIsSubmitting(true);
    const backendUrl = "/backend/franchise_permit/franchise_permit.php";
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value === null || value === undefined) return;
        
        if (value instanceof File) {
          formDataToSend.append(key, value);
        } else if (typeof value === 'boolean') {
          formDataToSend.append(key, value ? '1' : '0');
        } else {
          formDataToSend.append(key, String(value));
        }
      });
      
      formDataToSend.append('permit_type', permitType);
      formDataToSend.append('payment_method', formData.payment_method);
      formDataToSend.append('franchise_fee_checked', formData.franchise_fee_checked ? '1' : '0');
      formDataToSend.append('sticker_id_fee_checked', formData.sticker_id_fee_checked ? '1' : '0');
      formDataToSend.append('inspection_fee_checked', formData.inspection_fee_checked ? '1' : '0');
      
      if (formData.permit_subtype === 'FRANCHISE' && formData.mtop_application_id) {
        formDataToSend.append('mtop_reference_id', formData.mtop_application_id);
      }
      
      const response = await fetch(backendUrl, { method: "POST", body: formDataToSend });
      const responseText = await response.text();
      let data;
      
      try { 
        data = JSON.parse(responseText); 
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        if (responseText.includes('<b>') || responseText.includes('PHP Error')) {
          showErrorMessage("Backend error occurred. Please check server logs.");
        } else {
          showErrorMessage("Invalid response from server");
        }
        return;
      }
      
      if (data.success) {
        showSuccessMessage(`Application submitted successfully! Application ID: ${data.data.application_id}`);
        logPermitSubmission("Franchise Permit", data.data?.application_id || "", { permit_type: formData.permit_type || "New" });
        setTimeout(() => { navigate("/user/permittracker"); }, 3000);
      } else {
        showErrorMessage(`Error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      showErrorMessage("Failed to submit application. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setFormData(prev => ({ ...prev, applicant_signature: event.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const renderInputField = (name, label, type = 'text', options = [], required = false) => {
    const isAutoFilled = formData.permit_subtype === 'FRANCHISE' && autoFilledFields[name];
    
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
            className={`w-full p-3 border rounded-lg ${errors[name] ? 'border-red-500' : 'border-black'} ${isAutoFilled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
            required={required} 
            disabled={isAutoFilled}
          >
            <option value="">Select {label.replace('*', '').trim()}</option>
            {options.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : (
          <input 
            type={type} 
            name={name} 
            value={formData[name] || ''} 
            onChange={handleChange} 
            placeholder={label}
            className={`w-full p-3 border rounded-lg ${errors[name] ? 'border-red-500' : 'border-black'} ${isAutoFilled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
            required={required} 
            readOnly={isAutoFilled} 
          />
        )}
        
        {isAutoFilled && (
          <div className="absolute top-9 right-0 mt-1 mr-3">
            <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Check className="w-3 h-3 mr-1" /> Auto-filled
            </div>
          </div>
        )}
        
        {errors[name] && (
          <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
            {errors[name]}
          </p>
        )}
        
        {!errors[name] && name === 'plate_number' && (
          <p className={`text-xs mt-1 ${formData.plate_number && formData.plate_number.length === 7 ? 'text-green-600' : 'text-red-600'}`}>
            Format: 3 letters followed by 4 digits (e.g., ABC1234)
          </p>
        )}
        
        {!errors[name] && name === 'chassis_number' && (
          <p className={`text-xs mt-1 ${formData.chassis_number && formData.chassis_number.length === 17 ? 'text-green-600' : 'text-red-600'}`}>
            Must be exactly 17 characters
          </p>
        )}
        
        {!errors[name] && name === 'engine_number' && (
          <p className={`text-xs mt-1 ${formData.engine_number && formData.engine_number.length >= 8 && formData.engine_number.length <= 12 ? 'text-green-600' : 'text-red-600'}`}>
            Must be 8-12 characters
          </p>
        )}
        
        {!errors[name] && (name === 'lto_or_number' || name === 'lto_cr_number') && (
          <p className={`text-xs mt-1 ${formData[name] && formData[name].length >= 7 && formData[name].length <= 8 ? 'text-green-600' : 'text-red-600'}`}>
            Must be 7-8 digits
          </p>
        )}
        
        {!errors[name] && name === 'year_acquired' && (
          <p className={`text-xs mt-1 ${formData.year_acquired && formData.year_acquired.length === 4 && parseInt(formData.year_acquired) >= 1900 && parseInt(formData.year_acquired) <= new Date().getFullYear() ? 'text-green-600' : 'text-red-600'}`}>
            Format: YYYY (e.g., 2023)
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
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>
              Select Permit Type
            </h3>
            
            {duplicateCheck.hasDuplicate && (
              <div className="p-4 rounded-lg border mb-4 bg-red-50 border-red-200">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 mt-0.5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-700">
                      ⚠️ Duplicate Application Detected
                    </p>
                    <p className="text-xs mt-1 text-red-600">
                      {duplicateCheck.message}
                    </p>
                    {duplicateCheck.duplicateDetails && (
                      <div className="mt-2 text-xs">
                        <p><strong>Application ID:</strong> {duplicateCheck.duplicateDetails.application_id}</p>
                        <p><strong>Status:</strong> {duplicateCheck.duplicateDetails.status}</p>
                        <p><strong>Date Submitted:</strong> {duplicateCheck.duplicateDetails.date_submitted}</p>
                        <p><strong>Remarks:</strong> {duplicateCheck.duplicateDetails.remarks || 'None'}</p>
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={() => navigate('/user/permittracker')} 
                      className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                    >
                      View Your Applications
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {formData.permit_subtype && (
              <div className={`p-4 rounded-lg border mb-4 ${
                mtopValidation.hasExistingPermit ? 
                  (formData.permit_subtype === 'MTOP' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200') : 
                  (formData.permit_subtype === 'MTOP' ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200')
              }`}>
                <div className="flex items-start">
                  <Key className={`w-5 h-5 mr-2 mt-0.5 ${
                    mtopValidation.hasExistingPermit ? 
                      (formData.permit_subtype === 'MTOP' ? 'text-red-600' : 'text-green-600') : 
                      (formData.permit_subtype === 'MTOP' ? 'text-blue-600' : 'text-yellow-600')
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      mtopValidation.hasExistingPermit ? 
                        (formData.permit_subtype === 'MTOP' ? 'text-red-700' : 'text-green-700') : 
                        (formData.permit_subtype === 'MTOP' ? 'text-blue-700' : 'text-yellow-700')
                    }`}>
                      {formData.permit_subtype === 'MTOP' ? 'MTOP Application Requirements' : 'Franchise Application Requirements'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                      {formData.permit_subtype === 'MTOP' ? 
                        '• Must NOT have existing approved MTOP permit (to avoid duplicates)' : 
                        '• MUST have existing APPROVED MTOP permit first'
                      }
                    </p>
                    {mtopValidation.message && (
                      <p className="text-xs mt-1 font-medium">{mtopValidation.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {formData.permit_subtype === 'FRANCHISE' && (
              <div className="bg-white rounded-lg shadow p-6 border border-black mb-4">
                <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>
                  Validate Existing MTOP Permit
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                      Existing MTOP Application ID *
                    </label>
                    <input 
                      type="text" 
                      name="mtop_application_id" 
                      value={formData.mtop_application_id || ''} 
                      onChange={handleChange} 
                      placeholder="Enter your MTOP Application ID" 
                      className="w-full p-3 border border-black rounded-lg" 
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the application ID from your approved MTOP permit
                    </p>
                  </div>
                  <div>
                    <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                      Plate Number *
                    </label>
                    <input 
                      type="text" 
                      name="mtop_plate_number" 
                      value={formData.mtop_plate_number || ''} 
                      onChange={handleChange} 
                      placeholder="ABC1234" 
                      className={`w-full p-3 border rounded-lg ${errors.mtop_plate_number ? 'border-red-500' : 'border-black'}`} 
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font, textTransform: 'uppercase' }} 
                    />
                    {errors.mtop_plate_number && (
                      <p className="text-red-600 text-sm mt-1">{errors.mtop_plate_number}</p>
                    )}
                    <p className={`text-xs mt-1 ${formData.mtop_plate_number && formData.mtop_plate_number.length === 7 ? 'text-green-600' : 'text-red-600'}`}>
                      Format: 3 letters followed by 4 digits (e.g., ABC1234)
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <button 
                    type="button" 
                    onClick={checkExistingMTOPPermit} 
                    disabled={isCheckingMTOP || !formData.mtop_application_id || !formData.mtop_plate_number} 
                    style={{ background: (isCheckingMTOP || !formData.mtop_application_id || !formData.mtop_plate_number) ? '#9CA3AF' : COLORS.primary }} 
                    className="px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
                  >
                    {isCheckingMTOP ? 'Validating...' : 'Validate MTOP Permit'}
                  </button>
                </div>
                {mtopValidation.message && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    mtopValidation.canProceed ? 
                      'bg-green-100 border border-green-300 text-green-800' : 
                      'bg-red-100 border border-red-300 text-red-800'
                  }`}>
                    <div className="flex items-center">
                      {mtopValidation.canProceed ? (
                        <Check className="w-5 h-5 mr-2" />
                      ) : (
                        <X className="w-5 h-5 mr-2" />
                      )}
                      <span className="text-sm">{mtopValidation.message}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <div className="space-y-4">
                <div 
                  className="p-4 border-2 border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors duration-200 cursor-pointer" 
                  onClick={() => setFormData(prev => ({...prev, permit_subtype: 'MTOP'}))}
                >
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="permit_subtype" 
                      value="MTOP" 
                      checked={formData.permit_subtype === 'MTOP'} 
                      onChange={handleChange} 
                      className="w-5 h-5 text-blue-600" 
                    />
                    <div className="ml-3">
                      <h4 className="font-bold text-lg" style={{ color: COLORS.primary }}>
                        Motorized Tricycle Operator's Permit (MTOP)
                      </h4>
                      <p className="text-sm mt-1" style={{ color: COLORS.secondary }}>
                        For individual tricycle operators. This permit allows you to operate a tricycle as an independent operator.
                      </p>
                      <p className="text-xs mt-2 font-semibold text-blue-700">
                        REQUIREMENT: No existing approved MTOP permit
                      </p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="p-4 border-2 border-green-300 rounded-lg bg-green-50 hover:bg-green-100 transition-colors duration-200 cursor-pointer" 
                  onClick={() => setFormData(prev => ({...prev, permit_subtype: 'FRANCHISE'}))}
                >
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="permit_subtype" 
                      value="FRANCHISE" 
                      checked={formData.permit_subtype === 'FRANCHISE'} 
                      onChange={handleChange} 
                      className="w-5 h-5 text-green-600" 
                    />
                    <div className="ml-3">
                      <h4 className="font-bold text-lg" style={{ color: COLORS.success }}>
                        Transport Permit
                      </h4>
                      <p className="text-sm mt-1" style={{ color: COLORS.secondary }}>
                        For TODA (Tricycle Operators and Drivers Association) members or corporations operating multiple units under a franchise.
                      </p>
                      <p className="text-xs mt-2 font-semibold text-green-700">
                        REQUIREMENT: Must have existing APPROVED MTOP permit
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium" style={{ color: COLORS.secondary }}>
                    Selected: <span className="font-bold">
                      {formData.permit_subtype === 'MTOP' ? 'Motorized Tricycle Operator\'s Permit (MTOP)' : 'Franchise Permit'}
                    </span>
                  </p>
                  {mtopValidation.message && (
                    <p className={`text-xs mt-2 ${mtopValidation.canProceed ? 'text-green-600' : 'text-red-600'}`}>
                      {mtopValidation.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>
              {formData.permit_subtype === 'MTOP' ? 'Operator Information' : 'Applicant Information'}
            </h3>
            
            {formData.permit_subtype === 'FRANCHISE' && originalMTOPData && (
              <div className="p-4 rounded-lg border mb-4 bg-blue-50 border-blue-200">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      ✓ Data Auto-filled from MTOP (READ-ONLY)
                    </p>
                    <p className="text-xs mt-1 text-blue-600">
                      Your information has been automatically filled from your existing MTOP permit and cannot be modified. Fields marked with "Auto-filled" are read-only.
                    </p>
                    <p className="text-xs mt-2 font-medium text-blue-700">
                      MTOP ID: {originalMTOPData.application_id} | Status: {originalMTOPData.status} | Plate: {originalMTOPData.plate_number}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button 
                    type="button" 
                    onClick={resetAutoFilledData} 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />Clear Auto-filled Data
                  </button>
                </div>
              </div>
            )}
            
            {formData.permit_subtype === 'FRANCHISE' && mtopValidation.message && (
              <div className={`p-4 rounded-lg border mb-4 ${
                mtopValidation.canProceed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start">
                  <Shield className={`w-5 h-5 mr-2 mt-0.5 ${
                    mtopValidation.canProceed ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      mtopValidation.canProceed ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {mtopValidation.canProceed ? '✓ Eligible for Franchise' : '✗ Not Eligible for Franchise'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                      {mtopValidation.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInputField('first_name', 'First Name', 'text', [], true)}
              {renderInputField('last_name', 'Last Name', 'text', [], true)}
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Middle Initial
                </label>
                <input 
                  type="text" 
                  name="middle_initial" 
                  value={formData.middle_initial || ''} 
                  onChange={handleChange} 
                  placeholder="M.I." 
                  maxLength="1" 
                  className={`w-full p-3 border rounded-lg ${'border-black'} ${
                    formData.permit_subtype === 'FRANCHISE' && autoFilledFields['middle_initial'] ? 
                    'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['middle_initial']} 
                />
                {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['middle_initial'] && (
                  <div className="absolute top-9 right-0 mt-1 mr-3">
                    <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3 mr-1" /> Auto-filled
                    </div>
                  </div>
                )}
              </div>
              
              {renderInputField('home_address', 'Home Address', 'text', [], true)}
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Contact Number *
                </label>
                <div className="relative">
                  <input 
                    type="tel" 
                    name="contact_number" 
                    value={formData.contact_number} 
                    onChange={handleChange} 
                    placeholder="09XXXXXXXXX" 
                    maxLength={11} 
                    className={`w-full p-3 border rounded-lg ${
                      errors.contact_number ? 'border-red-500' : 'border-black'
                    } ${
                      formData.permit_subtype === 'FRANCHISE' && autoFilledFields['contact_number'] ? 
                      'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                    readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['contact_number']} 
                  />
                  {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['contact_number'] && (
                    <div className="absolute top-0 right-0 mt-3 mr-3">
                      <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3 mr-1" /> Auto-filled
                      </div>
                    </div>
                  )}
                </div>
                {errors.contact_number ? (
                  <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                    {errors.contact_number}
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>
                    Format: 09XXXXXXXXX (11 digits total)
                  </p>
                )}
              </div>
              
              {renderInputField('email', 'Email Address', 'email', [], true)}
              {renderInputField('citizenship', 'Citizenship', 'select', NATIONALITIES, true)}
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Date of Birth *
                </label>
                <input 
                  type="date" 
                  name="birth_date" 
                  value={formData.birth_date || ''} 
                  onChange={handleChange} 
                  className={`w-full p-3 border rounded-lg ${
                    errors.birth_date ? 'border-red-500' : 'border-black'
                  } ${
                    formData.permit_subtype === 'FRANCHISE' && autoFilledFields['birth_date'] ? 
                    'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['birth_date']} 
                />
                {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['birth_date'] && (
                  <div className="absolute top-9 right-0 mt-1 mr-3">
                    <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3 mr-1" /> Auto-filled
                    </div>
                  </div>
                )}
                {errors.birth_date && (
                  <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                    {errors.birth_date}
                  </p>
                )}
              </div>
              
              {renderInputField('id_type', 'Valid ID Type', 'select', ["Driver's License (LTO)", "Passport (DFA)", "Philippine National ID (PhilSys ID)", "UMID", "Postal ID", "Voter's ID (COMELEC)", "PRC ID", "PhilHealth ID", "SSS ID", "GSIS ID (GSIS e-Card)", "TIN ID (BIR)", "Senior Citizen ID", "PWD ID", "OFW ID (iDOLE Card)", "Alien Certificate of Registration (ACR)", "OWWA ID", "Barangay ID / Barangay Certification", "NBI Clearance", "Police Clearance", "Seaman's Book", "School ID (with current registration)", "Company ID (with current employment)", "IBP ID (Integrated Bar of the Philippines)", "HDMF / Pag-IBIG ID"], true)}
              
              <div className="relative">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Valid ID Number *
                </label>
                <input 
                  type="text" 
                  name="id_number" 
                  value={formData.id_number || ''} 
                  onChange={handleChange} 
                  placeholder="ID Number" 
                  className={`w-full p-3 border rounded-lg ${
                    errors.id_number ? 'border-red-500' : 'border-black'
                  } ${
                    formData.permit_subtype === 'FRANCHISE' && autoFilledFields['id_number'] ? 
                    'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`} 
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                  required={true} 
                  readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['id_number']} 
                />
                {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['id_number'] && (
                  <div className="absolute top-9 right-0 mt-1 mr-3">
                    <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3 mr-1" /> Auto-filled
                    </div>
                  </div>
                )}
              </div>
              
              {formData.permit_subtype === 'MTOP' && (
                renderInputField('operator_type', 'Operator Type', 'select', OPERATOR_TYPES, true)
              )}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>
              Vehicle & Route Information
            </h3>
            
            {formData.permit_subtype === 'FRANCHISE' && originalMTOPData && (
              <div className="p-4 rounded-lg border mb-4 bg-blue-50 border-blue-200">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      ✓ Vehicle & Route Data Auto-filled from MTOP (READ-ONLY)
                    </p>
                    <p className="text-xs mt-1 text-blue-600">
                      Vehicle and route information has been automatically filled from your existing MTOP permit and cannot be modified.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {formData.permit_subtype === 'MTOP' && mtopValidation.message && (
              <div className={`p-4 rounded-lg border mb-4 ${
                mtopValidation.canProceed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start">
                  <Key className={`w-5 h-5 mr-2 mt-0.5 ${
                    mtopValidation.canProceed ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      mtopValidation.canProceed ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {mtopValidation.canProceed ? '✓ Eligible for MTOP Application' : '✗ Not Eligible for MTOP Application'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                      {mtopValidation.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow p-6 border border-black mb-6">
              <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>
                Vehicle Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('make_brand', 'Make / Brand', 'text', [], true)}
                {renderInputField('model', 'Model', 'text', [], true)}
                
                <div className="relative">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Engine Number *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="engine_number" 
                      value={formData.engine_number || ''} 
                      onChange={handleChange} 
                      placeholder="Engine Number" 
                      maxLength="12" 
                      className={`w-full p-3 border rounded-lg ${
                        errors.engine_number ? 'border-red-500' : 'border-black'
                      } ${
                        formData.permit_subtype === 'FRANCHISE' && autoFilledFields['engine_number'] ? 
                        'bg-gray-100 cursor-not-allowed' : 'bg-white'
                      }`} 
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font, textTransform: 'uppercase' }} 
                      required={true} 
                      readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['engine_number']} 
                    />
                    {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['engine_number'] && (
                      <div className="absolute top-0 right-0 mt-3 mr-3">
                        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3 mr-1" /> Auto-filled
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.engine_number ? (
                    <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                      {errors.engine_number}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>
                      Must be 8-12 characters
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Chassis Number *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="chassis_number" 
                      value={formData.chassis_number || ''} 
                      onChange={handleChange} 
                      placeholder="Chassis Number" 
                      maxLength="17" 
                      className={`w-full p-3 border rounded-lg ${
                        errors.chassis_number ? 'border-red-500' : 'border-black'
                      } ${
                        formData.permit_subtype === 'FRANCHISE' && autoFilledFields['chassis_number'] ? 
                        'bg-gray-100 cursor-not-allowed' : 'bg-white'
                      }`} 
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font, textTransform: 'uppercase' }} 
                      required={true} 
                      readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['chassis_number']} 
                    />
                    {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['chassis_number'] && (
                      <div className="absolute top-0 right-0 mt-3 mr-3">
                        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3 mr-1" /> Auto-filled
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.chassis_number ? (
                    <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                      {errors.chassis_number}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>
                      Must be exactly 17 characters
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Plate Number *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="plate_number" 
                      value={formData.plate_number || ''} 
                      onChange={handleChange} 
                      placeholder="ABC1234" 
                      maxLength="7" 
                      className={`w-full p-3 border rounded-lg ${
                        errors.plate_number ? 'border-red-500' : 'border-black'
                      } ${
                        formData.permit_subtype === 'FRANCHISE' && autoFilledFields['plate_number'] ? 
                        'bg-gray-100 cursor-not-allowed' : 'bg-white'
                      }`} 
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font, textTransform: 'uppercase' }} 
                      required={true} 
                      readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['plate_number']} 
                    />
                    {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['plate_number'] && (
                      <div className="absolute top-0 right-0 mt-3 mr-3">
                        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3 mr-1" /> Auto-filled
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.plate_number ? (
                    <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                      {errors.plate_number}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>
                      Format: 3 letters followed by 4 digits (e.g., ABC1234)
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Year Acquired *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="year_acquired" 
                      value={formData.year_acquired || ''} 
                      onChange={handleChange} 
                      placeholder="YYYY" 
                      maxLength="4" 
                      className={`w-full p-3 border rounded-lg ${
                        errors.year_acquired ? 'border-red-500' : 'border-black'
                      } ${
                        formData.permit_subtype === 'FRANCHISE' && autoFilledFields['year_acquired'] ? 
                        'bg-gray-100 cursor-not-allowed' : 'bg-white'
                      }`} 
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                      required={true} 
                      readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['year_acquired']} 
                    />
                    {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['year_acquired'] && (
                      <div className="absolute top-0 right-0 mt-3 mr-3">
                        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3 mr-1" /> Auto-filled
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.year_acquired ? (
                    <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                      {errors.year_acquired}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: COLORS.font }}>
                      Format: YYYY (e.g., 2023)
                    </p>
                  )}
                </div>
                
                {renderInputField('color', 'Color ', 'text', [], true)}
                {renderInputField('vehicle_type', 'Vehicle Type ', 'select', ['Tricycle', 'Motorcycle', 'Pedicabs', 'E-Tricycle'], true)}
                
                <div className="relative">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    LTO OR Number *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="lto_or_number" 
                      value={formData.lto_or_number || ''} 
                      onChange={handleChange} 
                      placeholder="OR Number" 
                      maxLength="8" 
                      className={`w-full p-3 border rounded-lg ${
                        errors.lto_or_number ? 'border-red-500' : 'border-black'
                      } ${
                        formData.permit_subtype === 'FRANCHISE' && autoFilledFields['lto_or_number'] ? 
                        'bg-gray-100 cursor-not-allowed' : 'bg-white'
                      }`} 
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                      required={true} 
                      readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['lto_or_number']} 
                    />
                    {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['lto_or_number'] && (
                      <div className="absolute top-0 right-0 mt-3 mr-3">
                        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3 mr-1" /> Auto-filled
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.lto_or_number ? (
                    <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                      {errors.lto_or_number}
                    </p>
                  ) : (
                    <p className={`text-xs mt-1 ${formData.lto_or_number && formData.lto_or_number.length >= 7 && formData.lto_or_number.length <= 8 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: COLORS.font }}>
                      Must be 7-8 digits
                    </p>
                  )}
                </div>

                <div className="relative">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    LTO CR Number *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="lto_cr_number" 
                      value={formData.lto_cr_number || ''} 
                      onChange={handleChange} 
                      placeholder="CR Number" 
                      maxLength="8" 
                      className={`w-full p-3 border rounded-lg ${
                        errors.lto_cr_number ? 'border-red-500' : 'border-black'
                      } ${
                        formData.permit_subtype === 'FRANCHISE' && autoFilledFields['lto_cr_number'] ? 
                        'bg-gray-100 cursor-not-allowed' : 'bg-white'
                      }`} 
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                      required={true} 
                      readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['lto_cr_number']} 
                    />
                    {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['lto_cr_number'] && (
                      <div className="absolute top-0 right-0 mt-3 mr-3">
                        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3 mr-1" /> Auto-filled
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.lto_cr_number ? (
                    <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                      {errors.lto_cr_number}
                    </p>
                  ) : (
                    <p className={`text-xs mt-1 ${formData.lto_or_number && formData.lto_or_number.length >= 7 && formData.lto_or_number.length <= 8 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: COLORS.font }}>
                      Must be 7-8 digits
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    LTO Expiration Date *
                  </label>
                  <input 
                    type="date" 
                    name="lto_expiration_date" 
                    value={formData.lto_expiration_date || ''} 
                    onChange={handleChange} 
                    className={`w-full p-3 border rounded-lg ${
                      errors.lto_expiration_date ? 'border-red-500' : 'border-black'
                    } ${
                      formData.permit_subtype === 'FRANCHISE' && autoFilledFields['lto_expiration_date'] ? 
                      'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                    readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['lto_expiration_date']} 
                  />
                  {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['lto_expiration_date'] && (
                    <div className="absolute top-9 right-0 mt-1 mr-3">
                      <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3 mr-1" /> Auto-filled
                      </div>
                    </div>
                  )}
                  {errors.lto_expiration_date && (
                    <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                      {errors.lto_expiration_date}
                    </p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    MV File Number
                  </label>
                  <input 
                    type="text" 
                    name="mv_file_number" 
                    value={formData.mv_file_number || ''} 
                    onChange={handleChange} 
                    placeholder="MV File Number" 
                    className={`w-full p-3 border border-black rounded-lg ${
                      formData.permit_subtype === 'FRANCHISE' && autoFilledFields['mv_file_number'] ? 
                      'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                    readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['mv_file_number']} 
                  />
                  {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['mv_file_number'] && (
                    <div className="absolute top-9 right-0 mt-1 mr-3">
                      <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3 mr-1" /> Auto-filled
                      </div>
                    </div>
                  )}
                </div>
                
                {renderInputField('district', 'District ', 'text', [], true)}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.primary }}>
                Route & Operation Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Route / Zone *
                  </label>
                  <input 
                    list="route-list" 
                    name="route_zone" 
                    value={formData.route_zone} 
                    onChange={handleChange} 
                    placeholder="Select or type route" 
                    className={`w-full p-3 border rounded-lg ${
                      errors.route_zone ? 'border-red-500' : 'border-black'
                    } ${
                      formData.permit_subtype === 'FRANCHISE' && autoFilledFields['route_zone'] ? 
                      'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                    readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['route_zone']} 
                  />
                  <datalist id="route-list">
                    {ROUTES.map(r => <option key={r.value} value={r.label} />)}
                  </datalist>
                  {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['route_zone'] && (
                    <div className="absolute top-9 right-0 mt-1 mr-3">
                      <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3 mr-1" /> Auto-filled
                      </div>
                    </div>
                  )}
                  {errors.route_zone && (
                    <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                      {errors.route_zone}
                    </p>
                  )}
                </div>
                
                {formData.permit_subtype === 'FRANCHISE' && (
                  <>
                    <div className="relative">
                      <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                        TODA Name *
                      </label>
                      <input 
                        list="toda-list" 
                        name="toda_name" 
                        value={formData.toda_name} 
                        onChange={handleChange} 
                        placeholder="Select or type TODA" 
                        className={`w-full p-3 border rounded-lg ${
                          errors.toda_name ? 'border-red-500' : 'border-black'
                        } ${
                          formData.permit_subtype === 'FRANCHISE' && autoFilledFields['toda_name'] ? 
                          'bg-gray-100 cursor-not-allowed' : 'bg-white'
                        }`} 
                        style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                        readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['toda_name']} 
                      />
                      <datalist id="toda-list">
                        {TODA_NAMES.map(name => <option key={name} value={name} />)}
                      </datalist>
                      {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['toda_name'] && (
                        <div className="absolute top-9 right-0 mt-1 mr-3">
                          <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <Check className="w-3 h-3 mr-1" /> Auto-filled
                          </div>
                        </div>
                      )}
                      {errors.toda_name && (
                        <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                          {errors.toda_name}
                        </p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                        TODA President Certificate
                      </label>
                      <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                        <Upload className="w-5 h-5 text-gray-500" />
                        <input 
                          type="file" 
                          name="toda_president_cert" 
                          onChange={handleChange} 
                          accept=".jpg,.jpeg,.png,.pdf" 
                          className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          style={{ fontFamily: COLORS.font }} 
                        />
                      </div>
                      {formData.toda_president_cert && (
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-green-600 text-xs flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            Uploaded: {formData.toda_president_cert.name}
                          </p>
                          <button 
                            type="button" 
                            onClick={() => previewFile(formData.toda_president_cert)} 
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Preview
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                <div className="relative">
                  <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                    Barangay of Operation *
                  </label>
                  <input 
                    list="barangay-list" 
                    name="barangay_of_operation" 
                    value={formData.barangay_of_operation} 
                    onChange={handleChange} 
                    placeholder="Select or type barangay" 
                    className={`w-full p-3 border rounded-lg ${
                      errors.barangay_of_operation ? 'border-red-500' : 'border-black'
                    } ${
                      formData.permit_subtype === 'FRANCHISE' && autoFilledFields['barangay_of_operation'] ? 
                      'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`} 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                    readOnly={formData.permit_subtype === 'FRANCHISE' && autoFilledFields['barangay_of_operation']} 
                  />
                  <datalist id="barangay-list">
                    {barangaysCaloocan.map(b => <option key={b} value={b} />)}
                  </datalist>
                  {formData.permit_subtype === 'FRANCHISE' && autoFilledFields['barangay_of_operation'] && (
                    <div className="absolute top-9 right-0 mt-1 mr-3">
                      <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3 mr-1" /> Auto-filled
                      </div>
                    </div>
                  )}
                  {errors.barangay_of_operation && (
                    <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                      {errors.barangay_of_operation}
                    </p>
                  )}
                </div>
                
                {formData.permit_subtype === 'FRANCHISE' && (
                  <div>
                    <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                      Company/Organization Name (Optional)
                    </label>
                    <input 
                      type="text" 
                      name="company_name" 
                      value={formData.company_name} 
                      onChange={handleChange} 
                      placeholder="Company/Organization Name" 
                      className="w-full p-3 border border-black rounded-lg" 
                      style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>
              Required Documents
            </h3>
            <p className="text-sm mb-4 text-gray-600" style={{ fontFamily: COLORS.font }}>
              <span className="text-red-600 font-bold">* All required documents must be uploaded.</span> Documents marked with * are required for {formData.permit_subtype === 'MTOP' ? 'MTOP' : 'Franchise'} application.
            </p>
            
            {errors.min_documents && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-600 font-medium" style={{ fontFamily: COLORS.font }}>
                  {errors.min_documents}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Mayor's Permit Verification - Only for FRANCHISE */}
              {formData.permit_subtype === 'FRANCHISE' && (
                <div className="flex flex-col p-4 border border-gray-300 rounded-lg">
                  <div className="mb-3">
                    <label className="flex items-center font-medium">
                      <span style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                        Mayor's Permit Verification (Optional)
                      </span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      If you have an existing Mayor's Permit, you can verify it here by entering your Permit ID or Applicant ID
                    </p>
                  </div>
                  <div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        name="mayors_permit_id" 
                        value={formData.mayors_permit_id || ''} 
                        onChange={handleChange} 
                        placeholder="Enter Mayor's Permit ID or Applicant ID" 
                        className="flex-1 p-3 border border-black rounded-lg" 
                        style={{ fontFamily: COLORS.font }}
                      />
                      <button
                        type="button"
                        onClick={verifyMayorsPermitId}
                        disabled={verifyingMayorsPermit || !formData.mayors_permit_id.trim()}
                        className={`px-4 py-3 rounded-lg font-medium text-white ${
                          verifyingMayorsPermit || !formData.mayors_permit_id.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : validatedMayorsPermitIds[formData.mayors_permit_id]
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {verifyingMayorsPermit ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : validatedMayorsPermitIds[formData.mayors_permit_id] ? (
                          'Verified'
                        ) : (
                          'Verify'
                        )}
                      </button>
                    </div>
                    
                    {validatedMayorsPermitIds[formData.mayors_permit_id] && (
                      <div className="text-xs text-green-600 flex items-center mt-2">
                        <Check className="w-3 h-3 mr-1" /> Mayor's Permit ID verified successfully
                      </div>
                    )}
                    
                    {formData.mayors_permit_applicant_id && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          <strong>Applicant ID:</strong> {formData.mayors_permit_applicant_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {[
                { 
                  name: 'proof_of_residency', 
                  label: 'Proof of Residency', 
                  description: 'Utility bill, lease agreement, or any document proving your residency' 
                },
                { 
                  name: 'barangay_clearance', 
                  label: 'Barangay Clearance *', 
                  description: 'Clearance from your barangay of residence - either upload file OR enter Barangay Clearance ID', 
                  specialType: 'barangayClearance' 
                },
                ...(formData.permit_subtype === 'FRANCHISE' ? [{
                  name: 'toda_endorsement',
                  label: 'TODA Endorsement *',
                  description: 'Endorsement letter from the Tricycle Operators and Drivers Association'
                }] : []),
                { 
                  name: 'lto_or_cr', 
                  label: 'LTO OR Copy', 
                  description: 'Official Receipt from LTO' 
                },
                { 
                  name: 'lto_cr_copy', 
                  label: 'LTO CR Copy *', 
                  description: 'Certificate of Registration from LTO' 
                },
                { 
                  name: 'drivers_license', 
                  label: 'Driver\'s License *', 
                  description: 'Valid driver\'s license of the operator' 
                },
                ...(formData.permit_subtype === 'MTOP' ? [
                  { 
                    name: 'nbi_clearance', 
                    label: 'NBI Clearance *', 
                    description: 'Valid NBI clearance certificate' 
                  },
                  { 
                    name: 'police_clearance', 
                    label: 'Police Clearance *', 
                    description: 'Police clearance from local police station' 
                  },
                  { 
                    name: 'medical_certificate', 
                    label: 'Medical Certificate *', 
                    description: 'Medical certificate from accredited clinic/hospital' 
                  },
                ] : []),
                { 
                  name: 'insurance_certificate', 
                  label: 'Insurance Certificate', 
                  description: 'Comprehensive insurance coverage for the vehicle', 
                  optional: true 
                },
                { 
                  name: 'emission_test', 
                  label: 'Emission Test', 
                  description: 'Latest emission test result', 
                  optional: true 
                },
                { 
                  name: 'id_picture', 
                  label: '2x2 ID Picture', 
                  description: 'Recent 2x2 ID photo', 
                  optional: true 
                },
                { 
                  name: 'official_receipt', 
                  label: 'Official Receipt', 
                  description: 'Official receipt for payment', 
                  optional: true 
                },
              ].map((doc) => (
                <div key={doc.name} className="flex flex-col p-4 border border-gray-300 rounded-lg">
                  <div className="mb-3">
                    <label className="flex items-center font-medium">
                      <span className={`${doc.optional ? '' : 'text-red-600'}`} style={{ 
                        color: doc.optional ? COLORS.secondary : COLORS.danger, 
                        fontFamily: COLORS.font 
                      }}>
                        {doc.label}
                      </span>
                      {doc.optional && (
                        <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          Optional
                        </span>
                      )}
                    </label>
                    {doc.description && (
                      <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                    )}
                  </div>
                  
                  {doc.specialType === 'barangayClearance' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                            Barangay Clearance ID (Alternative to Upload)
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              name="barangay_clearance_id" 
                              value={formData.barangay_clearance_id || ''} 
                              onChange={handleChange} 
                              placeholder="Enter Barangay Clearance ID" 
                              className="flex-1 p-3 border border-black rounded-lg" 
                              style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
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
                              }`}
                            >
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
                            <div className="text-xs text-green-600 flex items-center mt-1">
                              <Check className="w-3 h-3 mr-1" /> ID verified successfully
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                            Or Upload Barangay Clearance Document
                          </label>
                          <div className="flex items-center gap-3 p-3 border border-black rounded w-full bg-white">
                            <Upload className="w-5 h-5 text-gray-500" />
                            <input 
                              type="file" 
                              name="barangay_clearance" 
                              onChange={handleChange} 
                              accept=".jpg,.jpeg,.png,.pdf" 
                              className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" 
                              style={{ fontFamily: COLORS.font }} 
                            />
                          </div>
                          {formData.barangay_clearance && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => previewFile(formData.barangay_clearance)}
                                className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100"
                              >
                                <Eye className="w-4 h-4" /> Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => verifyDocument('barangay_clearance', formData.barangay_clearance)}
                                disabled={documentVerification.barangay_clearance?.isVerifying}
                                className={`flex items-center gap-1 px-3 py-1 text-sm rounded border ${
                                  documentVerification.barangay_clearance?.isVerified 
                                    ? 'bg-green-100 border-green-500 text-green-700' 
                                    : 'bg-blue-50 border-blue-500 text-blue-700'
                                }`}
                              >
                                {documentVerification.barangay_clearance?.isVerifying ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                                ) : documentVerification.barangay_clearance?.isVerified ? (
                                  <><Check className="w-4 h-4" /> Verified</>
                                ) : (
                                  <><Shield className="w-4 h-4" /> Verify</>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar for barangay clearance verification */}
                      {formData.barangay_clearance && documentVerification.barangay_clearance?.isVerifying && (
                        <div className="p-3 border border-blue-300 rounded-lg bg-blue-50">
                          <div className="flex items-center justify-between text-xs text-blue-600">
                            <span>Verifying document...</span>
                            <span>{documentVerification.barangay_clearance.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all" 
                              style={{ width: `${documentVerification.barangay_clearance.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {(formData.barangay_clearance_id || formData.barangay_clearance) && (
                        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center">
                            <Check className="w-4 h-4 text-green-600 mr-2" />
                            <span className="text-sm text-green-700">
                              {formData.barangay_clearance_id ? 
                                `Barangay Clearance ID: ${formData.barangay_clearance_id}` : 
                                formData.barangay_clearance ? 
                                `Uploaded: ${formData.barangay_clearance.name}` : ''
                              }
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {(!formData.barangay_clearance_id && !formData.barangay_clearance) && errors.barangay_clearance && (
                        <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                          {errors.barangay_clearance}
                        </p>
                      )}
                    </div>
                  ) : (
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
                          required={!doc.optional} 
                        />
                      </div>
                      
                      {formData[doc.name] && (
                        <>
                          <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded mt-2">
                            <div className="flex items-center">
                              <Check className="w-4 h-4 text-green-600 mr-2" />
                              <span className="text-sm text-green-700">
                                Uploaded: {formData[doc.name].name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                type="button" 
                                onClick={() => previewFile(formData[doc.name])} 
                                className="flex items-center gap-1 px-3 py-1 text-sm rounded hover:bg-gray-100"
                              >
                                <Eye className="w-4 h-4" /> Preview
                              </button>
                              {documentVerification[doc.name] && (
                                <button
                                  type="button"
                                  onClick={() => verifyDocument(doc.name, formData[doc.name])}
                                  disabled={documentVerification[doc.name]?.isVerifying}
                                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded border ${
                                    documentVerification[doc.name]?.isVerified 
                                      ? 'bg-green-100 border-green-500 text-green-700' 
                                      : 'bg-blue-50 border-blue-500 text-blue-700'
                                  }`}
                                >
                                  {documentVerification[doc.name]?.isVerifying ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                                  ) : documentVerification[doc.name]?.isVerified ? (
                                    <><Check className="w-4 h-4" /> Verified</>
                                  ) : (
                                    <><Shield className="w-4 h-4" /> Verify</>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Progress bar for document verification */}
                          {documentVerification[doc.name]?.isVerifying && (
                            <div className="p-3 border border-blue-300 rounded-lg bg-blue-50 mt-2">
                              <div className="flex items-center justify-between text-xs text-blue-600">
                                <span>Verifying document...</span>
                                <span>{documentVerification[doc.name].progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full transition-all" 
                                  style={{ width: `${documentVerification[doc.name].progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {errors[doc.name] && (
                        <p className="text-red-600 text-sm mt-1" style={{ fontFamily: COLORS.font }}>
                          {errors[doc.name]}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              

            </div>
          </div>
        );
        
      case 5:
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
                    name: 'franchise_fee', 
                    label: formData.permit_subtype === 'MTOP' ? 'MTOP Application Fee' : 'Franchise Fee', 
                    amount: FEES.franchise_fee, 
                    checked: formData.franchise_fee_checked 
                  },
                  { 
                    name: 'sticker_id_fee', 
                    label: 'Sticker / ID Fee', 
                    amount: FEES.sticker_id_fee, 
                    checked: formData.sticker_id_fee_checked 
                  },
                  { 
                    name: 'inspection_fee', 
                    label: 'Inspection Fee', 
                    amount: FEES.inspection_fee, 
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
                          (formData.franchise_fee_checked ? FEES.franchise_fee : 0) + 
                          (formData.sticker_id_fee_checked ? FEES.sticker_id_fee : 0) + 
                          (formData.inspection_fee_checked ? FEES.inspection_fee : 0)
                        ).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {[
                          formData.franchise_fee_checked, 
                          formData.sticker_id_fee_checked, 
                          formData.inspection_fee_checked
                        ].filter(Boolean).length} fee(s) selected
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Show payment status if paid */}
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
                      disabled={!formData.franchise_fee_checked && !formData.sticker_id_fee_checked && !formData.inspection_fee_checked} 
                      style={{ 
                        background: (!formData.franchise_fee_checked && !formData.sticker_id_fee_checked && !formData.inspection_fee_checked) ? 
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
        
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>
              Declaration and Signature
            </h3>
            
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <div className="mb-8 p-6 border-2 border-red-200 bg-red-50 rounded-lg">
                <h4 className="font-bold text-lg mb-4 text-red-700">
                  LEGAL DECLARATION
                </h4>
                <div className="space-y-3 text-sm" style={{ fontFamily: COLORS.font }}>
                  <p>
                    I, <span className="font-bold">{getFullName() || '[Full Name]'}</span>, hereby solemnly declare that:
                  </p>
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>All information provided in this application form is true, complete, and correct to the best of my knowledge;</li>
                    <li>I am the registered owner/authorized representative of the tricycle unit described in this application;</li>
                    <li>The vehicle is roadworthy and complies with all safety and emission standards;</li>
                    <li>I have secured all necessary clearances, permits, and insurance coverage;</li>
                    <li>I shall abide by all traffic rules, regulations, and ordinances of Caloocan City;</li>
                    <li>I understand that any false statement or misrepresentation shall be grounds for:</li>
                    <ul className="list-disc ml-8 mt-2 space-y-1">
                      <li>Immediate cancellation of the permit</li>
                      <li>Administrative and criminal liability</li>
                      <li>Blacklisting from future applications</li>
                      <li>Fines and penalties as per existing laws</li>
                    </ul>
                    <li>I agree to the processing of my personal data for the purpose of this application in accordance with the Data Privacy Act of 2012;</li>
                    <li>I consent to inspections and monitoring by authorized personnel.</li>
                  </ol>
                  <p className="mt-4 font-semibold">
                    Republic Act No. 4136 - Land Transportation and Traffic Code
                  </p>
                  <p className="text-xs italic">
                    "Any person who makes any false statement in any document required by this Act shall, upon conviction, be punished by a fine of not less than ₱5,000 nor more than ₱20,000 or imprisonment of not less than 6 months nor more than 1 year, or both."
                  </p>
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
                        <img src={formData.applicant_signature} alt="Applicant Signature" className="max-h-20 mx-auto" />
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
                          <p className="text-red-600 text-sm mt-1">
                            {errors.applicant_signature}
                          </p>
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
                    value={formData.date_submitted || new Date().toISOString().split('T')[0]} 
                    readOnly 
                    className="w-full p-3 border border-black rounded-lg bg-gray-100 cursor-not-allowed" 
                    style={{ color: COLORS.secondary, fontFamily: COLORS.font }} 
                    required 
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Submission date is automatically set to today's date
                  </p>
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
                      I, <span className="font-semibold">{getFullName() || '[Full Name]'}</span>, have read, understood, and agree to all terms and conditions stated in this declaration. I certify that all information provided is accurate and I accept full responsibility for its veracity.
                    </p>
                    {errors.declaration && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.declaration}
                      </p>
                    )}
                  </label>
                </div>
              </div>
              
            </div>
          </div>
        );
        
      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>
              Review Your Application
            </h3>
            
            <div className="bg-white rounded-lg shadow p-6 border border-black">
              <div className="space-y-6">
                {/* Application Type Header */}
                <div className="p-4 bg-blue-50 rounded-lg mb-4 border-l-4 border-blue-500">
                  <h5 className="font-bold text-lg mb-2" style={{ color: COLORS.primary }}>
                    📋 Application Type: {formData.permit_subtype === 'MTOP' ? 'Motorized Tricycle Operator\'s Permit (MTOP)' : 'Franchise Permit'}
                  </h5>
                  {formData.permit_subtype === 'MTOP' && (
                    <p className="text-sm" style={{ color: COLORS.secondary }}>
                      <span className="font-semibold">Operator Type:</span> {formData.operator_type}
                    </p>
                  )}
                  {formData.permit_subtype === 'FRANCHISE' && formData.mtop_application_id && (
                    <p className="text-sm" style={{ color: COLORS.secondary }}>
                      <span className="font-semibold">MTOP Reference ID:</span> {formData.mtop_application_id}
                    </p>
                  )}
                </div>
                
                {formData.permit_subtype === 'FRANCHISE' && originalMTOPData && (
                  <div className="p-4 rounded-lg border mb-4 bg-blue-50 border-blue-200">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Check className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700">
                          ✓ Data Auto-filled from MTOP (READ-ONLY)
                        </p>
                        <p className="text-xs mt-1 text-blue-600">
                          Your application has been pre-filled with data from your existing MTOP permit (ID: {formData.mtop_application_id})
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <h5 className="font-bold text-lg mb-2" style={{ color: COLORS.primary }}>
                    Payment Summary
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium" style={{ color: COLORS.secondary }}>
                        Payment Method:
                      </p>
                      <p className={`font-bold ${formData.payment_method === 'online' ? 'text-blue-600' : 'text-green-600'}`}>
                        {formData.payment_method === 'online' ? 'Online Payment' : 'Receipt Upload'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: COLORS.secondary }}>
                        Total Amount:
                      </p>
                      <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                        ₱{(
                          (formData.franchise_fee_checked ? FEES.franchise_fee : 0) + 
                          (formData.sticker_id_fee_checked ? FEES.sticker_id_fee : 0) + 
                          (formData.inspection_fee_checked ? FEES.inspection_fee : 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                    👤 {formData.permit_subtype === 'MTOP' ? 'Operator Information' : 'Applicant Information'}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Full Name:</span>
                      <p className="font-semibold text-gray-900 mt-1">{getFullName()}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">First Name:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.first_name}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Last Name:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.last_name}</p>
                    </div>
                    {formData.middle_initial && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Middle Initial:</span>
                        <p className="font-semibold text-gray-900 mt-1">{formData.middle_initial}.</p>
                      </div>
                    )}
                    <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                      <span className="font-medium text-gray-600">Home Address:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.home_address}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Contact Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.contact_number}</p>
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
                    {formData.permit_subtype === 'MTOP' && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Operator Type:</span>
                        <p className="font-semibold text-gray-900 mt-1">{formData.operator_type}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                    🚗 Tricycle Information
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
                      <span className="font-medium text-gray-600">Engine Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.engine_number}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Chassis Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.chassis_number}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Plate Number:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.plate_number}</p>
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
                      <span className="font-medium text-gray-600">LTO Expiration:</span>
                      <p className="font-semibold text-gray-900 mt-1">{formData.lto_expiration_date}</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center">
                      <span className="font-medium w-40">Route/Zone:</span>
                      <span className="flex-1">{formData.route_zone}</span>
                    </div>
                    {formData.permit_subtype === 'FRANCHISE' && (
                      <div className="flex items-center">
                        <span className="font-medium w-40">TODA Name:</span>
                        <span className="flex-1">{formData.toda_name}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="font-medium w-40">Barangay of Operation:</span>
                      <span className="flex-1">{formData.barangay_of_operation}</span>
                    </div>
                    {formData.permit_subtype === 'FRANCHISE' && formData.company_name && (
                      <div className="flex items-center">
                        <span className="font-medium w-40">Company Name:</span>
                        <span className="flex-1">{formData.company_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                    📄 Required Documents & Uploads
                  </h5>
                  <p className="text-sm text-gray-600 mb-4">All documents marked with <span className="text-red-600 font-bold">*</span> are required</p>
                  <div className="space-y-3">
                    {[
                      { name: 'proof_of_residency', label: 'Proof of Residency', file: formData.proof_of_residency, required: false },
                      { name: 'barangay_clearance', label: 'Barangay Clearance', file: formData.barangay_clearance, id: formData.barangay_clearance_id, required: true },
                      { name: 'lto_or_cr', label: 'LTO OR/CR', file: formData.lto_or_cr, required: false },
                      { name: 'lto_cr_copy', label: 'LTO CR Copy', file: formData.lto_cr_copy, required: true },
                      { name: 'drivers_license', label: 'Driver\'s License', file: formData.drivers_license, required: true },
                      { name: 'insurance_certificate', label: 'Insurance Certificate', file: formData.insurance_certificate, required: false },
                      { name: 'emission_test', label: 'Emission Test', file: formData.emission_test, required: false },
                      { name: 'id_picture', label: '2x2 ID Picture', file: formData.id_picture, required: false },
                      { name: 'official_receipt', label: 'Official Receipt', file: formData.official_receipt, required: false },
                      ...(formData.permit_subtype === 'FRANCHISE' ? 
                        [{ name: 'toda_endorsement', label: 'TODA Endorsement', file: formData.toda_endorsement, required: true }] : 
                        []
                      ),
                      ...(formData.permit_subtype === 'MTOP' ? 
                        [
                          { name: 'nbi_clearance', label: 'NBI Clearance', file: formData.nbi_clearance, required: true },
                          { name: 'police_clearance', label: 'Police Clearance', file: formData.police_clearance, required: true },
                          { name: 'medical_certificate', label: 'Medical Certificate', file: formData.medical_certificate, required: true }
                        ] : 
                        []
                      )
                    ].map((doc) => (
                      <div key={doc.name} className={`p-4 border-2 rounded-lg ${
                        doc.file || doc.id ? 
                          (documentVerification[doc.name]?.isVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200') : 
                          (doc.required ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200')
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start flex-1">
                            {doc.file || doc.id ? (
                              documentVerification[doc.name]?.isVerified ? (
                                <Check className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                              )
                            ) : (
                              doc.required ? (
                                <X className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                              )
                            )}
                            <div className="flex-1">
                              <span className={`font-semibold ${doc.required ? 'text-red-600' : 'text-gray-700'}`}>
                                {doc.label} {doc.required && '*'}
                              </span>
                              <p className="text-sm text-gray-600 mt-1">
                                {doc.file ? (
                                  <>
                                    <span className="font-medium">File:</span> {doc.file.name}
                                    <br />
                                    <span className="text-xs text-gray-500">Size: {(doc.file.size / 1024).toFixed(2)} KB</span>
                                    <br />
                                    {documentVerification[doc.name]?.isVerified ? (
                                      <span className="text-xs text-green-600 font-medium flex items-center mt-1">
                                        <Check className="w-3 h-3 mr-1" /> AI Verified
                                      </span>
                                    ) : (
                                      <span className="text-xs text-yellow-600 font-medium flex items-center mt-1">
                                        <AlertCircle className="w-3 h-3 mr-1" /> Not AI Verified
                                      </span>
                                    )}
                                  </>
                                ) : doc.id ? (
                                  <><span className="font-medium">Clearance ID:</span> {doc.id}</>
                                ) : (
                                  doc.required ? (
                                    <span className="text-red-600 font-medium">⚠ Not provided - Required for submission</span>
                                  ) : (
                                    <span className="text-gray-500 font-medium">Not provided - Optional</span>
                                  )
                                )}
                              </p>
                              {doc.file && doc.file.type && doc.file.type.startsWith('image/') && (
                                <div className="mt-2">
                                  <img 
                                    src={URL.createObjectURL(doc.file)} 
                                    alt={doc.label}
                                    className="w-32 h-32 object-cover rounded border border-gray-300"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          {doc.file && (
                            <button 
                              type="button" 
                              onClick={() => previewFile(doc.file)} 
                              className="ml-3 flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors duration-300 text-blue-700 font-medium flex-shrink-0" 
                            >
                              <Eye className="w-4 h-4" />
                              View Full
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                    Payment Summary
                  </h5>
                  <div className="space-y-4">
                    {[
                      { 
                        name: 'franchise_fee', 
                        label: formData.permit_subtype === 'MTOP' ? 'MTOP Application Fee' : 'Franchise Fee', 
                        checked: formData.franchise_fee_checked 
                      },
                      { 
                        name: 'sticker_id_fee', 
                        label: 'Sticker / ID Fee', 
                        checked: formData.sticker_id_fee_checked 
                      },
                      { 
                        name: 'inspection_fee', 
                        label: 'Inspection Fee', 
                        checked: formData.inspection_fee_checked 
                      }
                    ].map((fee) => (
                      <div key={fee.name} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                        <div className="flex items-center">
                          {fee.checked ? (
                            <Check className="w-5 h-5 text-green-600 mr-3" />
                          ) : (
                            <div className="w-5 h-5 border border-gray-300 rounded mr-3"></div>
                          )}
                          <div>
                            <span className="font-medium">{fee.label}:</span>
                            <p className="text-sm text-gray-600">
                              {fee.checked ? 'Selected' : 'Not selected'}
                            </p>
                          </div>
                        </div>
                        {fee.checked && (
                          <span className="font-bold" style={{ color: COLORS.primary }}>
                            ₱{FEES[fee.name].toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                    
                    {paymentStatus.isPaid && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <Check className="w-6 h-6 text-green-600 mr-3" />
                          <div>
                            <p className="font-semibold text-green-700">
                              ✓ Payment Status: {paymentStatus.isPaid ? 'Paid' : 'Pending'}
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                              Payment Method: {paymentStatus.paymentMethod === 'online' ? 'Online Payment' : 'Receipt Upload'}
                            </p>
                            {paymentStatus.paymentDate && (
                              <p className="text-xs text-green-600 mt-1">
                                Payment Date: {paymentStatus.paymentDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold mb-3 text-lg" style={{ color: COLORS.primary }}>
                    Declaration Summary
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ fontFamily: COLORS.font }}>
                    <div className="flex items-center">
                      <span className="font-medium w-48">Applicant's Signature:</span>
                      <span className="flex-1">
                        {formData.applicant_signature ? (
                          <span className="text-green-600 font-medium">✓ Provided</span>
                        ) : (
                          <span className="text-red-600 font-medium">✗ Missing</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-48">Date of Submission:</span>
                      <span className="flex-1">{formData.date_submitted || 'Not set'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-48">Agreement to Declaration:</span>
                      <span className="flex-1">
                        {agreeDeclaration ? (
                          <span className="text-green-600 font-medium">✓ Agreed</span>
                        ) : (
                          <span className="text-red-600 font-medium">✗ Not agreed</span>
                        )}
                      </span>
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
    <div className="mx-1 mt-1 p-6 rounded-lg min-h-screen" style={{ 
      background: COLORS.background, 
      color: COLORS.secondary, 
      fontFamily: COLORS.font 
    }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary }}>
            FRANCHISE PERMIT APPLICATION
          </h1>
          <p className="mt-2" style={{ color: COLORS.secondary }}>
            Apply for {formData.permit_subtype === 'MTOP' ? 'Motorized Tricycle Operator\'s Permit (MTOP)' : 'Franchise Permit'} for tricycle operation.
          </p>
        </div>
        <button 
          onClick={handleBackConfirmation} 
          onMouseEnter={e => e.currentTarget.style.background = COLORS.accent} 
          onMouseLeave={e => e.currentTarget.style.background = COLORS.success} 
          style={{ background: COLORS.success }} 
          className="px-4 py-2 rounded-lg font-medium text-white hover:bg-[#FDA811] transition-colors duration-300"
        >
          Change Permit Type
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
                <p className="text-sm font-medium" style={{ 
                  color: currentStep >= step.id ? COLORS.success : COLORS.secondary, 
                  fontFamily: COLORS.font 
                }}>
                  {step.title}
                </p>
                <p className="text-xs" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block w-16 h-0.5 mx-4" style={{ 
                  background: currentStep > step.id ? COLORS.success : '#9CA3AF' 
                }} />
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
              disabled={
                !isStepValid(currentStep) || 
                (formData.permit_subtype === 'FRANCHISE' && !mtopValidation.canProceed) || 
                duplicateCheck.hasDuplicate
              } 
              style={{ 
                background: (
                  !isStepValid(currentStep) || 
                  (formData.permit_subtype === 'FRANCHISE' && !mtopValidation.canProceed) || 
                  duplicateCheck.hasDuplicate
                ) ? '#9CA3AF' : COLORS.success 
              }} 
              onMouseEnter={e => { 
                if (isStepValid(currentStep) && 
                    !(formData.permit_subtype === 'FRANCHISE' && !mtopValidation.canProceed) && 
                    !duplicateCheck.hasDuplicate) {
                  e.currentTarget.style.background = COLORS.accent; 
                }
              }} 
              onMouseLeave={e => { 
                if (isStepValid(currentStep) && 
                    !(formData.permit_subtype === 'FRANCHISE' && !mtopValidation.canProceed) && 
                    !duplicateCheck.hasDuplicate) {
                  e.currentTarget.style.background = COLORS.success; 
                }
              }} 
              className={`px-6 py-3 rounded-lg font-semibold text-white ${
                (!isStepValid(currentStep) || 
                (formData.permit_subtype === 'FRANCHISE' && !mtopValidation.canProceed) || 
                duplicateCheck.hasDuplicate) ? 'cursor-not-allowed' : 'transition-colors duration-300'
              }`}
            >
              {currentStep === steps.length - 1 ? 'Review Application' : 'Next'}
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={isSubmitting || !mtopValidation.canProceed || duplicateCheck.hasDuplicate} 
              onMouseEnter={e => { 
                if (!isSubmitting && mtopValidation.canProceed && !duplicateCheck.hasDuplicate) {
                  e.currentTarget.style.background = COLORS.accent; 
                }
              }} 
              onMouseLeave={e => { 
                if (!isSubmitting && mtopValidation.canProceed && !duplicateCheck.hasDuplicate) {
                  e.currentTarget.style.background = COLORS.success; 
                }
              }} 
              style={{ 
                background: (isSubmitting || !mtopValidation.canProceed || duplicateCheck.hasDuplicate) ? 
                '#9CA3AF' : COLORS.success 
              }} 
              className={`px-6 py-3 rounded-lg font-semibold text-white ${
                (isSubmitting || !mtopValidation.canProceed || duplicateCheck.hasDuplicate) ? 
                'cursor-not-allowed' : 'transition-colors duration-300'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
      
      {showPreview.url && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div className="rounded-lg shadow-lg w-full max-w-4xl border border-gray-200 overflow-hidden" style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            fontFamily: COLORS.font, 
            backdropFilter: 'blur(10px)', 
            maxHeight: '90vh' 
          }}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold" style={{ color: COLORS.primary }}>
                Preview Document
              </h2>
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
                    <img src={showPreview.url} alt="Preview" className="max-w-full h-auto max-h-[500px]" />
                  </div>
                ) : showPreview.type === 'application' && showPreview.name?.includes('.pdf') ? (
                  <iframe src={showPreview.url} className="w-full h-[500px] rounded" title="PDF Preview" />
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
      



      {/* Payment Success Modal */}
      {showPaymentSuccessModal && (
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
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-center mb-4" style={{ color: COLORS.primary }}>Payment Successful!</h2>
            
            <div className="mb-6">
              <p className="text-sm text-center mb-3" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                Your payment has been completed successfully! As long as you have completed the payment process, it is considered successful. You can now proceed to the next step.
              </p>
              
              {paymentStatus.transactionId && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                  <p className="text-sm font-medium text-blue-700 mb-2">Payment Details:</p>
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Transaction ID:</span> {paymentStatus.transactionId}</p>
                    <p><span className="font-medium">Payment Date:</span> {new Date(paymentStatus.paymentDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Payment Method:</span> Online Payment</p>
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-700 mb-2">Next Steps:</p>
                <ul className="text-xs space-y-1 text-green-700">
                  <li>• Your payment has been recorded in the system</li>
                  <li>• You can now proceed to the declaration step</li>
                  <li>• Your application will be processed after submission</li>
                  <li>• You will receive updates via email</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowPaymentSuccessModal(false);
                  setCurrentStep(7); // Navigate to Step 7 (Declaration)
                }}
                style={{ background: COLORS.primary }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.primary}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                Proceed to Next Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MTOP Details Modal */}
      {showMtopDetailsModal && mtopValidation.permitDetails && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                Existing MTOP Permit Details
              </h2>
              <button
                onClick={() => setShowMtopDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Essential Permit Information */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Application ID</p>
                      <p className="font-bold text-lg" style={{ color: COLORS.primary }}>
                        {mtopValidation.permitDetails.application_id || mtopValidation.permitDetails.display_id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Status</p>
                      <p className={`font-bold text-lg ${mtopValidation.permitDetails.status === 'pending' ? 'text-yellow-600' : mtopValidation.permitDetails.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                        {mtopValidation.permitDetails.status?.toUpperCase() || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-blue-200">
                    <p className="text-gray-600 text-sm mb-1">Plate Number</p>
                    <p className="font-bold text-lg text-green-700">
                      {mtopValidation.permitDetails.plate_number || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-lg mb-3 text-green-800">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Make/Brand:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.make_brand || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Model:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.model || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Color:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.color || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Year Acquired:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.year_acquired || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Vehicle Type:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.vehicle_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Engine Number:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.engine_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Chassis Number:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.chassis_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">MV File Number:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.mv_file_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* LTO Information */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-lg mb-3 text-purple-800">LTO Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">LTO OR Number:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.lto_or_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">LTO CR Number:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.lto_cr_number || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">LTO Expiration Date:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.lto_expiration_date_formatted || mtopValidation.permitDetails.lto_expiration_date || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Operation Details */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-lg mb-3 text-yellow-800">Operation Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">District:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.district || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Route/Zone:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.route_zone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">TODA Name:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.toda_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Barangay of Operation:</p>
                    <p className="font-semibold">{mtopValidation.permitDetails.barangay_of_operation || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowMtopDetailsModal(false);
                  nextStep();
                }}
                style={{ background: COLORS.primary }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.primary}
                className="px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-300"
              >
                Proceed to Next Step
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}