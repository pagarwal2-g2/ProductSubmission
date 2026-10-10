// Auth removed — all routes are publicly accessible
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
