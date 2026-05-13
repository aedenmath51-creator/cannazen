import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiPost } from "@/lib/api";
import { useSeo } from "@/hooks/use-seo";
import { AuthShell } from "@/components/auth-shell";

export default function VerifyEmailPage() {
  useSeo({ title: "Vérification email" });
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) { setStatus("error"); return; }
    apiPost("/auth/verify-email", { token })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <AuthShell title="Vérification email">
      <div className="text-center text-muted-foreground">
        {status === "loading" && <p>Vérification en cours…</p>}
        {status === "ok" && (
          <>
            <p className="mb-6 text-foreground">Votre email a été confirmé.</p>
            <Link href="/mon-compte" className="text-primary underline">Accéder à mon espace</Link>
          </>
        )}
        {status === "error" && (
          <>
            <p className="mb-6 text-destructive">Lien invalide ou expiré.</p>
            <Link href="/connexion" className="text-primary underline">Retour à la connexion</Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
