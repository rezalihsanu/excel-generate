"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FileSpreadsheet, Lock, Mail, ArrowRight, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "oauth_failed") {
          setErrorMsg("Autentikasi dengan akun Google dibatalkan atau gagal. Silakan coba kembali.");
        } else {
          setErrorMsg(decodeURIComponent(err));
        }
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoadingGoogle(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message || "Gagal menghubungkan ke layanan Google.");
        setLoadingGoogle(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menghubungkan ke Google.");
      setLoadingGoogle(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message === "Invalid login credentials"
            ? "Email atau kata sandi tidak sesuai."
            : error.message
        );
        setLoading(false);
        return;
      }

      // Periksa status langganan
      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_subscribed")
          .eq("id", data.user.id)
          .single();

        if (!profile?.is_subscribed) {
          router.push("/premium?status=unsubscribed");
          router.refresh();
          return;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat mencoba masuk.");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Header / Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center pt-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">
            Excel Insight
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Masuk ke Ruang Kerja
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Gunakan akun Google terdaftar atau email & kata sandi Anda.
        </p>
      </div>

      {/* Main Login Card (Fixed & Compact) */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
        <div className="bg-white py-6 px-6 sm:px-8 shadow-sm border border-slate-200/90 rounded-2xl">
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || loadingGoogle}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.99]"
          >
            {loadingGoogle ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                <span>Menghubungkan ke Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                atau masuk dengan email & kata sandi
              </span>
            </div>
          </div>

          {/* Email & Password Form */}
          <form className="space-y-3.5" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
              >
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analis@instansi.go.id"
                  className="block w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || loadingGoogle}
              className="w-full mt-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi Akun...
                </>
              ) : (
                <>
                  Masuk Sekarang
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Access Note & Premium Link */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 leading-normal">
              Akses dibatasi khusus akun instansi & satuan kerja terdaftar.{" "}
              <Link
                href="/premium"
                className="text-blue-600 hover:text-blue-700 font-semibold underline ml-0.5 inline-block"
              >
                Paket Langganan & Aktivasi
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-[11px] text-slate-400 pb-2">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sistem Analisis & Pelaporan Spreadsheet Resmi Kepolisian</span>
        </p>
      </footer>
    </div>
  );
}
