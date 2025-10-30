import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Get environment variables
        const clientId = process.env.BASALAM_CLIENT_ID;
        const redirectUri = process.env.BASALAM_REDIRECT_URI;
        const basalamApiUrl = process.env.BASALAM_API_BASE_URL || 'https://api.basalam.com';

        // Debug: Log environment variables (remove in production)
        console.log('Environment check:', {
            clientId: clientId ? 'SET' : 'MISSING',
            redirectUri: redirectUri ? 'SET' : 'MISSING',
            basalamApiUrl: basalamApiUrl ? 'SET' : 'MISSING',
            nodeEnv: process.env.NODE_ENV
        });

        if (!clientId || !redirectUri) {
            return NextResponse.json(
                {
                    error: 'Basalam OAuth configuration is missing',
                    debug: {
                        clientId: clientId ? 'SET' : 'MISSING',
                        redirectUri: redirectUri ? 'SET' : 'MISSING'
                    }
                },
                { status: 500 }
            );
        }

        // Build OAuth authorization URL (طبق مستندات باسلام)
        const authUrl = new URL('https://basalam.com/accounts/sso');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', 'vendor.product.read vendor.product.write customer.order.read');

        // Add state parameter for security (optional)
        const state = Math.random().toString(36).substring(2, 15);
        authUrl.searchParams.set('state', state);

        // Redirect to Basalam OAuth
        return NextResponse.redirect(authUrl.toString());

    } catch (error) {
        console.error('Basalam OAuth redirect error:', error);
        return NextResponse.json(
            { error: 'Failed to redirect to Basalam OAuth' },
            { status: 500 }
        );
    }
}