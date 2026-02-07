import { jsPDF } from 'jspdf';
import gsmLogoSrc from '../assets/GSM_logo.png';

// Use public URL - logoplms.png is in the public/ folder
const plmsLogoSrc = new URL('/logoplms.png', window.location.origin).href;

// ===== CONSTANTS =====
const PW = 210, PH = 297, M = 12;
const CW = PW - 2 * M;
const ORANGE = [218, 130, 42];
const DARK = [51, 51, 51];
const GRAY = [120, 120, 120];
const WHITE = [255, 255, 255];

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

// ===== FORMATTING =====
const fmtDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtCurrency = (a) => {
  const n = parseFloat(a) || 0;
  return 'PHP ' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ===== DRAWING UTILITIES =====
function drawBorder(doc) {
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(2.5);
  doc.rect(M - 3, M - 3, CW + 6, PH - 2 * M + 6);
  doc.setLineWidth(0.5);
  doc.rect(M, M, CW, PH - 2 * M);
}

function drawWatermark(doc) {
  try {
    doc.setTextColor(230, 230, 230);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(55);
    doc.text('DIGITAL COPY', PW / 2, PH / 2, { align: 'center', angle: 45 });
  } catch {
    // Fallback if angle not supported - draw multiple lines
    doc.setTextColor(235, 235, 235);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.text('DIGITAL COPY', PW / 2, PH / 2 - 10, { align: 'center' });
    doc.setFontSize(48);
    doc.text('DIGITAL COPY', PW / 2, PH / 2 + 10, { align: 'center' });
  }
  doc.setTextColor(...DARK);
}

function drawPlateBox(doc, id) {
  const x = PW - M - 32, y = M + 2;
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.5);
  doc.rect(x, y, 28, 12, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...GRAY);
  doc.text('Plate No.', x + 2, y + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  const num = String(id).replace(/\D/g, '').slice(-4).padStart(4, '0');
  doc.text(num, x + 14, y + 10, { align: 'center' });
}

function drawHeaderBlock(doc, gsmImg, plmsImg, lines, y0) {
  let y = y0;
  if (gsmImg) doc.addImage(gsmImg, 'PNG', M + 5, y - 2, 24, 24);
  if (plmsImg) doc.addImage(plmsImg, 'PNG', PW - M - 29, y - 2, 24, 24);
  lines.forEach(l => {
    doc.setFont('helvetica', l.b ? 'bold' : 'normal');
    doc.setFontSize(l.s || 9);
    doc.setTextColor(...DARK);
    doc.text(l.t, PW / 2, y + 3, { align: 'center' });
    y += (l.s || 9) * 0.5 + 1;
  });
  return y + 2;
}

function drawTitle(doc, title, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...DARK);
  doc.text(title, PW / 2, y, { align: 'center' });
  const tw = doc.getTextWidth(title);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(1);
  doc.line(PW / 2 - tw / 2 - 5, y + 2, PW / 2 + tw / 2 + 5, y + 2);
  return y + 8;
}

function drawSubtitle(doc, text, y) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(text, PW / 2, y, { align: 'center' });
  return y + 6;
}

function sectionHeader(doc, title, y) {
  doc.setFillColor(...ORANGE);
  doc.rect(M + 4, y, CW - 8, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text(title, PW / 2, y + 4.2, { align: 'center' });
  doc.setTextColor(...DARK);
  return y + 8;
}

function infoRow(doc, label, value, y, lx, vx) {
  lx = lx || M + 8;
  vx = vx || M + 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(label, lx, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(value ?? 'N/A'), vx, y);
  return y + 5.5;
}

function drawImportant(doc, text, y) {
  doc.setFillColor(...ORANGE);
  doc.roundedRect(PW / 2 - 14, y, 28, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...WHITE);
  doc.text('IMPORTANT', PW / 2, y + 3.7, { align: 'center' });
  y += 7;
  doc.setDrawColor(180, 0, 0);
  doc.setLineWidth(0.3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 0, 0);
  const lines = doc.splitTextToSize(text, CW - 24);
  const boxH = lines.length * 3.5 + 4;
  doc.rect(M + 8, y, CW - 16, boxH);
  doc.text(lines, M + 10, y + 4);
  doc.setTextColor(...DARK);
  return y + boxH + 3;
}

function drawSignatureBlock(doc, signers, y) {
  const w = (CW - 16) / signers.length;
  signers.forEach((s, i) => {
    const cx = M + 8 + w * i + w / 2;
    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.3);
    doc.line(cx - 22, y + 12, cx + 22, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(s.name, cx, y + 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(s.title, cx, y + 19.5, { align: 'center' });
  });
  return y + 24;
}

function drawFooterInfo(doc, permit) {
  let y = PH - M - 18;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.5);
  doc.line(M + 4, y, PW - M - 4, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...GRAY);
  doc.text('This is a system-generated DIGITAL COPY of your permit. For the official/physical copy, please visit the respective office.', PW / 2, y, { align: 'center' });
  doc.text('Generated: ' + new Date().toLocaleString() + ' | Ref: ' + permit.id + '-' + Date.now().toString(36).toUpperCase(), PW / 2, y + 4, { align: 'center' });
  doc.text('GoServePH - Permit & Licensing Management System | e-plms.goserveph.com', PW / 2, y + 8, { align: 'center' });
  doc.setTextColor(...DARK);
}

// ===== BUSINESS PERMIT (Mayor's Permit) =====
function genBusiness(doc, p, g, l) {
  drawBorder(doc);
  drawWatermark(doc);
  drawPlateBox(doc, p.id);

  let y = drawHeaderBlock(doc, g, l, [
    { t: 'Republic of the Philippines', s: 9 },
    { t: 'CITY OF CALOOCAN', s: 11, b: true },
    { t: 'Office of the City Mayor', s: 8 },
    { t: 'BUSINESS PERMITS AND LICENSING OFFICE', s: 9, b: true },
  ], M + 6);

  y = drawTitle(doc, "MAYOR'S PERMIT", y + 2);
  y = drawSubtitle(doc, '— TAX YEAR ' + new Date().getFullYear() + ' —', y);

  y = infoRow(doc, 'BIN:', p.receiptNumber || 'N/A', y);
  y = infoRow(doc, 'DATE ISSUED:', fmtDate(p.approvedDate || p.submittedDate), y);
  y += 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('This certified that ' + (p.businessName || 'N/A'), M + 8, y);
  y += 5;
  doc.text('with registered trade name as ' + (p.businessName || 'N/A'), M + 8, y);
  y += 5;
  doc.text('with business address at: ' + (p.address || 'N/A'), M + 8, y);
  y += 6;

  const bodyText = 'has been granted a BUSINESS PERMIT to operate the following business, under the Revised Revenue Code of Caloocan City, subject to the provisions of amendments, official issuances and other administrative regulations.';
  doc.setFontSize(8);
  const bodyLines = doc.splitTextToSize(bodyText, CW - 16);
  doc.text(bodyLines, M + 8, y);
  y += bodyLines.length * 3.5 + 4;

  y = sectionHeader(doc, 'PERMIT DETAILS', y);
  y = infoRow(doc, 'Permit ID:', p.id, y);
  y = infoRow(doc, 'Application Type:', p.application_type || 'New', y);
  y = infoRow(doc, 'Status:', p.status, y);
  y = infoRow(doc, 'Applicant:', p.applicantName || 'N/A', y);
  y = infoRow(doc, 'Contact:', p.contactNumber || 'N/A', y);
  y = infoRow(doc, 'Email:', p.email || 'N/A', y);
  y += 2;

  y = sectionHeader(doc, 'PARTICULARS OF PAYMENT', y);
  y = infoRow(doc, 'Capital Investment:', fmtCurrency(p.fees), y);
  y = infoRow(doc, 'O.R. No.:', p.receiptNumber || 'N/A', y);
  y = infoRow(doc, 'Valid Until:', fmtDate(p.expirationDate), y);
  y += 4;

  y = drawImportant(doc, "Failure to renew business/mayor's permit on or before the deadline shall subject the permittee to a SURCHARGE of 25% of the amount of yearly fees and INTEREST of 2% MONTHLY OF EVERY MONTH UNTIL FULLY PAID. This permit is NON-TRANSFERABLE.", y);

  y = drawSignatureBlock(doc, [
    { name: p.applicantName || 'N/A', title: 'Permittee' },
    { name: 'OSCAR OCA MALAPITAN', title: 'City Mayor' },
    { name: 'BUSINESS PERMITS OFFICER', title: 'Licensing Officer' },
  ], y);

  drawFooterInfo(doc, p);
}

// ===== FRANCHISE / TODA PERMIT =====
function genFranchise(doc, p, g, l) {
  drawBorder(doc);
  drawWatermark(doc);
  drawPlateBox(doc, p.id);

  let y = drawHeaderBlock(doc, g, l, [
    { t: 'Republic of the Philippines', s: 9 },
    { t: 'CITY OF CALOOCAN', s: 11, b: true },
    { t: 'Office of the City Mayor', s: 8 },
    { t: 'TRICYCLE REGULATORY UNIT', s: 9, b: true },
  ], M + 6);

  y = drawTitle(doc, 'TODA PERMIT', y + 2);

  y = infoRow(doc, 'Permit No.:', p.id, y);
  y = infoRow(doc, 'Date Issued:', fmtDate(p.approvedDate || p.submittedDate), y);
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(p.applicantName || 'N/A', PW / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const certText = 'This certifies that ' + (p.applicantName || 'N/A') + ', is a licensed tricycle driver/operator to operate a tricycle belonging to the ' + (p.businessName || 'N/A') + ' Tricycle Operators and Drivers Association, Inc.';
  const certLines = doc.splitTextToSize(certText, CW - 16);
  doc.text(certLines, M + 8, y);
  y += certLines.length * 4 + 4;

  y = sectionHeader(doc, 'OPERATOR INFORMATION', y);
  y = infoRow(doc, 'NAME OF OPERATOR:', p.applicantName || 'N/A', y);
  y = infoRow(doc, 'ADDRESS:', p.address || 'N/A', y);
  y = infoRow(doc, 'CONTACT:', p.contactNumber || 'N/A', y);
  y = infoRow(doc, 'EMAIL:', p.email || 'N/A', y);
  y += 2;

  y = sectionHeader(doc, 'PERMIT DETAILS', y);
  y = infoRow(doc, 'Application Type:', p.application_type || 'New', y);
  y = infoRow(doc, 'Status:', p.status, y);
  y = infoRow(doc, 'Receipt No.:', p.receiptNumber || 'N/A', y);
  y = infoRow(doc, 'TODA Association:', p.businessName || 'N/A', y);
  y = infoRow(doc, 'Valid Until:', fmtDate(p.expirationDate), y);
  y += 4;

  y = drawImportant(doc, 'This permit is NON-TRANSFERABLE and is VALID until ' + fmtDate(p.expirationDate) + ', unless sooner cancelled and/or revoked. Failure to renew this permit for the next calendar year until every 20th of January shall make the permittee liable to pay SURCHARGE of 25% of the amount of yearly fees and INTEREST of 2% MONTHLY OF EVERY MONTH UNTIL FULLY PAID.', y);

  y = drawSignatureBlock(doc, [
    { name: p.applicantName || 'N/A', title: 'Permittee' },
    { name: 'OSCAR OCA MALAPITAN', title: 'City Mayor' },
    { name: 'HEAD, TRU', title: 'Tricycle Regulatory Unit' },
  ], y);

  drawFooterInfo(doc, p);
}

// ===== BUILDING PERMIT =====
function genBuilding(doc, p, g, l) {
  drawBorder(doc);
  drawWatermark(doc);
  drawPlateBox(doc, p.id);

  let y = drawHeaderBlock(doc, g, l, [
    { t: 'Republic of the Philippines', s: 9 },
    { t: 'CITY OF CALOOCAN', s: 11, b: true },
    { t: 'Office of the City Mayor', s: 8 },
    { t: 'OFFICE OF THE BUILDING OFFICIAL', s: 9, b: true },
  ], M + 6);

  y = drawTitle(doc, 'BUILDING PERMIT', y + 2);
  y = drawSubtitle(doc, '— PERMIT No. ' + p.id + ' —', y);

  y = infoRow(doc, 'Application No.:', p.id, y);
  y = infoRow(doc, 'Date Issued:', fmtDate(p.approvedDate || p.submittedDate), y);
  y = infoRow(doc, 'Issued to:', p.applicantName || 'N/A', y);
  y += 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('with registered address at: ' + (p.address || 'N/A'), M + 8, y);
  y += 5;

  const bodyText = 'has been granted to erect/construct the specified project below, subject to the provisions of the National Building Code of the Philippines (P.D. 1096) and its implementing rules and regulations.';
  doc.setFontSize(8);
  const bodyLines = doc.splitTextToSize(bodyText, CW - 16);
  doc.text(bodyLines, M + 8, y);
  y += bodyLines.length * 3.5 + 4;

  y = sectionHeader(doc, 'PROJECT INFORMATION', y);
  y = infoRow(doc, 'Use/Purpose:', p.businessName || 'N/A', y);
  y = infoRow(doc, 'Application Type:', p.application_type || 'New', y);
  y = infoRow(doc, 'Total Estimated Cost:', fmtCurrency(p.fees), y);
  y = infoRow(doc, 'Status:', p.status, y);
  y += 2;

  y = sectionHeader(doc, 'APPLICANT INFORMATION', y);
  y = infoRow(doc, 'Applicant/Owner:', p.applicantName || 'N/A', y);
  y = infoRow(doc, 'Project Location:', p.address || 'N/A', y);
  y = infoRow(doc, 'Contact:', p.contactNumber || 'N/A', y);
  y = infoRow(doc, 'Email:', p.email || 'N/A', y);
  y = infoRow(doc, 'Expected Completion:', fmtDate(p.expirationDate), y);
  y += 4;

  y = drawImportant(doc, 'This Permit may be revoked/cancelled should the grantee violate any provision of the National Building Code, its implementing rules, zoning ordinance, and other related laws, rules, and regulations. This permit is NON-TRANSFERABLE.', y);

  y = drawSignatureBlock(doc, [
    { name: p.applicantName || 'N/A', title: 'Applicant/Owner' },
    { name: 'OSCAR OCA MALAPITAN', title: 'City Mayor' },
    { name: 'CITY BUILDING OFFICIAL', title: 'Building Official' },
  ], y);

  drawFooterInfo(doc, p);
}

// ===== BARANGAY CLEARANCE =====
function genBarangay(doc, p, g, l) {
  drawBorder(doc);
  drawWatermark(doc);
  drawPlateBox(doc, p.id);

  const brgyName = p.address ? (p.address.split(',').pop()?.trim() || 'CALOOCAN CITY') : 'CALOOCAN CITY';

  let y = drawHeaderBlock(doc, g, l, [
    { t: 'Republic of the Philippines', s: 9 },
    { t: brgyName.toUpperCase(), s: 12, b: true },
    { t: 'CITY OF CALOOCAN', s: 10, b: true },
    { t: 'OFFICE OF THE BARANGAY CAPTAIN', s: 8 },
  ], M + 6);

  y = drawTitle(doc, 'BARANGAY CLEARANCE', y + 2);

  y = infoRow(doc, 'Document No.:', p.id, y);
  y = infoRow(doc, 'O.R. No.:', p.receiptNumber || 'N/A', y);
  y = infoRow(doc, 'Date Issued:', fmtDate(p.approvedDate || p.submittedDate), y);
  y += 5;

  // TO WHOM IT MAY CONCERN banner
  doc.setFillColor(...ORANGE);
  doc.roundedRect(M + 20, y, CW - 40, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('TO WHOM IT MAY CONCERN', PW / 2, y + 5, { align: 'center' });
  doc.setTextColor(...DARK);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const bodyText = 'This is to certify that ' + (p.applicantName || 'N/A').toUpperCase() + ', of legal age, residing at ' + (p.address || 'N/A') + ', Caloocan City, has requested for a BARANGAY CLEARANCE from this office.';
  const lines = doc.splitTextToSize(bodyText, CW - 20);
  doc.text(lines, M + 10, y);
  y += lines.length * 5 + 4;

  doc.setFontSize(10);
  doc.text('Purpose: ' + (p.remarks || 'General Purpose'), M + 10, y);
  y += 6;
  doc.text('Clearance Fee: ' + fmtCurrency(p.fees), M + 10, y);
  y += 8;

  y = sectionHeader(doc, 'APPLICANT DETAILS', y);
  y = infoRow(doc, 'Full Name:', p.applicantName || 'N/A', y);
  y = infoRow(doc, 'Address:', p.address || 'N/A', y);
  y = infoRow(doc, 'Contact:', p.contactNumber || 'N/A', y);
  y = infoRow(doc, 'Email:', p.email || 'N/A', y);
  y = infoRow(doc, 'Status:', p.status, y);
  y += 4;

  y = drawImportant(doc, 'This clearance is NON-TRANSFERABLE and is VALID until the date specified. Failure to renew shall subject the holder to penalties as provided by the Barangay ordinances. This clearance is issued upon the request of the above-named person for whatever legal purpose it may serve.', y);

  y = drawSignatureBlock(doc, [
    { name: p.applicantName || 'N/A', title: 'Applicant' },
    { name: 'BARANGAY CAPTAIN', title: 'Barangay Captain' },
  ], y);

  drawFooterInfo(doc, p);
}

// ===== MAIN EXPORT =====
export async function generatePermitPDF(permit) {
  const [gsmImg, plmsImg] = await Promise.all([
    loadImg(gsmLogoSrc),
    loadImg(plmsLogoSrc),
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const type = (permit.permitType || '').toLowerCase();

  if (type.includes('business')) {
    genBusiness(doc, permit, gsmImg, plmsImg);
  } else if (type.includes('franchise') || type.includes('toda')) {
    genFranchise(doc, permit, gsmImg, plmsImg);
  } else if (type.includes('building')) {
    genBuilding(doc, permit, gsmImg, plmsImg);
  } else if (type.includes('barangay')) {
    genBarangay(doc, permit, gsmImg, plmsImg);
  } else {
    genBusiness(doc, permit, gsmImg, plmsImg);
  }

  const filename = (permit.permitType || 'Permit').replace(/\s+/g, '-') + '-' + permit.id + '-Digital-Copy.pdf';
  doc.save(filename);
  return filename;
}
