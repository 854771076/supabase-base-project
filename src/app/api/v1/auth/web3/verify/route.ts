import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { parseSiweMessage, verifySiweMessage } from 'viem/siwe';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

export async function POST(request: NextRequest) {
    try {
        const { message, signature } = await request.json();

        if (!message || !signature) {
            return NextResponse.json(
                { error: 'Missing message or signature' },
                { status: 400 }
            );
        }

        // Parse the SIWE message
        const siweMessage = parseSiweMessage(message);

        if (!siweMessage.address) {
            return NextResponse.json(
                { error: 'Invalid SIWE message: missing address' },
                { status: 400 }
            );
        }

        // Create a public client for signature verification
        const publicClient = createPublicClient({
            chain: mainnet,
            transport: http(),
        });

        // Verify the SIWE signature
        const isValid = await verifySiweMessage(publicClient, {
            message,
            signature: signature as `0x${string}`,
        });

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Create Supabase admin client to create/get user
        const supabase = await createAdminClient();
        const walletAddress = siweMessage.address.toLowerCase();
        const email = `${walletAddress}@wallet.local`;

        // Try to get existing user or create new one
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

        let user = existingUsers?.users?.find(u => u.email === email);

        if (!user) {
            // Create new user for this wallet
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: {
                    wallet_address: walletAddress,
                    auth_method: 'web3',
                },
            });

            if (createError) {
                console.error('Error creating user:', createError);
                return NextResponse.json(
                    { error: 'Failed to create user' },
                    { status: 500 }
                );
            }

            user = newUser.user;
        }

        // Generate a magic link for the user to complete the session
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email,
        });

        if (linkError || !linkData) {
            console.error('Error generating link:', linkError);
            return NextResponse.json(
                { error: 'Failed to generate session' },
                { status: 500 }
            );
        }

        // Extract token from the link
        const url = new URL(linkData.properties.action_link);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                wallet_address: walletAddress,
            },
            verification: {
                token,
                type,
            }
        });

    } catch (error) {
        console.error('Web3 verify error:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}
