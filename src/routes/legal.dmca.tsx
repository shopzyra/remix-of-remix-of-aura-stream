import { createFileRoute } from "@tanstack/react-router";
import { config } from "@/lib/config";

export const Route = createFileRoute("/legal/dmca")({
  component: () => (
    <>
      <h1>DMCA & Copyright Policy</h1>
      <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>

      <p>
        {config.legal.companyName} respects intellectual-property rights and complies with
        the Digital Millennium Copyright Act ("DMCA") and equivalent laws in other
        jurisdictions.
      </p>

      <h2>Music we stream</h2>
      <p>
        {config.app.name} does not host the music in its main catalog. Streams come from the
        open <a href="https://audius.org" target="_blank" rel="noreferrer">Audius</a> network
        on the user's request. Takedown requests for music hosted on Audius should be sent
        directly to Audius's designated agent.
      </p>

      <h2>User uploads</h2>
      <p>
        If you believe audio uploaded by a user infringes your copyright, send a notice
        containing the following information to
        {" "}<a href={`mailto:${config.legal.companyEmail}`}>{config.legal.companyEmail}</a>:
      </p>
      <ol className="list-decimal pl-6 text-muted-foreground space-y-1">
        <li>Your name, address, phone and email.</li>
        <li>A description of the copyrighted work that has been infringed.</li>
        <li>A URL or sufficient detail to locate the allegedly infringing material on our service.</li>
        <li>A statement that you have a good-faith belief that use of the material is not authorized.</li>
        <li>A statement, under penalty of perjury, that the information is accurate and you are authorized to act on behalf of the copyright owner.</li>
        <li>Your physical or electronic signature.</li>
      </ol>

      <h2>Counter-notice</h2>
      <p>
        Users whose content is removed may submit a counter-notice including the items
        described in 17 U.S.C. § 512(g)(3).
      </p>

      <h2>Repeat infringers</h2>
      <p>
        Accounts of users found to be repeat infringers will be terminated.
      </p>
    </>
  ),
});
