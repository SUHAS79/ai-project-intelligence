import { redirect } from "next/navigation";

// Redirect /projects to the dashboard (projects are shown there)
export default function ProjectsPage() {
  redirect("/");
}
