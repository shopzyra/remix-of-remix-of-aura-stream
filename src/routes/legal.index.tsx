import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Shield, Cookie, AlertOctagon, Users } from "lucide-react";
import { config } from "@/lib/config";

export const Route = createFileRoute("/legal/")({
  component: LegalIndex,
});

const items = [
  { to: "/legal/terms", icon: FileText, title: "Terms of Service", desc: "The rules for using the service." },
  { to: "/legal/privacy", icon: Shield, title: "Privacy Policy", desc: "What we collect and why." },
  { to: "/legal/cookies", icon: Cookie, title: "Cookie Policy", desc: "How we use storage on your device." },
  { to: "/legal/dmca", icon: AlertOctagon, title: "DMCA / Copyright", desc: "Report infringing content." },
  { to: "/legal/community", icon: Users, title: "Community Guidelines", desc: "What we expect from everyone." },
] as const;

function LegalIndex() {
  return (
    <>
      <h1>Legal</h1>
      <p>
        Policies for {config.app.name}, operated by {config.legal.companyName}.
      </p>
      <div className="not-prose mt-6 grid gap-3 sm:grid-cols-2">
        {items.map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="glass flex items-start gap-3 rounded-2xl p-4 transition hover:bg-surface-2"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg gradient-brand text-primary-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
