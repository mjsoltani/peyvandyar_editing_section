import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Get correct base URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://basalam-product-manager.onrender.com'
      : 'http://localhost:3000';

    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${baseUrl}/fa/auth/login?error=oauth_error`
      );
    }

    // Validate authorization code
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        `${baseUrl}/fa/auth/login?error=no_code`
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
        `${baseUrl}/fa/auth/login?error=config_error`
      );
    }

    // Exchange code for access token (طبق مستندات باسلام)
    const tokenResponse = await fetch('https://auth.basalam.com/oauth/token', {
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
        `${baseUrl}/fa/auth/login?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    
    // Log token info for debugging
    console.log('Tokens received:', {
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      access_token_length: tokens.access_token?.length,
      access_token_start: tokens.access_token?.substring(0, 20) + '...'
    });

    // Try different user info endpoints
    const userEndpoints = [
      'https://openapi.basalam.com/v1/users/me',
      'https://auth.basalam.com/whoami'
    ];

    let userInfo = null;
    let lastError = null;

    for (const endpoint of userEndpoints) {
      try {
        console.log(`Trying user info endpoint: ${endpoint}`);
        
        const userResponse = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Accept': 'application/json',
          },
        });

        console.log(`Response from ${endpoint}:`, {
          status: userResponse.status,
          statusText: userResponse.statusText,
          headers: Object.fromEntries(userResponse.headers.entries())
        });

        if (userResponse.ok) {
          userInfo = await userResponse.json();
          console.log(`Success with ${endpoint}:`, userInfo);
          break;
        } else {
          const errorText = await userResponse.text();
          console.error(`Failed ${endpoint}:`, errorText);
          lastError = errorText;
        }
      } catch (error) {
        console.error(`Error with ${endpoint}:`, error);
        lastError = error;
      }
    }

    if (!userInfo) {
      console.error('All user info endpoints failed. Last error:', lastError);
      return NextResponse.redirect(
        `${baseUrl}/fa/auth/login?error=user_info_failed`
      );
    }



    // Log user info for debugging
    console.log('User info received:', {
      id: userInfo.id,
      username: userInfo.username,
      name: userInfo.name,
      vendor: userInfo.vendor
    });

    // Here you would typically:
    // 1. Save user info to your database
    // 2. Create a session
    // 3. Set authentication cookies
    
    // For now, redirect to dashboard with success
    const dashboardUrl = new URL(`${baseUrl}/fa/dashboard`);
    dashboardUrl.searchParams.set('login', 'success');
    dashboardUrl.searchParams.set('user', userInfo.name || userInfo.username);
    dashboardUrl.searchParams.set('vendor', userInfo.vendor?.title || 'نامشخص');
    
    return NextResponse.redirect(dashboardUrl.toString());

  } catch (error) {
    console.error('OAuth callback error:', error);
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://basalam-product-manager.onrender.com'
      : 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/fa/auth/login?error=callback_error`
    );
  }
}