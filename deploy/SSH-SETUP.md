# SSH-ключи для деплоя (без паролей в Git)

## 1. Ключ для GitHub Actions → VDS

На **Windows** (PowerShell):

```powershell
Set-Location C:\Users\A\Desktop\NODEJS\07-myapp\deploy
ssh-keygen -t ed25519 -f ci_deploy_key -N '""' -C "github-actions-task-planner"
```

Файлы (не коммитить приватный ключ):

- `ci_deploy_key` — **приватный** → GitHub Secret `SSH_PRIVATE_KEY` (весь текст файла)
- `ci_deploy_key.pub` — **публичный** → на VDS в `/home/deploy/.ssh/authorized_keys`

На VDS (после `bootstrap-vds.sh`):

```bash
cat >> /home/deploy/.ssh/authorized_keys << 'EOF'
<содержимое ci_deploy_key.pub>
EOF
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

## 2. Ключ для git push с ПК → GitHub

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\id_ed25519_github -C "htmllabru@gmail.com"
```

Публичный ключ добавить: GitHub → Settings → SSH and GPG keys → New SSH key.

Проверка:

```powershell
ssh -T git@github.com
```

## 3. Deploy key на VDS → GitHub (clone/pull)

На VDS под `deploy`:

```bash
sudo -u deploy ssh-keygen -t ed25519 -f /home/deploy/.ssh/github_deploy -N ""
sudo -u deploy cat /home/deploy/.ssh/github_deploy.pub
```

Публичный ключ: репозиторий → Settings → Deploy keys → Add (read-only).

```bash
sudo -u deploy bash -c 'cat >> ~/.ssh/config << EOF
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config'
```

## 4. GitHub Secrets (Actions)

| Secret | Значение |
|--------|----------|
| `SSH_HOST` | `81.163.31.249` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | содержимое `deploy/ci_deploy_key` |
| `SSH_PORT` | `22` |
