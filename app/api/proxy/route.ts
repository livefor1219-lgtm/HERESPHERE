import { NextResponse } from 'next/server';

// CORS preflight 요청 처리
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("프론트에서 받은 데이터:", body);

    // 1. n8n 주소 하드코딩 (환경변수 쓰지 마, 에러 원인임)
    const N8N_URL = "https://sunhyeyun.app.n8n.cloud/webhook-test/herusphere-action";

    // 2. n8n으로 전송
    const response = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // 3. n8n 응답 받기
    if (!response.ok) {
      throw new Error(`n8n Error: ${response.statusText}`);
    }
    const data = await response.json();

    // CORS 헤더 추가하여 응답
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error: any) {
    console.error("API 라우트 에러:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

