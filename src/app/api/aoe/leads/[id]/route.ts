import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Whitelist allowed fields for PATCH
  const allowed = [
    'status', 'notes', 'reviewed_by',
    'selected_subject_1', 'selected_subject_2', 'selected_subject_3',
    'edited_body_1', 'edited_body_2', 'edited_body_3',
    'replied_at',
  ]
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // Status transition validation
  if (updates.status) {
    const validStatuses = [
      'PENDING_REVIEW','APPROVED','REJECTED','EMAIL_1_SENT',
      'EMAIL_2_SENT','EMAIL_3_SENT','REPLIED','CONVERTED','ARCHIVED'
    ]
    if (!validStatuses.includes(updates.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.reviewed_by = user.id
  }

  const { data, error } = await supabase
    .from('aoe_leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
