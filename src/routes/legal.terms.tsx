import { createFileRoute } from "@tanstack/react-router";
import { config } from "@/lib/config";

export const Route = createFileRoute("/legal/terms")({
  component: () => (
    <>
      <h1>Terms of Service</h1>
      <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>

      <p>
        Welcome to <strong>{config.app.name}</strong> ("we", "our", "us"), operated by
        {" "}{config.legal.companyName}. By accessing or using the service you ("you", "user")
        agree to these Terms of Service ("Terms"). If you do not agree, do not use the service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 13 years old (or the minimum digital-consent age in your country)
        to use the service. If you are under 18 you confirm that a parent or legal guardian
        has reviewed and agreed to these Terms on your behalf.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for activity that occurs under your account and for keeping your
        login credentials secure. You agree to provide accurate information and to notify us
        promptly of any unauthorized use.
      </p>

      <h2>3. Music and content</h2>
      <p>
        {config.app.name} streams audio from the open, decentralized
        <a href="https://audius.org" target="_blank" rel="noreferrer"> Audius </a>
        network and from files that users upload to their own private library. All third-party
        content is provided subject to that provider's terms. {config.app.name} does not host,
        own, license or claim any rights to music streamed from Audius — when you play it we
        are simply requesting a public, freely available stream on your behalf.
      </p>

      <h2>4. User uploads</h2>
      <p>
        Uploaded audio remains your property. By uploading you confirm you own or otherwise
        have the right to store and stream the content for your personal use. Uploads are
        stored privately and are only streamable by you. We may remove uploaded content that
        we believe in good faith infringes someone else's rights or violates these Terms.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul className="list-disc pl-6 text-muted-foreground space-y-1">
        <li>infringe any copyright, trademark, privacy or other right;</li>
        <li>attempt to reverse-engineer, scrape or stress-test the service;</li>
        <li>upload malware, illegal content, or content that promotes hate or violence;</li>
        <li>impersonate another person or misrepresent your affiliation;</li>
        <li>use the service to violate any law.</li>
      </ul>

      <h2>6. Donations</h2>
      <p>
        {config.app.name} is free and ad-free. Voluntary donations are non-refundable and do
        not entitle you to any additional product, service, or feature.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The {config.app.name} name, logo, design and code are © {new Date().getFullYear()}
        {" "}{config.legal.companyName}. {config.app.name} is independent and is not
        affiliated with, endorsed by, or sponsored by Spotify AB or any other music service.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The service is provided "as is" and "as available", without warranties of any kind,
        express or implied. We don't warrant that streams will be uninterrupted, error-free,
        or available in your region.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {config.legal.companyName} will not be liable
        for any indirect, incidental, special, consequential or punitive damages, or any loss
        of profits or revenues, arising from your use of the service.
      </p>

      <h2>10. Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these Terms or harm other users.
        You may stop using the service at any time and delete your account from Settings.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these Terms occasionally. Material changes will be announced in-app or
        by email at least 14 days before they take effect.
      </p>

      <h2>12. Contact</h2>
      <p>Questions: <a href={`mailto:${config.legal.companyEmail}`}>{config.legal.companyEmail}</a></p>
    </>
  ),
});
