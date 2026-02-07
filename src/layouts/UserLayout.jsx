import { Outlet } from "react-router-dom";
import UserHeader from "../components/user/header/UserHeader";
import Footer from "../components/user/Footer";
import usePageTracking from "../hooks/usePageTracking";

const UserLayout = () => {
  usePageTracking();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
      <UserHeader />
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
     <Footer /> 
    </div>
  );
};

export default UserLayout;