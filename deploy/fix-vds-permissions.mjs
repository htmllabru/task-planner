/** Одноразово: sudoers + chown для deploy (GitHub Actions build) */
import { Client } from 'ssh2';

const cmd = [
  "echo 'deploy ALL=(ALL) NOPASSWD: /usr/bin/chown, /bin/chown' > /etc/sudoers.d/deploy-task-planner",
  'chmod 440 /etc/sudoers.d/deploy-task-planner',
  'chown -R deploy:deploy /var/www/task-planner',
].join(' && ');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(code === 0 ? 'OK: permissions fixed' : `Exit ${code}`);
      conn.end();
      process.exit(code ?? 1);
    });
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
  });
});
conn.connect({
  host: process.env.SSH_HOST ?? '81.163.31.249',
  username: process.env.SSH_USER ?? 'root',
  password: process.env.SSH_PASSWORD,
});
