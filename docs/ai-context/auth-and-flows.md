# Автентикация, бизнес потоци и технически дълг

## 1. Потоци за вход, сесия и права на достъп

### А. Локална регистрация и вход (Email / Password)
1. **Паролна политика и Lockout (`IdentityOptionsProvider`)**: минимална дължина 8 символа, задължителни цифра, малка и главна буква (без задължителен специален символ), уникален имейл; заключване на акаунта след 5 неуспешни опита за 15 минути.
2. **Регистрация**: `Register.jsx` изпраща `POST /Account/signup` с `SignUpModel` (`UserName`, `FirstName`, `LastName`, `Email`, `Password`, `Language`).
3. `AuthService.SignUpAsync` създава `User`, добавя го в роля `"User"`, генерира email confirmation token и изпраща локализиран (`bg`/`en`) имейл през MailKit (`Resources/EmailTemplate.html` + `emailTexts.{lang}.json`) с линк `${FrontendBaseUrl}/verify-email?userId=...&token=...`. Генерира JWT + 64-байтов криптографски `RefreshToken` (валиден 7 дни, записва се като SHA-256 хеш в `RefreshTokens` чрез `RefreshTokenHelper.RotateUserRefreshTokensAsync`) и връща `{ token, user: UserDto, refreshToken }`.
4. **Потвърждение на имейл**: Отварянето на `/verify-email` в `VerifyEmail.jsx` извиква `POST /Account/confirmemail`, сървърът потвърждава имейла в Identity и фронтендът обновява `emailConfirmed: true` в `AuthContext`.
5. **Вход**: `Login.jsx` изпраща `POST /Account/login` (`Email`, `Password`) → `AuthService.LoginAsync` проверява дали потребителят не е `IsDeleted`, валидира паролата чрез `SignInManager.CheckPasswordSignInAsync(..., lockoutOnFailure: true)`, генерира JWT, ревокира **всички** активни refresh токени на потребителя и издава нов чрез `RefreshTokenHelper.RotateUserRefreshTokensAsync`, връщайки `{ token, user, refreshToken }`.
6. **Изход (`POST /Account/logout`)**: При изход `AuthContext.logout()` изчиства `localStorage` и извиква `POST /Account/logout` с `refreshToken`, като `AuthService.LogoutAsync` ревокира подадения токен (или всички активни токени на текущия JWT потребител, ако няма подаден `refreshToken`).
7. **Забравена и сменена парола**: `ForgotPasswordModal.jsx` → `POST /Account/forgot-password` (с `EmailPolicy` rate limiting + 1-минутен `ConcurrentDictionary` cooldown в `AuthService` и единично `Uri.EscapeDataString` кодиране на токена) → имейл с линк `/reset-password?token=...&email=...` → `ResetPassword.jsx` → `POST /Account/reset-password-token`. При успешна смяна или ресет на парола (`ChangePasswordAsync`, `ResetPasswordAsync`, `UserService.ChangePasswordAsync`) се ревокират всички активни refresh токени на потребителя.

### Б. Google OAuth 2.0 (Authorization Code Flow)
1. В `App.jsx` приложението е обвито в `<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>`.
2. В `AuthModal.jsx` бутонът за Google извиква `useGoogleLogin({ flow: 'auth-code' })`.
3. Google popup прозорецът връща временен authorization code (`credentialResponse.code`).
4. `authService.googleLogin(code)` изпраща `POST /api/Auth/google-login` с `{ code }`.
5. В бекенда `GoogleAuthService.ExchangeCodeForTokensAsync(code)` изпраща server-to-server `POST https://oauth2.googleapis.com/token` с `client_id`, `client_secret`, `redirect_uri` (от `Authentication:Google:*`) и `grant_type=authorization_code`, за да получи `id_token`.
6. `GoogleAuthService.ExternalLoginAsync(idToken)` валидира `id_token` чрез `GoogleJsonWebSignature.ValidateAsync` спрямо конфигурирания `ClientId` (`Audience`) и проверява `payload.Subject`, `payload.Email` и `payload.EmailVerified`.
7. Търси потребителя първо по `UserManager.FindByLoginAsync("Google", payload.Subject)`. Ако не е намерен, търси по имейл; при съществуващ локален акаунт отказва автоматичното свързване, ако `!user.EmailConfirmed` (защита срещу account takeover) или ако вече има вързан друг Google акаунт, проверява `IsDeleted`/lockout и записва връзката в `AspNetUserLogins` (`AddLoginAsync`).
8. При нов потребител създава `User` с `EmailConfirmed = true`, `IsExternalLogin = true`, `ProviderName = "Google"`, `ProviderId = payload.Subject`, роля `"User"` и запис в `AspNetUserLogins`.
9. Генерира вътрешен JWT, ротира refresh токените чрез `RefreshTokenHelper.RotateUserRefreshTokensAsync` и връща `AuthResult` (`Success`, `Token`, `RefreshToken`, `User`) към клиента.

### В. Facebook Login
1. `FacebookSDKContext.jsx` зарежда динамично `https://connect.facebook.net/en_US/sdk.js` и инициализира `window.FB.init({ appId: VITE_APP_FACEBOOK_APP_ID, cookie: true, xfbml: true, version: "v23.0" })`.
2. В `AuthModal.jsx` бутонът за Facebook извиква `window.FB.login(..., { scope: 'public_profile,email' })` и получава `response.authResponse.accessToken`.
3. `authService.facebookLogin(accessToken)` изпраща `POST /api/Auth/facebook-login` с `{ accessToken }`.
4. В бекенда `FacebookAuthService.ExternalLoginAsync(accessToken)` взима `Authentication:Facebook:AppSecret`, изчислява HMAC-SHA256 `appsecret_proof` върху `accessToken` и заявява `GET https://graph.facebook.com/v18.0/me?fields=id,name,email,first_name,last_name&access_token=...&appsecret_proof=...`.
5. Търси потребителя първо по `FindByLoginAsync("Facebook", userProfile.Id)`. Ако не е намерен, изисква `userProfile.Email` и проверява по имейл със същите защити за `IsDeleted`/lockout, потвърден имейл (`!user.EmailConfirmed`), конфликт с друг Facebook акаунт и свързване в `AspNetUserLogins`; при нов потребител създава `User` (`EmailConfirmed = true`, `IsExternalLogin = true`, `ProviderName = "Facebook"`, `ProviderId = userProfile.Id`, роля `"User"`).
6. Генерира вътрешен JWT, ротира refresh токените и връща `AuthResult`.

### Г. Съхранение, валидация и обновяване (Refresh) на токените
- **Клиент (`AuthContext.jsx` + `src/api/axius.js`)**:
  - Данните за сесията се пазят в `localStorage` под ключове `jwtToken`, `refreshToken` и `user` (JSON). `src/services/api.jsx` е само re-export на `src/api/axius.js`.
  - При първоначално зареждане `AuthContext.initializeAuth()` декодира `jwtToken` с `jwt-decode` и проверява `decoded.exp * 1000 > Date.now()`. При изтекъл access token и наличен `refreshToken` извиква single-flight `refreshAccessToken()` (`POST /Account/refresh-token`).
  - Axios инстансът в `src/api/axius.js` прикачва `Authorization: Bearer <jwtToken>` към всяка заявка и премахва `Content-Type` при `FormData`. При отговор `401 Unauthorized` (извън `AUTH_BYPASS_PATHS` и с `!originalRequest._retry`) използва single-flight механизъм (`isRefreshing` + опашка `failedQueue`) за паралелните 401 заявки, обновява `localStorage` и повтаря заявките; при неуспех изчиства `localStorage` и изпраща `window` събитие `auth:logout`, което `AuthContext` слуша.
- **Сървър (`Program.cs`, `JwtTokenService.cs`, `AuthService.cs`, `RefreshTokenHelper.cs`)**:
  - `AddIdentity` е регистриран преди `AddAuthentication` + `AddJwtBearer`, така че `JwtBearerDefaults.AuthenticationScheme` остава default схема за `[Authorize]`.
  - `JwtTokenService.GenerateJwtToken` подписва HS256 JWT с UTF-8 секрета от `Jwt:Secret` (идентичен с UTF-8 валидацията в `Program.cs`) и добавя claims: `ClaimTypes.NameIdentifier` (`user.Id`), `ClaimTypes.Email`, `ClaimTypes.Name` (`user.UserName`), `Jti` и `ClaimTypes.Role` за всяка роля.
  - В БД `RefreshTokens.Token` пази **SHA-256 хеша** на суровия refresh токен (`RefreshTokenHelper.HashToken`).
  - `AuthService.RefreshTokenAsync` използва EF Core транзакция и `SELECT * FROM "RefreshTokens" WHERE "Token" = ... FOR UPDATE NOWAIT` (при паралелна заявка PostgreSQL `55P03` връща отказ без race condition), проверява дали потребителят не е изтрит или заключен (`IsLockedOutAsync`) и **винаги ротира** refresh токена (ревокира стария и създава нов за 7 дни).

### Д. Разграничаване на роли (`Administrator` vs. `User`)
- **Роли в системата**: `"Administrator"` и `"User"` (`GlobalConstants`).
- **На сървъра**: Всички админ контролери и методи (`AdminController`, `WorkoutController`, `ShoesController`, `GalleryController` `all`/`upload`/`delete`, както и `UserController` `all`/`get`/`PUT /{id}`/`DELETE /{id}`) са защитени с `[Authorize(Roles = GlobalConstants.AdministratorRoleName)]`. Потребителските маршрути (`ScheduleController` `apply`/`is-registered`/`cancel-registration`, `AccountController.VerifyEmailStatus`, `AccountController.ResetPassword`, `UserController.ChangePassword`) са с `[Authorize]` и валидират JWT `ClaimTypes.NameIdentifier`.
- **На клиента**:
  - `NavBar.jsx` показва линк „Админ панел“ (`/admin`) само когато `user?.role === 'Administrator'`.
  - `App.jsx` защитава всички `/admin/*` маршрути чрез `ProtectedAdminRoute` (проверява `user.role === 'Admin' || user.role === 'Administrator'`), иначе пренасочва към `/`.

---

## 2. Основни бизнес потоци (Kangoo Jumps тренировки)

### Записване без регистрация и отмяна с 1 клик
- Публичните потребители се записват директно през `Schedule.jsx` → `WorkoutModal.jsx` (`POST /api/Schedule/apply`, `[AllowAnonymous]`, `BookingPolicy` rate limit), без нужда от регистрация или вход.
- Входът остава само за администратора през скрит маршрут `/admin/login` (`AuthService.LoginAsync` допуска само потребители с роля `Administrator`).
- `ScheduleService.ApplyForWorkoutAsync` използва транзакция + `pg_advisory_xact_lock(hashtext(normalizedEmail))`: проверява за дублиране на имейл в същата тренировка (`ALREADY_REGISTERED`), лимит от максимум 3 активни предстоящи резервации на имейл (`MAX_ACTIVE_BOOKINGS`), свободни места и обувки по размер, генерира криптографски сигурен `CancellationToken` и изпраща потвърдителен имейл с линк `${FrontendBaseUrl}/cancel-booking/${cancellationToken}`.
- Фронтендът пази въведените Име, Имейл, Размер обувки, `UsesOwnShoes` и `CardType` в `localStorage` (`jwj_booking_prefs_v1`) за автоматично попълване.
- Отварянето на `/cancel-booking/:token` зарежда детайлите (`GET /api/Schedule/cancel/{token}`) и при потвърждение (`POST /api/Schedule/cancel/{token}`) освобождава мястото и обувките.

---

### А. Създаване и администриране на график, обувки и потребители
1. **Часова зона**: Сървърът нормализира и съхранява датите на тренировките като стенен час в `Europe/Sofia` чрез `BulgariaTimeHelper` и ги връща в UTC (`SofiaToUtc`), а клиентът форматира и парсва датите в `Europe/Sofia` чрез `client-app/src/utils/workoutDate.js`.
2. **Списък на тренировки (`/admin/workouts`)**: `AdminWorkoutList.jsx` извиква `GET /api/workouts/all` и превключва клиентски между предстоящи и минали тренировки, с търсене и изтриване. (На бекенда `GET /api/Workout` и `GET /api/workouts/all` поддържат сървърна пагинация `page`, `pageSize`, `upcomingOnly`, `search`.)
3. **Създаване и редакция (`WorkoutForm.jsx` → `POST /api/Workout`, `PUT /api/Workout/{id}`)**:
   - `WorkoutServices.CreateWorkoutAsync` валидира входа, нормализира датата в `Europe/Sofia`, задава автоматично `Status = "Booked"` при `AvailableSpots == 0` и създава `WorkoutShoes` записи за всички активни чифтове в `Shoes`.
   - `WorkoutServices.UpdateWorkoutAsync` валидира и записва промените (`Day`, `Time`, `Date`, `Status`, `AvailableSpots`) в БД.
4. **Управление на участници (`/admin/workouts/:id/view` и `WorkoutForm.jsx`)**:
   - Зарежда детайли с участници и обувки чрез `GET /api/Admin/workouts/{id}` (включително минали тренировки).
   - Админът може да търси потребител (`GET /api/users/search`) и да го добави (`POST /api/Admin/add/participant`, което вика `ScheduleService.ApplyForWorkoutAsync(..., requireConfirmedEmail: false, allowPastWorkout: true)`) или премахне (`DELETE /api/Admin/remove/participant` с `allowPastWorkout: true`).
5. **Управление на обувки (`/admin/shoes` → `ShoesController`)**:
   - При добавяне на нов чифт (`POST /api/Shoes`) `ShoesService.AddShoeAsync` автоматично добавя записи в `WorkoutShoes` за всички предстоящи тренировки.
   - Смяната на размер (`PUT /api/Shoes/{id}`) и изтриването (`DELETE /api/Shoes/{id}`) са забранени, ако чифтът е резервиран за предстояща тренировка.
6. **Управление на потребители (`/admin/users` → `UserController` / `AdminController`)**:
   - Админът може да редактира потребител (`PUT /User/{id}` с `UserUpdateViewModel`) и да променя ролята му; смяната на роля ревокира активните refresh токени, а понижаването на собствената роля или последния администратор е забранено.
   - Изтриването (`DELETE /User/{id}` или `DELETE /api/Admin/users/{id}`) забранява самоизтриване и изтриване на последния админ, извършва soft delete + анонимизиране на `UserName`/`Email`, ревокира refresh токени, изтрива `UserLogins` и освобождава предстоящите резервации и обувки на потребителя.
7. **Изтриване на тренировка (`DELETE /api/Workout/delete-workout/{id}`)**: прави soft delete (`IsDeleted = true`) на свързаните `Appointments`, `WorkoutShoes` и самата `Workout`.

### Б. Записване за тренировка от потребител
1. `Schedule.jsx` зарежда `GET /api/Schedule` (`ScheduleService.GetAllWorkoutsAsync`, което филтрира `w.Date > nowSofia` и връща `TakenSpots` и `TotalSpots`) и клиентски филтрира `parsedDate > now`, групирайки слотовете по `Day` и `Time`.
2. При клик на слот със статус `"Available"` (или `"Booked"`, ако потребителят е логнат, за да може да види статуса си и да отмени) се отваря `WorkoutModal.jsx`:
   - Преброява свободните обувки по размери (`S`/`M`/`L`/`XL`) от `selectedWorkout.WorkoutShoes` (`!ws.IsTaken`).
   - Ако потребителят е логнат, проверява дали вече е записан чрез `GET /api/Schedule/is-registered/{workoutId}`.
   - Мапва размерите чрез `SHOE_SIZE_MAP` (`S:1, M:2, L:3, XL:4`) и картите към `CardType` (`1, 2, 3`).
3. При изпращане: `Schedule.jsx` вика `POST /api/Schedule/apply` (`ScheduleController.ApplyForWorkout` чете `userId` от JWT `ClaimTypes.NameIdentifier`), обновява локалния списък с `response.data?.workout` и при `409 Conflict` автоматично презарежда графика; `WorkoutModal.jsx` показва локализирано съобщение по `err.response.data.code` (`bookingErrors.*`).
4. `ScheduleService.ApplyForWorkoutAsync` (в БД транзакция):
   - Валидира `CardType`, `ShoeSize` (ако `!usesOwnShoes`), съществуване на потребителя, `EmailConfirmed == true` (когато `requireConfirmedEmail == true`), съществуване на тренировката и `workout.Date > nowSofia` (когато `!allowPastWorkout`).
   - Проверява за активно дублирано записване (`ALREADY_REGISTERED`), `Status == "Available"` (`WORKOUT_NOT_AVAILABLE`) и `AvailableSpots > 0` (`NO_AVAILABLE_SPOTS`).
   - При `!usesOwnShoes` намира първата активна свободна `WorkoutShoes` с искания размер (`!ws.IsTaken`) и я маркира `IsTaken = true`.
   - Ако има предишно soft-deleted записване за `(WorkoutId, UserId)`, прави `Undelete` и обновява данните; иначе създава нов `Appointment`.
   - Намалява `workout.AvailableSpots -= 1`; при достигане на `0` задава `workout.Status = "Booked"`.
   - При едновременна промяна (`DbUpdateConcurrencyException` през `xmin` или нарушение на частичния уникален индекс `IX_Appointments_WorkoutId_ShoeId`) транзакцията се връща и хвърля `ScheduleBookingException` (`409 CONCURRENCY_CONFLICT`).

### В. Отмяна на записване
1. Ако `WorkoutModal.jsx` установи `isAlreadyRegistered === true`, показва бутон за отмяна → `DELETE /api/Schedule/cancel-registration/{workoutId}`.
2. `ScheduleService.CancelRegistrationAsync` (в БД транзакция):
   - Намира `Appointment` по `(WorkoutId, UserId)` и свързаната `Workout`.
   - Забранява отмяна на минала/започнала тренировка при `!allowPastWorkout` (`400 WORKOUT_PAST`).
   - Увеличава `workout.AvailableSpots += 1` и ако статусът е бил `"Booked"`, го връща на `"Available"`.
   - Ако `appointment.ShoeId != null`, намира съответната `WorkoutShoes` и връща `IsTaken = false`.
   - Извършва **`HardDelete`** на `Appointment` и пази от конкурентна промяна (`xmin` → `409 CONCURRENCY_CONFLICT`).

---

## 3. Технически дълг, останали проблеми и незавършени функционалности

### Тестово покритие и зависимости
- **Липсващи автоматизирани тестове**: `ServerAPI.sln` все още няма тест проект (CI стъпката `dotnet test` преминава без тестове), а в `client-app/package.json` липсват `lint` и `test` скриптове.
- **Ненужни/остарели пакети в `client-app/package.json`**: съдържа сървърни/неизползвани пакети (`cors`, `fs-extra`, `glob`, `jquery`, `firebase`), по-стар `jwt-decode` (`3.1.2`) и остатъчен Create React App `eslintConfig` (`react-app`).

### Мъртъв код и проследени артефакти
- **Двоен `<Navbar />` на `/`**: На главната страница `/` `Navbar` се рендерира едновременно от `AppContent` в `App.jsx` и вътре в `Home.jsx`.
- **Неизползвани файлове и методи**:
  - Frontend: `UserContext.jsx`, `AdminRoute.jsx`, `AdminRoutes.js`, `firebase.js`, както и неизползваният метод `UserService.createUser` (`POST /User`, който ендпойнт е премахнат от бекенда).
  - Backend: неизползваните private методи `BuildVerificationEmail` и `BuildPasswordResetEmail` в `AuthService.cs` и неизползваните `SendPasswordResetEmailAsync` / `SendConfirmationEmailAsync` в `EmailService.cs`.
  - Корен на репозиторито: случайно проследен файл `Library/Application Support/Microsoft/DeveloperTools/deviceid`.

### Незавършени UI функционалности, пагинация и локализация
- **Клиентска vs. сървърна пагинация в админа**: `AdminUsersList.jsx` и `AdminWorkoutList.jsx` все още зареждат първата страница (до 50 потребители / 100 тренировки) и филтрират клиентски, без UI контроли за новата сървърна пагинация (`page`, `pageSize`, `search`, `upcomingOnly`).
- **Незавършени екрани и полета**: бутонът за Instagram в `AuthModal.jsx` няма имплементация; линкът `/admin/analytics` в `AdminLayout.jsx` няма дефиниран маршрут в `App.jsx`; таблицата `UserHistories` все още не се попълва автоматично от сървисите; админ панелът все още съдържа смесени текстове на английски и български без `i18next`.

### Конфигурационни бележки
- **In-memory cooldown за reset парола**: `AuthService._recentResetRequests` е in-memory `static ConcurrentDictionary` (важи само за един сървърен инстанс, допълнен от `EmailPolicy` rate limiter-а).
- **HTTPS metadata в Development**: `Program.cs` задава `options.RequireHttpsMetadata = true` безусловно в `AddJwtBearer`.
