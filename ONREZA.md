# Деплой на ONREZA (dorozhnij.ru)

Репозиторий: **https://github.com/dorozhnij/landrice_2026**

## Параметры сборки в [app.onreza.ru/dorozhnij](https://app.onreza.ru/dorozhnij)

| Поле | Значение |
|------|----------|
| Repository | `dorozhnij/landrice_2026` |
| Branch | `main` |
| Framework Preset | **Static HTML** (`static-html`) |
| Root Directory | `.` |
| Install Command | *(пусто)* |
| Build Command | `bash scripts/build.sh` |
| Output Directory | `dist` |

Публикуется **содержимое** каталога `dist/` (внутри: `landrice_2026/` и корневой `index.html` с редиректом).

## После подключения

1. Запустите **Deploy / Rebuild** в панели ONREZA.
2. Дождитесь успешной сборки.
3. Проверьте: https://dorozhnij.ru/landrice_2026/

## Локальная проверка бандла (до ONREZA)

```bash
bash scripts/build.sh
npx --yes serve dist -l 3000
```

Откройте: http://localhost:3000/landrice_2026/

## Обновления

Каждый `git push` в `main` → **Rebuild** в ONREZA (или auto-deploy, если включён).

Для обновления данных: изменить CSV → `python3 build_data.py` → commit `data.json` → push.
