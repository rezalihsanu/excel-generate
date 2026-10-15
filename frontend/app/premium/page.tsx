"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Sparkles,
  Zap,
  ArrowRight,
  Lock,
} from "lucide-react";

// Official WhatsApp Green Icon
function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.149.929 3.182 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.148-.544-1.859-.772-3.031-2.671-3.124-2.795-.093-.124-.754-1.003-.754-1.913 0-.91.477-1.357.646-1.543.169-.186.37-.232.493-.232.123 0 .247.001.355.006.114.005.267-.043.418.32.155.372.531 1.294.577 1.388.046.094.077.202.015.326-.062.124-.093.201-.185.31-.093.109-.195.244-.279.327-.093.093-.19.195-.082.381.108.186.481.794 1.031 1.284.71.632 1.309.828 1.494.92.185.093.294.077.402-.047.108-.124.463-.541.586-.727.123-.186.247-.155.417-.093.169.062 1.077.509 1.262.602.185.093.308.139.354.216.046.077.046.45-.098.855zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.177L2 22l4.981-1.396A9.946 9.946 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.636 0-3.168-.485-4.453-1.32l-.319-.208-2.957.828.841-2.887-.229-.333A8.17 8.17 0 013.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z" />
    </svg>
  );
}

export default function PremiumPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  // Nomor WhatsApp Admin (bisa disesuaikan via NEXT_PUBLIC_ADMIN_WHATSAPP)
  const adminWhatsApp =
    process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "6281234567890";

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser(authUser);
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();
          setProfile(prof);

          // Jika user ternyata sudah berlangganan
          if (prof?.is_subscribed) {
            setCheckMessage("Akun Anda telah berstatus aktif!");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Handler untuk refresh / periksa status akun di database
  const handleCheckStatus = async () => {
    setChecking(true);
    setCheckMessage(null);
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/auth/login");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("is_subscribed, subscription_plan")
        .eq("id", authUser.id)
        .single();

      if (prof?.is_subscribed) {
        setCheckMessage("Selamat! Akun Anda telah aktif. Mengalihkan ke dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      } else {
        setCheckMessage(
          "Akun Anda belum terdaftar di database langganan. Silakan konfirmasi ke admin via WhatsApp."
        );
      }
    } catch (err: any) {
      setCheckMessage("Gagal memeriksa status. Silakan coba kembali.");
    } finally {
      setChecking(false);
    }
  };

  // Handler Logout
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  // URL WhatsApp dengan pesan dinamis
  const userEmail = user?.email || "";
  const userName =
    profile?.full_name || user?.user_metadata?.full_name || "Pengguna";
  const waMessage = encodeURIComponent(
    `Halo Admin Excel Insight,\n\nSaya ingin mengaktifkan paket langganan akun Excel Insight saya:\n• Nama: ${userName}\n• Email: ${userEmail}\n\nMohon bantuannya untuk pendaftaran dan aktivasi akses akun saya ke dalam sistem. Terima kasih!`
  );
  const waUrl = `https://wa.me/${adminWhatsApp}?text=${waMessage}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Navbar (Same Color Palette as Login / Main App) */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              Excel Insight
            </span>
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold tracking-wide uppercase">
              Paket Lisensi
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900">
                    {userName}
                  </span>
                  <span className="text-[11px] text-slate-500">{userEmail}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ganti Akun</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-lg border border-blue-200 transition"
              >
                Masuk ke Akun
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-center">
        {/* User Alert Banner (If Logged In and Unsubscribed) */}
        {user && !profile?.is_subscribed && (
          <div className="mb-8 rounded-2xl bg-amber-50 border border-amber-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-900 tracking-wide">
                  Akun Belum Terdaftar di Database Langganan
                </h2>
                <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                  Email akun Google Anda (
                  <span className="font-semibold text-slate-900">{userEmail}</span>
                  ) belum memiliki paket langganan aktif. Silakan hubungi admin untuk aktivasi akses.
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300 shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${checking ? "animate-spin text-blue-600" : ""}`}
              />
              <span>Cek Status</span>
            </button>
          </div>
        )}

        {/* User Success Banner (If already Subscribed) */}
        {profile?.is_subscribed && (
          <div className="mb-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-emerald-900">
                  Langganan Akun Anda Telah Aktif! ({profile.subscription_plan})
                </h2>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Anda memiliki akses penuh ke seluruh fitur analitik Excel Insight.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
            >
              Buka Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Notification Toast Message */}
        {checkMessage && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2 shadow-sm">
            <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />
            <span>{checkMessage}</span>
          </div>
        )}

        {/* Header Hero Title */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-3">
            <Zap className="w-3.5 h-3.5" />
            Eksklusif Satuan Kerja & Analis
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Akses Layanan Premium Excel Insight
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Platform inspeksi otomatis spreadsheet, visualisasi analitik interaktif, dan generasi laporan PDF standar resmi kepolisian.
          </p>
        </div>

        {/* Pricing & Subscription Card (Matching Light Theme with Slate-50 / White Cards) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Paket Resmi Institusi
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                Excel Insight Professional
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Lisensi penuh untuk pemrosesan dataset spreadsheet dan pelaporan berkala.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                Aktivasi via Admin
              </span>
            </div>
          </div>

          {/* Feature List */}
          <div className="grid sm:grid-cols-2 gap-3.5 mb-7">
            {[
              "Unggah Excel (.xlsx, .xls) hingga 50MB",
              "Deteksi multi-sheet instan & cerdas",
              "Analitik statistik deskriptif otomatis",
              "Grafik visual interaktif (Bar, Line, Area)",
              "Ekspor Laporan PDF Eksekutif ReportLab",
              "Data terenkripsi aman di Supabase PostgreSQL",
              "Riwayat file tersimpan tanpa batasan",
              "Dukungan teknis prioritas langsung dari admin",
            ].map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Call to Actions */}
          <div className="space-y-3">
            {/* Primary Action: Chat via WhatsApp */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-3 group active:scale-[0.99]"
            >
              <WhatsAppIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span>Hubungi Admin via WhatsApp untuk Berlangganan</span>
              <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Secondary Action: Refresh / Check */}
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-2.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${checking ? "animate-spin text-blue-600" : ""}`}
              />
              <span>
                {checking
                  ? "Memeriksa Status Akun..."
                  : "Sudah Konfirmasi Admin? Klik untuk Periksa Ulang Status Akun"}
              </span>
            </button>
          </div>

          {/* Admin Contact Details Note */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">
              Butuh bantuan atau aktivasi manual? Hubungi WhatsApp Admin di{" "}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-600 hover:underline"
              >
                +{adminWhatsApp}
              </a>
            </p>
          </div>
        </div>

        {/* How It Works Steps (Consistent Card Styling) */}
        <div className="mt-8">
          <h2 className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4">
            Cara Aktivasi Akses 3 Langkah Mudah
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 text-center shadow-xs">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center mx-auto mb-2 border border-blue-100">
                1
              </div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">Chat Admin</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Klik tombol WhatsApp untuk mengirimkan email akun Google Anda.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 text-center shadow-xs">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center mx-auto mb-2 border border-blue-100">
                2
              </div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">Aktivasi Database</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Admin mendaftarkan email Anda ke database pengguna langganan.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 text-center shadow-xs">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center mx-auto mb-2 border border-blue-100">
                3
              </div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">Akses Langsung</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Klik periksa ulang status dan ruang kerja dashboard langsung terbuka.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>© 2026 Excel Insight — Sistem Analisis & Pelaporan Spreadsheet Kepolisian.</span>
        </p>
      </footer>
    </div>
  );
}
