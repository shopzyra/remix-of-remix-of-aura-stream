import { createFileRoute } from "@tanstack/react-router";
import { config } from "@/lib/config";
export const Route = createFileRoute("/legal/terms")({ component: () => (
  <>
    <h1>Terms of Service</h1>
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <p>Welcome to {config.app.name}, operated by {config.legal.companyName}. By using the service you agree to these terms.</p>
    <h2>1. Your account</h2>
    <p>You're responsible for activity on your account and for keeping your credentials secure.</p>
    <h2>2. Acceptable use</h2>
    <p>Don't abuse the service, infringe copyrights, or upload content you don't have the rights to.</p>
    <h2>3. Content</h2>
    <p>Music streamed from third-party catalogs (such as Audius) is subject to those providers' terms. Content you upload remains yours.</p>
    <h2>4. Termination</h2>
    <p>We may suspend accounts that violate these terms.</p>
    <h2>5. Contact</h2>
    <p>Questions: {config.legal.companyEmail}</p>
  </>
)});
