import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }
    
    // TODO: Check actual access status from database/contract
    // This is a stub implementation - will be fleshed out in later phases
    
    return NextResponse.json({ 
      address,
      hasAccess: false, // Mock - always false for stub
      isValidated: false,
      expiry: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
