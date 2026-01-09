import { NextResponse } from 'next/server';
import { generateSiweNonce } from 'viem/siwe';

/**
 * @swagger
 * /api/v1/auth/web3/nonce:
 *   get:
 *     summary: Generate a nonce for SIWE authentication
 *     description: Returns a random nonce for Sign-In with Ethereum (SIWE) signature
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Successfully generated nonce
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nonce:
 *                   type: string
 *                   description: Random nonce string for SIWE
 */
export async function GET() {
    const nonce = generateSiweNonce();
    
    return NextResponse.json({ nonce });
}
