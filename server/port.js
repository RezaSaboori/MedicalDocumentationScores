import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

const DEFAULT_PORT = 4617;
const MAX_ATTEMPTS = 30;
const ENV_PATH = '.env.local';

const validatePort = (value) => {
  const port = Number(value);

  if (
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65535
  ) {
    throw new Error(`Invalid server port: ${value}`);
  }

  return port;
};

const saveSelectedPort = (port) => {
  const existing = existsSync(ENV_PATH)
    ? readFileSync(ENV_PATH, 'utf8')
    : '';

  const entry = `APP_PORT=${port}`;

  const updated = /^APP_PORT=.*$/m.test(existing)
    ? existing.replace(/^APP_PORT=.*$/m, entry)
    : `${existing.trimEnd()}\n${entry}\n`;

  writeFileSync(ENV_PATH, updated, {
    mode: 0o600,
  });
};

const listen = (app, port) =>
  new Promise((resolve, reject) => {
    const server = app.listen(port, '127.0.0.1');

    const onError = (error) => {
      server.removeListener('listening', onListening);
      reject(error);
    };

    const onListening = () => {
      server.removeListener('error', onError);
      resolve(server);
    };

    server.once('error', onError);
    server.once('listening', onListening);
  });

export const startOnStablePort = async (app) => {
  const configuredPort = validatePort(
    process.env.PORT ??
    process.env.APP_PORT ??
    DEFAULT_PORT
  );

  const allowFallback =
    process.env.NODE_ENV !== 'production' &&
    !process.env.PORT;

  const attempts = allowFallback ? MAX_ATTEMPTS : 1;

  for (let offset = 0; offset < attempts; offset += 1) {
    const port = configuredPort + offset;

    if (port > 65535) break;

    try {
      const server = await listen(app, port);

      if (allowFallback) {
        saveSelectedPort(port);
      }

      console.log(
        `Server running on http://127.0.0.1:${port}`
      );

      console.log(`VITE_API_PORT=${port}`);

      return server;
    } catch (error) {
      if (error.code !== 'EADDRINUSE' || !allowFallback) {
        throw error;
      }
    }
  }

  throw new Error(
    'No available port found in the configured range.'
  );
};