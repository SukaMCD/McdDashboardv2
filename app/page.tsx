import { getProjects } from "@/lib/actions/project-actions";
import PublicHubClient from "@/components/PublicHubClient";

export default async function Home() {
  const projects = await getProjects();
  
  return <PublicHubClient initialProjects={projects} />;
}
