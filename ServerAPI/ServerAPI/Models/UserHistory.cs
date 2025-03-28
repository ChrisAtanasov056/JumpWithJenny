namespace ServerAPI.Models
{
    using System.ComponentModel.DataAnnotations;

    public class UserHistory
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string ?UserId { get; set; }
    public User ?User { get; set; }

    [Required]
    public string ?ShoeId { get; set; }
    public Shoes ?Shoe { get; set; }

    [Required]
    public string ?WorkoutId { get; set; }
    public Workout ?Workout { get; set; }

    public DateTime UsedAt { get; set; } = DateTime.UtcNow;
}
}