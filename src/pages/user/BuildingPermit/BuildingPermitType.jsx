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

export default function BuildingPermitType({ building_permit_id }) {
  const navigate = useNavigate();

  const permit_type = [
    { id: 'PROFESSIONAL', title: 'PROFESSIONAL / ENGINEER', description: 'Register yourself as a professional or engineer to be available for building projects.', color: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'NEW', title: 'NEW', description: 'Apply for a new building permit for your project.', color: 'bg-green-500 hover:bg-green-600' },
    { id: 'RENEWAL', title: 'RENEWAL', description: 'Renew your current building permit quickly and easily.w your existing building permit', color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'OCCUPANCY', title: 'OCCUPANCY', description: 'Apply for a permit to legally occupy your building.', color: 'bg-pink-500 hover:bg-pink-600' },
    { id: 'ANCILLARY', title: 'ANCILLARY PERMITS', description: 'Apply for the required ancillary permits needed for specialized works in your building project.', color: 'bg-yellow-500 hover:bg-yellow-600' },
  ];

const handleTypeSelection = (typeId) => {
  const selectedPermit = permit_type.find(t => t.id === typeId);
  
  Swal.fire({
    title: 'Selected Permit Type',
    html: `
      <div style="text-align: center; padding: 10px 0;">
        <p style="margin-bottom: 10px;">You have selected: <strong style="color: ${COLORS.primary}">${selectedPermit?.title}</strong></p>
        <p style="font-size: 0.9rem; color: #666;">${selectedPermit?.description}</p>
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
        NEW: '/user/building/new',
        RENEWAL: '/user/building/renewal',
        OCCUPANCY: '/user/building/occupancy',
        PROFESSIONAL: '/user/building/professional',
        ANCILLARY: '/user/building/ancillary',
      };
      navigate(routeMap[typeId] || '/user/building/new', {
        state: { permitType: typeId },
      });
    }
  });
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
        <h1 className="text-2xl md:text-4xl font-bold mb-8 text-center">
          Building Permit Types
        </h1>
        <p className="mb-6 text-center">
          Please select the type of Building permit you need to apply for
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6">
          {permit_type.map((type) => (
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
