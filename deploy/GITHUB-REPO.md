# Создание GitHub-репозитория

`gh` CLI на машине может отсутствовать — создайте репозиторий вручную.

## Шаги

1. https://github.com/new → имя **task-planner**, Private/Public по желанию, **без** README/license.
2. На ПК — SSH-ключ для GitHub ([SSH-SETUP.md](SSH-SETUP.md) §2).
3. Привязать remote и push:

```powershell
Set-Location C:\Users\A\Desktop\NODEJS\07-myapp
git remote add origin git@github.com:htmllabru/task-planner.git
git push -u origin main
```

Замените `htmllabru` на ваш логин GitHub.

4. Repo → **Settings** → **Secrets and variables** → **Actions** — добавить секреты из [SSH-SETUP.md](SSH-SETUP.md) §4.
5. На VDS — Deploy key для `git pull` ([SSH-SETUP.md](SSH-SETUP.md) §3).

После первого push откройте вкладку **Actions** — workflow «Deploy to Selectel VDS» должен запуститься (деплой упадёт, пока VDS не настроен — это нормально).
