import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const vendorId = searchParams.get('vendor_id');
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Try different product endpoints
    const endpoints = [
      `https://openapi.basalam.com/v1/vendors/${vendorId}/products`,
      'https://openapi.basalam.com/v1/products',
      'https://openapi.basalam.com/v1/vendor/products'
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
          return NextResponse.json({
            success: true,
            endpoint: endpoint,
            data: products
          });
        } else {
          const errorText = await response.text();
          console.error(`Failed ${endpoint}:`, errorText);
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