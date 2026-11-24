namespace ServerAPI.Common
{
    using System;

    public static class BulgariaTimeHelper
    {
        public static readonly TimeZoneInfo BulgariaTimeZone = ResolveBulgariaTimeZone();

        private static TimeZoneInfo ResolveBulgariaTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Europe/Sofia");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("FLE Standard Time");
            }
        }

        public static DateTime GetCurrentSofiaTime()
        {
            var sofiaNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, BulgariaTimeZone);
            return DateTime.SpecifyKind(sofiaNow, DateTimeKind.Unspecified);
        }

        public static DateTime NormalizeToSofiaWallClock(DateTime date, string time = null)
        {
            if (date == default)
            {
                throw new ArgumentException("Workout date is required.");
            }

            if (date.Kind == DateTimeKind.Utc)
            {
                var sofia = TimeZoneInfo.ConvertTimeFromUtc(date, BulgariaTimeZone);
                return DateTime.SpecifyKind(sofia, DateTimeKind.Unspecified);
            }

            if (date.Kind == DateTimeKind.Local)
            {
                var sofia = TimeZoneInfo.ConvertTimeFromUtc(date.ToUniversalTime(), BulgariaTimeZone);
                return DateTime.SpecifyKind(sofia, DateTimeKind.Unspecified);
            }

            if (date.TimeOfDay == TimeSpan.Zero &&
                !string.IsNullOrWhiteSpace(time) &&
                TimeSpan.TryParse(time.Trim(), out var parsedTime))
            {
                date = date.Date.Add(parsedTime);
            }

            if (BulgariaTimeZone.IsInvalidTime(date))
            {
                throw new ArgumentException("The specified workout date/time does not exist in Europe/Sofia due to daylight saving time.");
            }

            return DateTime.SpecifyKind(date, DateTimeKind.Unspecified);
        }

        public static DateTime SofiaToUtc(DateTime sofiaDate)
        {
            if (sofiaDate == default || sofiaDate.Year <= 1)
            {
                return DateTime.SpecifyKind(sofiaDate, DateTimeKind.Utc);
            }

            if (sofiaDate.Kind == DateTimeKind.Utc)
            {
                return sofiaDate;
            }

            if (sofiaDate.Kind == DateTimeKind.Local)
            {
                return sofiaDate.ToUniversalTime();
            }

            var unspecified = DateTime.SpecifyKind(sofiaDate, DateTimeKind.Unspecified);
            if (BulgariaTimeZone.IsInvalidTime(unspecified))
            {
                unspecified = unspecified.AddHours(1);
            }

            return TimeZoneInfo.ConvertTimeToUtc(unspecified, BulgariaTimeZone);
        }

        public static DateTime GetNextUpcomingSofiaDate(DayOfWeek targetDay, TimeSpan timeOfDay, DateTime? referenceSofiaNow = null)
        {
            var now = referenceSofiaNow ?? GetCurrentSofiaTime();
            var daysUntil = ((int)targetDay - (int)now.DayOfWeek + 7) % 7;
            var candidate = now.Date.AddDays(daysUntil).Add(timeOfDay);

            if (candidate <= now)
            {
                candidate = candidate.AddDays(7);
            }

            if (BulgariaTimeZone.IsInvalidTime(candidate))
            {
                candidate = candidate.AddHours(1);
            }

            return DateTime.SpecifyKind(candidate, DateTimeKind.Unspecified);
        }
    }
}
