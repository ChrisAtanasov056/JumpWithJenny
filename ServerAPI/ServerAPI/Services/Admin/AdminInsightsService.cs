using Microsoft.EntityFrameworkCore;
using ServerAPI.Common;
using ServerAPI.Data;
using ServerAPI.Models.Admin;
using ServerAPI.Models.Common;
using ServerAPI.Models.Enums;
using ServerAPI.Models.Schedule;
using ServerAPI.Services.Workouts;

namespace ServerAPI.Services.Admin
{
    public class AdminInsightsService : IAdminInsightsService
    {
        private readonly JumpWithJennyDbContext _context;
        private readonly IWorkoutServices _workoutServices;
        private readonly IShoesService _shoesService;

        public AdminInsightsService(
            JumpWithJennyDbContext context,
            IWorkoutServices workoutServices,
            IShoesService shoesService)
        {
            _context = context;
            _workoutServices = workoutServices;
            _shoesService = shoesService;
        }

        public async Task<AdminDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default)
        {
            var nowSofia = BulgariaTimeHelper.GetCurrentSofiaTime();
            var weekEndSofia = nowSofia.AddDays(7);

            var upcomingWorkoutsMeta = await _context.Workouts
                .AsNoTracking()
                .Where(w => w.Date > nowSofia && w.Status != "Cancelled")
                .OrderBy(w => w.Date)
                .Select(w => new
                {
                    w.Id,
                    w.Date,
                    w.AvailableSpots,
                    TakenSpots = w.Appointments.Count(a => !a.IsDeleted)
                })
                .ToListAsync(cancellationToken);

            var nextWorkoutId = upcomingWorkoutsMeta.FirstOrDefault()?.Id;
            AdminWorkoutViewModel nextWorkout = null;
            var nextShoePrep = new List<AdminShoePrepItemDto>();
            var nextOwnShoesCount = 0;

            if (!string.IsNullOrEmpty(nextWorkoutId))
            {
                nextWorkout = await _workoutServices.GetWorkoutByIdAsync(nextWorkoutId);
                var appointments = nextWorkout.Appointments ?? Array.Empty<AppointmentViewModel>();
                var workoutShoes = nextWorkout.WorkoutShoes ?? Array.Empty<ServerAPI.Models.WorkoutShoes>();

                nextOwnShoesCount = appointments.Count(a => a.UsesOwnShoes);

                foreach (var size in Enum.GetValues<ShoesSize>())
                {
                    var totalForSize = workoutShoes.Count(ws => ws.Shoe != null && ws.Shoe.Size == size);
                    var bookedFromShoes = workoutShoes.Count(ws => ws.Shoe != null && ws.Shoe.Size == size && ws.IsTaken);
                    var bookedFromAppointments = appointments.Count(a => !a.UsesOwnShoes && a.ShoeSize == size);
                    var bookedCount = Math.Max(bookedFromShoes, bookedFromAppointments);

                    nextShoePrep.Add(new AdminShoePrepItemDto
                    {
                        Size = size,
                        BookedCount = bookedCount,
                        TotalCount = totalForSize,
                        FreeCount = Math.Max(0, totalForSize - bookedCount),
                    });
                }
            }

            var thisWeekWorkouts = upcomingWorkoutsMeta.Where(w => w.Date <= weekEndSofia).ToList();
            var thisWeekBookingsCount = thisWeekWorkouts.Sum(w => w.TakenSpots);
            var thisWeekCapacity = thisWeekWorkouts.Sum(w => w.AvailableSpots + w.TakenSpots);
            var occupancyPercent = thisWeekCapacity > 0
                ? (int)Math.Round((double)thisWeekBookingsCount * 100 / thisWeekCapacity)
                : 0;

            var previewIds = upcomingWorkoutsMeta.Take(5).Select(w => w.Id).ToList();
            var previewWorkouts = new List<AdminWorkoutViewModel>(previewIds.Count);
            foreach (var previewId in previewIds)
            {
                if (nextWorkout != null && previewId == nextWorkout.Id)
                {
                    previewWorkouts.Add(nextWorkout);
                }
                else
                {
                    previewWorkouts.Add(await _workoutServices.GetWorkoutByIdAsync(previewId));
                }
            }

            var recentBookingsRaw = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.Workout != null && !a.Workout.IsDeleted)
                .OrderByDescending(a => a.CreatedOn)
                .Take(6)
                .Select(a => new
                {
                    a.Id,
                    a.WorkoutId,
                    a.FullName,
                    a.Email,
                    a.PhoneNumber,
                    ShoeSize = a.Shoe != null ? (ShoesSize?)a.Shoe.Size : null,
                    a.UsesOwnShoes,
                    a.IsAttended,
                    a.CreatedOn,
                    WorkoutDate = a.Workout.Date,
                    WorkoutDay = a.Workout.Day,
                    WorkoutTime = a.Workout.Time,
                })
                .ToListAsync(cancellationToken);

            var recentBookings = recentBookingsRaw.Select(b => new AdminRecentBookingDto
            {
                AppointmentId = b.Id,
                WorkoutId = b.WorkoutId,
                FullName = b.FullName,
                Email = b.Email ?? string.Empty,
                PhoneNumber = b.PhoneNumber ?? string.Empty,
                ShoeSize = b.ShoeSize,
                UsesOwnShoes = b.UsesOwnShoes,
                IsAttended = b.IsAttended,
                CreatedOn = DateTime.SpecifyKind(b.CreatedOn, DateTimeKind.Utc),
                WorkoutDate = BulgariaTimeHelper.SofiaToUtc(b.WorkoutDate),
                WorkoutDay = b.WorkoutDay,
                WorkoutTime = b.WorkoutTime,
            }).ToList();

            var clientIdentities = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.Workout != null && !a.Workout.IsDeleted)
                .Select(a => new
                {
                    a.FullName,
                    a.NormalizedEmail,
                    a.PhoneNumber,
                })
                .ToListAsync(cancellationToken);

            var totalUniqueClients = clientIdentities
                .Select(c => BuildClientKey(c.NormalizedEmail, c.PhoneNumber, c.FullName))
                .Distinct(StringComparer.Ordinal)
                .Count();

            var shoesInventory = await _shoesService.GetShoesInventoryAsync();

            return new AdminDashboardDto
            {
                NextWorkout = nextWorkout,
                NextWorkoutShoePrep = nextShoePrep,
                NextWorkoutOwnShoesCount = nextOwnShoesCount,
                UpcomingWorkoutsCount = upcomingWorkoutsMeta.Count,
                ThisWeekWorkoutsCount = thisWeekWorkouts.Count,
                ThisWeekBookingsCount = thisWeekBookingsCount,
                OccupancyRatePercent = occupancyPercent,
                TotalUniqueClients = totalUniqueClients,
                TotalShoesCount = shoesInventory.TotalCount,
                ShoesSummary = shoesInventory.SizeSummaries,
                UpcomingWorkoutsPreview = previewWorkouts,
                RecentBookings = recentBookings,
            };
        }

        public async Task<PagedResult<AdminClientSummaryDto>> GetClientsPagedAsync(
            int page = 1,
            int pageSize = 25,
            string search = null,
            string sortBy = "lastVisit",
            CancellationToken cancellationToken = default)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var summaries = await BuildClientSummariesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                var digitsTerm = NormalizeDigits(search);

                summaries = summaries.Where(c =>
                    (!string.IsNullOrEmpty(c.FullName) && c.FullName.ToLowerInvariant().Contains(term)) ||
                    (!string.IsNullOrEmpty(c.Email) && c.Email.ToLowerInvariant().Contains(term)) ||
                    (!string.IsNullOrEmpty(c.PhoneNumber) && c.PhoneNumber.ToLowerInvariant().Contains(term)) ||
                    (!string.IsNullOrEmpty(digitsTerm) && NormalizeDigits(c.PhoneNumber).Contains(digitsTerm)))
                    .ToList();
            }

            IEnumerable<AdminClientSummaryDto> ordered = (sortBy ?? "lastVisit").Trim().ToLowerInvariant() switch
            {
                "bookingscount" => summaries.OrderByDescending(c => c.TotalBookings).ThenByDescending(c => c.LastWorkoutDate),
                "name" => summaries.OrderBy(c => c.FullName, StringComparer.OrdinalIgnoreCase).ThenByDescending(c => c.LastWorkoutDate),
                _ => summaries.OrderByDescending(c => c.LastWorkoutDate).ThenByDescending(c => c.TotalBookings),
            };

            var totalCount = summaries.Count;
            var pagedItems = ordered
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<AdminClientSummaryDto>
            {
                Items = pagedItems,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }

        public async Task<IReadOnlyList<AdminClientAutocompleteDto>> AutocompleteClientsAsync(
            string query,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Array.Empty<AdminClientAutocompleteDto>();
            }

            var term = query.Trim().ToLowerInvariant();
            var digitsTerm = NormalizeDigits(query);

            var summaries = await BuildClientSummariesAsync(cancellationToken);

            return summaries
                .Where(c =>
                    (!string.IsNullOrEmpty(c.FullName) && c.FullName.ToLowerInvariant().Contains(term)) ||
                    (!string.IsNullOrEmpty(c.Email) && c.Email.ToLowerInvariant().Contains(term)) ||
                    (!string.IsNullOrEmpty(c.PhoneNumber) && c.PhoneNumber.ToLowerInvariant().Contains(term)) ||
                    (!string.IsNullOrEmpty(digitsTerm) && NormalizeDigits(c.PhoneNumber).Contains(digitsTerm)))
                .OrderByDescending(c => c.TotalBookings)
                .ThenByDescending(c => c.LastWorkoutDate)
                .Take(8)
                .Select(c => new AdminClientAutocompleteDto
                {
                    ClientKey = c.ClientKey,
                    FullName = c.FullName,
                    Email = c.Email,
                    PhoneNumber = c.PhoneNumber,
                    PreferredShoeSize = c.PreferredShoeSize,
                    UsesOwnShoesMostly = c.UsesOwnShoesMostly,
                    TotalBookings = c.TotalBookings,
                })
                .ToList();
        }

        private async Task<List<AdminClientSummaryDto>> BuildClientSummariesAsync(CancellationToken cancellationToken)
        {
            var nowSofia = BulgariaTimeHelper.GetCurrentSofiaTime();

            var rows = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.Workout != null && !a.Workout.IsDeleted)
                .Select(a => new
                {
                    a.Id,
                    a.FullName,
                    a.Email,
                    a.NormalizedEmail,
                    a.PhoneNumber,
                    ShoeSize = a.Shoe != null ? (ShoesSize?)a.Shoe.Size : null,
                    a.UsesOwnShoes,
                    a.IsAttended,
                    a.CreatedOn,
                    a.WorkoutId,
                    WorkoutDate = a.Workout.Date,
                    WorkoutDay = a.Workout.Day,
                    WorkoutTime = a.Workout.Time,
                    WorkoutStatus = a.Workout.Status,
                })
                .ToListAsync(cancellationToken);

            var grouped = rows.GroupBy(r => BuildClientKey(r.NormalizedEmail, r.PhoneNumber, r.FullName));
            var result = new List<AdminClientSummaryDto>();

            foreach (var group in grouped)
            {
                var bookings = group.OrderByDescending(x => x.CreatedOn).ToList();
                var latest = bookings[0];

                var latestEmail = bookings.Select(b => b.Email).FirstOrDefault(e => !string.IsNullOrWhiteSpace(e)) ?? string.Empty;
                var latestPhone = bookings.Select(b => b.PhoneNumber).FirstOrDefault(p => !string.IsNullOrWhiteSpace(p)) ?? string.Empty;
                var latestName = bookings.Select(b => b.FullName).FirstOrDefault(n => !string.IsNullOrWhiteSpace(n)) ?? "Guest";

                var ownShoesCount = bookings.Count(b => b.UsesOwnShoes);
                var preferredShoeSize = bookings
                    .Where(b => !b.UsesOwnShoes && b.ShoeSize.HasValue)
                    .GroupBy(b => b.ShoeSize.Value)
                    .OrderByDescending(g => g.Count())
                    .ThenByDescending(g => g.Max(x => x.CreatedOn))
                    .Select(g => (ShoesSize?)g.Key)
                    .FirstOrDefault();

                var recentWorkouts = bookings
                    .OrderByDescending(b => b.WorkoutDate)
                    .Take(5)
                    .Select(b => new AdminClientWorkoutItemDto
                    {
                        AppointmentId = b.Id,
                        WorkoutId = b.WorkoutId,
                        WorkoutDate = BulgariaTimeHelper.SofiaToUtc(b.WorkoutDate),
                        WorkoutDay = b.WorkoutDay,
                        WorkoutTime = b.WorkoutTime,
                        WorkoutStatus = b.WorkoutStatus,
                        ShoeSize = b.ShoeSize,
                        UsesOwnShoes = b.UsesOwnShoes,
                        IsAttended = b.IsAttended,
                    })
                    .ToList();

                var maxWorkoutSofia = bookings.Max(b => b.WorkoutDate);
                var minCreatedUtc = bookings.Min(b => b.CreatedOn);

                result.Add(new AdminClientSummaryDto
                {
                    ClientKey = group.Key,
                    FullName = latestName,
                    Email = latestEmail,
                    PhoneNumber = latestPhone,
                    TotalBookings = bookings.Count,
                    UpcomingBookings = bookings.Count(b => b.WorkoutDate > nowSofia && b.WorkoutStatus != "Cancelled"),
                    AttendedCount = bookings.Count(b => b.IsAttended),
                    PreferredShoeSize = preferredShoeSize,
                    UsesOwnShoesMostly = ownShoesCount > bookings.Count / 2.0,
                    LastWorkoutDate = BulgariaTimeHelper.SofiaToUtc(maxWorkoutSofia),
                    FirstBookingDate = DateTime.SpecifyKind(minCreatedUtc, DateTimeKind.Utc),
                    RecentWorkouts = recentWorkouts,
                });
            }

            return result;
        }

        private static string BuildClientKey(string normalizedEmail, string phoneNumber, string fullName)
        {
            if (!string.IsNullOrWhiteSpace(normalizedEmail))
            {
                return "email:" + normalizedEmail.Trim();
            }

            var digits = NormalizeDigits(phoneNumber);
            var namePart = (fullName ?? string.Empty).Trim().ToLowerInvariant();
            return $"phone:{digits}:{namePart}";
        }

        private static string NormalizeDigits(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            return new string(value.Where(char.IsDigit).ToArray());
        }
    }
}
