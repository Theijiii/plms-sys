import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building, 
  Car, 
  FileText, 
  Home,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  UserPlus,
  TrendingUp,
  Award,
  Zap,
  Lock,
  Globe,
  Users
} from "lucide-react";
import Footer from '../components/user/Footer';

export default function LandingPage() {
  const [time, setTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);
  const [activeCard, setActiveCard] = useState(null);
  const navigate = useNavigate();

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Header visibility on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (direction !== "down" && scrollY > 50) {
        setIsVisible(true);
      } else if (direction === "down" && scrollY > 50) {
        setIsVisible(false);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };

    window.addEventListener("scroll", updateScrollDirection);
    return () => window.removeEventListener("scroll", updateScrollDirection);
  }, []);

  const handleLoginClick = () => {
    navigate("/login");
  };

  const services = [
    {
      id: 1,
      title: "Business Permit Application",
      description: "Apply, renew, and manage your business permits online with streamlined processing.",
      icon: <FileText className="w-8 h-8" />,
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      borderColor: "border-blue-300",
      iconBg: "bg-blue-500",
      textColor: "text-blue-600",
      features: ["New Business", "Renewal", "Amendments", "Payment"],
      stats: "Processed in 3-5 days",
      statsIcon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: 2,
      title: "Transport & Franchise Permit",
      description: "Secure transport permits, vehicle registration, and franchise applications digitally.",
      icon: <Car className="w-8 h-8" />,
      gradient: "from-green-500 to-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      borderColor: "border-green-300",
      iconBg: "bg-green-500",
      textColor: "text-green-600",
      features: ["Registration", "Franchise", "Renewal"],
      stats: "24/7 Online Application",
      statsIcon: <Globe className="w-4 h-4" />
    },
    {
      id: 3,
      title: "Building & Construction Permit",
      description: "Submit building plans, get construction permits, and schedule inspections online.",
      icon: <Building className="w-8 h-8" />,
      gradient: "from-orange-500 to-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      borderColor: "border-orange-300",
      iconBg: "bg-orange-500",
      textColor: "text-orange-600",
      features: ["Building Plans", "Permits", "Clearances"],
      stats: "Digital Plan Submission",
      statsIcon: <Zap className="w-4 h-4" />
    },
    {
      id: 4,
      title: "Barangay Permit & Clearance",
      description: "Obtain barangay clearance, community permits, and local certifications quickly.",
      icon: <Home className="w-8 h-8" />,
      gradient: "from-red-500 to-red-600",
      bgColor: "bg-gradient-to-br from-red-50 to-red-100",
      borderColor: "border-red-300",
      iconBg: "bg-red-500",
      textColor: "text-red-600",
      features: ["Clearance", "Certifications", "Community", "Local"],
      stats: "Issued in 24 hours",
      statsIcon: <Clock className="w-4 h-4" />
    }
  ];

  const features = [
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Secure & Encrypted",
      description: "Bank-level security protection",
      gradient: "from-yellow-400 to-orange-500",
      iconBg: "bg-gradient-to-br from-yellow-400 to-orange-500"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "24/7 Access",
      description: "Apply anytime, anywhere",
      gradient: "from-blue-400 to-blue-600",
      iconBg: "bg-gradient-to-br from-blue-400 to-blue-600"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fast Processing",
      description: "Quick turnaround times",
      gradient: "from-green-400 to-green-600",
      iconBg: "bg-gradient-to-br from-green-400 to-green-600"
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Users", icon: <Users className="w-5 h-5" /> },
    { value: "100K+", label: "Applications", icon: <FileText className="w-5 h-5" /> },
    { value: "99%", label: "Satisfaction", icon: <Award className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-100/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      {/* Header - WHITE (unchanged) */}
      <header
        className={`sticky top-0 z-50 bg-white shadow-sm border-b-4 border-[#FDA811] transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="px-[50px] py-3 flex justify-between items-center">
          {/* LEFT: Logo + Title + Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src="/logoplms.png"
                alt="PLMS Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold">
                <span className="text-blue-700">Go</span>
                <span className="text-green-600">Serve</span>
                <span className="text-blue-700">PH</span>
              </span>
              <span className="text-sm text-gray-600">
                Serbisyong Publiko, Abot-Kamay Mo.
              </span>
            </div>
          </div>

          {/* RIGHT: Auth Buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right text-sm text-gray-800 mr-3">
              <div className="font-semibold">{time.toLocaleTimeString()}</div>
              <div>
                {time.toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 md:px-12 lg:px-[50px] py-8 md:py-10 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Section - Hero Content */}
          <div className="text-center lg:text-left space-y-8 mt-8">
            {/* Logo + Badge */}
            <div className="flex flex-col items-center lg:items-start gap-6">
              <img
                src="/logoplms.png"
                alt="PLMS Logo"
                className="w-32 h-32 object-contain drop-shadow-lg"
              />
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 backdrop-blur-sm rounded-full border border-blue-300">
                <Award className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Trusted Government Service Platform</span>
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-800 drop-shadow-sm">
                Permit & Licensing Made
                <span className="block mt-2 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Simple & Fast
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-medium max-w-2xl">
                Transform your permit applications with our secure digital platform. Government services are now faster, simpler, and accessible at your fingertips.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-white backdrop-blur-md border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                >
                  <div className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleLoginClick}
                className="group px-8 py-4 bg-gradient-to-r from-[#FDA811] to-[#ff8c00] text-white rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <UserPlus className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Get Started Now</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="flex items-center justify-center text-blue-600">
                    {stat.icon}
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-800 drop-shadow-sm">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section - Service Cards */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                Our Services
              </h2>
              <p className="text-gray-700 text-sm md:text-base">
                Wide ranging digital solutions for all your permit needs
              </p>
            </div>

            {/* Service Cards Grid */}
            <div className="grid grid-cols-1 gap-5">
              {services.map((service) => (
                <div
                  key={service.id}
                  onMouseEnter={() => setActiveCard(service.id)}
                  onMouseLeave={() => setActiveCard(null)}
                  className={`${service.bgColor} backdrop-blur-sm border-2 ${service.borderColor} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 cursor-pointer group`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-16 h-16 ${service.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                      <div className="text-white">
                        {service.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-xl mb-2 ${service.textColor} group-hover:underline`}>
                        {service.title}
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 text-sm font-semibold ${service.textColor} mb-4 px-3 py-2 bg-white/50 rounded-lg border ${service.borderColor} w-fit`}>
                    {service.statsIcon}
                    <span>{service.stats}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 bg-white/80 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-800 border border-gray-200 hover:bg-white transition-colors shadow-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer (unchanged) */}
      <Footer />
    </div>
  );
}