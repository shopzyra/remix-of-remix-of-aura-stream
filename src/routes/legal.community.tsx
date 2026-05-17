import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/legal/community")({ component: () => (
  <>
    <h1>Community Guidelines</h1>
    <p>Be respectful. Don't upload hateful, illegal, or infringing material. Don't impersonate others. Report problems and we'll act.</p>
  </>
)});
