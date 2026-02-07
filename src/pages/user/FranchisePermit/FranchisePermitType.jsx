import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from "lucide-react";
import Swal from 'sweetalert2';

const COLORS = {
  primary: '#4A90E2',
  secondary: '#000000',
  accent: '#FDA811',  // hover color
  success: '#4CAF50', // default button color
  danger: '#E53935',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

export default function FranchisePermitType({ franchise_permit_id }) {
  const navigate = useNavigate();

  const application_type = [
    { id: 'NEW', title: 'NEW', description: 'Apply for a new franchise permit' },
    { id: 'RENEWAL', title: 'RENEWAL', description: 'Renew your existing franchise permit' },
  ];

  // Hover handlers for buttons
  const handleMouseEnter = (e) => {
    e.currentTarget.style.backgroundColor = COLORS.accent;
  };
  const handleMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = COLORS.success;
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

  const handleTypeSelection = (typeId) => {
    const selectedApplication = application_type.find(t => t.id === typeId);
    
    Swal.fire({
      title: 'Selected Permit Type',
      html: `
        <div style="text-align: center; padding: 10px 0;">
          <p style="margin-bottom: 10px;">You have selected: <strong style="color: ${COLORS.primary}">${selectedApplication?.title}</strong></p>
          <p style="font-size: 0.9rem; color: #666;">${selectedApplication?.description}</p>
        </div>
      `,
      icon: 'question',
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
    }).then((result) => {
      if (result.isConfirmed) {
        const routeMap = {
          NEW: '/user/franchise/new',
          RENEWAL: '/user/franchise/renew',
        };
        navigate(routeMap[typeId] || '/user/franchise/new', { 
          state: { permitType: typeId } 
        });
      }
    });
  };

  // TEMPORARILY DISABLED: Confirmation modal handlers
  // const handleConfirmYes = () => {
  //   setIsConfirmModalOpen(false);
  //   navigate('/user/franchise/new', { state: { permitType: 'NEW' } });
  // };
  
  // const handleConfirmNo = () => {
  //   setIsConfirmModalOpen(false);
  // };

  return (
    <div className="mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg min-h-screen">
      <h1 className="text-2xl md:text-4xl font-bold mb-8 text-center">
        Franchise and Transport Permit Types
      </h1>
      <p className="mb-6 text-center">
        Please select the type of franchise permit you need to apply for
      </p>

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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="inline-flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}