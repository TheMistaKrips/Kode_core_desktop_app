# Koda Core — AI-ассистент с локальной нейросетью и агентной системой

![Electron](https://img.shields.io/badge/Electron-39.8.10-47848F?style=for-the-badge&logo=electron)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs)
![License](https://img.shields.io/badge/License-Apache%25202.0-blue.svg?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%2520%257C%2520macOS%2520%257C%2520Linux-lightgrey?style=for-the-badge)

## 🚀 Что это?
Koda Core — это десктопное приложение на Electron, которое объединяет в себе:
* **🧠 Локальный AI-ассистент (Qwen 2.5 3B/7B)** — работает полностью офлайн, без API ключей и интернета.
* **🤖 Агентная система** — несколько AI-агентов, которые выполняют задачи параллельно.
* **📁 Работа с файлами** — читает PDF, DOCX, XLSX, изображения (OCR), создаёт документы, таблицы, код и архивы.
* **🌐 Веб-поиск** — через DuckDuckGo (без API ключа).
* **💾 Полная конфиденциальность** — все данные хранятся локально.

## ✨ Основные возможности

### 🧠 Локальный AI
* Загружайте модели Qwen 2.5 3B (легкая, быстрая) или 7B (мощная)
* Полностью офлайн, никаких запросов на серверы
* Поддержка GPU (CUDA, Metal) и CPU

### 🤖 Агентная система
* **Исследователь (Researcher)** — поиск в интернете, анализ информации
* **Кодер (Coder)** — написание кода на любых языках, создание лендингов
* **Аналитик (Analyst)** — создание таблиц, анализ данных, экспорт в Excel
* **Писатель (Writer)** — написание статей, отчетов, новостей
* **Мастер-агент (Orchestrator)** — координация других агентов, распределение задач

### 📁 Файлы
* **Чтение:** PDF, DOCX, XLSX, CSV, TXT, изображения (OCR)
* **Создание:** DOCX, XLSX, PDF, ZIP, код (любые языки)
* **Drag & Drop** — просто перетащите файл в окно приложения

### 💬 Чат
* Стриминг ответов (печатает по словам)
* Сохранение истории (чаты не теряются после перезапуска)
* Поиск по чатам
* Голосовой ввод (Speech-to-Text)

### 🎨 Интерфейс
* Сворачиваемая панель чатов
* Адаптивный дизайн
* Skeleton Loader при загрузке модели
* Индикатор печати
* Горячие клавиши (Ctrl+K — поиск, Esc — отмена)

## 🖼️ Скриншоты

![Main](https://screenshots/main.png)
![Chat](https://screenshots/chat.png)
![Agents](https://screenshots/agents.png)
![Settings](https://screenshots/settings.png)

## ⚡ Технологии
* **Фреймворк:** Electron 39.8, React 19.2
* **Язык:** JavaScript (ES2022)
* **Стили:** Tailwind CSS 4, CSS Modules
* **AI движок:** node-llama-cpp 3.19
* **Модель:** Qwen 2.5 (3B / 7B) в формате GGUF
* **Файлы:** pdf-parse, mammoth, xlsx, docx, pdf-lib, adm-zip
* **OCR:** Tesseract.js
* **Система:** systeminformation

## 📦 Установка

### Требования
* Node.js 20+
* npm 10+
* Windows 10/11, macOS 12+, или Linux
* Минимум 8 ГБ ОЗУ (рекомендуется 16 ГБ)
* Свободное место: ~3 ГБ (модель 3B) или ~6 ГБ (модель 7B)

### Для разработки
```bash
# 1. Клонировать репозиторий
git clone https://github.com/TheMistaKrips/koda-core.git
cd koda-core

# 2. Скачать модель и положить в папку models/
# https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF
# Файл: qwen2.5-3b-instruct-q4_k_m.gguf

# 3. Установить зависимости
npm install

# 4. Запустить в режиме разработки
npm run dev
```

### Сборка приложения
```bash
# Windows (EXE установщик)
npm run build:win

# macOS (DMG образ)
npm run build:mac

# Linux (AppImage)
npm run build:linux
```

## 🧪 Тестирование агентов
Вот несколько фраз для проверки работы агентов:

| Агент | Пример запроса |
|---|---|
| Researcher | "Найди 3 интересных факта о космосе" |
| Coder | "Напиши код на Python для расчёта факториала" |
| Analyst | "Сделай таблицу с 5 языками программирования и их особенностями" |
| Writer | "Напиши статью на тему 'Будущее искусственного интеллекта'" |
| Orchestrator | "Проанализируй мои расходы: еда 15000, транспорт 5000, развлечения 3000" |

## 📁 Структура проекта
```text
koda-core/
├── src/
│   ├── main/
│   │   ├── ai/                     # AI модули
│   │   │   ├── models.js           # Управление моделями
│   │   │   ├── generator.js        # Генерация ответов
│   │   │   ├── prompts.js          # Системные промпты
│   │   │   ├── router.js           # Роутер (3B/7B)
│   │   │   ├── agents/             # Агентная система
│   │   │   │   ├── index.js
│   │   │   │   ├── orchestrator.js
│   │   │   │   ├── researcher.js
│   │   │   │   ├── coder.js
│   │   │   │   ├── analyst.js
│   │   │   │   └── writer.js
│   │   │   ├── knowledge-base.js
│   │   │   ├── file-processor.js
│   │   │   ├── code-generator.js
│   │   │   ├── web-search.js
│   │   │   ├── ocr.js
│   │   │   ├── export-excel.js
│   │   │   └── utils.js
│   │   └── index.js
│   ├── preload/
│   │   └── index.js
│   └── renderer/
│       ├── components/
│       │   ├── ChatPanel.jsx
│       │   ├── AgentsPanel.jsx
│       │   ├── SystemMonitor.jsx
│       │   └── TitleBar.jsx
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── models/
│   └── qwen2.5-3b-instruct-q4_k_m.gguf
├── resources/
│   ├── koda.ico
│   └── koda.icns
├── package.json
└── README.md
```

## 🤝 Лицензия
Этот проект распространяется под лицензией **Apache License 2.0**. Это значит, что вы можете:
* ✅ Использовать в коммерческих целях
* ✅ Изменять и адаптировать
* ✅ Распространять

*С условием указания авторства.*

## 🧑‍💻 Авторы
**Фетисов Герман** — создатель и разработчик

## 📧 Контакты
* **GitHub:** [@TheMistaKrips](https://github.com/TheMistaKrips)
* **Email:** [fetisovdev0@gmail.com](mailto:fetisovdev0@gmail.com)
* **Telegram:** @your-telegram *(нужно вписать вручную)*

## ⭐ Понравился проект?
Поставь ⭐ на GitHub, чтобы поддержать разработку!