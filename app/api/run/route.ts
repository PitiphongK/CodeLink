import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  void request;
  return new Response(
    JSON.stringify({
      error: 'This endpoint is disabled. Use the shared runner (Run button) instead.',
    }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  );
}
