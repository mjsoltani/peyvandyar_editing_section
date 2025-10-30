import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let token = searchParams.get('token');
    const vendorId = searchParams.get('vendor_id');
    
    console.log('Products API called with:', { 
      hasToken: !!token, 
      tokenLength: token?.length,
      vendorId 
    });
    
    // If no token in params, try to get from cookies or headers
    if (!token) {
      // For now, we'll need to implement proper session management
      // This is a temporary solution
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'Please login first to access products'
      }, { status: 401 });
    }

    // Try different product endpoints
    const endpoints = [
      `https://openapi.basalam.com/v1/vendors/${vendorId}/products`,
      'https://openapi.basalam.com/v1/products',
      'https://openapi.basalam.com/v1/vendor/products',
      'https://openapi.basalam.com/v1/products/me',
      `https://openapi.basalam.com/v1/vendor/${vendorId}/products`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying products endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        console.log(`Response from ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText
        });

        if (response.ok) {
          const products = await response.json();
          console.log(`Success with ${endpoint}:`, {
            dataType: typeof products,
            isArray: Array.isArray(products),
            keys: Object.keys(products || {}),
            length: Array.isArray(products) ? products.length : 'N/A'
          });
          
          return NextResponse.json({
            success: true,
            endpoint: endpoint,
            data: products,
            debug: {
              vendorId,
              tokenLength: token?.length,
              responseType: typeof products
            }
          });
        } else {
          const errorText = await response.text();
          console.error(`Failed ${endpoint}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
        }
      } catch (error) {
        console.error(`Error with ${endpoint}:`, error);
      }
    }

    return NextResponse.json({
      error: 'All product endpoints failed',
      message: 'Could not fetch products from any endpoint'
    }, { status: 500 });

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}