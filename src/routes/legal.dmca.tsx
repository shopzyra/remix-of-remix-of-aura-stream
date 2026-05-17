import { createFileRoute } from "@tanstack/react-router";
import { config } from "@/lib/config";
export const Route = createFileRoute("/legal/dmca")({ component: () => (
  <>
    <h1>DMCA Policy</h1>
    <p>If you believe your copyright has been infringed by content available through {config.app.name}, send a notice including: identification of the work, the infringing URL, your contact info, a good-faith statement, and your signature to <strong>{config.legal.companyEmail}</strong>. We respond promptly and may remove access to the material.</p>
  </>
)});
