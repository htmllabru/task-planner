# Как работать с проектом и CI/CD (простыми словами)

Краткая шпаргалка для повседневной работы с **Task Planner**.  
Полная настройка сервера — в [readme2.md](readme2.md).

**Сайт на сервере:** http://81.163.31.249/

---

## Как устроен CI/CD

```text
Вы меняете код на ПК
    → git commit + git push в ветку main
        → GitHub Actions (автоматически)
            1) npm test          — тесты на GitHub
            2) rsync на VDS      — копирование файлов
            3) npm run build     — сборка на сервере
            4) pm2 reload        — перезапуск приложения
        → на сайте новая версия
```

Файл pipeline: [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

**Важно:**

- Деплой срабатывает только при **push в `main`**.
- Сначала всегда идёт **test** — если тесты красные, **deploy не запускается** (сайт не обновится).
- На сервер **не** заливаются: `node_modules`, `dist`, `data`, `.env` — база и секреты на VDS остаются как были.
- **Secrets** (секреты SSH для деплоя) — один раз в настройках GitHub: [deploy/ACTIONS-SECRETS.md](deploy/ACTIONS-SECRETS.md).

### Почему push есть, а сайт старый?

| Шаг в Actions | Если упал | Результат |
|---------------|-----------|-----------|
| **test** | Нет `JWT_SECRET` в CI (исправлено в коде) | deploy **не стартует** |
| **deploy** | Нет Secrets `SSH_*` или ошибка Rsync | файлы **не доезжают** на VDS |
| **deploy** | `error in libcrypto` / `Permission denied (publickey)` | Пересоздать Secret `SSH_PRIVATE_KEY` — см. [ACTIONS-SECRETS.md](deploy/ACTIONS-SECRETS.md) |

Проверка: https://github.com/htmllabru/task-planner/actions — оба job должны быть зелёными.

---

## Работа на своём компьютере

### Запуск для разработки

```powershell
Set-Location C:\Users\A\Desktop\NODEJS\07-myapp
npm run dev
```

Откройте http://localhost:3000 — правите код, смотрите результат локально.

### Перед коммитом (по желанию, но полезно)

```powershell
npm test
npm run build
```

Если тесты красные — на сервер через CI/CD код **не попадёт** (deploy идёт только после успешных test).

---

## Как сделать коммит и отправить на сервер

### 1. Посмотреть, что изменилось

```powershell
Set-Location C:\Users\A\Desktop\NODEJS\07-myapp
git status
```

### 2. Добавить файлы в коммит

```powershell
git add .
```

Или только нужные файлы, например:

```powershell
git add src/routes/web/index.ts readme3.md
```

**Не коммитьте:** `.env` (пароли), `node_modules/`, `data/` — они в `.gitignore`.

### 3. Создать коммит

```powershell
git commit -m "Исправил вход в личный кабинет"
```

Пишите коротко **что сделали**, по-русски или по-английски — как удобно.

### 4. Привязать GitHub (один раз, если `git push` пишет «origin does not appear»)

Сначала создайте пустой репозиторий: https://github.com/new → имя **task-planner** (без README).

Потом в PowerShell:

```powershell
Set-Location C:\Users\A\Desktop\NODEJS\07-myapp
git remote add origin git@github.com:htmllabru/task-planner.git
```

Замените `htmllabru` на **ваш логин** GitHub, если он другой.

Проверка:

```powershell
git remote -v
```

Должно показать `origin` → `git@github.com:.../task-planner.git`.

SSH-ключ для GitHub: **Settings** → **SSH and GPG keys** → добавить содержимое  
`C:\Users\A\.ssh\id_rsa.pub` (или `id_ed25519.pub`).

Проверка SSH:

```powershell
ssh -T git@github.com
```

Ожидается: `Hi <логин>! You've successfully authenticated...`

### 5. Отправить на GitHub (и запустить деплой)

```powershell
git push -u origin main
```

Первый раз — с флагом `-u`, дальше можно просто `git push`.

После `push` GitHub сам запустит Actions.

---

## Как проверить, что CI/CD отработал

### 1. GitHub Actions

1. Откройте репозиторий на GitHub.
2. Вкладка **Actions**.
3. Workflow **Deploy to Selectel VDS**.
4. Последний запуск должен быть **зелёным** (✓).

Если **красный** (✗):

- Откройте упавший job → смотрите лог.
- Часто: упали **тесты** (`test`) или неверные **Secrets** (`deploy`).

### 2. Сайт в браузере

- http://81.163.31.249/ — главная / вход
- Залогиньтесь и проверьте то, что меняли (задачи, кабинет, API)

### 3. Быстрая проверка API (консоль браузера F12)

```js
const res = await fetch('http://81.163.31.249/api/tasks', {
  headers: { 'X-API-Key': 'sk_ВАШ_КЛЮЧ' },
});
console.log(res.status, await res.json());
```

Без ключа ожидается **401** — это нормально.

---

## Если GitHub Actions ещё не настроен

Один раз в репозитории → **Settings** → **Secrets and variables** → **Actions**:

| Имя | Значение |
|-----|----------|
| `SSH_HOST` | `81.163.31.249` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | приватный SSH-ключ (целиком, с `BEGIN` и `END`) |

Подробнее: [deploy/ACTIONS-SECRETS.md](deploy/ACTIONS-SECRETS.md).

Репозиторий на GitHub ещё не создан — [deploy/GITHUB-REPO.md](deploy/GITHUB-REPO.md).

---

## Деплой без GitHub (вручную с ПК)

Если нужно срочно обновить сервер без `git push`:

```powershell
Set-Location C:\Users\A\Desktop\NODEJS\07-myapp
$env:SSH_PASSWORD = '<пароль root>'
node deploy/reload-remote.mjs
```

Пароль в git **не** сохраняйте. Для обычной работы удобнее **push в main**.

---

## Ошибка push: `Permission denied (publickey)` и passphrase

Git спрашивает `Enter passphrase for key id_rsa` — это **пароль от вашего SSH-ключа** (если вы его задавали при создании ключа). После этого GitHub всё равно может отказать.

**Проверьте по порядку:**

1. Репозиторий **task-planner** создан на https://github.com/htmllabru? (или ваш логин)
2. На https://github.com/settings/keys добавлен ключ из **целиком** файла `id_rsa.pub` (одна длинная строка)
3. Passphrase вводите **правильный** (тот, что задавали при `ssh-keygen`)

Проверка в **Git Bash** (из меню Пуск → Git Bash):

```bash
ssh-add ~/.ssh/id_rsa
ssh -T git@github.com
```

Успех: `Hi htmllabru! You've successfully authenticated...`

### Проще: push через HTTPS (без SSH)

В **PowerShell**:

```powershell
Set-Location C:\Users\A\Desktop\NODEJS\07-myapp
git remote set-url origin https://github.com/htmllabru/task-planner.git
git push -u origin main
```

| Запрос | Что вводить |
|--------|-------------|
| Username | `htmllabru` (ваш логин GitHub) |
| Password | **токен**, не пароль от сайта |

**Токен:** https://github.com/settings/tokens → **Generate new token (classic)** → scope **repo** → Generate → скопировать `ghp_...` → вставить как Password.

После этого CI/CD работает так же, как при SSH.

---

## Частые ситуации

| Ситуация | Что делать |
|----------|------------|
| `Permission denied (publickey)` | Раздел выше: HTTPS или проверить ключ на GitHub |
| `origin does not appear` | `git remote add origin https://github.com/ЛОГИН/task-planner.git` |
| **На GitHub есть код, на сайте старое** | Push ≠ деплой. Откройте **Actions** — job **deploy** должен быть зелёным. Если красный или нет — не настроены Secrets (`SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`). См. [deploy/ACTIONS-SECRETS.md](deploy/ACTIONS-SECRETS.md). Вручную: `node deploy/reload-remote.mjs` |
| Изменил код, на сайте старое | Сделали `git push origin main`? Actions зелёный? |
| Actions зелёный, сайт старое | Ctrl+F5 в браузере; подождать 1–2 мин |
| `npm test` падает локально | Исправить код, снова `npm test`, потом commit + push |
| На сервере нет моего пользователя | Зарегистрироваться на http://81.163.31.249/register (БД на VDS своя) |
| Не пускает в кабинет после входа | Сайт по HTTP — cookie без `Secure` (уже исправлено в коде) |

---

## Минимальный чеклист «всё ок»

1. [ ] Локально `npm run dev` — работает  
2. [ ] `git add` → `git commit` → `git push origin main`  
3. [ ] GitHub Actions — зелёный  
4. [ ] http://81.163.31.249/ — видно ваши изменения  

Этого достаточно для обычной работы с CI/CD.
