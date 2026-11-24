# Jump With Jenny — Project Guidelines (`GEMINI.md`)

## Обзор на технологичния стек

- **Backend (`ServerAPI/ServerAPI/`, solution `ServerAPI/ServerAPI.sln`)**: ASP.NET Core Web API (C#, `net9.0`), Entity Framework Core (`Npgsql.EntityFrameworkCore.PostgreSQL`), ASP.NET Core Identity (`User` / `UserRole`), JWT Bearer + Refresh Tokens, AutoMapper, `Newtonsoft.Json` (`DefaultContractResolver` — PascalCase сериализация), MailKit (SMTP имейли), Swagger/OpenAPI.
- **База данни**: PostgreSQL (включен `Npgsql.EnableLegacyTimestampBehavior` за съвместимост на `timestamp without time zone`).
- **Frontend (`client-app/`)**: React 18 + Vite 6 SPA, React Router v6, Axios, SCSS + Bootstrap 5.3, React Bootstrap, Framer Motion, AOS, React Slick, `i18next` / `react-i18next` (`bg` по подразбиране, `en` fallback), `@react-oauth/google`, Facebook JS SDK (`v23.0`).
- **Автентикация**:
  - Локален вход/регистрация с имейл и парола (ASP.NET Identity + JWT + Refresh Token в БД).
  - **Google OAuth 2.0**: Authorization Code Flow (`@react-oauth/google` → сървърен обмен и валидация през `Google.Apis.Auth`).
  - **Facebook Login**: Клиентски `accessToken` от Facebook JS SDK, валидиран сървърно през Facebook Graph API `v18.0` с HMAC-SHA256 `appsecret_proof`.
- **Хостинг**: Linux VPS с Nginx reverse proxy (`https://jumpwithjenny.com` и `https://api.jumpwithjenny.com`).

---

## Задължителни правила за проекта

1. **EF Core миграции — без редакция на историята**
   - **НИКОГА** не променяй, преименувай или изтривай съществуващи миграции в `ServerAPI/ServerAPI/Migrations/`.
   - При всяка промяна в моделите или в `JumpWithJennyDbContext` задължително генерирай **нова миграция** от директорията `ServerAPI/ServerAPI`:
     ```bash
     dotnet ef migrations add <MigrationName>
     ```

2. **Бизнес валидациите принадлежат на `ServerAPI`**
   - Всички валидации за капацитет на тренировки (`AvailableSpots`), наличност на Kangoo Jumps обувки (`WorkoutShoes`), графици/дати, дублирани записвания, потвърден имейл и оторизация на резервации се имплементират и налагат задължително в `ServerAPI` (в сървисите и контролерите), а не само в `client-app`.
   - Клиентските проверки в `client-app` са само за UX обратна връзка.

3. **Езикови правила (код vs. потребителски интерфейс)**
   - Целият код, идентификатори, DTO/ViewModel класове, имена на методи/маршрути, логове и коментари в кода се пишат на **английски език**.
   - Всички потребителски текстове в UI на `client-app` (етикети, бутони, известия, съобщения за грешка и потвърждения) са на **български език** — поддържай преводите в `client-app/src/locales/bg/translation.json` (и синхронно в `en/translation.json`, ако се поддържа двуезичие), без да въвеждаш нови хардкоднати английски текстове в потребителския UI.

4. **Конфигурация, тайни ключове и безопасност**
   - **НИКОГА** не чети, не логвай, не хардкодвай и не комитвай реални тайни ключове, пароли или connection strings от `appsettings.json`, `appsettings.Development.json`, `.env` или `.env.production`.

5. **JSON сериализация и API договори**
   - Бекендът използва `Newtonsoft.Json` с `DefaultContractResolver` (PascalCase ключове като `Id`, `Day`, `Time`, `WorkoutShoes`), но отделни контролери връщат анонимни обекти или `UserDto` с camelCase/lowercase ключове (`token`, `refreshToken`, `accessToken`, `user.id`, `user.role`). При промяна на ендпойнти или фронтенд заявки винаги проверявай точния регистър на JSON свойствата от двете страни.

---

## Допълнителна документация

- [Архитектура, директории, комуникация и команди](docs/ai-context/architecture.md)
- [Схема на базата данни (PostgreSQL) и API ендпойнти](docs/ai-context/database-and-api.md)
- [Автентикация, бизнес потоци и технически дълг](docs/ai-context/auth-and-flows.md)
