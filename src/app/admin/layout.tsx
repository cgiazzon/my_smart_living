import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminLayoutClient from './layout-client'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>
}
