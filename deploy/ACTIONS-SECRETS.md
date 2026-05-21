# GitHub Actions — Secrets (секреты)

## Что такое Secrets простыми словами

**Secrets** — это «сейф» на GitHub для паролей и ключей. Туда кладут данные, которые **нельзя** писать в коде и в чате.

Когда срабатывает Actions после `git push`, workflow читает секреты и подключается к вашему VDS по SSH — как будто робот вводит ключ вместо вас.

**Без секретов job `deploy` не сможет зайти на сервер** — сайт не обновится, хотя код на GitHub уже новый.

## Как открыть настройку

1. Репозиторий https://github.com/htmllabru/task-planner  
2. Вкладка **Settings** (шестерёнка)  
3. Слева: **Secrets and variables** → **Actions**  
4. Кнопка **New repository secret**

## Какие секреты добавить (для деплоя на VDS)

| Secret | Значение |
|--------|----------|
| `SSH_HOST` | `81.163.31.249` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | приватный ключ CI (см. ниже) |
| `SSH_PORT` | `22` (опционально) |

`JWT_SECRET` для тестов в CI **не нужен** — подставляется автоматически в workflow.

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
