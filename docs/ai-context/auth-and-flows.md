# Автентикация, бизнес потоци и технически дълг

## 1. Потоци за вход, сесия и права на достъп

### А. Локална регистрация и вход (Email / Password)
1. **Регистрация**: `Register.jsx` изпраща `POST /Account/signup` с `SignUpModel` (`UserName`, `FirstName`, `LastName`, `Email`, `Password`, `Language`).
2. `AuthService.SignUpAsync` създава `User`, добавя го в роля `"User"`, генерира email confirmation token и изпраща локализиран (`bg`/`en`) имейл през MailKit (`Resources/EmailTemplate.html` + `emailTexts.{lang}.json`) с линк `${FrontendBaseUrl}/verify-email?userId=...&token=...`. Връща JWT + Refresh Token + `UserDto`.
3. **Потвърждение на имейл**: Отварянето на `/verify-email` в `VerifyEmail.jsx` извиква `POST /Account/confirmemail`, сървърът потвърждава имейла в Identity и фронтендът обновява `emailConfirmed: true` в `AuthContext`.
4. **Вход**: `Login.jsx` изпраща `POST /Account/login` (`Email`, `Password`) → `AuthService.LoginAsync` проверява паролата чрез `SignInManager.PasswordSignInAsync`, генерира JWT и 64-байтов криптографски `RefreshToken` (валиден 7 дни, записва се в `RefreshTokens`), ревокира стария refresh token и връща `{ token, user, refreshToken }`.
5. **Забравена парола**: `ForgotPasswordModal.jsx` → `POST /Account/forgot-password` → имейл с линк `/reset-password?token=...&email=...` → `ResetPassword.jsx` → `POST /Account/reset-password-token`.

### Б. Google OAuth 2.0 (Authorization Code Flow)
1. В `App.jsx` приложението е обвито в `<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>`.
2. В `AuthModal.jsx` бутонът за Google извиква `useGoogleLogin({ flow: 'auth-code' })`.
3. Google popup прозорецът връща временен authorization code (`credentialResponse.code`).
4. `authService.googleLogin(code)` изпраща `POST /api/Auth/google-login` с `{ code }`.
5. В бекенда `GoogleAuthService.ExchangeCodeForTokensAsync(code)` изпраща server-to-server `POST https://oauth2.googleapis.com/token` с `client_id`, `client_secret`, `redirect_uri` (от `Authentication:Google:*`) и `grant_type=authorization_code`, за да получи `id_token`.
6. `GoogleAuthService.ExternalLoginAsync(idToken)` валидира `id_token` чрез `GoogleJsonWebSignature.ValidateAsync` спрямо конфигурирания `ClientId` (`Audience`).
7. Извлича `payload.Email`; ако потребителят не съществува в `AspNetUsers`, създава нов `User` с `EmailConfirmed = true`, `IsExternalLogin = true` и роля `"User"`.
8. Генерира вътрешен JWT + `RefreshToken` и връща `AuthResult` към клиента.

### В. Facebook Login
1. `FacebookSDKContext.jsx` зарежда динамично `https://connect.facebook.net/en_US/sdk.js` и инициализира `window.FB.init({ appId: VITE_APP_FACEBOOK_APP_ID, cookie: true, xfbml: true, version: "v23.0" })`.
2. В `AuthModal.jsx` бутонът за Facebook извиква `window.FB.login(..., { scope: 'public_profile,email' })` и получава `response.authResponse.accessToken`.
3. `authService.facebookLogin(accessToken)` изпраща `POST /api/Auth/facebook-login` с `{ accessToken }`.
4. В бекенда `FacebookAuthService.ExternalLoginAsync(accessToken)` взима `Authentication:Facebook:AppSecret`, изчислява HMAC-SHA256 `appsecret_proof` върху `accessToken` и заявява `GET https://graph.facebook.com/v18.0/me?fields=id,name,email,first_name,last_name&access_token=...&appsecret_proof=...`.
5. При валиден профил с имейл намира или създава `User` (`EmailConfirmed = true`, `IsExternalLogin = true`, роля `"User"`), генерира вътрешен JWT + `RefreshToken` и връща `AuthResult`.

### Г. Съхранение, валидация и обновяване (Refresh) на токените
- **Клиент (`AuthContext.jsx` + `src/api/axius.js`)**:
  - Данните за сесията се пазят в `localStorage` под ключове `jwtToken`, `refreshToken` и `user` (JSON).
  - При първоначално зареждане `AuthContext.initializeAuth()` декодира `jwtToken` с `jwt-decode` и проверява `decoded.exp * 1000 > Date.now()`. При изтекъл access token и наличен `refreshToken` вика `POST /Account/refresh-token`.
  - Axios инстансът в `src/api/axius.js` прикачва `Authorization: Bearer <jwtToken>` към всяка заявка. При отговор `401 Unauthorized` (и `!originalRequest._retry`) прави един опит за подновяване през `POST /Account/refresh-token`, обновява `localStorage` и повтаря оригиналната заявка; при неуспех изчиства `localStorage`. *(Внимание: вторият инстанс `src/services/api.jsx` няма 401 response interceptor.)*
- **Сървър (`Program.cs`, `JwtTokenService.cs`, `AuthService.cs`)**:
  - `JwtTokenService.GenerateJwtToken` подписва HS256 JWT със секрета от `Jwt:Secret` и добавя claims: `ClaimTypes.NameIdentifier` (`user.Id`), `ClaimTypes.Email`, `ClaimTypes.Name` (`user.UserName`), `Jti` и `ClaimTypes.Role` за всяка роля.
  - `JwtBearer` middleware валидира `Issuer`, `Audience`, `Lifetime` и `IssuerSigningKey` при всяка защитена заявка.
  - `AuthService.RefreshTokenAsync` използва EF Core транзакция и флаг `RefreshToken.Locked` за защита от паралелни заявки; ротира `RefreshToken` (ревокира стария и създава нов), ако до изтичането му остава по-малко от 1 ден.

### Д. Разграничаване на роли (`Administrator` vs. `User`)
- **Роли в системата**: `"Administrator"` и `"User"` (`GlobalConstants`).
- **На сървъра**: `AdminController` има `[Authorize(Roles = "Administrator")]` на ниво клас, но 5 от методите му го отменят с `[AllowAnonymous]`, а `WorkoutController`, `ShoesController` и `UserController` изобщо нямат активен `[Authorize]` атрибут.
- **На клиента**:
  - `NavBar.jsx` показва линк „Админ панел“ (`/admin`) само когато `user?.role === 'Administrator'`.
  - `App.jsx` защитава всички `/admin/*` маршрути чрез `ProtectedAdminRoute` (проверява `user.role === 'Admin' || user.role === 'Administrator'`), иначе пренасочва към `/`.

---

## 2. Основни бизнес потоци (Kangoo Jumps тренировки)

### А. Създаване и администриране на график
1. Админът отваря `/admin/workouts` (`AdminWorkoutList.jsx` → `GET /api/workouts/all`), където може да превключва между предстоящи и минали тренировки, да търси и да изтрива.
2. Създаване на тренировка (`/admin/workouts/new` → `WorkoutForm.jsx` → `POST /api/Workout`):
   - `WorkoutServices.CreateWorkoutAsync` създава запис в `Workouts` със `Status = "Available"`, `Day`, `Time`, `Date`, `AvailableSpots`.
   - Автоматично прочита всички налични чифтове от таблица `Shoes` и създава за всеки чифт запис в `WorkoutShoes` (`IsTaken = false`).
3. Преглед и ръчно управление на участници (`/admin/workouts/:id/view` и редактиране в `WorkoutForm.jsx`):
   - Зарежда детайли с участници и обувки чрез `GET /api/Admin/workouts/{id}`.
   - Админът може да търси потребител (`GET /api/users/search`) и да го добави (`POST /api/Admin/add/participant`) или премахне (`DELETE /api/Admin/remove/participant`).
4. Изтриване (`DELETE /api/Workout/delete-workout/{id}`): прави soft delete (`IsDeleted = true`) на свързаните `Appointments`, `WorkoutShoes` и самата `Workout`.

### Б. Записване за тренировка от потребител
1. `Schedule.jsx` зарежда `GET /api/Schedule` (`ScheduleService.GetAllWorkoutsAsync`, което връща `Date >= DateTime.UtcNow.Date`) и клиентски филтрира `new Date(w.Date) > now`, групирайки слотовете по `Day` и `Time`.
2. При клик на слот със статус `"Available"` се отваря `WorkoutModal.jsx`:
   - Преброява свободните обувки по размери (`S`/`M`/`L`/`XL`) от `selectedWorkout.WorkoutShoes` (`!ws.IsTaken`).
   - Ако потребителят е логнат, проверява дали вече е записан чрез `GET /api/Schedule/is-registered/{workoutId}`.
   - Проверява клиентски дали `user.emailConfirmed === true`, дали е избрана карта (`CoolFit`, `PulseCard`, `IndividualWorkout`) и дали потребителят е със собствени обувки или е избрал размер.
3. При изпращане: `Schedule.jsx` вика `POST /api/Schedule/apply` (`ScheduleController.ApplyForWorkout` чете `userId` от JWT `ClaimTypes.NameIdentifier`).
4. `ScheduleService.ApplyForWorkoutAsync`:
   - Зарежда тренировката с `WorkoutShoes` и `Appointments`.
   - Проверява дали тренировката съществува и дали `workout.Appointments.Count < 20`.
   - Ако `!usesOwnShoes`: намира първата свободна `WorkoutShoes` с искания `ShoesSize` (`!ws.IsTaken`) и я маркира `IsTaken = true`.
   - Създава `Appointment` (`IsConfirmed = true`, `ShoeId` или `null` при собствени обувки) и намалява `workout.AvailableSpots -= 1`.

### В. Отмяна на записване
1. Ако `WorkoutModal.jsx` установи `isAlreadyRegistered === true`, показва бутон за отмяна → `DELETE /api/Schedule/cancel-registration/{workoutId}`.
2. `ScheduleService.CancelRegistrationAsync`:
   - Намира `Appointment` по `(WorkoutId, UserId)`.
   - Увеличава `workout.AvailableSpots += 1`.
   - Ако `appointment.ShoeId != null`, намира съответната `WorkoutShoes` и връща `IsTaken = false`.
   - Извършва **`HardDelete`** на `Appointment` (не soft delete), за да може потребителят да се запише отново при композитния PK `(UserId, WorkoutId)`.

---

## 3. Технически дълг, открити бъгове и остарели зависимости

### Критични проблеми по сигурността
- **Липсваща или отменена оторизация на бекенда**:
  - `WorkoutController` има коментиран `[Authorize(Roles = "Administrator")]` и `[AllowAnonymous]` на отделни методи.
  - `AdminController` има `[AllowAnonymous]` върху `GetWorkout`, `AddParticipantToWorkout`, `RemoveParticipantFromWorkout`, `SearchUsers` (`/api/users/search`) и `GetAllWorkouts` (`/api/workouts/all`), а `All` и `DeleteUser` не задават `AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme`.
  - `ShoesController`, `UserController` и `AccountController.ResetPassword` нямат `[Authorize]`.
  - `GalleryController` изисква JWT за `all`/`upload`/`delete`, но не проверява за роля `"Administrator"`.
- **Логване на тайни и чувствителни данни**: `JwtTokenService.cs` (ред 38) логва `_jwtSettings.Secret` вместо `user.Id` (`_logger.LogInformation("Generating JWT token for user: {UserId}", _jwtSettings.Secret)`). `AuthService` логва refresh токени и password reset токени в явен вид.
- **Хардкоднат seed администратор**: `GlobalConstants.AccountsSeeding` съдържа хардкоднати `admin@admin.com` / `123456`.
- **Identity vs. JWT default scheme и кодиране на ключа**: `AddIdentity` е регистриран след `AddJwtBearer` (което презаписва default схемата при `[Authorize]` без изричен `AuthenticationSchemes`), а валидацията в `Program.cs` използва `Encoding.ASCII`, докато `JwtTokenService` подписва с `Encoding.UTF8`.

### Бъгове в бизнес логиката и API договорите
- **`WorkoutServices.UpdateWorkoutAsync`**: обновява свойствата на `workout`, но **не извиква `SaveChangesAsync()`** — промените при редакция на тренировка не се записват в БД.
- **Капацитет и конкурентност в `ScheduleService.ApplyForWorkoutAsync`**:
  - Проверява хардкоднато `workout.Appointments.Count >= 20` вместо `workout.AvailableSpots <= 0` (пренебрегвайки конфигурируемия `AvailableSpots`).
  - Не проверява `workout.Status == "Available"`, минала дата, нито `user.EmailConfirmed` на сървъра; не задава `workout.Status = "Booked"` при изчерпване на местата; няма транзакция или concurrency защита при едновременни записвания.
  - При грешка прихваща всяко изключение и връща `null`, маскирайки причината (напр. повторно записване).
- **Несъответствия между `client-app` и `ServerAPI` при записване**:
  - `WorkoutModal.jsx` мапва картите към `0, 1, 2` вместо към C# enum стойностите `CardType` (`1, 2, 3`), и изпраща `shoeSize` като низ (`'S'`, `'M'`, `'L'`, `'XL'`) или `0`, което води до проблеми при десериализация/търсене.
  - `Schedule.jsx` при `200 OK` от `POST /api/Schedule/apply` подменя обекта в списъка с `response.data` (който е `{ message, workout }`), вместо с `response.data.workout`.
- **Грешки в админ UI и `localStorage` ключове**:
  - `PhotosManagement.jsx` чете `localStorage.getItem("token")`, докато `AuthContext` пази токена под `"jwtToken"`.
  - `authService.jsx` в `googleLogin` чете `response.Token` и `response.RefreshToken` (вместо `response.data.Token` / `response.data.RefreshToken`).
  - `AdminShoeForm.jsx` при `PUT /api/shoes/{id}` изпраща `{ size }` без `Id`, а `ShoesController.UpdateShoe` връща `400 Bad Request` при `id != updatedShoeDto.Id`. `AdminShoesList.jsx` филтрира след изтриване по `shoe.id` вместо `shoe.Id`.
  - `AuthService.LoginAsync` и OAuth сървисите ревокират само `FirstOrDefaultAsync` refresh token, а `_recentResetRequests` е в Scoped `AuthService` (губи състояние между заявките). `ForgotPasswordAsync` прави двойно URL-енкодване на reset токена (`UrlEncode(HttpUtility.UrlEncode(token))`).
  - `JumpWithJennyDbContext.OnModelCreating` събира `foreignKeys`, но не променя `DeleteBehavior` в цикъл.

### Остарели зависимости, дублиране и конфигурационен дълг
- **Смесени .NET версии на пакети (`ServerAPI.csproj`)**: Target framework е `net9.0`, но EF Core, Npgsql, Identity и `JwtBearer` са версия `6.0.x` (а `Microsoft.AspNetCore.Cors` е `2.2.0`), смесени със `System.IdentityModel.Tokens.Jwt 8.1.2`.
- **Неизползвани/дублирани зависимости**: `SendGrid 9.29.3` в `ServerAPI.csproj` (използва се само MailKit); в `Program.cs` услугите `EmailTemplateService`, `EmailService`, `ContactService` и `GoogleAuthService` са регистрирани по два пъти (вторият `AddScoped<IGoogleAuthService, GoogleAuthService>()` презаписва `AddHttpClient<IGoogleAuthService, GoogleAuthService>()`).
- **Frontend пакети (`client-app/package.json`)**: съдържа сървърни/ненужни пакети (`cors`, `fs-extra`, `glob`, `jquery`, `firebase`), остарял `jwt-decode` (`3.1.2`) и `eslintConfig` от Create React App (`react-app`).
- **Дублиран API слой в `client-app`**: два отделни Axios инстанса (`src/api/axius.js` и `src/services/api.jsx`) и дублиран метод `getAllWorkouts` в `WorkoutSevices.jsx` (вторият презаписва първия).

### Мъртъв код и UI несъответствия
- **Двоен `<Navbar />`**: На главната страница `/` `Navbar` се рендерира едновременно от `AppContent` в `App.jsx` и вътре в `Home.jsx`.
- **Неизползвани файлове/артефакти**: `WeatherForecastController.cs`, `WeatherForecast.cs`, `web.config.bak`, бинарен файл `ServerAPI/ServerAPI/ServerAPI` и файл `дс` в `ServerAPI/ServerAPI/`; `UserContext.jsx`, `AdminRoute.jsx`, `AdminRoutes.js`, `firebase.js` в `client-app/src/`.
- **Незавършени екрани/полета**: бутонът за Instagram в `AuthModal.jsx` няма логика; линкът `/admin/analytics` в `AdminLayout.jsx` няма дефиниран маршрут в `App.jsx`; таблицата `UserHistories` и колоните `User.ProviderId` / `User.ProviderName` не се попълват; админ панелът съдържа смесени текстове на английски и български без `i18next`.
