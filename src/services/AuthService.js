const API_LOGIN = "/backend/login/users.php";
const OTP_API = "/backend/login/otp-admin.php";
const GET_PROFILE_API = "/backend/login/get_profile.php?action=get";

// --------------------- USERS ---------------------
export const loginUser = async ({ email, password }) => {
  try {
    const res = await fetch(`${API_LOGIN}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const data = await res.json();

    if (!data.success) return data;

    // Store token in localStorage for subsequent requests
    if (data.token) {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("email", email);
      
      // ✅ ADDED: Store user profile data from login response
      // This eliminates the need for an additional API call to get first name
      if (data.first_name) {
        localStorage.setItem("first_name", data.first_name);
      }
      if (data.last_name) {
        localStorage.setItem("last_name", data.last_name);
      }
      if (data.full_name) {
        localStorage.setItem("full_name", data.full_name);
        localStorage.setItem("display_name", data.full_name); // For compatibility
      } else if (data.first_name && data.last_name) {
        // Construct full name if not provided
        const fullName = `${data.first_name} ${data.last_name}`;
        localStorage.setItem("full_name", fullName);
        localStorage.setItem("display_name", fullName);
      }
      if (data.user_id) {
        localStorage.setItem("user_id", data.user_id);
      }
      
      // ✅ ADDED: For backward compatibility with existing code
      localStorage.setItem("user_name", data.first_name || data.full_name || email.split('@')[0]);
      
      // ✅ ADDED: Trigger custom event to update UserHeader component
      window.dispatchEvent(new Event('user-data-updated'));
    }

    // Admin detected? start OTP flow
    if (data.isAdmin) {
      const otpRes = await fetch(`${OTP_API}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, purpose: "login" }),
      });

      const otpData = await otpRes.json();
      return {
        ...otpData,
        requireOTP: true,
        department: otpData.department,
      };
    }

    // Regular user
    return { ...data, requireOTP: false };

  } catch (err) {
    console.error("Login error:", err);
    return { success: false, message: "Network error" };
  }
};

// --------------------- REGISTER ---------------------
export const registerUser = async (userData) => {
  try {
    console.log("📤 Sending registration data:", userData);
    
    const res = await fetch(`${API_LOGIN}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Registration HTTP error:", res.status, res.statusText);
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("📥 Registration response:", data);
    
    // Store user profile data from registration response
    if (data.success && data.token) {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("email", userData.email);
      
      if (data.first_name) {
        localStorage.setItem("first_name", data.first_name);
      }
      if (data.last_name) {
        localStorage.setItem("last_name", data.last_name);
      }
      if (data.full_name) {
        localStorage.setItem("full_name", data.full_name);
        localStorage.setItem("display_name", data.full_name);
      } else if (userData.firstName && userData.lastName) {
        const fullName = `${userData.firstName} ${userData.lastName}`;
        localStorage.setItem("full_name", fullName);
        localStorage.setItem("display_name", fullName);
      }
      if (data.user_id) {
        localStorage.setItem("user_id", data.user_id);
      }
      
      // For backward compatibility
      localStorage.setItem("user_name", data.first_name || userData.firstName || userData.email.split('@')[0]);
      
      // Trigger custom event
      window.dispatchEvent(new Event('user-data-updated'));
    }
    
    return data;
    
  } catch (err) {
    console.error("Register error:", err);
    return { 
      success: false, 
      message: err.message || "Network error during registration" 
    };
  }
};

// --------------------- OTP ---------------------
export const sendOtp = async (email, purpose = "login") => {
  try {
    const res = await fetch(`${OTP_API}?action=send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, purpose }),
    });
    return await res.json();
  } catch (err) {
    console.error("Send OTP error:", err);
    return { success: false, message: "Network error (send OTP)" };
  }
};

export const verifyOtp = async (email, otp, purpose = "login") => {
  try {
    const res = await fetch(`${OTP_API}?action=verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, otp, purpose }),
    });
    const data = await res.json();
    
    // ✅ ADDED: If OTP verification is successful for admin login,
    // store any additional user data that might be returned
    if (data.success && data.user_data) {
      if (data.user_data.first_name) {
        localStorage.setItem("first_name", data.user_data.first_name);
      }
      if (data.user_data.last_name) {
        localStorage.setItem("last_name", data.user_data.last_name);
      }
      if (data.user_data.full_name) {
        localStorage.setItem("full_name", data.user_data.full_name);
        localStorage.setItem("display_name", data.user_data.full_name);
      }
      
      window.dispatchEvent(new Event('user-data-updated'));
    }
    
    return data;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return { success: false, message: "Network error (verify OTP)" };
  }
};

// --------------------- GET USER PROFILE ---------------------
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) return { success: false, message: "No auth token found" };

    const res = await fetch(GET_PROFILE_API, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const data = await res.json();
    
    // ✅ ADDED: Update localStorage with fresh profile data when explicitly fetched
    if (data.success && data.profile) {
      localStorage.setItem("first_name", data.profile.first_name || '');
      localStorage.setItem("last_name", data.profile.last_name || '');
      if (data.profile.first_name && data.profile.last_name) {
        const fullName = `${data.profile.first_name} ${data.profile.last_name}`;
        localStorage.setItem("full_name", fullName);
        localStorage.setItem("display_name", fullName);
      }
      localStorage.setItem("user_name", data.profile.first_name || '');
      
      window.dispatchEvent(new Event('user-data-updated'));
    }
    
    return data;
  } catch (error) {
    console.error("Get profile error:", error);
    return { success: false, message: "Network error (get profile)" };
  }
};