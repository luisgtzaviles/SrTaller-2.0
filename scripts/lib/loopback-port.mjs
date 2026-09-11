import { once } from 'node:events';
import { createServer } from 'node:net';

export async function reserveLoopbackPort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Unable to reserve an ephemeral loopback port');
  }
  const { port } = address;
  server.close();
  await once(server, 'close');
  return port;
}
