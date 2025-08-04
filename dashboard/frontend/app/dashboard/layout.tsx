import TopNavbar from "../components/TopNavbar";
import SideNavbar from "../components/SideNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      <div className="flex flex-col md:flex-row">
        <SideNavbar />
        <main className="flex-1 p-4 md:p-6 pt-4 md:pt-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
