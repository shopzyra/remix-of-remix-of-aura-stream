import { config } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";

export type Provider = "google" | "github" | "azure";

export const enabledProviders = (): Provider[] => {
  const out: Provider[] = [];
  if (config.auth.google) out.push("google");
  if (config.auth.github) out.push("github");
  if (config.auth.microsoft) out.push("azure");
  return out;
};

export async function signInWithProvider(provider: Provider) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
}
