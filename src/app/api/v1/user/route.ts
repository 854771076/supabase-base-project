import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/v1/user:
 *   get:
 *     summary: Get current authenticated user profile
 *     description: Returns the basic profile information of the currently logged-in user.
 *     tags:
 *       - User
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: User ID
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: User email
 *                 user_metadata:
 *                   type: object
 *                   description: User metadata (full_name, avatar_url, etc.)
 *                 last_sign_in_at:
 *                   type: string
 *                   format: date-time
 *                   description: Last sign-in timestamp
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 */
export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        last_sign_in_at: user.last_sign_in_at,
    });
}
