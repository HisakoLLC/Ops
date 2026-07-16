import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { revision_id, doc_id } = body

    if (!revision_id || !doc_id) {
      return NextResponse.json({ error: 'revision_id and doc_id are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user profile / role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || 'viewer'
    if (!['admin', 'editor', 'writer'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to restore document revisions' }, { status: 403 })
    }

    // Fetch revision snapshot
    const { data: revision, error: revErr } = await supabase
      .from('doc_revisions')
      .select('*')
      .eq('id', revision_id)
      .single()

    if (revErr || !revision) {
      return NextResponse.json({ error: 'Revision not found: ' + (revErr?.message || '') }, { status: 404 })
    }

    // Update document with revision snapshot
    const { data: updatedDoc, error: updateErr } = await supabase
      .from('docs')
      .update({
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt || null,
        slug: revision.slug || null,
        category_id: revision.category_id || null,
        tags: revision.tags || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc_id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to restore revision: ' + updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, doc: updatedDoc }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
