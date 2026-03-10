// Minimal layout for public-facing pages (no auth, no sidebar)
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
