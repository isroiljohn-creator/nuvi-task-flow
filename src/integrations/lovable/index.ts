// Lovable Cloud Auth — Railway deployment uchun stub versiya
// (Lovable.dev platformasidan tashqarida Supabase auth to'g'ridan-to'g'ri ishlatiladi)

import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft", opts?: SignInOptions) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as "google",
        options: {
          redirectTo: opts?.redirect_uri ?? window.location.origin,
          queryParams: opts?.extraParams,
        },
      });
      if (error) return { error };
      return { data };
    },
  },
};
