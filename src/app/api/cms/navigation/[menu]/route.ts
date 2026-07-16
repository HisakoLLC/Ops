import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: getCorsHeaders() })
}

export async function GET(request: Request, { params }: { params: Promise<{ menu: string }> }) {
  const { menu: menuSlug } = await params
  const supabase = await createClient()

  const { data: menuData, error: menuErr } = await supabase
    .from('nav_menus')
    .select('*')
    .eq('slug', menuSlug)
    .single()

  if (menuErr || !menuData) {
    return NextResponse.json({ error: 'Navigation menu not found' }, { status: 404, headers: getCorsHeaders() })
  }

  const { data: items, error: itemsErr } = await supabase
    .from('nav_items')
    .select('*')
    .eq('menu_id', menuData.id)
    .order('sort_order', { ascending: true })

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500, headers: getCorsHeaders() })
  }

  // Build tree structure
  const map: Record<string, any> = {}
  const roots: any[] = []

  if (items) {
    items.forEach(item => {
      map[item.id] = { ...item, children: [] }
    })

    items.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id])
      } else {
        roots.push(map[item.id])
      }
    })
  }

  return NextResponse.json({
    menu: {
      name: menuData.name,
      slug: menuData.slug,
      description: menuData.description,
    },
    items: roots,
  }, {
    status: 200,
    headers: getCorsHeaders(),
  })
}
