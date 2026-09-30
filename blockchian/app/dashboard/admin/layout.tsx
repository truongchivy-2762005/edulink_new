import WorkspaceShell from "@/components/workspace/WorkspaceShell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell role="admin">{children}</WorkspaceShell>;
}
