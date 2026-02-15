import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isValidSlug } from '@/lib/slug';

/**
 * GET /api/organizations/check-slug?slug=xxx
 * Check if an organization slug is available
 * 
 * Query Parameters:
 * - slug: string (required)
 * 
 * Response:
 * - 200: { available: boolean }
 * - 400: Invalid slug format
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const slug = searchParams.get('slug');

        if (!slug) {
            return NextResponse.json(
                { error: 'Slug parameter is required' },
                { status: 400 }
            );
        }

        if (!isValidSlug(slug)) {
            return NextResponse.json(
                { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
                { status: 400 }
            );
        }

        const result = await db.query(
            'SELECT id FROM organizations WHERE slug = $1',
            [slug]
        );

        const existingOrg = result.rows[0];
        return NextResponse.json({
            available: !existingOrg,
            slug,
        });
    } catch (error) {
        console.error('Check slug error:', error);
        return NextResponse.json(
            { error: 'An error occurred while checking slug availability' },
            { status: 500 }
        );
    }
}
