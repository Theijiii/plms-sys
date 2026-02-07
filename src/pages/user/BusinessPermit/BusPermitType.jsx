import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from "lucide-react";
import Swal from 'sweetalert2';

const COLORS = {
  primary: '#4A90E2',
  secondary: '#000000',
  accent: '#FDA811',
  success: '#4CAF50',
  danger: '#E53935',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

export default function BusPermitType({ business_permit_id }) {
  const navigate = useNavigate();

  const application_type = [
    { id: 'NEW', title: 'NEW', description: 'Apply for a new business permit', color: 'bg-green-500 hover:bg-green-600' },
    { id: 'RENEWAL', title: 'RENEWAL', description: 'Renew your existing business permit', color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'SPECIAL', title: 'SPECIAL', description: 'Apply for special business permit or exemption', color: 'bg-purple-500 hover:bg-purple-600' },
    { id: 'LIQUOR_PERMIT', title: 'LIQUOR PERMIT', description: 'Apply for liquor license and related permits', color: 'bg-red-500 hover:bg-red-600' },
    { id: 'AMENDMENT', title: 'AMENDMENT', description: 'Make changes to your existing business permit', color: 'bg-yellow-500 hover:bg-yellow-600' },
  ];

  const verifyBarangayClearance = async (permitId) => {
    try {
      const response = await fetch('/backend/barangay_permit/admin_fetch.php');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const permit = data.data.find(p => 
          String(p.permit_id) === String(permitId) && p.status === 'approved'
        );
        return permit ? { exists: true, permit_id: permit.permit_id, permit } : { exists: false };
      }
      return { exists: false };
    } catch (error) {
      console.error('Error verifying Barangay Permit:', error);
      return { exists: false, error: true };
    }
  };

  const verifyApplicantId = async (applicantId) => {
    try {
      const response = await fetch('/backend/business_permit/admin_fetch.php');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const application = data.data.find(app => 
          String(app.applicant_id).trim() === String(applicantId).trim()
        );
        return application ? { exists: true, applicant_id: application.applicant_id, application } : { exists: false };
      }
      return { exists: false };
    } catch (error) {
      console.error('Error verifying Applicant ID:', error);
      return { exists: false, error: true };
    }
  };

  const handleTypeSelection = (typeId) => {
    const selectedApplication = application_type.find(t => t.id === typeId);
    
    // Check if this is a NEW application or other type
    if (typeId === 'NEW') {
      // For NEW type, ask about Barangay Permit
      Swal.fire({
        title: 'Do you have an existing Barangay Permit?',
        html: `
          <div style="text-align: center; padding: 10px 0;">
            <p style="margin-bottom: 10px;">Before applying for a business permit, we need to check if you already have a valid Barangay Permit.</p>
            <p style="font-size: 0.9rem; color: #666;">If you don't have one, you will be redirected to the Barangay Permit application page.</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: COLORS.success,
        cancelButtonColor: '#9CA3AF',
        denyButtonColor: COLORS.primary,
        confirmButtonText: 'Yes, I have one',
        cancelButtonText: 'No',
        denyButtonText: 'Redirect me to apply',
        customClass: {
          popup: 'swal-wide',
          title: 'swal-title-center',
          htmlContainer: 'swal-text-center'
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Ask for Barangay Permit ID
          const { value: permitId } = await Swal.fire({
            title: 'Enter Barangay Permit ID',
            html: `
              <div style="text-align: center; padding: 10px 0;">
                <p style="margin-bottom: 15px; font-size: 0.95rem;">Please enter your Barangay Permit ID to verify your permit.</p>
              </div>
            `,
            input: 'text',
            inputPlaceholder: 'e.g., 2041',
            showCancelButton: true,
            confirmButtonColor: COLORS.success,
            cancelButtonColor: '#9CA3AF',
            confirmButtonText: 'Verify',
            cancelButtonText: 'Cancel',
            customClass: {
              popup: 'swal-wide',
              title: 'swal-title-center',
              htmlContainer: 'swal-text-center'
            },
            inputValidator: (value) => {
              if (!value) {
                return 'Please enter your Barangay Permit ID';
              }
            }
          });

          if (permitId) {
            // Show loading while verifying
            Swal.fire({
              title: 'Verifying...',
              html: '<p style="text-align: center;">Checking your Barangay Permit ID...</p>',
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });

            // Verify the permit ID
            const verification = await verifyBarangayClearance(permitId);

            if (verification.exists) {
              // NEW type - show confirmation
              Swal.fire({
                title: 'Permit Verified!',
                html: `
                  <div style="text-align: center; padding: 10px 0;">
                    <p style="margin-bottom: 10px; color: ${COLORS.success};">✓ Your Barangay Permit is valid and approved.</p>
                    <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="margin-bottom: 10px;">You have selected: <strong style="color: ${COLORS.primary}">${selectedApplication?.title}</strong></p>
                    <p style="font-size: 0.9rem; color: #666;">${selectedApplication?.description}</p>
                  </div>
                `,
                icon: 'success',
                showCancelButton: true,
                confirmButtonColor: COLORS.success,
                cancelButtonColor: '#9CA3AF',
                confirmButtonText: 'Continue',
                cancelButtonText: 'Cancel',
                customClass: {
                  popup: 'swal-wide',
                  title: 'swal-title-center',
                  htmlContainer: 'swal-text-center'
                }
              }).then((confirmResult) => {
                if (confirmResult.isConfirmed) {
                  navigate('/user/business/new', {
                    state: { 
                      application_type: typeId,
                      barangay_permit_id: verification.permit_id
                    }
                  });
                }
              });
            } else {
              // Invalid or not found
              Swal.fire({
                title: 'Permit Not Found',
                html: `
                  <div style="text-align: center; padding: 10px 0;">
                    <p style="margin-bottom: 10px; color: ${COLORS.danger};">There is no ID existing or your permit is not approved yet.</p>
                    <p style="font-size: 0.9rem; color: #666;">You need to apply for a Barangay Permit first before proceeding with a Business Permit application.</p>
                  </div>
                `,
                icon: 'error',
                showDenyButton: true,
                showCancelButton: false,
                showConfirmButton: false,
                denyButtonColor: COLORS.primary,
                denyButtonText: 'Apply for Barangay Permit',
                customClass: {
                  popup: 'swal-wide',
                  title: 'swal-title-center',
                  htmlContainer: 'swal-text-center'
                }
              }).then((errorResult) => {
                if (errorResult.isDenied) {
                  navigate('/user/barangay/new');
                }
              });
            }
          }
        } else if (result.isDenied) {
          // Redirect to Barangay Permit application
          navigate('/user/barangay/new');
        }
        // If cancelled, do nothing
      });
    } else {
      // For other types (RENEWAL, SPECIAL, LIQUOR_PERMIT, AMENDMENT), ask for Business Permit Applicant ID
      Swal.fire({
        title: 'Do you have an existing Business Permit?',
        html: `
          <div style="text-align: center; padding: 10px 0;">
            <p style="margin-bottom: 10px;">To proceed with <strong>${selectedApplication?.title}</strong>, we need to verify your existing Business Permit.</p>
            <p style="font-size: 0.9rem; color: #666;">${selectedApplication?.description}</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: COLORS.success,
        cancelButtonColor: '#9CA3AF',
        confirmButtonText: 'Yes, I have one',
        cancelButtonText: 'No',
        customClass: {
          popup: 'swal-wide',
          title: 'swal-title-center',
          htmlContainer: 'swal-text-center'
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Ask for Business Permit Applicant ID
          const { value: applicantId } = await Swal.fire({
            title: 'Enter Business Permit Applicant ID',
            html: `
              <div style="text-align: center; padding: 10px 0;">
                <p style="margin-bottom: 15px; font-size: 0.95rem;">Please enter your Business Permit Applicant ID to verify your existing application.</p>
              </div>
            `,
            input: 'text',
            inputPlaceholder: 'e.g., BUS-2026-1234',
            showCancelButton: true,
            confirmButtonColor: COLORS.success,
            cancelButtonColor: '#9CA3AF',
            confirmButtonText: 'Verify',
            cancelButtonText: 'Cancel',
            customClass: {
              popup: 'swal-wide',
              title: 'swal-title-center',
              htmlContainer: 'swal-text-center'
            },
            inputValidator: (value) => {
              if (!value) {
                return 'Please enter your Applicant ID';
              }
            }
          });

          if (applicantId) {
            // Show loading while verifying
            Swal.fire({
              title: 'Verifying...',
              html: '<p style="text-align: center;">Checking your Applicant ID...</p>',
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });

            // Verify the applicant ID
            const applicantVerification = await verifyApplicantId(applicantId);

            if (applicantVerification.exists) {
              // Valid applicant ID - Show confirmation
              Swal.fire({
                title: 'Verification Complete!',
                html: `
                  <div style="text-align: center; padding: 10px 0;">
                    <p style="margin-bottom: 10px; color: ${COLORS.success};">✓ Your Business Permit Applicant ID is verified.</p>
                    <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="margin-bottom: 10px;">You have selected: <strong style="color: ${COLORS.primary}">${selectedApplication?.title}</strong></p>
                    <p style="font-size: 0.9rem; color: #666;">${selectedApplication?.description}</p>
                  </div>
                `,
                icon: 'success',
                showCancelButton: true,
                confirmButtonColor: COLORS.success,
                cancelButtonColor: '#9CA3AF',
                confirmButtonText: 'Continue',
                cancelButtonText: 'Cancel',
                customClass: {
                  popup: 'swal-wide',
                  title: 'swal-title-center',
                  htmlContainer: 'swal-text-center'
                }
              }).then((confirmResult) => {
                if (confirmResult.isConfirmed) {
                  const routeMap = {
                    RENEWAL: '/user/business/renewal',
                    SPECIAL: '/user/business/special',
                    LIQUOR_PERMIT: '/user/business/liquor',
                    AMENDMENT: '/user/business/amendment',
                  };
                  navigate(routeMap[typeId], {
                    state: { 
                      application_type: typeId,
                      applicant_id: applicantVerification.applicant_id
                    }
                  });
                }
              });
            } else {
              // Invalid applicant ID
              Swal.fire({
                title: 'Applicant ID Not Found',
                html: `
                  <div style="text-align: center; padding: 10px 0;">
                    <p style="margin-bottom: 10px; color: ${COLORS.danger};">The Applicant ID you entered does not exist in our records.</p>
                    <p style="font-size: 0.9rem; color: #666;">Please check your Applicant ID and try again.</p>
                  </div>
                `,
                icon: 'error',
                confirmButtonColor: COLORS.primary,
                confirmButtonText: 'OK',
                customClass: {
                  popup: 'swal-wide',
                  title: 'swal-title-center',
                  htmlContainer: 'swal-text-center'
                }
              });
            }
          }
        }
        // If cancelled or no, do nothing
      });
    }
  };

  const handleBackToDashboard = () => {
    Swal.fire({
      title: 'Go Back to Dashboard?',
      text: 'Are you sure you want to return to the dashboard?',
      icon: 'question',
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
          html: '<p style="text-align: center;">Returning to dashboard...</p>',
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
            navigate('/user/dashboard');
          }
        });
      }
    });
  };

  return (
    <div className="mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg min-h-screen">
      <h1 className="text-2xl md:text-4xl font-bold mb-8 text-center">Business Permit Types</h1>
      <p className="mb-6 text-center">Please select the type of business permit you need to apply for</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6">
        {application_type.map((type) => (
          <div
            key={type.id}
            onClick={() => handleTypeSelection(type.id)}
            className="cursor-pointer rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-blue-300 hover:bg-blue-100 shadow-lg shadow-blue-200/50 hover:shadow-blue-300/50 flex flex-col justify-between h-full"
          >
            <h2 className="mb-3 text-2xl font-semibold flex items-center justify-between">
              {type.title}
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-70">{type.description}</p>
          </div>
        ))}
      </div>


      {/* Back to Dashboard Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleBackToDashboard}
          style={{ backgroundColor: COLORS.success, color: '#fff' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.accent}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.success}
          className="inline-flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
