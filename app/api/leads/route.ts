import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { LeadInsert, LeadUpdate } from '@/lib/types/database'

// GET /api/leads - Fetch all leads for the user's account
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get account_id from query params
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')

    if (!accountId) {
      return NextResponse.json({ error: 'account_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('account_id', accountId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ leads: data })
  } catch (error) {
    console.error('Fetch leads error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body: LeadInsert = await request.json()

    const { data, error } = await supabase
      .from('leads')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error('Create lead error:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}

// PATCH /api/leads - Update a lead
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body: { id: string } & LeadUpdate = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error('Update lead error:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

// DELETE /api/leads - Soft delete a lead
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('user_id')

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Lead ID and user_id required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('leads')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_by_type: 'user',
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete lead error:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
