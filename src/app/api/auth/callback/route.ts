import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL('/fa/auth/login?error=oauth_error', request.url)
      );
    }

    // Validate authorization code
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/fa/auth/login?error=no_code', request.url)
      );
    }

    // Get environment variables
    const clientId = process.env.BASALAM_CLIENT_ID;
    const clientSecret = process.env.BASALAM_CLIENT_SECRET;
    const redirectUri = process.env.BASALAM_REDIRECT_URI;
    const basalamApiUrl = process.env.BASALAM_API_BASE_URL || 'https://api.basalam.com';

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing OAuth configuration');
      return NextResponse.redirect(
        new URL('/fa/auth/login?error=config_error', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`${basalamApiUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL('/fa/auth/login?error=token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // Get user info from Basalam
    const userResponse = await fetch(`${basalamApiUrl}/api/user`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Get user info failed:', errorText);
      return NextResponse.redirect(
        new URL('/fa/auth/login?error=user_info_failed', request.url)
      );
    }

    const userInfo = await userResponse.json();

    // Here you would typically:
    // 1. Save user info to your database
    // 2. Create a session
    // 3. Set authentication cookies
    
    // For now, redirect to dashboard with success
    const dashboardUrl = new URL('/fa/dashboard', request.url);
    dashboardUrl.searchParams.set('login', 'success');
    dashboardUrl.searchParams.set('user', userInfo.name || userInfo.username);
    
    return NextResponse.redirect(dashboardUrl.toString());

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/fa/auth/login?error=callback_error', request.url)
    );
  }
}