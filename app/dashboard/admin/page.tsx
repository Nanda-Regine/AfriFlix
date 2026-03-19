import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminPanel } from './admin-panel'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — AfriFlix',
  robots: { index: false, follow: false },
}

export const revalidate = 0

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    redirect('/dashboard')
  }

  // Fetch platform stats and queues in parallel
  const [
    creatorsRes, worksRes, pendingReportsRes, pendingVerifyRes,
    pendingPayoutsRes, totalViewsRes,
  ] = await Promise.all([
    supabase.from('creators').select('id', { count: 'exact', head: true }),
    supabase.from('works').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('reports').select(`
      id, reason, details, status, created_at,
      work:works(id, title, category)
    `).eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
    supabase.from('verification_requests').select(`
      id, method, status, notes, social_proof_url, submitted_at,
      creator:creators(id, display_name, username, avatar_url, country, categories)
    `).eq('status', 'pending').order('submitted_at', { ascending: true }).limit(20),
    supabase.from('payouts').select('id, gross_amount, creator_id', { count: 'exact' })
      .eq('status', 'pending').limit(50),
    supabase.from('works').select('view_count').eq('status', 'published').limit(1000),
  ])

  const stats = {
    totalCreators: creatorsRes.count ?? 0,
    publishedWorks: worksRes.count ?? 0,
    pendingReports: pendingReportsRes.count ?? 0,
    pendingVerifications: pendingVerifyRes.count ?? 0,
    pendingPayouts: pendingPayoutsRes.count ?? 0,
    totalViews: (totalViewsRes.data ?? []).reduce((sum, w) => sum + (w.view_count ?? 0), 0),
  }

  return (
    <AdminPanel
      stats={stats}
      reports={(pendingReportsRes.data ?? []) as Parameters<typeof AdminPanel>[0]['reports']}
      verifications={(pendingVerifyRes.data ?? []) as Parameters<typeof AdminPanel>[0]['verifications']}
    />
  )
}
