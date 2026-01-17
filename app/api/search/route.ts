import { NextRequest, NextResponse } from 'next/server'
import { runSearch, PHONE_REGEX } from '@/lib/scraper'

interface SearchRequest {
  query: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    console.log(`Searching for: ${query}`)

    const results = await runSearch(query)

    if (results.length > 0) {
      const enrichedResults = results.map((r) => {
        const emails =
          r.snippet
            .toLowerCase()
            .match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g) || []
        const phones = r.snippet.match(PHONE_REGEX) || []
        return { ...r, emails, phones }
      })

      return NextResponse.json({ success: true, results: enrichedResults })
    }

    return NextResponse.json(
      { error: 'Search failed after all attempts' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      {
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
