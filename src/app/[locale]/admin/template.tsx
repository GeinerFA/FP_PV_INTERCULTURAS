/**
 * Unlike the layout, a template remounts on every navigation, so the entrance animation plays each
 * time the admin moves between sections while the sidebar (in the layout) stays still.
 */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="admin-page-enter flex flex-col gap-6">{children}</div>;
}
