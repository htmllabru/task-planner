# GitHub Actions — Secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Значение |
|--------|----------|
| `SSH_HOST` | `81.163.31.249` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | приватный ключ CI (см. ниже) |
| `SSH_PORT` | `22` (опционально) |

## Где взять `SSH_PRIVATE_KEY`

**Вариант A** — после `node deploy/setup-vds-remote.mjs` ключ выводится в консоль (блок `BEGIN OPENSSH PRIVATE KEY`).

**Вариант B** — на VDS:

```bash
sudo cat /home/deploy/.ssh/ci_deploy_key
```

Скопируйте **весь** файл, включая строки `BEGIN` / `END`, в Secret `SSH_PRIVATE_KEY`.

## Проверка

1. Push в ветку `main`.
2. Вкладка **Actions** → workflow **Deploy to Selectel VDS** → зелёный статус.
3. Сайт: http://81.163.31.249/

Деплой использует **rsync** (не `git pull` на сервере), `.env` и `data/` на VDS не перезаписываются.
