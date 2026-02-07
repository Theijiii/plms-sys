// src/components/user/Footer.jsx
import React from "react";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white text-[#333] font-[Montserrat,Arial,sans-serif] border-t border-gray-200">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-10 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
        {/* LEFT COLUMN: Logo + tagline + Socials */}
        <div className="space-y-4 mx-auto w-fit">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/GSM_logo.png"
              alt="GoServePH Logo"
              className="w-17 h-17 object-contain"
            />
            <h2 className="text-3xl font-extrabold tracking-wide text-[#4CAF50]">
              Go<span className="text-[#FDA811]">ServePH</span>
            </h2>
          </div>

          <p className="text-md font-semibold text-[#555]">
            Serbisyong Publiko, Abot-Kamay Mo.
          </p>

          {/* Social icons */}
          <div className="flex gap-4 pt-3">
            <a
              href="#"
              className="text-[#4A90E2] hover:text-[#4CAF50] transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={20} />
            </a>
            <a
              href="#"
              className="text-[#4A90E2] hover:text-[#4CAF50] transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a
              href="#"
              className="text-[#4A90E2] hover:text-[#4CAF50] transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="#"
              className="text-[#4A90E2] hover:text-[#4CAF50] transition-colors"
              aria-label="GitHub"
            >
              <Github size={20} />
            </a>
          </div>
        </div>

        {/* MIDDLE COLUMN: Pages */}
        <div className="flex flex-col items-start space-y-2 mx-auto w-fit">
          <h3 className="text-lg font-semibold text-[#FDA811] mb-2">Pages</h3>
          {["Home", "About Us", "Contact Us", "Policy", "FAQs"].map(
            (page, i) => (
              <a
                key={i}
                href={`/${page.toLowerCase().replace(" ", "")}`}
                className="text-sm text-[#333] hover:text-[#4CAF50] transition-colors"
              >
                {page}
              </a>
            )
          )}
        </div>

        {/* RIGHT COLUMN: Contact Info (left-aligned but centered column) */}
        <div className="space-y-4 mx-auto w-fit text-left">
          <div className="flex items-start justify-start gap-3">
            <MapPin className="mt-1 text-[#4CAF50]" size={18} />
            <p className="text-sm leading-relaxed text-[#333]">
              <span className="block font-semibold">
                8th Ave, Grace Park East
              </span>
              Caloocan, Metro Manila
            </p>
          </div>

          <div className="flex items-center justify-start gap-3">
            <Phone className="text-[#4CAF50]" size={18} />
            <p className="text-sm text-[#333]">+63 912 345 6789</p>
          </div>

          <div className="flex items-center justify-start gap-3">
            <Mail className="text-[#4CAF50]" size={18} />
            <a
              href="mailto:support@company.com"
              className="text-sm text-[#4A90E2] hover:text-[#4CAF50] transition-colors"
            >
              support@company.com
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 py-4 text-center text-xs text-[#555]">
        &copy; {new Date().getFullYear()} Government Management System.{" "}
        <span className="text-[#4CAF50] font-semibold">
          Permit & Licensing Management System
        </span>{" "}
        Module. All rights reserved.
      </div>
    </footer>
  );
}
