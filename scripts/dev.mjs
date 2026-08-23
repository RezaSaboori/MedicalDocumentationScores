import { spawn } from 'child_process';
import fs from 'fs';

let client = null;

const updateEnvPort = (port) => {
  const envPath = '.env.local';
  const key = 'VITE_API_PORT';

  let content = '';

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  const regex = new RegExp(`^${key}=.*$`, 'm');

  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${port}`);
  } else {
    content += `\n${key}=${port}\n`;
  }

  fs.writeFileSync(envPath, content);
};

const server = spawn('node', ['--experimental-sqlite', 'server/index.js'], {
  stdio: ['inherit', 'pipe', 'inherit'],
});

server.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);

  const match = chunk.toString().match(/VITE_API_PORT=(\d+)/);

  if (match && !client) {
    const port = match[1];

    updateEnvPort(port);

    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    client = spawn(npmCommand, ['run', 'dev:client'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_API_PORT: port,
      },
    });

    client.on('exit', () => {
      server.kill();
      process.exit(0);
    });
  }
});

server.on('exit', (code) => {
  if (client) {
    client.kill();
  }

  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  if (client) {
    client.kill();
  }

  server.kill();
  process.exit(0);
});