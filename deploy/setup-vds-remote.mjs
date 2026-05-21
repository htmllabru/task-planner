/**
 * Одноразовая настройка VDS (запуск с ПК):
 *   $env:SSH_PASSWORD = '...'
 *   node deploy/setup-vds-remote.mjs
 *
 * Не храните пароль в файлах и не коммитьте в git.
 */
import { Client } from 'ssh2';
import { readFileSync, readdirSync, statSync, createReadStream } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const APP_ROOT = join(__dirname, '..');

const HOST = process.env.SSH_HOST ?? '81.163.31.249';
const USER = process.env.SSH_USER ?? 'root';
const PASSWORD = process.env.SSH_PASSWORD;
const APP_DIR = '/var/www/task-planner';
const GITHUB_REPO = process.env.GITHUB_REPO ?? ''; // git@github.com:user/task-planner.git

const SKIP_DIRS = new Set(['node_modules', 'dist', 'data', '.git', 'coverage']);
const SKIP_FILES = new Set(['.env']);

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}: ${errOut || out}`));
        else resolve(out);
      });
      stream.on('data', (d) => {
        out += d;
        process.stdout.write(d);
      });
      stream.stderr.on('data', (d) => {
        errOut += d;
        process.stderr.write(d);
      });
    });
  });
}

function uploadDir(sftp, localDir, remoteDir) {
  const entries = readdirSync(localDir, { withFileTypes: true });
  return Promise.all(
    entries.map(async (ent) => {
      const localPath = join(localDir, ent.name);
      const rel = relative(APP_ROOT, localPath);
      if (SKIP_DIRS.has(ent.name) || SKIP_FILES.has(ent.name)) return;
      const remotePath = `${remoteDir}/${ent.name}`;
      if (ent.isDirectory()) {
        await new Promise((res, rej) =>
          sftp.mkdir(remotePath, (e) => (e && e.code !== 4 ? rej(e) : res())),
        );
        await uploadDir(sftp, localPath, remotePath);
      } else {
        await new Promise((res, rej) => {
          sftp.fastPut(localPath, remotePath, (e) => (e ? rej(e) : res()));
        });
        console.log('  upload', rel);
      }
    }),
  );
}

function connect() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on('ready', () => resolve(conn))
      .on('error', reject)
      .connect({
        host: HOST,
        port: Number(process.env.SSH_PORT ?? 22),
        username: USER,
        password: PASSWORD,
        readyTimeout: 30000,
      });
  });
}

async function main() {
  if (!PASSWORD) {
    console.error('Задайте SSH_PASSWORD в окружении.');
    process.exit(1);
  }

  const conn = await connect();
  console.log('==> bootstrap-vds.sh');
  const bootstrap = readFileSync(join(__dirname, 'bootstrap-vds.sh'), 'utf8');
  const bootstrapLf = bootstrap.replace(/\r\n/g, '\n');
  await exec(conn, `cat > /tmp/bootstrap-vds.sh << 'BOOTSTRAP_EOF'\n${bootstrapLf}\nBOOTSTRAP_EOF`);
  await exec(conn, 'chmod +x /tmp/bootstrap-vds.sh && bash /tmp/bootstrap-vds.sh');

  console.log('==> CI key on server');
  await exec(
    conn,
    `sudo -u deploy bash -c 'test -f ~/.ssh/ci_deploy_key || ssh-keygen -t ed25519 -f ~/.ssh/ci_deploy_key -N "" -C github-actions'`,
  );
  await exec(
    conn,
    `sudo -u deploy bash -c 'cat ~/.ssh/ci_deploy_key.pub >> ~/.ssh/authorized_keys && sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys'`,
  );

  const privKey = await exec(conn, 'sudo -u deploy cat /home/deploy/.ssh/ci_deploy_key');
  console.log('\n========== SSH_PRIVATE_KEY для GitHub Secrets ==========\n');
  console.log(privKey.trim());
  console.log('\n=======================================================\n');

  if (GITHUB_REPO) {
    console.log('==> git clone', GITHUB_REPO);
    await exec(
      conn,
      `sudo -u deploy bash -c 'test -d ${APP_DIR}/.git || git clone ${GITHUB_REPO} ${APP_DIR}'`,
    );
  } else {
    console.log('==> upload project (GITHUB_REPO не задан)');
    const sftp = await new Promise((res, rej) => conn.sftp((e, s) => (e ? rej(e) : res(s))));
    await new Promise((res, rej) =>
      sftp.mkdir(APP_DIR, (e) => (e && e.code !== 4 ? rej(e) : res())),
    );
    await uploadDir(sftp, APP_ROOT, APP_DIR);
    await exec(conn, `chown -R deploy:deploy ${APP_DIR}`);
  }

  const jwt = await exec(conn, 'openssl rand -base64 32');
  const envContent = `PORT=3000
NODE_ENV=production
JWT_SECRET=${jwt.trim()}
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://81.163.31.249
DATABASE_PATH=${APP_DIR}/data/app.db
`;
  await exec(
    conn,
    `cat > ${APP_DIR}/.env << 'ENV_EOF'\n${envContent}ENV_EOF\nchown deploy:deploy ${APP_DIR}/.env && chmod 600 ${APP_DIR}/.env`,
  );

  console.log('==> npm build + pm2');
  await exec(conn, `cd ${APP_DIR} && sudo -u deploy npm ci && sudo -u deploy npm run build`);
  await exec(
    conn,
    `cd ${APP_DIR} && sudo -u deploy pm2 delete task-planner 2>/dev/null; sudo -u deploy pm2 start ecosystem.config.cjs && sudo -u deploy pm2 save`,
  );

  const startupOut = await exec(conn, 'sudo -u deploy pm2 startup systemd -h 2>/dev/null || sudo env PATH=$PATH pm2 startup systemd -h');
  const startupCmd = startupOut.split('\n').find((l) => l.includes('sudo env'));
  if (startupCmd) {
    await exec(conn, startupCmd.trim());
  }

  await exec(
    conn,
    `cp ${APP_DIR}/deploy/nginx-task-planner.conf /etc/nginx/sites-available/task-planner && ln -sf /etc/nginx/sites-available/task-planner /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default 2>/dev/null; nginx -t && systemctl reload nginx`,
  );

  conn.end();
  console.log('\nГотово. Откройте http://81.163.31.249/');
  console.log('Добавьте SSH_PRIVATE_KEY в GitHub Secrets (см. вывод выше).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
