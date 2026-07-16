import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Max file size: 10MB
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || 'general'
  const altText = (formData.get('alt_text') as string) || ''

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })

  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const filename = `${timestamp}-${random}.${ext}`
  const storagePath = `${folder}/${filename}`

  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Get image dimensions (for jpeg/png/webp)
  let width: number | null = null
  let height: number | null = null
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    try {
      if (file.type === 'image/png') {
        width = buffer.readUInt32BE(16)
        height = buffer.readUInt32BE(20)
      } else if (file.type === 'image/jpeg') {
        for (let i = 0; i < buffer.length - 1; i++) {
          if (buffer[i] === 0xFF && (buffer[i + 1] === 0xC0 || buffer[i + 1] === 0xC2)) {
            height = buffer.readUInt16BE(i + 5)
            width = buffer.readUInt16BE(i + 7)
            break
          }
        }
      }
    } catch { /* dimensions optional */ }
  }

  // Upload to Supabase Storage
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  )

  const { error: uploadError } = await serviceClient.storage
    .from('hisako-media')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed', detail: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = serviceClient.storage
    .from('hisako-media')
    .getPublicUrl(storagePath)

  // Save to media table
  const { data: media, error: dbError } = await supabase
    .from('media')
    .insert({
      filename,
      original_filename: file.name,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
      width,
      height,
      alt_text: altText,
      folder,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (dbError) {
    // Cleanup storage if DB insert fails
    await serviceClient.storage.from('hisako-media').remove([storagePath])
    return NextResponse.json({ error: 'Database error', detail: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, media })
}
