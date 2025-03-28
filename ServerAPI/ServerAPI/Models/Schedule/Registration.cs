namespace ServerAPI.Models.Schedule
{
    public class Registration
{
    public string Id { get; set; } = Guid.NewGuid().ToString(); // Unique ID for the registration
    public string WorkoutId { get; set; } // ID of the workout
    public string UserId { get; set; } // ID of the user
    public string Shoe { get; set; } // Shoe size of the user
    public string CardType { get; set; } // Type of card used
    public DateTime RegistrationDate { get; set; } // Date and time of registration
}
}