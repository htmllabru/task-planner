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

### Как правильно вставить ключ в GitHub

1. **Delete** старый секрет `SSH_PRIVATE_KEY` (если был).
2. **New repository secret** → имя `SSH_PRIVATE_KEY`.
3. Вставьте ключ **целиком** — от `-----BEGIN` до `-----END` включительно.
4. **Без** кавычек, пробелов в начале/конце, без `github_pat_...` (это другой токен).
5. Ключ **без passphrase** (пароля на ключ). Иначе CI не сможет его открыть.

Проверка на VDS, что публичная часть в `authorized_keys`:

```bash
ssh root@81.163.31.249
sudo grep -F "$(cat /home/deploy/.ssh/ci_deploy_key.pub)" /home/deploy/.ssh/authorized_keys && echo OK
```

### Ошибка `error in libcrypto` / `Permission denied (publickey)`

| Причина | Решение |
|---------|---------|
| В Secret попал **битый** или **обрезанный** ключ | Пересоздать Secret по инструкции выше |
| Вставили **публичный** `.pub` вместо приватного | Нужен файл **без** `.pub` |
| У ключа есть **passphrase** | Создать новый ключ **без** пароля (команды ниже) |
| Публичный ключ не в `authorized_keys` | Команда `grep` выше |

**Новый ключ для CI на VDS (без passphrase):**

```bash
sudo -u deploy ssh-keygen -t ed25519 -f /home/deploy/.ssh/ci_deploy_key -N "" -C "github-actions"
sudo -u deploy bash -c 'cat /home/deploy/.ssh/ci_deploy_key.pub >> ~/.ssh/authorized_keys'
sudo cat /home/deploy/.ssh/ci_deploy_key
```

Последняя команда выводит приватный ключ — **один раз** скопируйте в GitHub Secret `SSH_PRIVATE_KEY`.

## Проверка

1. Push в ветку `main`.
2. Вкладка **Actions** → workflow **Deploy to Selectel VDS** → зелёный статус.
3. Сайт: http://81.163.31.249/

Деплой использует **rsync** (не `git pull` на сервере), `.env` и `data/` на VDS не перезаписываются.
