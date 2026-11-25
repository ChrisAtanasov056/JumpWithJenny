namespace ServerAPI.Models.Schedule
{
    public enum BookingErrorCode
    {
        WorkoutNotFound,
        UserNotFound,
        EmailNotConfirmed,
        WorkoutInPast,
        WorkoutNotAvailable,
        AlreadyRegistered,
        NoAvailableSpots,
        NoAvailableShoes,
        InvalidShoeSize,
        InvalidCardType,
        ConcurrencyConflict,
        InvalidFullName,
        InvalidEmail,
        InvalidPhoneNumber,
        MaxActiveBookingsReached,
        BookingNotFound
    }

    public class ScheduleBookingException : Exception
    {
        public ScheduleBookingException(
            BookingErrorCode errorCode,
            string code,
            string message,
            Exception innerException = null)
            : base(message, innerException)
        {
            ErrorCode = errorCode;
            Code = code;
        }

        public BookingErrorCode ErrorCode { get; }

        public string Code { get; }
    }
}
