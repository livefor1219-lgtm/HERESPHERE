import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // n8n 주소 하드코딩
    const N8N_URL = "https://sunhyeyun.app.n8n.cloud/webhook-test/herusphere-action";

    const response = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
