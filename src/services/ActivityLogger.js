const LOG_API = "/backend/api/log_activity.php";

function getUserData() {
  return {
    user_id: parseInt(localStorage.getItem("user_id") || localStorage.getItem("goserveph_user_id") || "0"),
    user_email: localStorage.getItem("email") || localStorage.getItem("goserveph_email") || "",
    user_name: localStorage.getItem("full_name") || localStorage.getItem("display_name") || localStorage.getItem("user_name") || localStorage.getItem("first_name") || "",
    user_role: localStorage.getItem("goserveph_role") || localStorage.getItem("user_role") || "user",
  };
}

export async function logActivity({ action, action_category = "system", description, module = "", reference_id = "", metadata = null, user_email = "", user_name = "", user_role = "" }) {
  try {
    const userData = getUserData();
    // Allow explicit overrides for cases where localStorage isn't populated yet (e.g. login)
    const payload = {
      ...userData,
      user_email: user_email || userData.user_email,
      user_name: user_name || userData.user_name,
      user_role: user_role || userData.user_role,
      action,
      action_category,
      description,
      module,
      reference_id,
      metadata,
    };
    if (!payload.user_email) return;

    fetch(LOG_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }).catch((err) => console.warn("Activity log failed:", err));
  } catch (err) {
    console.warn("Activity logger error:", err);
  }
}

export function logLogin(email, role = "user") {
  logActivity({
    action: "Login",
    action_category: "account",
    description: `User logged in`,
    module: "Authentication",
    metadata: { role },
    user_email: email,
    user_role: role,
  });
}

export function logLogout() {
  const email = localStorage.getItem("email") || localStorage.getItem("goserveph_email") || "";
  const role = localStorage.getItem("goserveph_role") || localStorage.getItem("user_role") || "user";
  logActivity({
    action: "Logout",
    action_category: "account",
    description: `User logged out`,
    module: "Authentication",
    user_email: email,
    user_role: role,
  });
}

export function logRegistration(email, name = "") {
  logActivity({
    action: "Registration",
    action_category: "account",
    description: `${name || email} registered a new account`,
    module: "Authentication",
    user_email: email,
    user_name: name,
  });
}

export function logPermitSubmission(permitType, referenceId = "", details = {}) {
  logActivity({
    action: "Permit Submission",
    action_category: "permit",
    description: `Submitted a ${permitType} application`,
    module: permitType,
    reference_id: referenceId,
    metadata: details,
  });
}

export function logPermitView(permitType, referenceId = "") {
  logActivity({
    action: "Permit View",
    action_category: "permit",
    description: `Viewed ${permitType} application ${referenceId}`,
    module: permitType,
    reference_id: referenceId,
  });
}

export function logProfileUpdate(field = "") {
  logActivity({
    action: "Profile Update",
    action_category: "account",
    description: `Updated profile${field ? ` (${field})` : ""}`,
    module: "Settings",
  });
}

export function logPasswordChange() {
  logActivity({
    action: "Password Change",
    action_category: "account",
    description: `Changed account password`,
    module: "Security",
  });
}

export function logPageVisit(pageName, path = "") {
  logActivity({
    action: "Page Visit",
    action_category: "navigation",
    description: `Visited ${pageName}`,
    module: pageName,
    metadata: { path },
  });
}
