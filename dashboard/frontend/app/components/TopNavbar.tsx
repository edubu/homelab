"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function TopNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  // Reset mobile menu state ONLY when pathname changes (navigation occurs)
  useEffect(() => {
    // Only run this effect if the pathname has actually changed
    if (previousPathname.current !== pathname) {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        // Also dispatch event to close sidebar
        document.dispatchEvent(
          new CustomEvent("toggleSidebar", {
            detail: { isOpen: false },
          })
        );
      }
      // Update the previous pathname
      previousPathname.current = pathname;
    }
  }, [pathname, mobileMenuOpen]);

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    // Dispatch a custom event that the layout can listen to
    document.dispatchEvent(
      new CustomEvent("toggleSidebar", {
        detail: { isOpen: newState },
      })
    );
  };

  return (
    <nav className="bg-white border-b h-16 flex items-center justify-between px-4 sticky top-0 z-20">
      {/* Left side - Logo, Menu Button and Name */}
      <div className="flex items-center space-x-3">
        {/* Hamburger menu button - only visible on mobile */}
        <button
          className="md:hidden flex items-center justify-center p-2"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">H</span>
        </div>
        <span className="text-xl font-semibold">Homelab</span>
      </div>

      {/* Right side - Profile */}
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      </div>
    </nav>
  );
}
