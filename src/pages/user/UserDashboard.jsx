import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Briefcase, 
  Landmark, 
  ClipboardList, 
  Search, 
  X, 
  ChevronRight,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  Users,
  Zap,
  TrendingUp,
  Calendar,
  MapPin,
  Truck,
  RefreshCw,
  Home,
  ArrowRight,
  Award,
  FileCheck,
  Building,
  Car,
  Home as HomeIcon,
  Target,
  Globe,
  Lock,
  Bell,
  Mail,
  Phone
} from "lucide-react";

// 🎨 Color palette
const COLORS = {
  primary: '#4CAF50',
  secondary: '#4A90E2',
  accent: '#FDA811',
  background: '#FBFBFB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
};

// 🧩 Enhanced Services data
const SERVICES = [
  {
    id: 1,
    name: "E-PERMIT TRACKER",
    description: "Track and monitor your submitted applications with real-time updates and notifications.",
    shortDescription: "Track your permit applications in real-time",
    icon: <Search className="w-10 h-10" />,
    path: "/user/permittracker",
    features: [
      { text: "Real-time status tracking", icon: <Zap size={16} /> },
      { text: "Document history", icon: <FileText size={16} /> },
      { text: "Downloadable Unofficial Digital Copy", icon: <Clock size={16} /> }
    ],
    stats: { 
      processingTime: "24-48 hours", 
      successRate: "98%",
      averageTime: "1.5 days"
    },
    color: COLORS.secondary,
    bgColor: `${COLORS.secondary}15`,
    hoverColor: '#3A7BC8',
    hoverBgColor: '#EBF3FF',
    activeBgColor: '#D8E7FF',
    popular: true
  },
  {
    id: 2,
    name: "BUSINESS PERMIT APPLICATION",
    description: "Complete digital processing for new business permits and renewals with integrated payment system.",
    shortDescription: "Start or renew your business operations",
    icon: <Briefcase className="w-10 h-10" />,
    path: "/user/business/type",
    features: [
      { text: "New business registration", icon: <FileText size={16} /> },
      { text: "Annual renewal processing", icon: <TrendingUp size={16} /> },
      { text: "Digital tax payment", icon: <Shield size={16} /> },
      { text: "Downloadable Unofficial Digital Copy", icon: <CheckCircle size={16} /> }
    ],
    stats: { 
      processingTime: "3-5 business days", 
      successRate: "95%",
      averageTime: "3 days"
    },
    color: COLORS.primary,
    bgColor: `${COLORS.primary}15`,
    hoverColor: '#3D8B40',
    hoverBgColor: '#F0F9F0',
    activeBgColor: '#E1F3E1',
    popular: true
  },
  {
    id: 3,
    name: "BARANGAY CLEARANCE & CERTIFICATES",
    description: "Quick processing of barangay certifications including clearances and residency verification.",
    shortDescription: "Local barangay certificates and clearances",
    icon: <Landmark className="w-10 h-10" />,
    path: "/user/barangay/new",
    features: [
      { text: "Clearance application", icon: <FileText size={16} /> },
      { text: "Residency verification", icon: <Home size={16} /> },
      { text: "Business endorsement", icon: <Briefcase size={16} /> },
      { text: "Certificate issuance", icon: <CheckCircle size={16} /> }
    ],
    stats: { 
      processingTime: "1-2 days", 
      successRate: "99%",
      averageTime: "1 day"
    },
    color: COLORS.secondary,
    bgColor: `${COLORS.secondary}15`,
    hoverColor: '#3A7BC8',
    hoverBgColor: '#EBF3FF',
    activeBgColor: '#D8E7FF',
    popular: true
  },
  {
    id: 4,
    name: "FRANCHISE AND TRANSPORT PERMIT",
    description: "Streamlined franchise application for public utility vehicles with route management.",
    shortDescription: "Public transport franchise management",
    icon: <ClipboardList className="w-10 h-10" />,
    path: "/user/franchise/type",
    features: [
      { text: "New franchise application", icon: <FileText size={16} /> },
      { text: "Route management", icon: <MapPin size={16} /> },
      { text: "MTOP Applications", icon: <Truck size={16} /> },
      { text: "Renewal processing", icon: <RefreshCw size={16} /> }
    ],
    stats: { 
      processingTime: "5-7 days", 
      successRate: "96%",
      averageTime: "5 days"
    },
    color: '#8B5CF6',
    bgColor: '#F5F3FF15',
    hoverColor: '#7C3AED',
    hoverBgColor: '#F5F0FF',
    activeBgColor: '#ECE5FF',
    popular: false
  },
    {
    id: 5,
    name: "BUILDING & CONSTRUCTION PERMIT",
    description: "Comprehensive building permit system with architectural review and safety compliance checks.",
    shortDescription: "Construction permits and safety compliance",
    icon: <Building2 className="w-10 h-10" />,
    path: "/user/building/type",
    features: [
      { text: "Building plan review", icon: <FileText size={16} /> },
      { text: "Professional Registration", icon: <Shield size={16} /> },
      { text: "Inspection scheduling", icon: <Calendar size={16} /> },
      { text: "Downloadable Unofficial Digital Copy", icon: <CheckCircle size={16} /> }
    ],
    stats: { 
      processingTime: "7-14 days", 
      successRate: "92%",
      averageTime: "10 days"
    },
    color: '#F59E0B',
    bgColor: '#FEF3C715',
    hoverColor: '#D97706',
    hoverBgColor: '#FFF7E6',
    activeBgColor: '#FFEECC',
    popular: false
  },

];

// 🎯 Services available in PLMS
const PLMS_SERVICES = [
  { icon: <Building size={20} />, name: "Building Permits", color: COLORS.warning },
  { icon: <Briefcase size={20} />, name: "Business Permits", color: COLORS.primary },
  { icon: <Car size={20} />, name: "Transport Franchise", color: '#8B5CF6' },
  { icon: <HomeIcon size={20} />, name: "Barangay Clearances", color: COLORS.secondary },
  { icon: <FileCheck size={20} />, name: "E-Permit Tracker", color: COLORS.success },
  { icon: <Award size={20} />, name: "Professional License", color: COLORS.error }
];

// ✨ Benefits of using PLMS
const PLMS_BENEFITS = [
  {
    icon: <Zap size={20} />,
    title: "Fast Processing",
    description: "70% faster than traditional methods",
    color: COLORS.primary
  },
  {
    icon: <Globe size={20} />,
    title: "Online Access",
    description: "Access anytime, anywhere",
    color: COLORS.secondary
  },
  {
    icon: <Lock size={20} />,
    title: "Secure Platform",
    description: "Military-grade encryption",
    color: COLORS.success
  },
  {
    icon: <Bell size={20} />,
    title: "Real-time Updates",
    description: "Instant notifications",
    color: COLORS.warning
  }
];

export default function UserDashboard() {
  const [filteredServices, setFilteredServices] = useState(SERVICES);
  const [search, setSearch] = useState("");
  const [expandedCard, setExpandedCard] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState(null);
  const navigate = useNavigate();

  // Show welcome modal only once on first visit
  useEffect(() => {
    const hasSeenWelcomeModal = localStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenWelcomeModal) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
        localStorage.setItem('hasSeenWelcomeModal', 'true');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Close modal function
  const handleCloseModal = () => {
    setShowWelcomeModal(false);
  };

  // 🔍 Search filter
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    setFilteredServices(
      SERVICES.filter((service) => 
        service.name.toLowerCase().includes(value) ||
        service.description.toLowerCase().includes(value) ||
        service.shortDescription.toLowerCase().includes(value)
      )
    );
    // Collapse card when searching
    if (value) {
      setExpandedCard(null);
    }
  };

  // Handle card hover - expand automatically
  const handleCardHover = (id) => {
    if (isAnimating || expandedCard === id) return;
    
    // Clear any existing close timeout
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    
    setIsAnimating(true);
    setExpandedCard(id);
    setHoveredCard(id);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  // Handle card leave - collapse after a delay
  const handleCardLeave = () => {
    if (isAnimating || !expandedCard) return;
    
    setIsAnimating(true);
    
    // Set timeout to collapse after 300ms delay
    const timeout = setTimeout(() => {
      setExpandedCard(null);
      setHoveredCard(null);
      setIsAnimating(false);
      setCloseTimeout(null);
    }, 300);
    
    setCloseTimeout(timeout);
  };

  // Handle card click - navigate immediately to prevent hover conflicts
  const handleCardClick = (serviceId) => {
    // Find the service and navigate
    const service = SERVICES.find(s => s.id === serviceId);
    if (service) {
      navigate(service.path);
    }
  };

  // Handle proceed button click - navigate to service
  const handleProceed = (service, e) => {
    e.stopPropagation(); // Prevent card click event
    navigate(service.path);
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: COLORS.background }}>
      {/* Welcome Modal - Permit and Licensing Management System */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay with blur */}
          <div 
            className="absolute inset-0 backdrop-blur-md"
            style={{ 
              background: 'rgba(76, 175, 80, 0.08)' // Green with low opacity
            }}
            onClick={handleCloseModal}
          ></div>
          
          {/* Modal Content */}
          <div 
            className="relative rounded-2xl shadow-2xl p-8 max-w-4xl w-full animate-slideInUp max-h-[90vh] overflow-y-auto border"
            style={{ 
              background: 'white',
              borderColor: `${COLORS.primary}30`,
              borderWidth: '2px'
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-all duration-300 z-10"
              style={{ color: COLORS.gray[600] }}
            >
              <X size={24} />
            </button>

            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-4 rounded-2xl mb-6"
                   style={{ 
                     background: `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.secondary}15)`,
                     border: `2px solid ${COLORS.primary}20`
                   }}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                       style={{ 
                         background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                       }}>
                    <Building2 size={32} className="text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                       style={{ background: COLORS.success }}>
                    <CheckCircle size={16} className="text-white" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                Permit & Licensing Management System
              </h1>
              
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Your comprehensive digital platform for all government permits and licenses
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-xl border border-green-100">
                <div className="text-2xl font-bold mb-1" style={{ color: COLORS.primary }}>5,000+</div>
                <div className="text-sm text-gray-600">Monthly Users</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-green-50 p-4 rounded-xl border border-blue-100">
                <div className="text-2xl font-bold mb-1" style={{ color: COLORS.secondary }}>98.5%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-green-50 p-4 rounded-xl border border-yellow-100">
                <div className="text-2xl font-bold mb-1" style={{ color: COLORS.warning }}>70%</div>
                <div className="text-sm text-gray-600">Faster Processing</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
                <div className="text-2xl font-bold mb-1" style={{ color: '#8B5CF6' }}>24/7</div>
                <div className="text-sm text-gray-600">Online Access</div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-center" style={{ color: COLORS.gray[800] }}>
                Available Services
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {PLMS_SERVICES.map((service, index) => (
                  <div 
                    key={index}
                    className="flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-default group"
                    style={{ 
                      background: `${service.color}10`,
                      border: `1px solid ${service.color}20`
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110"
                      style={{ 
                        background: service.color,
                        color: 'white'
                      }}
                    >
                      {service.icon}
                    </div>
                    <span className="text-sm font-medium text-center" style={{ color: COLORS.gray[700] }}>
                      {service.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-center" style={{ color: COLORS.gray[800] }}>
                Why Choose PLMS?
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLMS_BENEFITS.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-start p-4 rounded-xl transition-all duration-300 hover:shadow-md"
                    style={{ 
                      background: `${benefit.color}08`,
                      border: `1px solid ${benefit.color}20`
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
                      style={{ 
                        background: benefit.color,
                        color: 'white'
                      }}
                    >
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-bold mb-1" style={{ color: COLORS.gray[800] }}>
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-center" style={{ color: COLORS.gray[800] }}>
                How PLMS Works
              </h2>
              <div className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 hidden md:block"
                     style={{ background: `${COLORS.primary}30` }}></div>
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { step: "1", title: "Select Service", desc: "Choose from available permits", icon: <Target size={20} /> },
                    { step: "2", title: "Submit Online", desc: "Upload required documents", icon: <FileText size={20} /> },
                    { step: "3", title: "Track Progress", desc: "Real-time application tracking", icon: <Search size={20} /> },
                    { step: "4", title: "Receive Permit", desc: "Download digital copy instantly", icon: <CheckCircle size={20} /> }
                  ].map((item, index) => (
                    <div key={index} className="relative text-center">
                      <div 
                        className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center shadow-md"
                        style={{ 
                          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                          color: 'white'
                        }}
                      >
                        {item.icon}
                      </div>
                      <div className="text-sm font-bold mb-1" style={{ color: COLORS.gray[800] }}>
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="p-6 rounded-xl mb-6"
                 style={{ 
                   background: `${COLORS.primary}08`,
                   border: `1px solid ${COLORS.primary}20`
                 }}>
              <h3 className="text-lg font-bold mb-3 text-center" style={{ color: COLORS.primary }}>
                Need Help?
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center justify-center p-3 rounded-lg bg-white">
                  <Mail size={16} className="mr-2" style={{ color: COLORS.secondary }} />
                  <span className="text-sm">support@plms.gov.ph</span>
                </div>
                <div className="flex items-center justify-center p-3 rounded-lg bg-white">
                  <Phone size={16} className="mr-2" style={{ color: COLORS.primary }} />
                  <span className="text-sm">(02) 1234-5678</span>
                </div>
                <div className="flex items-center justify-center p-3 rounded-lg bg-white">
                  <Clock size={16} className="mr-2" style={{ color: COLORS.warning }} />
                  <span className="text-sm">Mon-Fri, 8AM-5PM</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-md"
                style={{ 
                  background: COLORS.background,
                  color: COLORS.primary,
                  border: `2px solid ${COLORS.primary}`
                }}
              >
                Explore Services
              </button>
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`
                }}
              >
                Get Started Now
              </button>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-6 pt-4 border-t" style={{ borderColor: `${COLORS.gray[200]}` }}>
              <p className="text-sm text-gray-500">
                PLMS - Making government services accessible, efficient, and transparent
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 lg:px-12 py-8">
        {/* Header Section */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: COLORS.primary }}>
              PERMIT AND LICENSING MANAGEMENT
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Streamlined digital services for businesses and individuals. 
              Apply, track, and manage all your permits in one place.
            </p>
          </div>
          {/* 🔍 Search Bar */}
          <div className="mb-12">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search for services..."
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border-2 shadow-sm focus:outline-none focus:shadow-md transition-all duration-700"
                style={{ 
                  borderColor: COLORS.gray[200],
                  background: 'white'
                }}
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilteredServices(SERVICES);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          {/* Stats - Made more compact */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-md hover:-translate-y-1 cursor-default">
              <div className="text-xl font-bold" style={{ color: COLORS.primary }}>5K+</div>
              <div className="text-xs text-gray-600">Monthly Applications</div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-md hover:-translate-y-1 cursor-default">
              <div className="text-xl font-bold" style={{ color: COLORS.secondary }}>98%</div>
              <div className="text-xs text-gray-600">Approval Rate</div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-md hover:-translate-y-1 cursor-default">
              <div className="text-xl font-bold" style={{ color: COLORS.accent }}>70%</div>
              <div className="text-xs text-gray-600">Faster Processing</div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 transition-all duration-700 hover:shadow-md hover:-translate-y-1 cursor-default">
              <div className="text-xl font-bold" style={{ color: COLORS.gray[700] }}>24/7</div>
              <div className="text-xs text-gray-600">Online Access</div>
            </div>
          </div>


        </div>

        {/* 🧩 Horizontal Rectangle Cards Section */}
        <div className="max-w-4xl mx-auto">
          {/* Services Grid */}
          <div className="space-y-5">
            {filteredServices.map((service) => {
              const isHovered = hoveredCard === service.id;
              const isExpanded = expandedCard === service.id;
              
              return (
                <div
                  key={service.id}
                  className="service-card relative overflow-hidden transition-all duration-500 rounded-xl shadow-lg border cursor-pointer group"
                  onMouseEnter={() => handleCardHover(service.id)}
                  onMouseLeave={handleCardLeave}
                  onClick={() => handleCardClick(service.id)}
                  style={{ 
                    background: isExpanded || isHovered 
                      ? service.hoverBgColor 
                      : 'white',
                    borderColor: isExpanded || isHovered 
                      ? service.hoverColor 
                      : COLORS.gray[200],
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    transform: (isExpanded || isHovered) ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: (isExpanded || isHovered)
                      ? `0 15px 30px -10px ${service.color}30, 0 8px 15px -8px ${service.color}20`
                      : '0 3px 5px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
                    transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                    height: isExpanded ? 'auto' : '140px',
                    minHeight: '140px'
                  }}
                >
                  {/* Card Header - Always Visible */}
                  <div className="p-5 h-full flex items-center">
                    <div className="flex items-center w-full">
                      {/* Service Icon */}
                      <div 
                        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-500 mr-4"
                        style={{ 
                          background: isExpanded || isHovered
                            ? service.hoverColor
                            : `${service.color}15`,
                          color: isExpanded || isHovered
                            ? 'white' 
                            : service.color,
                          transform: (isExpanded || isHovered) ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        {React.cloneElement(service.icon, { className: "w-8 h-8" })}
                      </div>

                      {/* Service Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 
                            className="text-lg font-bold transition-colors duration-500 truncate"
                            style={{ 
                              color: isExpanded || isHovered
                                ? service.hoverColor 
                                : COLORS.gray[800]
                            }}
                          >
                            {service.name}
                          </h3>
                          {service.popular && (
                            <span 
                              className="px-1.5 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 transition-all duration-500"
                              style={{ 
                                background: isExpanded || isHovered
                                  ? `${service.hoverColor}30`
                                  : `${COLORS.accent}15`,
                                color: isExpanded || isHovered
                                  ? service.hoverColor
                                  : COLORS.accent,
                                transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                            >
                              Popular
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2 transition-colors duration-500">
                          {service.shortDescription}
                        </p>

                        {/* Stats Badges */}
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center text-xs transition-all duration-500">
                            <Clock 
                              size={12} 
                              className="mr-1 transition-colors duration-500" 
                              style={{ 
                                color: isExpanded || isHovered
                                  ? service.hoverColor
                                  : COLORS.gray[500] 
                              }} 
                            />
                            <span 
                              className="font-medium transition-colors duration-500"
                              style={{ 
                                color: isExpanded || isHovered
                                  ? service.hoverColor
                                  : COLORS.gray[700]
                              }}
                            >
                              {service.stats.processingTime}
                            </span>
                          </div>
                          <div className="flex items-center text-xs transition-all duration-500">
                            <TrendingUp 
                              size={12} 
                              className="mr-1 transition-colors duration-500" 
                              style={{ 
                                color: isExpanded || isHovered
                                  ? service.hoverColor
                                  : COLORS.gray[500] 
                              }} 
                            />
                            <span 
                              className="font-medium transition-colors duration-500"
                              style={{ 
                                color: isExpanded || isHovered
                                  ? service.hoverColor
                                  : COLORS.gray[700]
                              }}
                            >
                              {service.stats.successRate} success
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expand/Collapse Indicator */}
                      <div className="flex-shrink-0 flex items-center ml-3 opacity-70 transition-all duration-500">
                        <ChevronRight 
                          size={20} 
                          className={`transition-transform duration-500 ${isExpanded ? 'rotate-90' : ''}`}
                          style={{ 
                            color: isExpanded || isHovered ? service.hoverColor : COLORS.gray[400],
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content - Shows when card is hovered */}
                  {isExpanded && (
                    <div 
                      className="border-t px-5 py-4 animate-verySlowFadeIn"
                      style={{ 
                        borderColor: `${service.color}20`,
                        background: `${service.color}03`
                      }}
                    >
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Column - Features */}
                        <div>
                          <h4 className="text-base font-semibold mb-3 flex items-center transition-colors duration-500"
                              style={{ color: service.hoverColor }}>
                            <Zap size={16} className="mr-2" />
                            Key Features
                          </h4>
                          <div className="space-y-2">
                            {service.features.map((feature, index) => (
                              <div 
                                key={index} 
                                className="flex items-start transition-all duration-500 hover:translate-x-1"
                                style={{ transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                              >
                                <div 
                                  className="mr-2 mt-0.5 transition-colors duration-500"
                                  style={{ color: service.hoverColor }}
                                >
                                  {React.cloneElement(feature.icon, { size: 14 })}
                                </div>
                                <span className="text-sm text-gray-700">
                                  {feature.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Column - Details & Stats */}
                        <div>
                          <h4 
                            className="text-base font-semibold mb-3 transition-colors duration-500"
                            style={{ color: service.hoverColor }}
                          >
                            Service Details
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-700 mb-2">
                                {service.description}
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">
                                    Processing Speed
                                  </span>
                                  <span 
                                    className="font-medium"
                                    style={{ color: service.hoverColor }}
                                  >
                                    {service.stats.averageTime} average
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="h-1.5 rounded-full transition-all duration-500"
                                    style={{ 
                                      width: '85%',
                                      background: `linear-gradient(90deg, ${service.color}, ${service.hoverColor})`,
                                      transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                  ></div>
                                </div>
                              </div>

                              <div className="flex space-x-3">
                                <div 
                                  className="flex-1 p-2 rounded-lg text-center transition-all duration-500" 
                                  style={{ 
                                    background: `${service.color}10`,
                                    border: `1px solid ${service.color}20`,
                                    transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                                  }}
                                >
                                  <div className="text-xs text-gray-600">
                                    Required Docs
                                  </div>
                                  <div 
                                    className="text-base font-bold mt-0.5"
                                    style={{ 
                                      color: service.hoverColor
                                    }}
                                  >
                                    3-5
                                  </div>
                                </div>
                                <div 
                                  className="flex-1 p-2 rounded-lg text-center transition-all duration-500" 
                                  style={{ 
                                    background: `${service.color}10`,
                                    border: `1px solid ${service.color}20`,
                                    transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                                  }}
                                >
                                  <div className="text-xs text-gray-600">
                                    Online Payment
                                  </div>
                                  <div 
                                    className="text-base font-bold mt-0.5"
                                    style={{ 
                                      color: service.hoverColor
                                    }}
                                  >
                                    Yes
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Proceed Button Section */}
                      <div className="mt-6 pt-4 border-t flex justify-end items-center" 
                           style={{ borderColor: `${service.color}20` }}>
                        <button
                          onClick={(e) => handleProceed(service, e)}
                          className="flex items-center px-4 py-2.5 rounded-lg font-semibold text-white shadow-md transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-sm"
                          style={{ 
                            background: `linear-gradient(135deg, ${service.color}, ${service.hoverColor})`,
                            transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          <span>Proceed to {service.name}</span>
                          <ArrowRight size={16} className="ml-1.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* No Results Message */}
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <Search size={40} className="mx-auto mb-3" style={{ color: COLORS.gray[400] }} />
              <h3 className="text-lg font-semibold mb-1.5" style={{ color: COLORS.gray[700] }}>
                No services found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto text-sm">
                We couldn't find any services matching "{search}". Try searching for something else.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setFilteredServices(SERVICES);
                }}
                className="mt-3 px-3 py-1.5 rounded-lg font-medium transition-all duration-700 hover:bg-gray-200 hover:-translate-y-0.5 text-sm"
                style={{ 
                  background: COLORS.gray[100],
                  color: COLORS.gray[700]
                }}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Additional Info Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-xl font-bold text-center mb-8" style={{ color: COLORS.primary }}>
            Why Choose Our Platform
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center transition-all duration-700 hover:shadow-md hover:-translate-y-1 hover:border-blue-100 cursor-default group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-700 group-hover:scale-105" 
                   style={{ background: `${COLORS.primary}15`, color: COLORS.primary }}>
                <Shield size={20} />
              </div>
              <h3 className="text-base font-bold mb-2 transition-colors duration-700 group-hover:text-blue-600">Secure & Encrypted</h3>
              <p className="text-gray-600 text-xs group-hover:text-gray-800">
                Military-grade encryption protects all your documents and personal information.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center transition-all duration-700 hover:shadow-md hover:-translate-y-1 hover:border-green-100 cursor-default group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-700 group-hover:scale-105" 
                   style={{ background: `${COLORS.secondary}15`, color: COLORS.secondary }}>
                <Zap size={20} />
              </div>
              <h3 className="text-base font-bold mb-2 transition-colors duration-700 group-hover:text-green-600">Fast Processing</h3>
              <p className="text-gray-600 text-xs group-hover:text-gray-800">
                Automated workflows reduce processing time by up to 70% compared to manual systems.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center transition-all duration-700 hover:shadow-md hover:-translate-y-1 hover:border-orange-100 cursor-default group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-700 group-hover:scale-105" 
                   style={{ background: `${COLORS.accent}15`, color: COLORS.accent }}>
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold mb-2 transition-colors duration-700 group-hover:text-orange-600">24/7 Support</h3>
              <p className="text-gray-600 text-xs group-hover:text-gray-800">
                Get instant help from our support team via chat, email, or phone anytime.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Custom CSS for animations and line clamping */}
      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes verySlowFadeIn {
          0% { 
            opacity: 0; 
            transform: translateY(-5px); 
          }
          20% {
            opacity: 0;
            transform: translateY(-4px);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-verySlowFadeIn {
          animation: verySlowFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Line clamping for better text control */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Truncate long text */
        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}