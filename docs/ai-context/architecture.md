# Архитектура на проекта Jump With Jenny

## 1. Карта на директориите

### Главна директория (`/`)
- `GEMINI.md` — правила и стандарти за разработка по проекта.
- `docs/ai-context/` — системна документация (`architecture.md`, `database-and-api.md`, `auth-and-flows.md`).
- `ServerAPI/` — .NET solution (`ServerAPI.sln`) и ASP.NET Core Web API проект.
- `client-app/` — React + Vite SPA клиентско приложение.
- `.github/workflows/deploy.yml` — CI/CD пайплайн: `verify` за PR/push към `main` и `deploy` към VPS с EF Core migration bundle, атомарна замяна и автоматичен rollback.
- `deploy/nginx/jumpwithjenny.conf` — продукционна Nginx конфигурация за `jumpwithjenny.com` и `api.jumpwithjenny.com`.
- `.aiignore`, `.gitignore` — правила за игнориране на файлове за AI инструменти и Git.
- `README.md`, `LICENSE` — общ README (шаблонен) и MIT лиценз.

---

### Backend (`ServerAPI/ServerAPI/`)
```text
ServerAPI/
├── ServerAPI.sln                         # Visual Studio / dotnet solution файл
└── ServerAPI/
    ├── Program.cs                        # Входна точка, DI контейнер, CORS, ForwardedHeaders, RateLimiting (AuthPolicy/EmailPolicy), ProblemDetails + GlobalExceptionHandler, JWT, Identity, CSP, /health и seed
    ├── ServerAPI.csproj                  # Target net9.0 и изравнени .NET 9 (9.0.4) NuGet зависимости
    ├── Properties/
    │   └── launchSettings.json           # Профили за локално стартиране (7024 HTTPS / 5024 HTTP)
    ├── Common/
    │   ├── GlobalConstants.cs            # Роли ("Administrator", "User") и кеш ключове
    │   └── BulgariaTimeHelper.cs         # Помощник за часова зона Europe/Sofia (нормализиране на стенен час, конвертиране Sofia ↔ UTC, GetNextUpcomingSofiaDate)
    ├── Controllers/                      # REST API контролери (8 броя)
    │   ├── AccountController.cs          # Админ вход, изход (logout), пароли, refresh token; AuthPolicy и EmailPolicy rate limiting
    │   ├── AdminController.cs            # Админ операции ([Authorize(Roles = "Administrator")]) за потребители, участници и справки с пагинация
    │   ├── ContactController.cs          # Изпращане на контактната форма по имейл (EmailPolicy rate limiting)
    │   ├── GalleryController.cs          # Публична галерия и админ ([Authorize(Roles = "Administrator")]) преглед/качване (до 10 MB, magic-bytes валидация)/изтриване
    │   ├── ScheduleController.cs         # Публичен график (с пагинация), публично записване (BookingPolicy) и отмяна с токен (CancelBookingPolicy)
    │   ├── ShoesController.cs            # CRUD за Kangoo Jumps обувки ([Authorize(Roles = "Administrator")])
    │   ├── UserController.cs             # [Authorize] на класа: админ операции (all, get, PUT /{id}, DELETE /{id}) с роля "Administrator" и PUT /User/change-password за собствения акаунт
    │   └── WorkoutController.cs          # CRUD за тренировки ([Authorize(Roles = "Administrator")]) с пагинация
    ├── Data/
    │   ├── JumpWithJennyDbContext.cs     # EF Core + IdentityDbContext, query filters, audit правила, xmin optimistic concurrency за Workout и WorkoutShoes, частичен уникален индекс за обувки в Appointments, performance индекси
    │   ├── DesignTimeDbContextFactory.cs # Design-time фабрика за `dotnet ef` (зарежда appsettings.{ENV}.json + environment променливи; изисква DevConnection в Production)
    │   ├── IdentityOptionsProvider.cs    # Подсилена паролна политика (мин. 8 символа, цифра, малка/главна буква, уникален имейл) и lockout (5 опита → 15 мин)
    │   ├── DbQueryRunner.cs              # Изпълнение на сурови SQL заявки
    │   ├── EfExpressionHelper.cs         # Помощни изрази за търсене по ключ
    │   ├── Common/                       # Интерфейси IDbQueryRunner, IRepository<T>, IDeletableEntityRepository<T> (вкл. AllAsSplitQuery, AllAsNoTrackingSplitQuery, AddRangeAsync с CancellationToken)
    │   ├── Repositories/                 # EfRepository<T> и EfDeletableEntityRepository<T> (soft delete + split query методи)
    │   └── Seeding/                      # JumpWithJennyDbSeeder, RoleSeeder, ISeeder
    │       └── CustomSeeders/            # AccountSeeder (роли винаги; дефолтен админ само в Development от SeedAdmin:*), ImageSeeder, ShoesSeeder, WorkoutCardSeeder, WorkoutSeeder (с BulgariaTimeHelper)
    ├── Migrations/                       # 10 EF Core миграции (2025-03-19 до 2026-11-24) + ModelSnapshot
    ├── Models/                           # EF Core ентитети и входни/изходни модели
    │   ├── User.cs, UserRole.cs          # Identity потребител и роля
    │   ├── Workout.cs, Shoes.cs          # Тренировки и обувки
    │   ├── WorkoutShoes.cs               # Връзка тренировка ↔ чифт обувки (IsTaken)
    │   ├── Appointment.cs                # Резервация на потребител за тренировка
    │   ├── WorkoutCardType.cs            # Карти за тренировка
    │   ├── UserHistory.cs                # История на използвани обувки (ентитет в БД)
    │   ├── RefreshToken.cs               # Refresh токени за подновяване на JWT (SHA-256 хеш)
    │   ├── ImageModel.cs                 # Снимки в галерията
    │   ├── EmailText.cs                  # Модел за локализирани имейл текстове
    │   ├── Common/                       # BaseModel, BaseDeletableModel, IAuditInfo, IDeletableEntity, PagedResult<T>
    │   ├── Enums/                        # CardType, ShoesSize
    │   ├── Authentication/               # AuthResult, LoginModel, SignUpModel, Google/Facebook DTOs, UserDto и др.
    │   ├── Contacts/                     # ContactFormDto (с DataAnnotations валидации)
    │   ├── Schedule/                     # WorkoutViewModels, AdminWorkoutViewModel, AppointmentViewModel, ApplyForWorkoutRequest, ScheduleBookingException (BookingErrorCode) и др.
    │   └── Workout/                      # WorkoutCreateModel, WorkoutUpdateModel (с Date и Status), GetParticipantsModel
    ├── ViewModels/                       # Допълнителни ViewModel-и (Users/AllUsersViewModels с пагинация, Users/UserUpdateViewModel, Users/*, Schedule/ShoeViewModel, FacebookUserInfo)
    ├── Services/
    │   ├── AuthService/                  # AuthService, GoogleAuthService, FacebookAuthService, RefreshTokenHelper + интерфейси
    │   ├── Contacts/                     # ContactService, IContactService
    │   ├── Schedule/                     # ScheduleService, IScheduleService
    │   ├── Shoes/                        # ShoesService, IShoesService
    │   ├── Users/                        # UserService, IUserService
    │   ├── Workouts/                     # WorkoutServices, IWorkoutServices
    │   ├── JwtTokenService.cs            # Генериране на JWT токени
    │   ├── JwtSettings.cs                # POCO настройки за секция "Jwt"
    │   ├── EmailService.cs               # SMTP изпращане чрез MailKit (SSL 465 / STARTTLS 587)
    │   ├── EmailTemplateService.cs       # Зареждане на шаблони от Resources/emailTexts.{lang}.json
    │   ├── IEmailService.cs              # Интерфейс за имейл услуги
    │   ├── GlobalExceptionHandler.cs     # IExceptionHandler → RFC 9110 ProblemDetails с traceId, message и опционален code
    │   └── CspNonceMiddleware.cs         # Middleware за CSP nonce и security headers в non-Development среда
    ├── Resources/                        # EmailTemplate.html, emailTemplates.json, emailTexts.{bg,en}.json
    ├── SeedData/Images/                  # Изходни изображения за начален seed на галерията
    ├── wwwroot/                          # Статични файлове: Images/, SeedData/Images/, uploads/
    └── appsettings*.json                 # Конфигурация (тайните не се четат и не се документират като стойности)
```

---

### Frontend (`client-app/`)
```text
client-app/
├── index.html                            # HTML шаблон (Google Fonts, FontAwesome 5 CDN, gtag.js, Iubenda, /src/index.jsx)
├── package.json                          # Зависимости и Vite скриптове (dev, build, preview)
├── vite.config.js                        # Vite конфигурация (порт 3000, outDir: 'dist')
├── public/                               # Статични активи, лога, images/, css/style.scss, robots.txt, sitemap.xml
├── .env / .env.production                # Vite env променливи (стойностите не се четат)
└── src/
    ├── index.jsx                         # Bootstrap + Slick CSS, инжектиране на CSP nonce, React 18 createRoot
    ├── App.jsx                           # Провайдери, BrowserRouter маршрути, ProtectedAdminRoute, CanonicalLink
    ├── i18n.jsx                          # i18next конфигурация (lng: 'bg', fallbackLng: 'en')
    ├── locales/
    │   ├── bg/translation.json           # Български преводи (основен език)
    │   └── en/translation.json           # Английски преводи
    ├── api/
    │   └── axius.js                      # Основен Axios инстанс (API_BASE_URL, Bearer interceptor, FormData handling, single-flight 401 refresh с failedQueue и auth:logout събитие)
    ├── utils/
    │   └── workoutDate.js                # Парсване и форматиране на дати за тренировки в Europe/Sofia (parseWorkoutDate, formatWorkoutDateBg, formatWorkoutDateForInput)
    ├── services/
    │   ├── api.jsx                       # Тънък re-export на ../api/axius (единен Axios клиент)
    │   ├── AuthContext.jsx               # Глобален Auth контекст (single-flight refreshAccessToken, AUTH_LOGOUT_EVENT listener, сървърен logout)
    │   ├── FacebookSDKContext.jsx        # Асинхронно зареждане и инициализация на Facebook JS SDK v23.0
    │   ├── UserContext.jsx               # Неизползван React контекст за user state
    │   ├── authService.jsx               # Заявки за signup, login, logout, OAuth, verify-email, reset/forgot password
    │   ├── WorkoutSevices.jsx            # Заявки за админ управление на тренировки и участници
    │   ├── ShoeService.jsx               # CRUD заявки към /api/shoes
    │   ├── UserServices.jsx              # Заявки за управление на потребители
    │   ├── ContactService.jsx            # Изпращане на контактната форма
    │   ├── VerifyEmail.jsx               # Страница /verify-email за потвърждаване на имейл
    │   ├── useOutsideClick.js            # Hook за затваряне на модали при клик извън тях
    │   ├── AdminRoutes.js                # Неизползван алтернативен масив от админ маршрути
    │   └── firebase.js                   # Неизползван Firebase Auth шаблон
    └── components/
        ├── Home/                         # Главна лендинг страница (обединява публичните секции)
        ├── NavBar/                       # Навигация, езиково меню, вход/профил бутони, админ линк
        ├── Welcome/                      # Hero секция
        ├── AboutMe/                      # Информация за инструктора и Kangoo Jumps
        ├── Gallery/                      # Слайдер галерия (react-slick + framer-motion)
        ├── Schedule/                     # Седмичен график (desktop таблица / mobile карти)
        ├── WorkoutModal/                 # Модал за записване и отмяна на тренировка
        ├── HappyCustomers/               # Отзиви от клиенти
        ├── FAQ/                          # Често задавани въпроси
        ├── Contacts/                     # Контактна форма + Google Maps embed + SuccessModal
        ├── Footer/                       # Футър с линкове и социални мрежи
        ├── Modal/AuthModal.jsx           # Модал за вход/регистрация + Google/Facebook/Instagram бутони
        ├── Login/                        # Форма за вход с имейл и парола
        ├── Register/                     # Форма за регистрация + SuccessModal
        ├── Profile/                      # Профилен модал (данни, верификация, смяна на парола, изход)
        ├── ChangePassword/               # Модал за смяна на парола
        ├── ForgotPassword/               # ForgotPasswordModal + страница ResetPassword (/reset-password)
        ├── DataDeletionPage/             # Страница /data-deletion (изисквана за Facebook App Compliance)
        ├── lang/LanguageDropdown.tsx     # Превключвател BG / EN
        ├── 404/NotFoundPage.jsx          # Страница за несъществуващ маршрут
        └── Admin/
            ├── AdminLayout.jsx           # Странична навигация и Outlet за админ панела
            ├── AdminRoute.jsx            # Неизползван guard (в App.jsx се ползва ProtectedAdminRoute)
            ├── Users/                    # AdminUsersList, AdminNewUser, AdminUserProfile, AdminUserModal, Paginations
            ├── Workouts/                 # AdminWorkoutList, WorkoutForm, WorkoutView, AddUserSearchModal
            ├── Shoes/                    # AdminShoesList, AdminShoeForm, ShoeDetailsView
            └── PhotosManagement/         # PhotosManagement (преглед, качване и изтриване на снимки)
```

---

## 2. Рутинг, State Management и стилове в `client-app`

- **Рутинг (`App.jsx`)**:
  - Публични маршрути: `/`, `/about`, `/gallery`, `/faq`, `/contacts`, `/schedule`, `/customers`, `/cancel-booking/:token`, `/reset-password`, `/data-deletion`, `*` (`NotFoundPage`).
  - Скрит админ вход: `/admin/login` (`AdminLoginPage`).
  - Админ маршрути под `/admin` (защитени от `ProtectedAdminRoute`, който допуска `user.role === 'Admin' || user.role === 'Administrator'` и пренасочва към `/admin/login`):
    - `/admin` → редирект към `/admin/workouts`
    - `/admin/users`, `/admin/users/new`, `/admin/users/:userId`
    - `/admin/workouts`, `/admin/workouts/new`, `/admin/workouts/:id`, `/admin/workouts/:id/view`
    - `/admin/photos`
    - `/admin/shoes`, `/admin/shoes/new`, `/admin/shoes/:id`, `/admin/shoes/details/:id`
- **State Management**:
  - `AuthContext` (`src/services/AuthContext.jsx`): управлява `isAuthenticated`, `isLoading`, `user`, `login`, `logout`, `googleLogin`, `facebookLogin`, `updateUser`. Запазва `jwtToken`, `refreshToken` и `user` в `localStorage` и слуша `auth:logout` за синхронно изчистване на сесията при провален refresh.
  - `FacebookSDKContext` (`src/services/FacebookSDKContext.jsx`): управлява `isFbSdkReady`.
  - Всички останали данни (тренировки, обувки, потребители, снимки, форми) се управляват с локален React state (`useState`, `useEffect`, `useCallback`) в съответните компоненти. Няма Redux или Zustand.
- **Стилове**:
  - Всеки компонент има собствен `.scss` файл до `.jsx` файла си (напр. `Schedule.scss`, `WorkoutModal.scss`, `AdminLayout.scss`).
  - Глобално в `src/index.jsx` се зареждат `bootstrap/dist/css/bootstrap.min.css`, `slick-carousel/slick/slick.css` и `slick-theme.css`.
  - За анимации и икони се използват `framer-motion`, `aos`, `@fortawesome/react-fontawesome` и `react-icons`.
  - За адаптивен изглед в `Schedule.jsx` се ползва `react-responsive` (`maxWidth: 768`), а в `AdminWorkoutList.jsx` — `window.innerWidth <= 768`.

---

## 3. Комуникация между фронтенд и бекенд

- **Базов URL**:
  - Дефиниран в `client-app/src/api/axius.js` (и re-export-ван от `client-app/src/services/api.jsx` като единен Axios клиент):
    ```js
    const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim();

    export const API_BASE_URL = (
      rawApiBaseUrl ||
      (import.meta.env.PROD ? 'https://api.jumpwithjenny.com' : 'https://localhost:7024')
    ).replace(/\/+$/, '');
    ```
  - Използва се и за зареждане на изображенията от сървъра: `${API_BASE_URL}${img.Url}` (напр. `/Images/...` или `/uploads/...` от `wwwroot`).
- **Прокси**:
  - В `client-app/vite.config.js` **няма** конфигуриран dev proxy. При локална разработка браузърът на `http://localhost:3000` изпраща заявки директно към `https://localhost:7024` (или стойността в `VITE_API_URL`).
  - В продукция Nginx (`deploy/nginx/jumpwithjenny.conf`) рутира заявките към `https://jumpwithjenny.com` (SPA + `/api/` proxy към `127.0.0.1:7024`) и `https://api.jumpwithjenny.com` (ASP.NET Core API на `127.0.0.1:7024`).
- **CORS (`ServerAPI/ServerAPI/Program.cs`)**:
  - Политика `"AllowOrigin"` с `AllowAnyHeader()`, `AllowAnyMethod()`, `AllowCredentials()`:
    - Базови продукционни origins винаги: `https://jumpwithjenny.com` и `https://www.jumpwithjenny.com`.
    - Допълнителни конфигурируеми origins от секция `AllowedOrigins`.
    - Локални origins (`http://localhost:3000`, `https://localhost:3000`, `https://localhost:5001`, `http://localhost:5173`) се добавят **само в `Development`** среда.
- **Security Headers, Rate Limiting и Middleware (`Program.cs`, `CspNonceMiddleware.cs`, `GlobalExceptionHandler.cs`, `deploy/nginx/jumpwithjenny.conf`)**:
  - `UseForwardedHeaders()` (`XForwardedFor | XForwardedProto`) за коректна работа зад Nginx reverse proxy.
  - `UseExceptionHandler()` (`GlobalExceptionHandler` → RFC 9110 `ProblemDetails` с `traceId`, `message` и опционален `code`) и `UseStatusCodePages()`.
  - `UseRateLimiter()`: `AuthPolicy` (15 заявки / 1 минута по IP), `EmailPolicy` (5 заявки / 5 минути по IP), отговор `429 Too Many Requests` като `ProblemDetails`.
  - `Cross-Origin-Opener-Policy: same-origin-allow-popups` (необходим за Google/Facebook OAuth popup прозорците).
  - В non-Development среда: `UseHsts()` и `CspNonceMiddleware` (преди `UseStaticFiles()`), който добавя `Content-Security-Policy` (с `connect-src 'self' https://jumpwithjenny.com https://www.jumpwithjenny.com https://api.jumpwithjenny.com`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy` и `Referrer-Policy`.
  - Продукционният Nginx (`deploy/nginx/jumpwithjenny.conf`) обслужва HTTPS/apex редиректи (`www` → apex, HTTP → HTTPS), SPA CSP & security headers, 1-годишен кеш за хешираните `/assets/`, `expires -1` за `index.html`, кеширане на статични медии/SEO файлове и reverse proxy към `127.0.0.1:7024`.
- **JSON формат**:
  - `AddNewtonsoftJson` с `DefaultContractResolver` (запазва PascalCase имената на C# свойствата) и `ReferenceLoopHandling.Ignore`.

---

## 4. Команди за локално стартиране, билдване и CI/CD

### Изисквани Environment променливи (само ключове)
- **Frontend (`client-app/.env`)**: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_APP_FACEBOOK_APP_ID`.
- **Backend (`ServerAPI/ServerAPI/appsettings.json` или User Secrets / Env)**: `ConnectionStrings:DevConnection`, `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`, `Jwt:TokenLifetime`, `Authentication:Google:ClientId`, `Authentication:Google:ClientSecret`, `Authentication:Google:RedirectUri`, `Authentication:Facebook:AppSecret`, `EmailSettings:SmtpHost`, `EmailSettings:Username`, `EmailSettings:Password`, `EmailSettings:FromEmail`, `EmailSettings:FromName`, `FrontendBaseUrl`, `WebsiteUrl`.
- **Опционални Backend ключове**: `AllowedOrigins` (масив от origins за CORS), `ContactSettings:RecipientEmail`, и (само за `Development`) `SeedAdmin:Email`, `SeedAdmin:Password`, `SeedAdmin:FirstName`, `SeedAdmin:LastName`.

### Backend (`ServerAPI/ServerAPI`)
```bash
cd ServerAPI/ServerAPI

# Възстановяване на зависимости и билд
dotnet restore
dotnet build

# Стартиране в Development режим (https://localhost:7024, http://localhost:5024, Swagger на /swagger)
# При стартиране в Development автоматично изпълнява dbContext.Database.Migrate() и JumpWithJennyDbSeeder
dotnet run

# Генериране и прилагане на нова EF Core миграция (при промяна на моделите)
dotnet ef migrations add <MigrationName>
dotnet ef database update

# Production билд / publish
dotnet build -c Release
dotnet publish -c Release -o ./publish
```

### Frontend (`client-app`)
```bash
cd client-app

# Инсталиране на пакети
npm install

# Локален dev сървър (http://localhost:3000)
npm run dev

# Production билд (генерира статичните файлове в client-app/dist/)
npm run build

# Локален преглед на production билда
npm run preview
```

### CI/CD деплой (`.github/workflows/deploy.yml`)
- **Job `verify`** (изпълнява се при `push`/`pull_request` към `main` и `workflow_dispatch`):
  - **Frontend** (Node 20): `npm ci`, опционален `lint`/`test`, `npm run build` с `VITE_API_URL=https://api.jumpwithjenny.com`, проверка на задължителните артефакти (`dist/index.html`, `manifest.json`, `robots.txt`, `favicon_v2.ico`, `brand_logo.png`) и проверка, че в `dist/assets/` липсва fallback към `localhost:7024`.
  - **Backend** (.NET 9.0.x): `dotnet restore`, `dotnet build -c Release`, `dotnet test -c Release`.
- **Job `deploy`** (при `push` към `main` или `workflow_dispatch`, след `verify`):
  - Генерира `client-app/.env.production` от GitHub Secret `VITE_ENV_PRODUCTION` (валидира `VITE_API_URL=https://...`) и билдва `client-app/dist`.
  - Публикува `ServerAPI` в `./publish/api` и генерира самостоятелен `linux-x64` EF Core migration bundle (`./publish/efbundle` с `dotnet-ef` 9.0.4).
  - Свързва се по SSH с pinned `known_hosts`, качва артефактите чрез `rsync` в `.new` директории (`dist.new`, `publish.new`, `efbundle.new`).
  - На VPS запазва продукционните `appsettings*.json` и `wwwroot/` от текущия `publish`, изпълнява `efbundle` (`ASPNETCORE_ENVIRONMENT=Production`), спира `jumpwithjenny.service`, прави атомарна замяна на `publish`/`dist` с `.prev` резервни копия и стартира услугата.
  - Проверява локалния `http://127.0.0.1:7024/health` (с автоматичен rollback към `.prev` при неуспех), след което валидира публичните HTTPS ендпойнти (`https://api.jumpwithjenny.com/health`, `https://jumpwithjenny.com/`, `/manifest.json`, `/robots.txt`).
