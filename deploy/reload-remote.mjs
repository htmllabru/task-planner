/** Быстрый деплой: upload + build + pm2 reload */
import { Client } from 'ssh2';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const APP_ROOT = join(__dirname, '..');
const APP_DIR = '/var/www/task-planner';
const SKIP = new Set(['node_modules', 'dist', 'data', '.git', 'coverage', '.env']);

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => (code ? reject(new Error(`exit ${code}`)) : resolve()));
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  });
}

function uploadDir(sftp, local, remote) {
  return Promise.all(
    readdirSync(local, { withFileTypes: true }).map(async (e) => {
      if (SKIP.has(e.name)) return;
      const lp = join(local, e.name);
      const rp = `${remote}/${e.name}`;
      if (e.isDirectory()) {
        await new Promise((r, j) => sftp.mkdir(rp, (er) => (er && er.code !== 4 ? j(er) : r())));
        await uploadDir(sftp, lp, rp);
      } else {
        await new Promise((r, j) => sftp.fastPut(lp, rp, (er) => (er ? j(er) : r())));
      }
    }),
  );
}

const conn = new Client();
conn.on('ready', async () => {
  const sftp = await new Promise((r, j) => conn.sftp((e, s) => (e ? j(e) : r(s))));
  await uploadDir(sftp, join(APP_ROOT, 'src'), `${APP_DIR}/src`);
  await new Promise((r, j) =>
    sftp.fastPut(join(APP_ROOT, 'package.json'), `${APP_DIR}/package.json`, (e) => (e ? j(e) : r())),
  );
  await exec(conn, `cd ${APP_DIR} && sudo -u deploy npm run build && sudo -u deploy pm2 reload task-planner`);
  conn.end();
  console.log('\nDone.');
});
conn.connect({
  host: process.env.SSH_HOST ?? '81.163.31.249',
  username: process.env.SSH_USER ?? 'root',
  password: process.env.SSH_PASSWORD,
});
