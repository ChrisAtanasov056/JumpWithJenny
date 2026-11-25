# База данни (PostgreSQL) и API референция

## 1. Схема на базата данни в PostgreSQL (`JumpWithJennyDbContext`)

`JumpWithJennyDbContext` наследява `IdentityDbContext<User, UserRole, string>` и използва `Npgsql.EntityFrameworkCore.PostgreSQL`.

### Общи правила и базови класове
- **`BaseModel`** (`IAuditInfo`): `Id` (`string` GUID по подразбиране), `CreatedOn` (`DateTime`), `ModifiedOn` (`DateTime?`).
- **`BaseDeletableModel`** (`BaseModel`, `IDeletableEntity`): добавя `IsDeleted` (`bool`) и `DeletedOn` (`DateTime?`).
- **Автоматичен одит**: `SaveChanges` / `SaveChangesAsync` попълват `CreatedOn` при `Added` и `ModifiedOn` при `Modified` с `DateTime.UtcNow`.
- **Глобален Soft-Delete филтър**: Всички `IDeletableEntity` типове (`User`, `UserRole`, `Workout`, `Shoes`, `WorkoutShoes`, `WorkoutCardType`, `Appointment`) имат глобален query filter `e => !e.IsDeleted`.
- **Optimistic Concurrency**: `Workouts` и `WorkoutShoes` използват PostgreSQL системната колона `xmin` (`xid`, `.IsRowVersion()`), за да предпазват от едновременни записвания (concurrency conflicts).
- **Timestamps и часова зона**: `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true)` → колоните са `timestamp without time zone`. `Workouts.Date` се съхранява като стенен час за `Europe/Sofia` (чрез `BulgariaTimeHelper`) и се конвертира към UTC (`SofiaToUtc`) при връщане от API.

### Enums (записват се като `integer`)
- **`ShoesSize`**: `s = 1`, `m = 2`, `l = 3`, `xl = 4`
- **`CardType`**: `CoolFit = 1`, `PulseCard = 2`, `IndividualWorkout = 3`

### Таблици и колони

| Таблица (PostgreSQL) | C# Ентитет | Ключови колони и типове | Връзки (FK), индекси и особености |
| :--- | :--- | :--- | :--- |
| **`AspNetUsers`** | `User` (`IdentityUser<string>`, `IAuditInfo`, `IDeletableEntity`) | PK `Id` (`text` GUID), `UserName`, `Email`, `EmailConfirmed`, `PasswordHash`, `FirstName` (`varchar(50)`), `LastName` (`varchar(50)`), `Age` (`int?`), `City` (`varchar(100)`), `ProfilePictureUrl` (`text`), `Description` (`text`), `ProviderId` (`varchar(100)`), `ProviderName` (`varchar(50)`), `IsExternalLogin` (`bool`), `CreatedOn`, `ModifiedOn`, `IsDeleted`, `DeletedOn` | 1:N с `Appointments`, `RefreshTokens`, `UserHistories`; индекс `(IsDeleted, UserName)` |
| **`AspNetRoles`** | `UserRole` (`IdentityRole`, `IAuditInfo`, `IDeletableEntity`) | PK `Id` (`text`), `Name`, `NormalizedName`, audit + soft-delete колони | M:N с `User` чрез `UserRoles` |
| **`UserRoles`** | `IdentityUserRole<string>` | Композитен PK `(UserId, RoleId)` | Преименувана от `AspNetUserRoles`; Cascade към `AspNetUsers` и `AspNetRoles` |
| `AspNetUserClaims`, `AspNetRoleClaims`, `AspNetUserLogins`, `AspNetUserTokens` | Стандартни Identity класове | Стандартни Identity колони | Cascade към `AspNetUsers` / `AspNetRoles` (`AspNetUserLogins` се използва за Google/Facebook login връзки) |
| **`Workouts`** | `Workout` (`BaseDeletableModel`) | PK `Id` (`text`), `Day` (`text`, required), `Time` (`text`, required), `Date` (`timestamp`, required, Sofia wall-clock), `Status` (`text`, required: `"Available"`, `"Booked"`, `"Completed"`, `"Cancelled"`), `AvailableSpots` (`int`, required), `xmin` (`xid` row version), audit + soft-delete | 1:N с `WorkoutShoes`, `Appointments`, `WorkoutCardTypes`, `UserHistories`; индекси `Date`, `(IsDeleted, Date)`, `Status` |
| **`Shoes`** | `Shoes` (`BaseDeletableModel`) | PK `Id` (`text`), `Size` (`integer` — `ShoesSize`, required), audit + soft-delete | 1:N с `WorkoutShoes`, `Appointments`, `UserHistories`; индекс `(IsDeleted, Size)` |
| **`WorkoutShoes`** | `WorkoutShoes` (`BaseDeletableModel`) | Композитен PK `(WorkoutId, ShoeId)`, `Id` (`text` GUID), `IsTaken` (`bool`), `xmin` (`xid` row version), audit + soft-delete | FK `WorkoutId` → `Workouts` (Cascade); FK `ShoeId` → `Shoes` (Cascade) |
| **`Appointments`** | `Appointment` (`BaseDeletableModel`) | PK `Id` (`text`), `UserId` (`text`, nullable), `WorkoutId` (`text`, required), `FullName` (`varchar(120)`), `Email` (`varchar(254)`), `NormalizedEmail` (`varchar(254)`), `PhoneNumber` (`varchar(30)`), `CancellationToken` (`varchar(128)`), `CardType` (`integer?` — legacy), `ShoeId` (`text`, nullable), `IsConfirmed` (`bool`), `UsesOwnShoes` (`bool`), audit + soft-delete | FK `UserId` → `AspNetUsers` (`SetNull`); FK `WorkoutId` → `Workouts` (Cascade); FK `ShoeId` → `Shoes` (nullable); частични уникални индекси `IX_Appointments_WorkoutId_NormalizedEmail` (`"IsDeleted" = false`) и `IX_Appointments_WorkoutId_ShoeId` (`"ShoeId" IS NOT NULL AND "IsDeleted" = false`); уникален индекс `IX_Appointments_CancellationToken`; индекси `(WorkoutId, IsDeleted)` и `(NormalizedEmail, IsDeleted)` |
| **`WorkoutCardTypes`** | `WorkoutCardType` (`BaseDeletableModel`) | PK `Id` (`text`), `CardType` (`integer` — `CardType`), shadow FK `WorkoutId` (`text`, nullable), audit + soft-delete | Nullable FK `WorkoutId` → `Workouts` |
| **`UserHistories`** | `UserHistory` | PK `Id` (`text`), `UserId` (`text`, required), `ShoeId` (`text`, required), `WorkoutId` (`text`, required), `UsedAt` (`timestamp`) | FK към `AspNetUsers`, `Shoes`, `Workouts` (Cascade). *Бележка: понастоящем не се записва от сървисите.* |
| **`RefreshTokens`** | `RefreshToken` | PK `Id` (`serial int`), `Token` (`text` — SHA-256 hex хеш на суровия токен), `Expires` (`timestamp`), `Created` (`timestamp`), `Revoked` (`timestamp?`), `Locked` (`bool`), `UserId` (`text`) | FK `UserId` → `AspNetUsers` (Cascade); индекси `Token`, `UserId`, `(UserId, Revoked)` |
| **`Images`** | `ImageModel` | PK `Id` (`serial int`), `Name` (`text`), `Url` (`text`), `CreatedAt` (`timestamp`) | Индекс `CreatedAt`; без външни ключове |

### ER Диаграма на релациите

```mermaid
erDiagram
    AspNetUsers ||--o{ Appointments : "books"
    Workouts ||--o{ Appointments : "has"
    Shoes ||--o{ Appointments : "assigned_to"
    Workouts ||--o{ WorkoutShoes : "allocates"
    Shoes ||--o{ WorkoutShoes : "used_in"
    Workouts ||--o{ WorkoutCardTypes : "accepts"
    AspNetUsers ||--o{ RefreshTokens : "owns"
    AspNetUsers ||--o{ UserHistories : "history"
    Shoes ||--o{ UserHistories : "history"
    Workouts ||--o{ UserHistories : "history"
    AspNetUsers ||--o{ UserRoles : "has"
    AspNetRoles ||--o{ UserRoles : "assigned"
```

### История на EF Core миграциите (`ServerAPI/ServerAPI/Migrations/`)
1. `20250319214629_InitialCreate` — начална схема (Identity, `Workouts`, `Shoes`, `WorkoutShoes`, `Appointments`, `WorkoutCardTypes`, `UserHistories`, `Images`).
2. `20250408114953_IdfixWorkoutCardType` — корекция на ключ/тип на `WorkoutCardType`.
3. `20250509093730_WorkoutAddDeletible` — добавяне на soft-delete колони към `Workouts`.
4. `20250509144723_AddTokenTable` — добавяне на таблица `RefreshTokens`.
5. `20250513145936_AddLockedBoolRefreshToken` — добавяне на колона `Locked` в `RefreshTokens`.
6. `20250624151255_AddDateToWorkout` — добавяне на колона `Date` в `Workouts`.
7. `20250802154056_AddIsExternalLoginToUser` — добавяне на `IsExternalLogin` в `AspNetUsers`.
8. `20250805153429_AddCascadeDeleteOnRefreshTokens` — каскадно изтриване за `RefreshTokens.UserId`.
9. `20261124201949_AddBookingConcurrencyAndUniqueShoeIndex` — `xmin` row version колони върху `Workouts` и `WorkoutShoes`, частичен уникален индекс `(WorkoutId, ShoeId)` върху `Appointments`.
10. `20261124211331_AddPerformanceIndexesAndNet9Upgrade` — добавяне на performance индекси (`Workouts`, `Shoes`, `RefreshTokens`, `Images`, `AspNetUsers`, `Appointments`) и ъпгрейд към EF Core / Npgsql 9.0.4.

### Начално попълване на данни (`JumpWithJennyDbSeeder`)
Изпълнява се при всяко стартиране на API-то (след автоматично `Migrate()` само в `Development`):
1. `RolesSeeder` + `AccountSeeder`: създават роли `Administrator` и `User` във всяка среда. Дефолтен администратор се създава **само в `Development`** и само ако са конфигурирани `SeedAdmin:Email` и `SeedAdmin:Password` (по избор `SeedAdmin:FirstName`, `SeedAdmin:LastName`).
2. `ShoesSeeder`: добавя 14 чифта обувки (7× `S`, 5× `M`, 1× `L`, 1× `XL`), ако `Shoes` е празна.
3. `WorkoutCardTypesSeeder`: добавя 3-те вида карти от `CardType`, ако `WorkoutCardTypes` е празна.
4. `WorkoutSeeder`: добавя 5 начални тренировки с дати, изчислени чрез `BulgariaTimeHelper.GetNextUpcomingSofiaDate`, и ги свързва с всички обувки в `WorkoutShoes`, ако `Workouts` е празна.
5. `ImageSeeder`: копира изображения от `SeedData/Images/` в `wwwroot/Images/` и ги записва в `Images`, ако `Images` е празна.

---

## 2. Списък на API ендпойнтите в `ServerAPI`

> **Формат на грешките и Rate Limiting:**
> - Необработените и бизнес изключенията се обработват централизирано от `GlobalExceptionHandler` и връщат RFC 9110 `application/problem+json` (`status`, `title`, `detail`, `type`, `instance`, `traceId`, `message` и опционален `code` — например при `ScheduleBookingException` или `DbUpdateConcurrencyException` → `409 Conflict`).
> - В `Program.cs` са конфигурирани две rate limiting политики по IP адрес: **`AuthPolicy`** (15 заявки / 1 мин) и **`EmailPolicy`** (5 заявки / 5 мин), които при превишаване връщат `429 Too Many Requests` като `ProblemDetails`.

### Root и Health (`Program.cs`)
| Метод | Маршрут | Достъп | Вход | Изход |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Anonymous | — | `200` `{ message: "JumpWithJenny API is running ✅" }` |
| `GET` | `/health` | `[AllowAnonymous]` | — | `200` `{ status: "healthy", database: "connected" }` / `503` `{ status: "unhealthy", database: "unreachable" }` |

### `AccountController` (`/Account`, CORS `"AllowOrigin"`, `AuthPolicy`)
| Метод | Маршрут | Достъп | Входен DTO / параметри | Изходен DTO / отговор |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/Account/signup` | Anonymous | `SignUpModel` (`UserName`, `FirstName`, `LastName`, `Password`, `Email`, `Language`) | `200` `{ token, user: UserDto, refreshToken }` / `400` `{ errors }` |
| `POST` | `/Account/login` | Anonymous | `LoginModel` (`Email`, `Password`) | `200` `{ token, user: UserDto, refreshToken }` / `401` `{ errors }` / `404` |
| `POST` | `/Account/confirmemail` | Anonymous | `ConfirmEmailRequest` (`UserId`, `Token`, `Language`) | `200` `{ message, user: UserDto }` / `400` `{ errors }` |
| `GET` | `/Account/verifyEmailStatus` | `[Authorize]` | Query: `userId` (`string`, по подразбиране текущия JWT потребител; допуска само собствен `userId` или `Administrator`, иначе `403`) | `200` `{ user: UserDto }` / `400` `{ errors }` / `401` / `403` |
| `POST` | `/Account/forgot-password` | Anonymous (`EmailPolicy`) | `ForgotPasswordRequest` (`Email`, `Language`) | `200` OK / `500` `{ errors }` |
| `POST` | `/Account/reset-password` | `[Authorize]` | `ResetPasswordRequest` (`Id`, `CurrentPassword`, `NewPassword`; принудително ползва JWT `NameIdentifier`, `403` при друг `Id`; ревокира активните refresh токени) | `200` OK / `400` `{ errors }` / `401` / `403` |
| `POST` | `/Account/reset-password-token` | Anonymous | `ForgotPasswordResetRequest` (`Email`, `Token`, `NewPassword`; ревокира активните refresh токени) | `200` `{ message }` / `400` `{ errors }` |
| `POST` | `/Account/refresh-token` | Anonymous | `RefreshTokenRequest` (`RefreshToken`) | `200` `{ accessToken, refreshToken, user: UserDto }` / `400` / `401` `AuthResult` |
| `POST` | `/Account/logout` | Anonymous *(или с JWT)* | Optional `RefreshTokenRequest` (`RefreshToken`); ревокира подадения токен или всички активни токени на текущия JWT потребител | `200` `{ message }` |
| `POST` | `/Account/resend-verification` | Anonymous (`EmailPolicy`) | `ResendEmailRequest` (`Email`, `Language`) | `200` `{ message }` / `400` `{ errors }` |

### `AuthController` (`/api/Auth`, `AuthPolicy`)
| Метод | Маршрут | Достъп | Входен DTO / параметри | Изходен DTO / отговор |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/Auth/google-login` | Anonymous | `GoogleAuthCodeRequest` (`Code`) | `200` `AuthResult` (`Success`, `Token`, `RefreshToken`, `User`, `Errors`) / `400` `{ errors }` |
| `POST` | `/api/Auth/facebook-login` | Anonymous | `FacebookAuthCodeRequest` (`AccessToken`) | `200` `AuthResult` / `400` `{ errors }` |

### `ScheduleController` (`/api/Schedule`)
| Метод | Маршрут | Достъп | Входен DTO / параметри | Изходен DTO / отговор |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/Schedule` | Anonymous | Query: `page=1`, `pageSize=50` (1..100) | `200` `List<WorkoutViewModels>` (филтрирани по `Date > nowSofia`, дати в UTC) |
| `GET` | `/api/Schedule/{id}` | Anonymous | Route: `id` | `200` `{ message, workout: { Id, Day, Time, Date, Status, AvailableSpots, TakenSpots, TotalSpots, Shoes: [{ Id, Size, IsTaken }] } }` / `404` |
| `POST` | `/api/Schedule/apply` | Anonymous (`BookingPolicy`: 10/5 мин) | `ApplyForWorkoutRequest` (`WorkoutId`, `FullName`, `Email`, `PhoneNumber`, `ShoeSize: ShoesSize?`, `UsesOwnShoes`, `Language?`) | `200` `{ message, workout: WorkoutViewModels, cancellationToken }` / `400` / `404` / `409` / `429` (`ProblemDetails` с `code`) |
| `GET` | `/api/Schedule/cancel/{token}` | Anonymous (`CancelBookingPolicy`: 20/мин) | Route: `token` (`CancellationToken`) | `200` `BookingCancellationDetailsDto` / `404` |
| `POST` | `/api/Schedule/cancel/{token}` | Anonymous (`CancelBookingPolicy`: 20/мин) | Route: `token` (`CancellationToken`) | `200` `{ message: "Registration canceled successfully." }` / `400` / `404` / `409` |

### `WorkoutController` (`/api/Workout`, `[Authorize(Roles = "Administrator")]`)
| Метод | Маршрут | Достъп | Входен DTO / параметри | Изходен DTO / отговор |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/Workout` | `[Authorize(Roles = "Administrator")]` | `WorkoutCreateModel` (`Id`, `Day`, `Time`, `Status`, `AvailableSpots`, `Date`; автоматично задава `"Booked"` при `AvailableSpots == 0` и създава `WorkoutShoes`) | `201` `WorkoutCreateModel` / `400` |
| `PUT` | `/api/Workout/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id`, Body: `WorkoutUpdateModel` (`Id`, `Day`, `Time`, `Date`, `Status`, `AvailableSpots`) | `200` `WorkoutUpdateModel` / `400` / `404` |
| `DELETE` | `/api/Workout/delete-workout/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id` | `204` NoContent / `400` / `404` |
| `GET` | `/api/Workout/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id` | `200` `WorkoutViewModels` / `404` |
| `GET` | `/api/Workout` | `[Authorize(Roles = "Administrator")]` | Query: `page=1`, `pageSize=20`, `upcomingOnly?`, `search?` | `200` `PagedResult<AdminWorkoutViewModel>` |

### `AdminController` (`/api/Admin`, `[Authorize(Roles = "Administrator")]` за всички методи)
| Метод | Маршрут | Достъп | Входен DTO / параметри | Изходен DTO / отговор |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/Admin/users/create` | `[Authorize(Roles = "Administrator")]` | `UserCreateViewModel` (`Username`, `Password`, `Email`, `FirstName`, `LastName`, `Role`) | `200` `{ Message }` / `400` |
| `GET` | `/api/Admin/users` | `[Authorize(Roles = "Administrator")]` | Query: `page=1`, `pageSize=50`, `search?` | `200` `AllUsersViewModels` (`Users`, `Page`, `PageSize`, `TotalCount`, `TotalPages`, `HasPreviousPage`, `HasNextPage`) |
| `DELETE` | `/api/Admin/users/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id` (защита срещу самоизтриване и последния админ) | `200` `{ Message }` / `400` / `404` |
| `GET` | `/api/Admin/workouts/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id` | `200` `AdminWorkoutViewModel` (минали и предстоящи) / `404` |
| `GET` | `/api/Admin/workouts/{id}/participants` | `[Authorize(Roles = "Administrator")]` | Route: `id` | `200` `IEnumerable<GetParticipantsModel>` (`Id`, `FullName`, `Email`, `PhoneNumber`, `ShoeSize`, `UsesOwnShoes`) |
| `POST` | `/api/Admin/add/participant` | `[Authorize(Roles = "Administrator")]` | Query `id` (fallback), Body: `ApplyForWorkoutRequest` (`WorkoutId`, `FullName`, `Email`, `PhoneNumber`, `ShoeSize`, `UsesOwnShoes`; `enforceBookingLimits: false`, `allowPastWorkout: true`) | `200` `AdminWorkoutViewModel` / `400` / `404` / `409` |
| `DELETE` | `/api/Admin/remove/participant` | `[Authorize(Roles = "Administrator")]` | Query: `appointmentId` (`allowPastWorkout: true`) | `200` `{ Message }` / `400` / `404` / `409` |
| `GET` | `/api/users/search` *(абсолютен маршрут)* | `[Authorize(Roles = "Administrator")]` | Query: `query` | `200` `IEnumerable<UserSearchResultModel>` (до 10 резултата) |
| `GET` | `/api/workouts/all` *(абсолютен маршрут)* | `[Authorize(Roles = "Administrator")]` | Query: `page?`, `pageSize?`, `upcomingOnly?`, `search?` | `200` `PagedResult<AdminWorkoutViewModel>` (при зададени `page`/`pageSize`) или `IEnumerable<AdminWorkoutViewModel>` (до 100 записа) |

### `ShoesController` (`/api/Shoes`, `[Authorize(Roles = "Administrator")]`)
| Метод | Маршрут | Достъп | Входен DTO / параметри | Изходен DTO / отговор |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/Shoes` | `[Authorize(Roles = "Administrator")]` | — | `200` `List<ShoesDTO>` (`Id`, `Size`) |
| `GET` | `/api/Shoes/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id` | `200` `ShoesDetailsDTO` (`Id`, `Size`, `Workouts`, `Users`) / `404` |
| `POST` | `/api/Shoes` | `[Authorize(Roles = "Administrator")]` | `ShoesDTO` (`Id`, `Size`; автоматично добавя `WorkoutShoes` към предстоящите тренировки) | `201` `Shoes` / `400` |
| `PUT` | `/api/Shoes/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id`, Body: `ShoesDTO` (забранена промяна на размер при активна резервация в предстояща тренировка) | `204` NoContent / `400` / `404` |
| `DELETE` | `/api/Shoes/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id` (забранено изтриване при активна резервация в предстояща тренировка) | `204` NoContent / `400` / `404` |

### `UserController` (`/User`, CORS `"AllowOrigin"`, `[Authorize]` на класа)
| Метод | Маршрут | Достъп | Входен DTO / параметри | Изходен DTO / отговор |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/User/all` | `[Authorize(Roles = "Administrator")]` | Query: `page=1`, `pageSize=50`, `search?` | `200` `AllUsersViewModels` |
| `GET` | `/User/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id` | `200` `UserAdminViewModel` (`Id`, `Username`, `Email`, `FirstName`, `LastName`, `Role`) / `404` |
| `PUT` | `/User/change-password` | `[Authorize]` | `ChangePasswordViewModel` (`Id`, `CurrentPassword`, `NewPassword`; само собствен `Id`, `403` при друг; ревокира активните refresh токени) | `200` string / `400` / `401` / `403` |
| `PUT` | `/User/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id`, Body: `UserUpdateViewModel` (`Username`, `Email`, `FirstName`, `LastName`, `Role`; защита срещу понижаване на собствената роля или последния админ; ревокира refresh токени при смяна на роля) | `200` `UserAdminViewModel` / `400` / `404` |
| `DELETE` | `/User/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id` (защита срещу самоизтриване и последния админ; soft delete + анонимизация + освобождаване на предстоящи резервации/обувки) | `200` `{ message }` / `400` / `404` |

### `GalleryController` (`/Gallery`, CORS `"AllowOrigin"`)
| Метод | Маршрут | Достъп | Входен DTO / параметри | Изходен DTO / отговор |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/Gallery` | Anonymous | Query: `page=1`, `pageSize=4` (валидира `page >= 1`, `1 <= pageSize <= 50`) | `200` `IEnumerable<ImageModel>` (`Id`, `Name`, `Url`, `CreatedAt`) / `400` |
| `GET` | `/Gallery/all` | `[Authorize(Roles = "Administrator")]` | — | `200` `IEnumerable<ImageModel>` |
| `POST` | `/Gallery/upload` | `[Authorize(Roles = "Administrator")]` | `multipart/form-data` (`file: IFormFile`; лимит 10 MB, проверка на разширение `.jpg`/`.jpeg`/`.png`/`.webp`, MIME тип и magic bytes) | `200` `ImageModel` / `400` |
| `DELETE` | `/Gallery/{id}` | `[Authorize(Roles = "Administrator")]` | Route: `id` (защита срещу path traversal при триене на файла) | `204` NoContent / `404` |

### `ContactController` (`/api/Contact`)
| Метод | Маршрут | Достъп | Входен DTO / параметри | Изходен DTO / отговор |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/Contact/send` | Anonymous (`EmailPolicy`) | `ContactFormDto` (`Name` [100], `Email` [254], `Subject` [200], `Message` [4000]) | `200` `{ Message }` / `400` `{ Errors }` |

### Основни DTO / ViewModel структури
- **`UserDto`** (`Models/Authentication/UserDTO.cs`): `{ id, email, username, firstname, lastname, emailConfirmed, role }` (lowercase ключове).
- **`AuthResult`**: `{ Success, Token, RefreshToken, ExpiresAt, User, Errors }` (PascalCase ключове).
- **`WorkoutViewModels`**: `{ Id, Day, Time, Status, AvailableSpots, TakenSpots, TotalSpots, Date, WorkoutShoes }`.
- **`AdminWorkoutViewModel`**: `{ Id, Day, Time, Status, CardType, AvailableSpots, Date, WorkoutShoes, Appointments: List<AppointmentViewModel> }`.
- **`AppointmentViewModel`**: `{ Id, UserId, UserFullName, UserEmail, CardType, ShoeId, ShoeSize, UsesOwnShoes }`.
- **`PagedResult<T>`**: `{ Items, Page, PageSize, TotalCount, TotalPages, HasPreviousPage, HasNextPage }`.
- **`AllUsersViewModels`**: `{ Users: List<UserViewModel>, Page, PageSize, TotalCount, TotalPages, HasPreviousPage, HasNextPage }`.
