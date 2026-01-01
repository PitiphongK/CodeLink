import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json().catch(() => null)) as
			| { code?: unknown }
			| null;
		const code = typeof body?.code === 'string' ? body.code : '';

		if (!code.trim()) {
			return new Response(JSON.stringify({ error: 'No code provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const proc = spawn('python3', ['-u', '-c', code], { timeout: 0 });

		let stdout = '';
		let stderr = '';
		let timedOut = false;

		const killTimeout = setTimeout(() => {
			try {
				proc.kill('SIGKILL');
				timedOut = true;
			} catch {
				// ignore
			}
		}, 7000);

		proc.stdout.on('data', (data) => {
			stdout += String(data);
		});

		proc.stderr.on('data', (data) => {
			stderr += String(data);
		});

		const exitCode: number = await new Promise((resolve) => {
			proc.on('close', (code) => {
				clearTimeout(killTimeout);
				resolve(code === null ? -1 : code);
			});
			proc.on('error', (err) => {
				clearTimeout(killTimeout);
				stderr += String(err instanceof Error ? err.message : err);
				resolve(-1);
			});
		});

		return new Response(JSON.stringify({ stdout, stderr, exitCode, timedOut }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

