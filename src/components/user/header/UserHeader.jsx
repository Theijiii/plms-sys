import { useState, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function UserHeader() {
  const [time, setTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [open, setOpen] = useState(false);
  const [userFirstName, setUserFirstName] = useState("Loading...");
  const [userFullName, setUserFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  // ================= TIME =================
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ================= SCROLL =================
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // ================= GET USER FROM LOCALSTORAGE =================
  const getUserFromStorage = () => {
    console.log("🔍 UserHeader: Getting user data from localStorage...");
    
    // Get first name (priority order)
    const firstName = localStorage.getItem("first_name") || 
                     localStorage.getItem("user_name") ||
                     localStorage.getItem("goserveph_name");
    
    // Get full name
    const fullName = localStorage.getItem("full_name") ||
                    localStorage.getItem("display_name") ||
                    localStorage.getItem("goserveph_name");
    
    // Get email
    const email = localStorage.getItem("email") || 
                  localStorage.getItem("goserveph_email");
    
    // Get role
    const role = localStorage.getItem("role") || 
                 localStorage.getItem("goserveph_role") || 
                 "user";
    
    // Use first name if available, otherwise extract from full name
    let displayFirstName = firstName;
    
    if (!displayFirstName && fullName) {
      // Extract first name from full name
      const nameParts = fullName.split(' ');
      displayFirstName = nameParts[0] || "User";
    } else if (!displayFirstName && email) {
      // Extract from email as last resort
      const emailName = email.split('@')[0];
      displayFirstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    } else if (!displayFirstName) {
      displayFirstName = "User";
    }
    
    console.log("✅ User data:", {
      firstName: displayFirstName,
      fullName: fullName || displayFirstName,
      email: email || "No email",
      role: role
    });
    
    return {
      firstName: displayFirstName,
      fullName: fullName || displayFirstName,
      email: email || "",
      role: role
    };
  };

  // ================= INITIALIZE & UPDATE USER INFO =================
  useEffect(() => {
    const updateUserInfo = () => {
      const userData = getUserFromStorage();
      setUserFirstName(userData.firstName);
      setUserFullName(userData.fullName);
      setUserEmail(userData.email);
      setUserRole(userData.role);
    };
    
    // Initial update
    updateUserInfo();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      console.log("Storage changed, updating user info");
      updateUserInfo();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-data-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-data-updated', handleStorageChange);
    };
  }, []);

  // ================= LOGOUT =================
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      
      if (token) {
        await fetch("/backend/login/users.php?action=logout", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'logout' })
        });
      }
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      // Clear ALL user data
      const itemsToClear = [
        "auth_token",
        "email",
        "user_id",
        "first_name",
        "last_name",
        "full_name",
        "user_name",
        "username",
        "role",
        "isAdmin",
        "department",
        "otp_verified",
        "goserveph_name",
        "goserveph_email",
        "goserveph_department",
        "goserveph_user_id",
        "goserveph_role",
        "last_login_time",
        "display_name"
      ];
      
      itemsToClear.forEach(item => localStorage.removeItem(item));
      
      // Clear cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Redirect to login
      navigate("/login");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white shadow-sm border-b-3 border-[#FDA811] transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4 py-2 flex justify-between items-center h-18">
        {/* LEFT */}
        <Link to="/user/dashboard" className="flex items-center gap-3">
          <img src="/GSM_logo.png" alt="Logo" className="w-12 h-12" />
          <div>
            <div className="text-lg font-bold">
              <span className="text-blue-700">Go</span>
              <span className="text-green-700">Serve</span>
              <span className="text-blue-700">PH</span>
            </div>
            <div className="text-xs text-gray-600">Serbisyong Publiko, Abot-Kamay Mo.</div>
          </div>
        </Link>

        {/* RIGHT */}
        <div className="flex items-center gap-6">
          <div className="text-right text-xs">
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

          {/* USER DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center space-x-2 px-3 py-1 rounded hover:bg-gray-100"
            >
              <User size={20} />
              <span className="font-medium">{userFirstName}</span>
              {userRole && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                  {userRole}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border z-50">
                <div className="px-4 py-3 border-b">
                  <div className="font-medium">{userFullName}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {userEmail || "No email"}
                  </div>
                  {userRole && (
                    <div className="text-xs text-gray-500 mt-1">
                      Role: <span className="font-medium capitalize">{userRole}</span>
                    </div>
                  )}
                </div>
                <div className="py-1">
                  <Link 
                    to="/user/profile" 
                    className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => setOpen(false)}
                  >
                    <User size={14} className="mr-2" /> My Profile
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-red-600 text-sm border-t"
                  >
                    <LogOut size={14} className="mr-2" /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}