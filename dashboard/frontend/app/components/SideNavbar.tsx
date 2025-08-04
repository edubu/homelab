"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaVideo,
  FaGlobe,
  FaHeartbeat,
  FaChartBar,
  FaNetworkWired,
  FaCog,
} from "react-icons/fa";
import { IoApps } from "react-icons/io5";

const navItems = [
  { name: "Home", path: "/dashboard", icon: FaHome },
  { name: "Apps", path: "/dashboard/apps", icon: IoApps },
  { name: "Camera Devices", path: "/dashboard/cameras", icon: FaVideo },
  { name: "DNS Records", path: "/dashboard/dns", icon: FaGlobe },
  { name: "Server Health", path: "/dashboard/health", icon: FaHeartbeat },
  { name: "Server Stats", path: "/dashboard/stats", icon: FaChartBar },
  {
    name: "Connected Devices",
    path: "/dashboard/devices",
    icon: FaNetworkWired,
  },
  { name: "Settings", path: "/dashboard/settings", icon: FaCog },
];

export default function SideNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Listen for toggle events from the TopNavbar
  useEffect(() => {
    const handleToggle = (e: CustomEvent) => {
      setIsOpen(e.detail.isOpen);
    };

    // Add event listener
    document.addEventListener("toggleSidebar", handleToggle as EventListener);

    // Clean up
    return () => {
      document.removeEventListener(
        "toggleSidebar",
        handleToggle as EventListener
      );
    };
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Only apply this on mobile screens
      if (window.innerWidth < 768 && isOpen) {
        const target = e.target as HTMLElement;
        // Check if click is outside the sidebar
        if (!target.closest("[data-sidebar]")) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [pathname]);

  return (
    <>
      {/* Overlay for mobile - only visible when sidebar is open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        data-sidebar
        className={`bg-gray-900 text-white fixed md:static 
          transition-transform duration-300 ease-in-out z-30
          md:w-64 md:min-h-screen md:px-4 md:py-6
          ${
            isOpen
              ? "inset-0 flex flex-col justify-start items-center pt-20 px-6"
              : "-translate-x-full md:translate-x-0"
          }`}
      >
        <div className="space-y-4 w-full max-w-md">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition-colors text-lg ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
