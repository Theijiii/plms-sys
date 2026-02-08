import { jsPDF } from 'jspdf';
import fileBrgyImg from '../assets/filebrgy.png';
import fileBuildingImg from '../assets/filebuilding.png';
import fileBusinessImg from '../assets/filebusiness.png';
import fileTodaImg from '../assets/filetoda.png';

// ===== CONSTANTS =====
const PW = 210, PH = 297;
const DARK = [51, 51, 51];

// ===== IMAGE LOADER =====
const imgCache = {};
async function loadImg(src) {
  if (imgCache[src]) return imgCache[src];
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      imgCache[src] = c.toDataURL('image/png');
      resolve(imgCache[src]);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ===== TEMPLATE SOURCE MAP =====
function getTemplateSrc(permitType) {
  const type = (permitType || '').toLowerCase();
  if (type.includes('business')) return fileBusinessImg;
  if (type.includes('barangay')) return fileBrgyImg;
  if (type.includes('building')) return fileBuildingImg;
  if (type.includes('toda') || type.includes('franchise')) return fileTodaImg;
  return fileBusinessImg;
}

// ===== FORMATTING =====
const fmtDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtCurrency = (a) => {
  const n = parseFloat(a) || 0;
  return 'PHP ' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ===== OVERLAY HELPER =====
// Draws a white rectangle at (x, y) with size (w, h), then writes text on top.
// The text baseline is positioned near the bottom of the box.
function overlay(doc, x, y, w, h, text, opts = {}) {
  const { fontSize = 9, bold = false, align = 'left', color = DARK, pad = 1.5 } = opts;
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'F');
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const val = String(text ?? 'N/A');
  const ty = y + h - pad;
  if (align === 'center') {
    doc.text(val, x + w / 2, ty, { align: 'center' });
  } else {
    doc.text(val, x + pad, ty);
  }
}

// ===== WATERMARK =====
function drawWatermark(doc) {
  doc.setTextColor(210, 210, 210);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(55);
  try {
    doc.text('DIGITAL COPY', PW / 2, PH / 2, { align: 'center', angle: 45 });
  } catch {
    doc.setFontSize(48);
    doc.text('DIGITAL COPY', PW / 2, PH / 2 - 10, { align: 'center' });
    doc.text('DIGITAL COPY', PW / 2, PH / 2 + 10, { align: 'center' });
  }
  doc.setTextColor(...DARK);
}

// ===== FOOTER STAMP =====
function drawFooter(doc, permit) {
  const fy = PH - 6;
  doc.setFillColor(255, 255, 255);
  doc.rect(8, fy - 3, PW - 16, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'System-generated DIGITAL COPY | Generated: ' + new Date().toLocaleString() +
    ' | Ref: ' + permit.id + '-' + Date.now().toString(36).toUpperCase() +
    ' | GoServePH - e-plms.goserveph.com',
    PW / 2, fy, { align: 'center' }
  );
  doc.setTextColor(...DARK);
}

// ===== BUSINESS PERMIT (Mayor's Permit) OVERLAY =====
function overlayBusiness(doc, p) {
  // Plate No (top-right box)
  overlay(doc, 177, 9, 21, 9,
    String(p.id).replace(/\D/g, '').slice(-4).padStart(4, '0'),
    { fontSize: 12, bold: true, align: 'center' });
  // BIN
  overlay(doc, 33, 78, 63, 6, p.receiptNumber || p.id, { fontSize: 9, bold: true });
  // DATE ISSUED
  overlay(doc, 56, 85, 90, 6, fmtDate(p.approvedDate || p.submittedDate));
  // Business name (This certified that)
  overlay(doc, 96, 93, 104, 6, p.businessName || 'N/A', { fontSize: 9, bold: true });
  // Trade name (registered trade name as)
  overlay(doc, 100, 100, 98, 6, p.businessName || 'N/A', { fontSize: 9, bold: true });
  // Business address
  overlay(doc, 66, 107, 135, 6, p.address || 'N/A', { fontSize: 8 });
  // Permittee signature name (bottom-left)
  overlay(doc, 14, 247, 58, 6, p.applicantName || 'N/A',
    { fontSize: 7, bold: true, align: 'center' });
}

// ===== BARANGAY CLEARANCE OVERLAY =====
function overlayBarangay(doc, p) {
  // Plate No (top-right box)
  overlay(doc, 177, 9, 21, 9,
    String(p.id).replace(/\D/g, '').slice(-4).padStart(4, '0'),
    { fontSize: 12, bold: true, align: 'center' });
  // Document No
  overlay(doc, 53, 97, 58, 6, p.id);
  // OR No
  overlay(doc, 32, 104, 58, 6, p.receiptNumber || 'N/A');
  // Applicant Name (below TO WHOM IT MAY CONCERN)
  overlay(doc, 32, 148, 146, 9,
    (p.applicantName || 'N/A').toUpperCase(),
    { fontSize: 11, bold: true, align: 'center' });
  // CALOOCAN CITY
  overlay(doc, 50, 158, 110, 6, 'CALOOCAN CITY', { fontSize: 9, align: 'center' });
  // Applicant signature name (bottom)
  overlay(doc, 14, 226, 58, 6, p.applicantName || 'N/A',
    { fontSize: 7, bold: true, align: 'center' });
}

// ===== BUILDING PERMIT OVERLAY =====
function overlayBuilding(doc, p) {
  // Plate No (top-right box)
  overlay(doc, 177, 9, 21, 9,
    String(p.id).replace(/\D/g, '').slice(-4).padStart(4, '0'),
    { fontSize: 12, bold: true, align: 'center' });
  // Application No
  overlay(doc, 57, 75, 62, 6, p.id);
  // Date Issued
  overlay(doc, 139, 75, 60, 6, fmtDate(p.approvedDate || p.submittedDate));
  // Issued to (applicant name)
  overlay(doc, 48, 83, 108, 6, p.applicantName || 'N/A', { fontSize: 9, bold: true });
  // Address
  overlay(doc, 70, 90, 132, 6, p.address || 'N/A', { fontSize: 8 });
  // Applicant signature name (bottom-left)
  overlay(doc, 14, 247, 58, 6, p.applicantName || 'N/A',
    { fontSize: 7, bold: true, align: 'center' });
}

// ===== TODA / FRANCHISE PERMIT OVERLAY =====
function overlayToda(doc, p) {
  // Plate No (top-right box)
  overlay(doc, 177, 9, 21, 9,
    String(p.id).replace(/\D/g, '').slice(-4).padStart(4, '0'),
    { fontSize: 12, bold: true, align: 'center' });
  // BIN
  overlay(doc, 36, 75, 64, 6, p.receiptNumber || p.id);
  // Permit No
  overlay(doc, 146, 75, 46, 6, String(p.id).replace(/\D/g, '').slice(-4));
  // Date Issued
  overlay(doc, 52, 82, 80, 6, fmtDate(p.approvedDate || p.submittedDate));
  // Applicant Name (centered bold)
  overlay(doc, 32, 93, 146, 9,
    (p.applicantName || 'N/A').toUpperCase(),
    { fontSize: 12, bold: true, align: 'center' });
  // Certification text (name within body)
  overlay(doc, 32, 103, 148, 14,
    'This certifies that ' + (p.applicantName || 'N/A').toUpperCase() +
    ', is a licensed tricycle driver/operator to operate a tricycle belonging to the ' +
    (p.businessName || 'N/A') + ' Tricycle Operators and Drivers Association, Inc.',
    { fontSize: 8 });
  // NAME OF OPERATOR (in table)
  overlay(doc, 82, 127, 112, 6,
    (p.applicantName || 'N/A').toUpperCase(), { fontSize: 9, bold: true });
  // ADDRESS (in table)
  overlay(doc, 50, 134, 152, 7,
    (p.address || 'N/A').toUpperCase(), { fontSize: 8 });
  // Permittee signature name (bottom)
  overlay(doc, 25, 220, 75, 6, p.applicantName || 'N/A',
    { fontSize: 8, bold: true, align: 'center' });
}

// ===== MAIN EXPORT =====
export async function generatePermitPDF(permit) {
  const templateSrc = getTemplateSrc(permit.permitType);
  const templateImg = await loadImg(templateSrc);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Place template image as full-page background
  if (templateImg) {
    doc.addImage(templateImg, 'PNG', 0, 0, PW, PH);
  }

  // Watermark
  drawWatermark(doc);

  // Apply permit-type-specific data overlays
  const type = (permit.permitType || '').toLowerCase();
  if (type.includes('business')) {
    overlayBusiness(doc, permit);
  } else if (type.includes('franchise') || type.includes('toda')) {
    overlayToda(doc, permit);
  } else if (type.includes('building')) {
    overlayBuilding(doc, permit);
  } else if (type.includes('barangay')) {
    overlayBarangay(doc, permit);
  } else {
    overlayBusiness(doc, permit);
  }

  // Footer timestamp
  drawFooter(doc, permit);

  const filename = (permit.permitType || 'Permit').replace(/\s+/g, '-') + '-' + permit.id + '-Digital-Copy.pdf';
  doc.save(filename);
  return filename;
}
