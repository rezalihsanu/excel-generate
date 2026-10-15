"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Building,
  Mail,
  ShieldCheck,
  Database,
  CheckCircle2,
  Save,
  Loader2,
  Server,
} from "lucide-react";

export default function SettingsPage() {
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [organization, setOrganization] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          setUserId(authData.user.id);
          setEmail(authData.user.email || "");
          setFullName(authData.user.user_metadata?.full_name || "");
          setOrganization(authData.user.user_metadata?.organization || "");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          organization: organization,
        },
      });

      // Update public.profiles table
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          organization: organization,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Memuat pengaturan akun...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Pengaturan Ruang Kerja
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola identitas analis dan periksa status infrastruktur Supabase yang terhubung.
        </p>
      </div>

      {savedSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-sm text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>Profil analis berhasil diperbarui dan disimpan!</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-base font-bold text-slate-900">
            Profil Analis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nama dan unit instansi Anda akan dicantumkan secara resmi pada header laporan PDF ReportLab.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Petugas Budi Santoso"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Instansi / Kesatuan / Unit
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Polres Malang"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Akun
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                ID Pengguna Unik (UUID)
              </label>
              <input
                type="text"
                disabled
                value={userId}
                className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan Perubahan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan Profil
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Connected Supabase Infrastructure Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="pb-4 border-b border-slate-100 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              Status Infrastruktur Cloud & Database
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Koneksi aktif ke Supabase Cloud dan Kontainer Lokal
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Aktif & Terverifikasi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Referensi Proyek Supabase
            </span>
            <span className="font-mono font-semibold text-slate-900 text-sm">
              zroxqehaovqrpdmvobbo
            </span>
            <span className="text-[11px] text-blue-600 block mt-1">excel-insight-polres</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Mesin Basis Data
            </span>
            <span className="font-semibold text-slate-900 text-sm">
              PostgreSQL 17
            </span>
            <span className="text-[11px] text-emerald-600 block mt-1">Isolasi RLS Aktif</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Penyimpanan Berkas (Storage)
            </span>
            <span className="font-semibold text-slate-900 text-sm">
              Bucket Privat S3
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">excel-uploads &bull; pdf-reports</span>
          </div>
        </div>
      </div>
    </div>
  );
}
