"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FileSpreadsheet,
  LayoutDashboard,
  UploadCloud,
  FolderArchive,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  User,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "NAVIGASI UTAMA",
    items: [
      { name: "Ringkasan", href: "/dashboard", icon: LayoutDashboard },
      { name: "Unggah Excel", href: "/dashboard/upload", icon: UploadCloud },
      { name: "File Saya", href: "/dashboard/files", icon: FolderArchive },
    ],
  },
  {
    label: "OUTPUT & LAPORAN",
    items: [
      { name: "Laporan PDF", href: "/dashboard/reports", icon: FileText },
    ],
  },
  {
    label: "SISTEM",
    items: [
      { name: "Pengaturan", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserEmail(data.user.email || null);
        setUserName(
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          null
        );

        // Periksa status langganan di database
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_subscribed")
          .eq("id", data.user.id)
          .single();

        if (profile && !profile.is_subscribed) {
          router.replace("/premium");
        }
      }
    };
    fetchUser();
  }, [router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* FIXED SIDEBAR (Streamlined, no squished footer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        }`}
      >
        {/* Top Header / App Logo */}
        <div className="shrink-0 h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight">
                  Excel Insight
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 -mt-0.5">
                Sistem Analitik Cerdas
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
                {group.label}
              </span>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                        isActive
                          ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30 ring-1 ring-blue-500/40"
                          : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-white"
                              : "text-slate-400 group-hover:text-white"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 opacity-80 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Minimal Clean Sidebar Footer (No overlapping, zero clutter) */}
        <div className="shrink-0 p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Aktif
            </span>
            <span className="text-slate-500 font-mono text-[10px]">v1.0 Pro</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="lg:pl-64 flex flex-col min-w-0 min-h-screen flex-1">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase & FastAPI Aktif
              </span>
            </div>
          </div>

          {/* User Account Menu replacing Unggah Excel */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className="flex items-center gap-3 py-1.5 px-2.5 sm:px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all text-left group cursor-pointer"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {userName
                    ? userName.charAt(0).toUpperCase()
                    : userEmail?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition truncate max-w-[140px]">
                  {userName || "Pengguna"}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                  {userEmail || "Terhubung"}
                </span>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                  accountDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {accountDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {userName
                        ? userName.charAt(0).toUpperCase()
                        : userEmail?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {userName || "Pengguna"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {userEmail || "Terhubung"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Akun Terverifikasi
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1 px-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Pengaturan Akun & API</span>
                  </Link>
                  <Link
                    href="/dashboard/upload"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition"
                  >
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                    <span>Unggah Spreadsheet Baru</span>
                  </Link>
                </div>

                {/* Logout Divider & Button */}
                <div className="pt-1 mt-1 border-t border-slate-100 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
