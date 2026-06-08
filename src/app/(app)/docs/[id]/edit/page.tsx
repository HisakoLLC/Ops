import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditDocClient } from './edit-doc-client'

export const dynamic = 'force-dynamic'

export default async function EditDocPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const id = (await params).id

  const { data: doc } = await supabase
    .from('docs_articles')
    .select('*')
    .eq('id', id)
    .single()

  if (!doc) {
    notFound()
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <EditDocClient doc={doc} />
    </div>
  )
}
