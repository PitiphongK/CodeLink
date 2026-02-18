# Running CodeLink Locally

To run the full CodeLink application with drawing board sync across devices, you need to start **3 servers**:

## 1. Start the Yjs WebSocket Server (for real-time sync)

```bash
pnpm dev:yjs
```

This starts the Yjs server on `ws://localhost:1234` which handles real-time synchronization for:
- Drawing board strokes
- Code editor content
- User cursors and awareness

## 2. Start the Terminal Server (for shared terminals)

```bash
pnpm dev:server
```

This starts the Socket.IO server on port 4000 for shared terminal functionality.

## 3. Start the Next.js App

```bash
pnpm dev
```

This starts the Next.js frontend on `http://localhost:3000`

## Quick Start (All at Once)

You can run all three in separate terminals, or use a process manager like `concurrently`:

```bash
# Install concurrently if you don't have it
pnpm add -D concurrently

# Then add this to package.json scripts:
"dev:all": "concurrently \"pnpm dev:yjs\" \"pnpm dev:server\" \"pnpm dev\""
```

## Testing Across Devices

1. Make sure all 3 servers are running
2. Find your local IP address:
   ```bash
   # On Linux/Mac
   ip addr show | grep inet
   # Or
   ifconfig | grep inet
   ```

3. Update `.env.local` to use your local IP instead of `localhost`:
   ```
   NEXT_PUBLIC_YJS_WEBSOCKET_URL=ws://YOUR_LOCAL_IP:1234
   ```

4. On both devices, navigate to:
   - Device 1: `http://YOUR_LOCAL_IP:3000/rooms/test-room`
   - Device 2: `http://YOUR_LOCAL_IP:3000/rooms/test-room`

5. Now drawing should sync between devices!

## Troubleshooting

- **Drawing doesn't sync**: Check that the Yjs server is running and the `NEXT_PUBLIC_YJS_WEBSOCKET_URL` is set correctly
- **Connection errors**: Make sure firewall allows connections on ports 1234, 3000, and 4000
- **Cross-device issues**: Use your local network IP (not `localhost`) in the environment variable
