import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const zkpRequest = await request.json();

    const proverUrl = 'https://prover-dev.mystenlabs.com/v1';
    const zkpResponse = await fetch(proverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zkpRequest),
    });

    if (!zkpResponse.ok) {
      throw new Error('Failed to fetch ZKP');
    }

    const zkpData = await zkpResponse.json();
    return NextResponse.json(zkpData);
  } catch (error) {
    console.error('ZKP error:', error);
    return NextResponse.json(
      { error: 'Failed to get ZKP proof' },
      { status: 500 }
    );
  }
}