using System.Globalization;
using System.Text;
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

        public async Task<AdminAnalyticsDto> GetAnalyticsAsync(
            string range = "30d",
            DateTime? from = null,
            DateTime? to = null,
            CancellationToken cancellationToken = default)
        {
            var nowSofia = BulgariaTimeHelper.GetCurrentSofiaTime();
            var (normalizedRange, startSofia, endSofia, prevStartSofia, prevEndSofia) =
                ResolveAnalyticsWindow(range, from, to, nowSofia);

            var allWorkouts = await _context.Workouts
                .AsNoTracking()
                .Select(w => new WorkoutAnalyticsRow
                {
                    Id = w.Id,
                    Day = w.Day,
                    Time = w.Time,
                    Date = w.Date,
                    Status = w.Status,
                    AvailableSpots = w.AvailableSpots,
                    TrainerNote = w.TrainerNote,
                    Shoes = w.WorkoutShoes
                        .Where(ws => !ws.IsDeleted && ws.Shoe != null && !ws.Shoe.IsDeleted)
                        .Select(ws => new WorkoutShoeAnalyticsRow
                        {
                            Size = ws.Shoe.Size,
                            IsTaken = ws.IsTaken,
                        })
                        .ToList(),
                })
                .ToListAsync(cancellationToken);

            var allAppointments = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.Workout != null && !a.Workout.IsDeleted)
                .Select(a => new AppointmentAnalyticsRow
                {
                    Id = a.Id,
                    WorkoutId = a.WorkoutId,
                    FullName = a.FullName,
                    Email = a.Email,
                    NormalizedEmail = a.NormalizedEmail,
                    PhoneNumber = a.PhoneNumber,
                    ShoeSize = a.Shoe != null ? (ShoesSize?)a.Shoe.Size : null,
                    UsesOwnShoes = a.UsesOwnShoes,
                    IsAttended = a.IsAttended,
                    CreatedOn = a.CreatedOn,
                    WorkoutDate = a.Workout.Date,
                    WorkoutDay = a.Workout.Day,
                    WorkoutTime = a.Workout.Time,
                    WorkoutStatus = a.Workout.Status,
                })
                .ToListAsync(cancellationToken);

            var cancelledAppointments = await _context.Appointments
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(a => a.IsCancelled && a.Workout != null && !a.Workout.IsDeleted)
                .Select(a => new CancelledAppointmentRow
                {
                    Id = a.Id,
                    WorkoutId = a.WorkoutId,
                    CancelledAt = a.CancelledAt,
                    WorkoutDate = a.Workout.Date,
                    WorkoutStatus = a.Workout.Status,
                })
                .ToListAsync(cancellationToken);

            var shoesInventory = await _shoesService.GetShoesInventoryAsync();
            var inventoryBySize = shoesInventory.SizeSummaries.ToDictionary(s => s.Size, s => s.TotalCount);

            var appointmentsByWorkout = allAppointments
                .GroupBy(a => a.WorkoutId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var firstBookingByClient = new Dictionary<string, DateTime>(StringComparer.Ordinal);
            var lifetimeBookingsCount = new Dictionary<string, int>(StringComparer.Ordinal);
            foreach (var appt in allAppointments)
            {
                var key = BuildClientKey(appt.NormalizedEmail, appt.PhoneNumber, appt.FullName);
                lifetimeBookingsCount[key] = lifetimeBookingsCount.GetValueOrDefault(key) + 1;
                if (!firstBookingByClient.TryGetValue(key, out var earliest) || appt.WorkoutDate < earliest)
                {
                    firstBookingByClient[key] = appt.WorkoutDate;
                }
            }

            bool InWindow(DateTime sofiaDate, DateTime? winStart, DateTime? winEnd) =>
                (!winStart.HasValue || sofiaDate >= winStart.Value) &&
                (!winEnd.HasValue || sofiaDate <= winEnd.Value);

            var windowWorkouts = allWorkouts
                .Where(w => InWindow(w.Date, startSofia, endSofia))
                .ToList();
            var activeWindowWorkouts = windowWorkouts
                .Where(w => !string.Equals(w.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
                .ToList();
            var cancelledWorkoutsCount = windowWorkouts.Count - activeWindowWorkouts.Count;

            var windowWorkoutIds = new HashSet<string>(activeWindowWorkouts.Select(w => w.Id));
            var windowBookings = allAppointments
                .Where(a => windowWorkoutIds.Contains(a.WorkoutId))
                .ToList();

            var windowCancellations = cancelledAppointments
                .Where(c => InWindow(c.WorkoutDate, startSofia, endSofia))
                .ToList();

            var totalWorkouts = activeWindowWorkouts.Count;
            var totalBookings = windowBookings.Count;
            var totalCapacity = activeWindowWorkouts.Sum(w =>
                w.AvailableSpots + (appointmentsByWorkout.TryGetValue(w.Id, out var list) ? list.Count : 0));
            var avgBookings = totalWorkouts > 0 ? Math.Round((double)totalBookings / totalWorkouts, 1) : 0;
            var occupancyPercent = totalCapacity > 0 ? (int)Math.Round(totalBookings * 100.0 / totalCapacity) : 0;

            var pastBookings = windowBookings.Where(b => b.WorkoutDate <= nowSofia).ToList();
            var attendedCount = pastBookings.Count(b => b.IsAttended);
            var attendanceRate = pastBookings.Count > 0 ? (int)Math.Round(attendedCount * 100.0 / pastBookings.Count) : 0;
            var noShowCount = Math.Max(0, pastBookings.Count - attendedCount);

            var windowClientKeys = windowBookings
                .Select(b => BuildClientKey(b.NormalizedEmail, b.PhoneNumber, b.FullName))
                .Distinct(StringComparer.Ordinal)
                .ToList();

            var newClientsCount = windowClientKeys.Count(k =>
                firstBookingByClient.TryGetValue(k, out var firstDate) && InWindow(firstDate, startSofia, endSofia));
            var returningClientsCount = windowClientKeys.Count(k =>
                lifetimeBookingsCount.GetValueOrDefault(k) >= 2);
            var retentionRatePercent = windowClientKeys.Count > 0
                ? (int)Math.Round(returningClientsCount * 100.0 / windowClientKeys.Count)
                : 0;

            var totalBookingAttempts = totalBookings + windowCancellations.Count;
            var cancellationRatePercent = totalBookingAttempts > 0
                ? (int)Math.Round(windowCancellations.Count * 100.0 / totalBookingAttempts)
                : 0;

            var lateCancellationsCount = windowCancellations.Count(c =>
            {
                if (!c.CancelledAt.HasValue) return false;
                var cancelledUtc = DateTime.SpecifyKind(c.CancelledAt.Value, DateTimeKind.Utc);
                var workoutUtc = BulgariaTimeHelper.SofiaToUtc(c.WorkoutDate);
                return (workoutUtc - cancelledUtc).TotalHours <= 24;
            });

            // Previous period comparison
            var hasPrevious = prevStartSofia.HasValue && prevEndSofia.HasValue;
            var prevTotalWorkouts = 0;
            var prevTotalBookings = 0;
            double prevAvgBookings = 0;
            var prevOccupancyPercent = 0;
            var prevNewClientsCount = 0;

            if (hasPrevious)
            {
                var prevWorkouts = allWorkouts
                    .Where(w =>
                        !string.Equals(w.Status, "Cancelled", StringComparison.OrdinalIgnoreCase) &&
                        InWindow(w.Date, prevStartSofia, prevEndSofia))
                    .ToList();
                var prevWorkoutIds = new HashSet<string>(prevWorkouts.Select(w => w.Id));
                var prevBookings = allAppointments.Where(a => prevWorkoutIds.Contains(a.WorkoutId)).ToList();

                prevTotalWorkouts = prevWorkouts.Count;
                prevTotalBookings = prevBookings.Count;
                var prevCapacity = prevWorkouts.Sum(w =>
                    w.AvailableSpots + (appointmentsByWorkout.TryGetValue(w.Id, out var l) ? l.Count : 0));
                prevAvgBookings = prevTotalWorkouts > 0 ? Math.Round((double)prevTotalBookings / prevTotalWorkouts, 1) : 0;
                prevOccupancyPercent = prevCapacity > 0 ? (int)Math.Round(prevTotalBookings * 100.0 / prevCapacity) : 0;
                prevNewClientsCount = prevBookings
                    .Select(b => BuildClientKey(b.NormalizedEmail, b.PhoneNumber, b.FullName))
                    .Distinct(StringComparer.Ordinal)
                    .Count(k => firstBookingByClient.TryGetValue(k, out var fd) && InWindow(fd, prevStartSofia, prevEndSofia));
            }

            // Trend series
            var trend = BuildTrendPoints(activeWindowWorkouts, appointmentsByWorkout, startSofia, endSofia);

            // Top Time Slots
            var topSlots = activeWindowWorkouts
                .GroupBy(w => new { Day = w.Day ?? string.Empty, Time = w.Time ?? string.Empty })
                .Select(g =>
                {
                    var workoutsCount = g.Count();
                    var bookings = g.Sum(w => appointmentsByWorkout.TryGetValue(w.Id, out var l) ? l.Count : 0);
                    var capacity = g.Sum(w =>
                        w.AvailableSpots + (appointmentsByWorkout.TryGetValue(w.Id, out var l) ? l.Count : 0));
                    return new AnalyticsSlotItemDto
                    {
                        Day = g.Key.Day,
                        Time = g.Key.Time,
                        WorkoutsCount = workoutsCount,
                        TotalBookings = bookings,
                        TotalCapacity = capacity,
                        AverageBookings = workoutsCount > 0 ? Math.Round((double)bookings / workoutsCount, 1) : 0,
                        OccupancyPercent = capacity > 0 ? (int)Math.Round(bookings * 100.0 / capacity) : 0,
                    };
                })
                .OrderByDescending(s => s.OccupancyPercent)
                .ThenByDescending(s => s.TotalBookings)
                .Take(8)
                .ToList();

            // Weekday breakdown
            var weekdayOrder = new[]
            {
                "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
            };
            var weekdayBreakdown = weekdayOrder.Select(day =>
            {
                var dayWorkouts = activeWindowWorkouts
                    .Where(w => string.Equals(w.Day, day, StringComparison.OrdinalIgnoreCase))
                    .ToList();
                var bookings = dayWorkouts.Sum(w => appointmentsByWorkout.TryGetValue(w.Id, out var l) ? l.Count : 0);
                var capacity = dayWorkouts.Sum(w =>
                    w.AvailableSpots + (appointmentsByWorkout.TryGetValue(w.Id, out var l) ? l.Count : 0));
                return new AnalyticsWeekdayItemDto
                {
                    Day = day,
                    WorkoutsCount = dayWorkouts.Count,
                    TotalBookings = bookings,
                    TotalCapacity = capacity,
                    OccupancyPercent = capacity > 0 ? (int)Math.Round(bookings * 100.0 / capacity) : 0,
                };
            }).ToList();

            // Booking Lead Time
            var leadTime = ComputeLeadTime(windowBookings);

            // Shoes Demand & Sold-Out Rate
            var ownShoesCount = windowBookings.Count(b => b.UsesOwnShoes);
            var studioShoesCount = windowBookings.Count - ownShoesCount;
            var ownShoesShare = totalBookings > 0 ? (int)Math.Round(ownShoesCount * 100.0 / totalBookings) : 0;

            var sizeItems = Enum.GetValues<ShoesSize>().Select(size =>
            {
                var bookingsForSize = windowBookings.Count(b => !b.UsesOwnShoes && b.ShoeSize == size);
                var sharePercent = totalBookings > 0 ? (int)Math.Round(bookingsForSize * 100.0 / totalBookings) : 0;

                var workoutsWithSize = activeWindowWorkouts
                    .Where(w => w.Shoes.Any(s => s.Size == size))
                    .ToList();
                var soldOutCount = workoutsWithSize
                    .Count(w => w.Shoes.Where(s => s.Size == size).All(s => s.IsTaken));
                var soldOutRate = workoutsWithSize.Count > 0
                    ? (int)Math.Round(soldOutCount * 100.0 / workoutsWithSize.Count)
                    : 0;

                return new AnalyticsShoeSizeItemDto
                {
                    Size = size,
                    InventoryCount = inventoryBySize.GetValueOrDefault(size),
                    BookingsCount = bookingsForSize,
                    SharePercent = sharePercent,
                    SoldOutWorkoutsCount = soldOutCount,
                    SoldOutRatePercent = soldOutRate,
                };
            }).ToList();

            // Top Clients in window
            var topClients = BuildSummariesFromRows(windowBookings, nowSofia)
                .OrderByDescending(c => c.TotalBookings)
                .ThenByDescending(c => c.AttendedCount)
                .Take(8)
                .ToList();

            // Inactive Regulars across all-time history (30+ days since last visit, >=2 visits, 0 upcoming)
            var inactiveThreshold = nowSofia.AddDays(-30);
            var allTimeClientGroups = allAppointments
                .GroupBy(a => BuildClientKey(a.NormalizedEmail, a.PhoneNumber, a.FullName));

            var inactiveRegulars = new List<AnalyticsInactiveClientDto>();
            foreach (var group in allTimeClientGroups)
            {
                var items = group.OrderByDescending(x => x.CreatedOn).ToList();
                if (items.Count < 2) continue;

                var hasUpcoming = items.Any(x =>
                    x.WorkoutDate > nowSofia &&
                    !string.Equals(x.WorkoutStatus, "Cancelled", StringComparison.OrdinalIgnoreCase));
                if (hasUpcoming) continue;

                var lastWorkoutSofia = items.Max(x => x.WorkoutDate);
                if (lastWorkoutSofia > inactiveThreshold) continue;

                var daysSince = Math.Max(0, (int)Math.Floor((nowSofia - lastWorkoutSofia).TotalDays));
                inactiveRegulars.Add(new AnalyticsInactiveClientDto
                {
                    ClientKey = group.Key,
                    FullName = items.Select(x => x.FullName).FirstOrDefault(n => !string.IsNullOrWhiteSpace(n)) ?? "Guest",
                    PhoneNumber = items.Select(x => x.PhoneNumber).FirstOrDefault(p => !string.IsNullOrWhiteSpace(p)) ?? string.Empty,
                    Email = items.Select(x => x.Email).FirstOrDefault(e => !string.IsNullOrWhiteSpace(e)) ?? string.Empty,
                    TotalBookings = items.Count,
                    AttendedCount = items.Count(x => x.IsAttended),
                    LastWorkoutDate = BulgariaTimeHelper.SofiaToUtc(lastWorkoutSofia),
                    DaysSinceLastWorkout = daysSince,
                });
            }

            inactiveRegulars = inactiveRegulars
                .OrderByDescending(c => c.TotalBookings)
                .ThenBy(c => c.DaysSinceLastWorkout)
                .Take(10)
                .ToList();

            return new AdminAnalyticsDto
            {
                Range = normalizedRange,
                StartDateUtc = startSofia.HasValue ? BulgariaTimeHelper.SofiaToUtc(startSofia.Value) : null,
                EndDateUtc = endSofia.HasValue ? BulgariaTimeHelper.SofiaToUtc(endSofia.Value) : null,
                HasPreviousPeriod = hasPrevious,
                Kpis = new AnalyticsKpiSummaryDto
                {
                    TotalWorkouts = totalWorkouts,
                    PreviousTotalWorkouts = prevTotalWorkouts,
                    CancelledWorkouts = cancelledWorkoutsCount,
                    TotalBookings = totalBookings,
                    PreviousTotalBookings = prevTotalBookings,
                    AverageBookingsPerWorkout = avgBookings,
                    PreviousAverageBookingsPerWorkout = prevAvgBookings,
                    OccupancyRatePercent = occupancyPercent,
                    PreviousOccupancyRatePercent = prevOccupancyPercent,
                    AttendanceRatePercent = attendanceRate,
                    AttendedCount = attendedCount,
                    PastBookingsCount = pastBookings.Count,
                    NoShowCount = noShowCount,
                    NewClientsCount = newClientsCount,
                    PreviousNewClientsCount = prevNewClientsCount,
                    ReturningClientsCount = returningClientsCount,
                    RetentionRatePercent = retentionRatePercent,
                    CancelledBookingsCount = windowCancellations.Count,
                    CancellationRatePercent = cancellationRatePercent,
                    LateCancellationsCount = lateCancellationsCount,
                },
                Trend = trend,
                TopTimeSlots = topSlots,
                WeekdayBreakdown = weekdayBreakdown,
                LeadTime = leadTime,
                ShoesDemand = new AnalyticsShoesDemandDto
                {
                    OwnShoesBookingsCount = ownShoesCount,
                    StudioShoesBookingsCount = studioShoesCount,
                    OwnShoesSharePercent = ownShoesShare,
                    Sizes = sizeItems,
                },
                TopClients = topClients,
                InactiveRegulars = inactiveRegulars,
            };
        }

        public async Task<(byte[] Content, string FileName)> ExportAnalyticsCsvAsync(
            string type = "workouts",
            string range = "30d",
            DateTime? from = null,
            DateTime? to = null,
            CancellationToken cancellationToken = default)
        {
            var nowSofia = BulgariaTimeHelper.GetCurrentSofiaTime();
            var (normalizedRange, startSofia, endSofia, _, _) =
                ResolveAnalyticsWindow(range, from, to, nowSofia);

            bool InWindow(DateTime sofiaDate) =>
                (!startSofia.HasValue || sofiaDate >= startSofia.Value) &&
                (!endSofia.HasValue || sofiaDate <= endSofia.Value);

            var sb = new StringBuilder();
            var normalizedType = (type ?? "workouts").Trim().ToLowerInvariant();
            string fileName;

            if (normalizedType == "clients")
            {
                var rows = await _context.Appointments
                    .AsNoTracking()
                    .Where(a => a.Workout != null && !a.Workout.IsDeleted)
                    .Select(a => new AppointmentAnalyticsRow
                    {
                        Id = a.Id,
                        WorkoutId = a.WorkoutId,
                        FullName = a.FullName,
                        Email = a.Email,
                        NormalizedEmail = a.NormalizedEmail,
                        PhoneNumber = a.PhoneNumber,
                        ShoeSize = a.Shoe != null ? (ShoesSize?)a.Shoe.Size : null,
                        UsesOwnShoes = a.UsesOwnShoes,
                        IsAttended = a.IsAttended,
                        CreatedOn = a.CreatedOn,
                        WorkoutDate = a.Workout.Date,
                        WorkoutDay = a.Workout.Day,
                        WorkoutTime = a.Workout.Time,
                        WorkoutStatus = a.Workout.Status,
                    })
                    .ToListAsync(cancellationToken);

                var filtered = rows.Where(r => InWindow(r.WorkoutDate)).ToList();
                var clients = BuildSummariesFromRows(filtered, nowSofia)
                    .OrderByDescending(c => c.TotalBookings)
                    .ToList();

                sb.AppendLine("FullName,PhoneNumber,Email,TotalBookings,AttendedCount,UpcomingBookings,PreferredShoe,LastWorkoutDate");
                foreach (var c in clients)
                {
                    var shoeLabel = c.UsesOwnShoesMostly
                        ? "Own"
                        : (c.PreferredShoeSize.HasValue ? c.PreferredShoeSize.Value.ToString().ToUpperInvariant() : string.Empty);

                    sb.AppendLine(string.Join(",",
                        EscapeCsv(c.FullName),
                        EscapeCsv(c.PhoneNumber),
                        EscapeCsv(c.Email),
                        c.TotalBookings.ToString(CultureInfo.InvariantCulture),
                        c.AttendedCount.ToString(CultureInfo.InvariantCulture),
                        c.UpcomingBookings.ToString(CultureInfo.InvariantCulture),
                        EscapeCsv(shoeLabel),
                        EscapeCsv(c.LastWorkoutDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))));
                }

                fileName = $"jwj-clients-{normalizedRange}-{nowSofia:yyyyMMdd}.csv";
            }
            else
            {
                var workouts = await _context.Workouts
                    .AsNoTracking()
                    .OrderBy(w => w.Date)
                    .Select(w => new
                    {
                        w.Date,
                        w.Day,
                        w.Time,
                        w.Status,
                        w.AvailableSpots,
                        w.TrainerNote,
                        Appointments = w.Appointments
                            .Where(a => !a.IsDeleted)
                            .Select(a => new
                            {
                                a.IsAttended,
                                a.UsesOwnShoes,
                                ShoeSize = a.Shoe != null ? (ShoesSize?)a.Shoe.Size : null,
                            })
                            .ToList(),
                    })
                    .ToListAsync(cancellationToken);

                var filteredWorkouts = workouts.Where(w => InWindow(w.Date)).ToList();

                sb.AppendLine("Date,Day,Time,Status,BookedSpots,AvailableSpots,TotalSpots,AttendedCount,OwnShoes,SizeS,SizeM,SizeL,SizeXL,TrainerNote");
                foreach (var w in filteredWorkouts)
                {
                    var booked = w.Appointments.Count;
                    var total = booked + w.AvailableSpots;
                    var attended = w.Appointments.Count(a => a.IsAttended);
                    var own = w.Appointments.Count(a => a.UsesOwnShoes);
                    var s = w.Appointments.Count(a => !a.UsesOwnShoes && a.ShoeSize == ShoesSize.s);
                    var m = w.Appointments.Count(a => !a.UsesOwnShoes && a.ShoeSize == ShoesSize.m);
                    var l = w.Appointments.Count(a => !a.UsesOwnShoes && a.ShoeSize == ShoesSize.l);
                    var xl = w.Appointments.Count(a => !a.UsesOwnShoes && a.ShoeSize == ShoesSize.xl);

                    sb.AppendLine(string.Join(",",
                        EscapeCsv(w.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)),
                        EscapeCsv(w.Day),
                        EscapeCsv(w.Time),
                        EscapeCsv(w.Status),
                        booked.ToString(CultureInfo.InvariantCulture),
                        w.AvailableSpots.ToString(CultureInfo.InvariantCulture),
                        total.ToString(CultureInfo.InvariantCulture),
                        attended.ToString(CultureInfo.InvariantCulture),
                        own.ToString(CultureInfo.InvariantCulture),
                        s.ToString(CultureInfo.InvariantCulture),
                        m.ToString(CultureInfo.InvariantCulture),
                        l.ToString(CultureInfo.InvariantCulture),
                        xl.ToString(CultureInfo.InvariantCulture),
                        EscapeCsv(w.TrainerNote ?? string.Empty)));
                }

                fileName = $"jwj-workouts-{normalizedRange}-{nowSofia:yyyyMMdd}.csv";
            }

            var preamble = Encoding.UTF8.GetPreamble();
            var body = Encoding.UTF8.GetBytes(sb.ToString());
            var result = new byte[preamble.Length + body.Length];
            Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
            Buffer.BlockCopy(body, 0, result, preamble.Length, body.Length);

            return (result, fileName);
        }

        private static (string Range, DateTime? StartSofia, DateTime? EndSofia, DateTime? PrevStartSofia, DateTime? PrevEndSofia) ResolveAnalyticsWindow(
            string range,
            DateTime? from,
            DateTime? to,
            DateTime nowSofia)
        {
            var normalized = (range ?? "30d").Trim().ToLowerInvariant();
            var today = nowSofia.Date;

            switch (normalized)
            {
                case "7d":
                {
                    var start = today.AddDays(-6);
                    var end = today.AddDays(1).AddTicks(-1);
                    return ("7d", start, end, start.AddDays(-7), start.AddTicks(-1));
                }
                case "30d":
                {
                    var start = today.AddDays(-29);
                    var end = today.AddDays(1).AddTicks(-1);
                    return ("30d", start, end, start.AddDays(-30), start.AddTicks(-1));
                }
                case "90d":
                {
                    var start = today.AddDays(-89);
                    var end = today.AddDays(1).AddTicks(-1);
                    return ("90d", start, end, start.AddDays(-90), start.AddTicks(-1));
                }
                case "year":
                {
                    var start = new DateTime(today.Year, 1, 1);
                    var end = new DateTime(today.Year, 12, 31, 23, 59, 59);
                    var prevStart = new DateTime(today.Year - 1, 1, 1);
                    var prevEnd = new DateTime(today.Year - 1, 12, 31, 23, 59, 59);
                    return ("year", start, end, prevStart, prevEnd);
                }
                case "custom":
                {
                    if (!from.HasValue || !to.HasValue)
                    {
                        throw new ArgumentException("Both 'from' and 'to' dates are required for custom range.");
                    }

                    var start = BulgariaTimeHelper.NormalizeToSofiaWallClock(from.Value).Date;
                    var endDate = BulgariaTimeHelper.NormalizeToSofiaWallClock(to.Value).Date;
                    if (start > endDate)
                    {
                        throw new ArgumentException("Start date cannot be after end date.");
                    }

                    var spanDays = (int)(endDate - start).TotalDays + 1;
                    var end = endDate.AddDays(1).AddTicks(-1);
                    return ("custom", start, end, start.AddDays(-spanDays), start.AddTicks(-1));
                }
                case "all":
                    return ("all", null, null, null, null);
                default:
                {
                    var start = today.AddDays(-29);
                    var end = today.AddDays(1).AddTicks(-1);
                    return ("30d", start, end, start.AddDays(-30), start.AddTicks(-1));
                }
            }
        }

        private static List<AnalyticsTrendPointDto> BuildTrendPoints(
            List<WorkoutAnalyticsRow> workouts,
            Dictionary<string, List<AppointmentAnalyticsRow>> appointmentsByWorkout,
            DateTime? startSofia,
            DateTime? endSofia)
        {
            if (workouts.Count == 0)
            {
                return new List<AnalyticsTrendPointDto>();
            }

            var minDate = (startSofia ?? workouts.Min(w => w.Date)).Date;
            var maxDate = (endSofia ?? workouts.Max(w => w.Date)).Date;
            var spanDays = Math.Max(1, (int)(maxDate - minDate).TotalDays + 1);

            DateTime BucketKey(DateTime date)
            {
                if (spanDays <= 14)
                {
                    return date.Date;
                }
                if (spanDays <= 120)
                {
                    var diff = ((int)date.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
                    return date.Date.AddDays(-diff);
                }
                return new DateTime(date.Year, date.Month, 1);
            }

            string BucketLabel(DateTime bucketStart)
            {
                if (spanDays <= 120)
                {
                    return bucketStart.ToString("dd.MM", CultureInfo.InvariantCulture);
                }
                return bucketStart.ToString("MM.yyyy", CultureInfo.InvariantCulture);
            }

            return workouts
                .GroupBy(w => BucketKey(w.Date))
                .OrderBy(g => g.Key)
                .TakeLast(16)
                .Select(g =>
                {
                    var bookings = g.Sum(w => appointmentsByWorkout.TryGetValue(w.Id, out var l) ? l.Count : 0);
                    var attended = g.Sum(w => appointmentsByWorkout.TryGetValue(w.Id, out var l) ? l.Count(a => a.IsAttended) : 0);
                    var capacity = g.Sum(w =>
                        w.AvailableSpots + (appointmentsByWorkout.TryGetValue(w.Id, out var l) ? l.Count : 0));

                    return new AnalyticsTrendPointDto
                    {
                        Label = BucketLabel(g.Key),
                        BucketStartUtc = BulgariaTimeHelper.SofiaToUtc(g.Key),
                        WorkoutsCount = g.Count(),
                        BookingsCount = bookings,
                        AttendedCount = attended,
                        CapacityCount = capacity,
                        OccupancyPercent = capacity > 0 ? (int)Math.Round(bookings * 100.0 / capacity) : 0,
                    };
                })
                .ToList();
        }

        private static AnalyticsLeadTimeDto ComputeLeadTime(List<AppointmentAnalyticsRow> bookings)
        {
            var sameDay = 0;
            var oneToTwo = 0;
            var threeToSeven = 0;
            var overSeven = 0;
            double totalHours = 0;
            var measured = 0;

            foreach (var b in bookings)
            {
                var createdUtc = DateTime.SpecifyKind(b.CreatedOn, DateTimeKind.Utc);
                var workoutUtc = BulgariaTimeHelper.SofiaToUtc(b.WorkoutDate);
                var hours = (workoutUtc - createdUtc).TotalHours;
                if (hours < 0) continue;

                measured++;
                totalHours += hours;

                if (hours < 24)
                {
                    sameDay++;
                }
                else if (hours <= 72)
                {
                    oneToTwo++;
                }
                else if (hours <= 168)
                {
                    threeToSeven++;
                }
                else
                {
                    overSeven++;
                }
            }

            return new AnalyticsLeadTimeDto
            {
                AverageHoursBefore = measured > 0 ? Math.Round(totalHours / measured, 1) : 0,
                SameDayCount = sameDay,
                OneToTwoDaysCount = oneToTwo,
                ThreeToSevenDaysCount = threeToSeven,
                OverSevenDaysCount = overSeven,
                TotalMeasured = measured,
            };
        }

        private static List<AdminClientSummaryDto> BuildSummariesFromRows(
            List<AppointmentAnalyticsRow> rows,
            DateTime nowSofia)
        {
            var grouped = rows.GroupBy(r => BuildClientKey(r.NormalizedEmail, r.PhoneNumber, r.FullName));
            var result = new List<AdminClientSummaryDto>();

            foreach (var group in grouped)
            {
                var bookings = group.OrderByDescending(x => x.CreatedOn).ToList();
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
                });
            }

            return result;
        }

        private static string EscapeCsv(string value)
        {
            var raw = value ?? string.Empty;
            if (raw.Length > 0 && (raw[0] == '=' || raw[0] == '+' || raw[0] == '-' || raw[0] == '@' || raw[0] == '\t' || raw[0] == '\r'))
            {
                raw = "'" + raw;
            }

            if (raw.Contains('"') || raw.Contains(',') || raw.Contains('\n') || raw.Contains('\r'))
            {
                return $"\"{raw.Replace("\"", "\"\"")}\"";
            }

            return raw;
        }

        private sealed class WorkoutAnalyticsRow
        {
            public string Id { get; set; }
            public string Day { get; set; }
            public string Time { get; set; }
            public DateTime Date { get; set; }
            public string Status { get; set; }
            public int AvailableSpots { get; set; }
            public string TrainerNote { get; set; }
            public List<WorkoutShoeAnalyticsRow> Shoes { get; set; } = new();
        }

        private sealed class WorkoutShoeAnalyticsRow
        {
            public ShoesSize Size { get; set; }
            public bool IsTaken { get; set; }
        }

        private sealed class AppointmentAnalyticsRow
        {
            public string Id { get; set; }
            public string WorkoutId { get; set; }
            public string FullName { get; set; }
            public string Email { get; set; }
            public string NormalizedEmail { get; set; }
            public string PhoneNumber { get; set; }
            public ShoesSize? ShoeSize { get; set; }
            public bool UsesOwnShoes { get; set; }
            public bool IsAttended { get; set; }
            public DateTime CreatedOn { get; set; }
            public DateTime WorkoutDate { get; set; }
            public string WorkoutDay { get; set; }
            public string WorkoutTime { get; set; }
            public string WorkoutStatus { get; set; }
        }

        private sealed class CancelledAppointmentRow
        {
            public string Id { get; set; }
            public string WorkoutId { get; set; }
            public DateTime? CancelledAt { get; set; }
            public DateTime WorkoutDate { get; set; }
            public string WorkoutStatus { get; set; }
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
