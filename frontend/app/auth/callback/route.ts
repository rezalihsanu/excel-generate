import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Periksa apakah profil user memiliki status langganan aktif
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_subscribed, subscription_plan")
          .eq("id", user.id)
          .single();

        // Jika email belum ada di database langganan / belum berlangganan
        if (!profile?.is_subscribed) {
          return NextResponse.redirect(`${origin}/premium?status=unsubscribed`);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Jika gagal pertukaran kode sesi atau ada error
  return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`);
}
