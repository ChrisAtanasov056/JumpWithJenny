# Архитектура на проекта Jump With Jenny

## 1. Карта на директориите

### Главна директория (`/`)
- `GEMINI.md` — правила и стандарти за разработка по проекта.
- `docs/ai-context/` — системна документация (`architecture.md`, `database-and-api.md`, `auth-and-flows.md`).
- `ServerAPI/` — .NET solution (`ServerAPI.sln`) и ASP.NET Core Web API проект.
- `client-app/` — React + Vite SPA клиентско приложение.
- `.roorules`, `.rooignore` — локални правила и изключения за AI инструменти.
- `README.md`, `LICENSE` — общ README (шаблонен) и MIT лиценз.

---

### Backend (`ServerAPI/ServerAPI/`)
```text
ServerAPI/
├── ServerAPI.sln                         # Visual Studio / dotnet solution файл
└── ServerAPI/
    ├── Program.cs                        # Входна точка, DI контейнер, CORS, JWT, Identity, AutoMapper, CSP, seed
    ├── ServerAPI.csproj                  # Target net9.0 и NuGet зависимости
    ├── Properties/
    │   └── launchSettings.json           # Профили за локално стартиране (7024 HTTPS / 5024 HTTP)
    ├── Common/
    │   └── GlobalConstants.cs            # Роли ("Administrator", "User"), кеш ключове, seed акаунт константи
    ├── Controllers/                      # REST API контролери (10 броя)
    │   ├── AccountController.cs          # Регистрация, вход, потвърждение на имейл, пароли, refresh token
    │   ├── AdminController.cs            # Админ операции за потребители, участници и справки
    │   ├── AuthController.cs             # Вход с Google OAuth 2.0 и Facebook Login
    │   ├── ContactController.cs          # Изпращане на контактната форма по имейл
    │   ├── GalleryController.cs          # Публична галерия и админ качване/изтриване на снимки
    │   ├── ScheduleController.cs         # Публичен график, записване и отмяна на тренировки
    │   ├── ShoesController.cs            # CRUD за Kangoo Jumps обувки
    │   ├── UserController.cs             # Операции за потребители (all, get, change-password, delete)
    │   ├── WorkoutController.cs          # CRUD за тренировки
    │   └── WeatherForecastController.cs  # Остатъчен шаблонен контролер
    ├── Data/
    │   ├── JumpWithJennyDbContext.cs     # EF Core + IdentityDbContext, query filters, audit правила
    │   ├── DesignTimeDbContextFactory.cs # Design-time фабрика за `dotnet ef` команди
    │   ├── IdentityOptionsProvider.cs    # Настройки за пароли на ASP.NET Identity
    │   ├── DbQueryRunner.cs              # Изпълнение на сурови SQL заявки
    │   ├── EfExpressionHelper.cs         # Помощни изрази за търсене по ключ
    │   ├── Common/                       # Интерфейси IDbQueryRunner, IRepository<T>, IDeletableEntityRepository<T>
    │   ├── Repositories/                 # EfRepository<T> и EfDeletableEntityRepository<T> (soft delete)
    │   └── Seeding/                      # JumpWithJennyDbSeeder, RoleSeeder, ISeeder
    │       └── CustomSeeders/            # AccountSeeder, ImageSeeder, ShoesSeeder, WorkoutCardSeeder, WorkoutSeeder
    ├── Migrations/                       # 8 EF Core миграции (2025-03-19 до 2025-08-05) + ModelSnapshot
    ├── Models/                           # EF Core ентитети и входни/изходни модели
    │   ├── User.cs, UserRole.cs          # Identity потребител и роля
    │   ├── Workout.cs, Shoes.cs          # Тренировки и обувки
    │   ├── WorkoutShoes.cs               # Връзка тренировка ↔ чифт обувки (IsTaken)
    │   ├── Appointment.cs                # Резервация на потребител за тренировка
    │   ├── WorkoutCardType.cs            # Карти за тренировка
    │   ├── UserHistory.cs                # История на използвани обувки (ентитет в БД)
    │   ├── RefreshToken.cs               # Refresh токени за подновяване на JWT
    │   ├── ImageModel.cs                 # Снимки в галерията
    │   ├── EmailText.cs                  # Модел за локализирани имейл текстове
    │   ├── Common/                       # BaseModel, BaseDeletableModel, IAuditInfo, IDeletableEntity
    │   ├── Enums/                        # CardType, ShoesSize
    │   ├── Authentication/               # AuthResult, LoginModel, SignUpModel, Google/Facebook DTOs, UserDto и др.
    │   ├── Contacts/                     # ContactFormDto
    │   ├── DTOs/                         # ShoesDTO, ShoesDetailsDTO, UserDTO, WorkoutDTO, WorkoutShoesDTO
    │   ├── Schedule/                     # WorkoutViewModels, AdminWorkoutViewModel, AppointmentViewModel, ApplyForWorkoutRequest и др.
    │   └── Workout/                      # WorkoutCreateModel, WorkoutUpdateModel, GetParticipantsModel
    ├── ViewModels/                       # Допълнителни ViewModel-и (Users/*, Schedule/ShoeViewModel, FacebookUserInfo)
    ├── Services/
    │   ├── AuthService/                  # AuthService, GoogleAuthService, FacebookAuthService + интерфейси
    │   ├── Contacts/                     # ContactService, IContactService
    │   ├── Schedule/                     # ScheduleService, IScheduleService
    │   ├── Shoes/                        # ShoesService, IShoesService
    │   ├── Users/                        # UserService, IUserService
    │   ├── Workouts/                     # WorkoutServices, IWorkoutServices
    │   ├── Mapper/                       # AutoMapperConfig, IMapFrom<T>, IMapTo<T>, IHaveCustomMappings, QueryableMappingExtensions
    │   ├── JwtTokenService.cs            # Генериране на JWT токени
    │   ├── JwtSettings.cs                # POCO настройки за секция "Jwt"
    │   ├── EmailService.cs               # SMTP изпращане чрез MailKit (SSL 465 / STARTTLS 587)
    │   ├── EmailTemplateService.cs       # Зареждане на шаблони от Resources/emailTexts.{lang}.json
    │   ├── IEmailService.cs              # Интерфейс за имейл услуги
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
    │   └── axius.js                      # Основен Axios инстанс (Bearer interceptor + 401 refresh interceptor)
    ├── services/
    │   ├── api.jsx                       # Втори Axios инстанс (само Bearer interceptor, без 401 refresh)
    │   ├── AuthContext.jsx               # Глобален Auth контекст (JWT/Refresh в localStorage, login/logout/OAuth)
    │   ├── FacebookSDKContext.jsx        # Асинхронно зареждане и инициализация на Facebook JS SDK v23.0
    │   ├── UserContext.jsx               # Неизползван React контекст за user state
    │   ├── authService.jsx               # Заявки за signup, login, OAuth, verify-email, reset/forgot password
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
  - Публични маршрути: `/`, `/about`, `/gallery`, `/faq`, `/contacts`, `/schedule`, `/customers`, `/register`, `/verify-email`, `/reset-password`, `/data-deletion`, `/login` (връща `NotFoundPage`), `*` (`NotFoundPage`).
  - Потребителски маршрут: `/profile` (ако има `user` → `Profile`, иначе `Login`).
  - Админ маршрути под `/admin` (защитени от `ProtectedAdminRoute`, който допуска `user.role === 'Admin' || user.role === 'Administrator'`):
    - `/admin` → редирект към `/admin/users`
    - `/admin/users`, `/admin/users/new`, `/admin/users/:userId`
    - `/admin/workouts`, `/admin/workouts/new`, `/admin/workouts/:id`, `/admin/workouts/:id/view`
    - `/admin/photos`
    - `/admin/shoes`, `/admin/shoes/new`, `/admin/shoes/:id`, `/admin/shoes/details/:id`
- **State Management**:
  - `AuthContext` (`src/services/AuthContext.jsx`): управлява `isAuthenticated`, `isLoading`, `user`, `login`, `logout`, `googleLogin`, `facebookLogin`, `updateUser`. Запазва `jwtToken`, `refreshToken` и `user` в `localStorage`.
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
  - Дефиниран в `client-app/src/api/axius.js` и `client-app/src/services/api.jsx` като:
    ```js
    export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7024';
    ```
  - Използва се и за зареждане на изображенията от сървъра: `${API_BASE_URL}${img.Url}` (напр. `/Images/...` или `/uploads/...` от `wwwroot`).
- **Прокси**:
  - В `client-app/vite.config.js` **няма** конфигуриран dev proxy. При локална разработка браузърът на `http://localhost:3000` изпраща заявки директно към `https://localhost:7024` (или стойността в `VITE_API_URL`).
  - В продукция Nginx рутира заявките към `https://jumpwithjenny.com` (SPA) и `https://api.jumpwithjenny.com` (ASP.NET Core API).
- **CORS (`ServerAPI/ServerAPI/Program.cs`)**:
  - Политика `"AllowOrigin"` с `AllowAnyHeader()`, `AllowAnyMethod()`, `AllowCredentials()` и изрично разрешени origins:
    - `http://localhost:3000`
    - `https://localhost:3000`
    - `https://localhost:5001`
    - `https://jumpwithjenny.com`
- **Security Headers (`Program.cs`, `CspNonceMiddleware.cs`)**:
  - Добавя се хедър `Cross-Origin-Opener-Policy: same-origin-allow-popups` (необходим за Google/Facebook OAuth popup прозорците).
  - В non-Development среда `CspNonceMiddleware` добавя `Content-Security-Policy` (с `connect-src 'self' https://jumpwithjenny.com https://api.jumpwithjenny.com https://localhost:7024`), `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` и `Referrer-Policy`.
- **JSON формат**:
  - `AddNewtonsoftJson` с `DefaultContractResolver` (запазва PascalCase имената на C# свойствата) и `ReferenceLoopHandling.Ignore`.

---

## 4. Команди за локално стартиране и билдване

### Изисквани Environment променливи (само ключове)
- **Frontend (`client-app/.env`)**: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_APP_FACEBOOK_APP_ID`.
- **Backend (`ServerAPI/ServerAPI/appsettings.json` или User Secrets / Env)**: `ConnectionStrings:DevConnection`, `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`, `Jwt:TokenLifetime`, `Authentication:Google:ClientId`, `Authentication:Google:ClientSecret`, `Authentication:Google:RedirectUri`, `Authentication:Facebook:AppSecret`, `EmailSettings:SmtpHost`, `EmailSettings:Username`, `EmailSettings:Password`, `EmailSettings:FromEmail`, `EmailSettings:FromName`, `FrontendBaseUrl`, `WebsiteUrl`.

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
