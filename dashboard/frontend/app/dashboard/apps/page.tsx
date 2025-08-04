"use client";

import { useState } from "react";
import {
  FaChartLine,
  FaLock,
  FaServer,
  FaChartPie,
  FaLockOpen,
  FaFilePdf,
  FaTools,
  FaFileAlt,
  FaNetworkWired,
  FaTh,
  FaThList,
  FaRss
} from "react-icons/fa";
import { MdSdStorage } from "react-icons/md";
import { LuSheet } from "react-icons/lu";
import { SiAuthentik } from "react-icons/si";



const apps = [
  {
    name: "Authentik",
    url: "https://authentik.internal.com",
    icon: <SiAuthentik className="w-6 h-6" />,
    category: "Management",
    description: "Identity Provider for Homelab User Management",
    color: "bg-orange-400",
  },
  {
    name: "Grist",
    url: "https://grist.internal.com",
    icon: <LuSheet className="w-6 h-6" />,
    category: "Productivity",
    description: "Database Spreadsheet",
    color: "bg-green-400",
  },
  {
    name: "Minio Console",
    url: "https://minio-console.internal.com",
    icon: <MdSdStorage className="w-6 h-6" />,
    category: "Storage",
    description: "Object Storage Console",
    color: "bg-green-400",
  },
  {
    name: "FreshRSS",
    url: "https://freshrss.internal.com",
    icon: <FaRss className="w-6 h-6" />,
    category: "Information",
    description: "RSS Feed Aggregator",
    color: "bg-blue-400",
  },
  {
    name: "Grafana",
    url: "https://grafana.internal.com",
    icon: <FaChartLine className="w-6 h-6" />,
    category: "Monitoring",
    description: "Analytics & monitoring platform",
    color: "bg-orange-500",
  },
  {
    name: "Prometheus",
    url: "https://prometheus.internal.com",
    icon: <FaChartPie className="w-6 h-6" />,
    category: "Monitoring",
    description: "Metrics & alerting",
    color: "bg-red-500",
  },
  {
    name: "Vaultwarden",
    url: "https://vaultwarden.internal.com",
    icon: <FaLock className="w-6 h-6" />,
    category: "Security",
    description: "Password manager",
    color: "bg-blue-500",
  },
  {
    name: "Portainer",
    url: "https://portainer.internal.com",
    icon: <FaServer className="w-6 h-6" />,
    category: "Management",
    description: "Container management",
    color: "bg-indigo-500",
  },
  {
    name: "Excalidraw",
    url: "https://excalidraw.internal.com",
    icon: <FaFileAlt className="w-6 h-6" />,
    category: "Productivity",
    description: "Virtual whiteboard",
    color: "bg-pink-500",
  },
  {
    name: "Pi-hole External",
    url: "https://pihole-external.internal.com/admin/login",
    icon: <FaLockOpen className="w-6 h-6" />,
    category: "Networking",
    description: "DNS Server for External IP Resolution",
    color: "bg-green-500",
  },
  {
    name: "Pi-hole Internal",
    url: "https://pihole-internal.internal.com/admin/login",
    icon: <FaLockOpen className="w-6 h-6" />,
    category: "Networking",
    description: "DNS Server for Internal IP Resolution",
    color: "bg-green-500",
  },
  {
    name: "Stirling PDF",
    url: "https://pdf.internal.com",
    icon: <FaFilePdf className="w-6 h-6" />,
    category: "Tools",
    description: "PDF toolkit",
    color: "bg-red-600",
  },
  {
    name: "IT Tools",
    url: "https://tools.internal.com",
    icon: <FaTools className="w-6 h-6" />,
    category: "Development",
    description: "Developer utilities",
    color: "bg-purple-500",
  },
  {
    name: "Reactive Resume",
    url: "https://rxresume.internal.com",
    icon: <FaFileAlt className="w-6 h-6" />,
    category: "Productivity",
    description: "Resume builder",
    color: "bg-teal-500",
  },
  {
    name: "Paperless",
    url: "https://paperless.internal.com",
    icon: <FaFileAlt className="w-6 h-6" />,
    category: "Productivity",
    description: "Document management",
    color: "bg-blue-400",
  },
  {
    name: "n8n",
    url: "https://n8n.internal.com",
    icon: <FaNetworkWired className="w-6 h-6" />,
    category: "Automation",
    description: "Workflow automation",
    color: "bg-green-600",
  },
];

function AppCard({ app }: { app: (typeof apps)[0] }) {
  return (
    <a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
        <div className={`${app.color} p-4 flex items-center justify-center`}>
          <div className="text-white">{app.icon}</div>
        </div>
        <div className="p-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {app.name}
          </h3>
          <p className="text-sm text-gray-600">{app.description}</p>
        </div>
        <div className="px-4 pb-3">
          <span className="text-xs text-blue-600 font-medium">
            Open {app.name} →
          </span>
        </div>
      </div>
    </a>
  );
}

export default function AppsPage() {
  const [viewMode, setViewMode] = useState<"grouped" | "grid">("grid");

  // Group apps by category for the grouped view
  const appsByCategory = apps.reduce((acc, app) => {
    if (!acc[app.category]) {
      acc[app.category] = [];
    }
    acc[app.category].push(app);
    return acc;
  }, {} as Record<string, typeof apps>);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Applications</h1>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("grouped")}
            className={`p-2 rounded-md ${
              viewMode === "grouped" ? "bg-white shadow" : "text-gray-500"
            }`}
            title="Grouped view"
          >
            <FaThList className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md ${
              viewMode === "grid" ? "bg-white shadow" : "text-gray-500"
            }`}
            title="Grid view"
          >
            <FaTh className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === "grouped" ? (
        // Grouped View
        Object.entries(appsByCategory).map(([category, categoryApps]) => (
          <div key={category} className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoryApps.map((app) => (
                <AppCard key={app.name} app={app} />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Grid View (all apps together)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {apps.map((app) => (
            <AppCard key={app.name} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
