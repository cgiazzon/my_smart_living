import { createClient } from '@/lib/supabase/server'
import AdminLayoutClient from './layout-client'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>
}
