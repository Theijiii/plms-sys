# SweetAlert Modal Conversion Guide for BusinessAmend.jsx

## Overview
Convert all custom modals in `src/pages/user/BusinessPermit/BusinessAmend.jsx` to use SweetAlert2.

## Step 1: Add SweetAlert Import
**Line 3** - Add after the lucide-react import:
```javascript
import Swal from 'sweetalert2';
```

## Step 2: Convert showSuccessMessage Function
**Lines 506-510** - Replace with:
```javascript
const showSuccessMessage = (message) => {
  Swal.fire({
    title: 'Success!',
    text: message,
    icon: 'success',
    confirmButtonText: 'Track Application',
    confirmButtonColor: '#4CAF50',
    timer: 3000,
    timerProgressBar: true
  }).then(() => {
    navigate("/user/permittracker");
  });
};
```

## Step 3: Convert showErrorMessage Function
**Lines 512-516** - Replace with:
```javascript
const showErrorMessage = (message) => {
  Swal.fire({
    title: 'Error',
    text: message,
    icon: 'error',
    confirmButtonText: 'Close',
    confirmButtonColor: '#E53935'
  });
};
```

## Step 4: Convert handleTypeSelection Function
**Lines 239-245** - Replace with:
```javascript
const handleTypeSelection = async (typeId) => {
  setSelectedType(typeId);
  const selected = amendmentTypes.find(t => t.id === typeId);
  
  const result = await Swal.fire({
    title: 'Confirm Amendment Type',
    html: `
      <div style="text-align: left; margin: 20px 0;">
        <div style="padding: 15px; background: ${selected?.formBgColor || '#f3f4f6'}; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0; font-size: 14px; color: #666; font-weight: 500;">You have selected:</p>
          <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: ${selected?.formColor || '#333'};">${selected?.title}</p>
        </div>
        <p style="margin-bottom: 15px;"><strong>Description:</strong> ${selected?.description}</p>
        <div style="padding: 15px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
          <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1e40af;">Before you proceed:</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #1e40af;">
            <li>Make sure you have your Business Permit ID ready</li>
            <li>Prepare all required documents</li>
            <li>Ensure you have valid government ID</li>
            <li>Have your business tax receipt available</li>
          </ul>
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Continue to Application',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#4CAF50',
    cancelButtonColor: '#9CA3AF',
    width: '600px'
  });

  if (result.isConfirmed) {
    confirmTypeSelection();
  } else {
    setSelectedType('');
  }
};
```

## Step 5: Update confirmTypeSelection Function
**Line 268** - Remove this line:
```javascript
setShowSelectionModal(false);
```

## Step 6: Convert handleLearnMore Function
**Lines 248-252** - Replace with:
```javascript
const handleLearnMore = async (typeId, e) => {
  e.stopPropagation();
  const selected = amendmentTypes.find(t => t.id === typeId);
  
  const generalReqsHtml = generalRequirements.map(req => 
    `<li style="margin-bottom: 8px;">
      <strong>${req.title}</strong><br/>
      <span style="font-size: 12px; color: #666;">${req.description}</span>
    </li>`
  ).join('');
  
  const specificReqsHtml = selected?.requirements.map(req => {
    const detailsHtml = req.details ? 
      `<ul style="margin: 5px 0 0 20px; font-size: 11px;">
        ${req.details.map(d => `<li style="margin: 3px 0;">${d}</li>`).join('')}
      </ul>` : '';
    return `<li style="margin-bottom: 10px;">
      <strong>${req.title}</strong><br/>
      <span style="font-size: 12px; color: #666;">${req.description}</span>
      ${detailsHtml}
    </li>`;
  }).join('') || '';
  
  const result = await Swal.fire({
    title: `Requirements for ${selected?.title}`,
    html: `
      <div style="text-align: left; max-height: 400px; overflow-y: auto;">
        <div style="margin-bottom: 20px;">
          <h4 style="color: #4A90E2; margin-bottom: 10px;">📋 General Requirements</h4>
          <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Required for all amendment types:</p>
          <ul style="padding-left: 20px;">${generalReqsHtml}</ul>
        </div>
        <div style="margin-bottom: 20px;">
          <h4 style="color: #d97706; margin-bottom: 10px;">📄 Specific Requirements</h4>
          <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Additional documents for this amendment:</p>
          <ul style="padding-left: 20px;">${specificReqsHtml}</ul>
        </div>
        <div style="padding: 12px; background: #fef3c7; border-radius: 6px; margin-top: 15px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #92400e;">Important Notes:</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #92400e;">
            <li>All documents must be clear and legible</li>
            <li>Maximum file size: 5MB per document</li>
            <li>Accepted formats: PDF, JPG, PNG</li>
          </ul>
        </div>
      </div>
    `,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Continue Application',
    cancelButtonText: 'Close',
    confirmButtonColor: '#4CAF50',
    cancelButtonColor: '#9CA3AF',
    width: '700px'
  });
  
  if (result.isConfirmed) {
    handleTypeSelection(typeId);
  }
};
```

## Step 7: Remove handleContinueFromRequirements Function
**Lines 255-259** - Delete this entire function (no longer needed)

## Step 8: Convert Back Confirmation
**Around line 1848** - Replace the onClick for back button:
```javascript
onClick={async () => {
  const result = await Swal.fire({
    title: 'Confirm Navigation',
    text: 'Are you sure you want to go back to amendment type selection? Any unsaved changes will be lost.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Go Back',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#E53935',
    cancelButtonColor: '#9CA3AF'
  });
  
  if (result.isConfirmed) {
    goBackToSelection();
  }
}}
```

## Step 9: Remove Custom Modal JSX
Delete these entire modal sections (lines approx 1657-2163):
- File Preview Modal
- Confirmation Modal  
- Success Modal
- Error Modal
- Requirements Preview Modal
- Selection Confirmation Modal
- Confirm Back Modal

## Step 10: Remove Unused State Variables
**Lines 18-28** - Remove these state variables:
```javascript
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [showSuccessModal, setShowSuccessModal] = useState(false);
const [showErrorModal, setShowErrorModal] = useState(false);
const [showSelectionModal, setShowSelectionModal] = useState(false);
const [showRequirementsModal, setShowRequirementsModal] = useState(false);
const [modalMessage, setModalMessage] = useState('');
const [modalTitle, setModalTitle] = useState('');
const [selectedForPreview, setSelectedForPreview] = useState(null);
const [isConfirmBackOpen, setIsConfirmBackOpen] = useState(false);
```

## Testing
After each major change, run:
```bash
npm run build
```

This will verify no syntax errors were introduced.
