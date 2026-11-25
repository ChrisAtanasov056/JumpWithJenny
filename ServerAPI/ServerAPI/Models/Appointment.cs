namespace ServerAPI.Models
{
    using ServerAPI.Models.Common;
    using ServerAPI.Models.Enums;
    using System.ComponentModel.DataAnnotations;

    public class Appointment : BaseDeletableModel
    {
        public string UserId { get; set; }

        public User User { get; set; }

        [Required]
        public string WorkoutId { get; set; }

        public Workout Workout { get; set; }

        [Required]
        [MaxLength(120)]
        public string FullName { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(254)]
        public string Email { get; set; }

        [Required]
        [MaxLength(254)]
        public string NormalizedEmail { get; set; }

        [Required]
        [MaxLength(30)]
        public string PhoneNumber { get; set; }

        [Required]
        [MaxLength(128)]
        public string CancellationToken { get; set; }

        public CardType? CardType { get; set; }

        public string ShoeId { get; set; }

        public Shoes Shoe { get; set; }

        public bool IsConfirmed { get; set; } = false;

        public bool UsesOwnShoes { get; set; }
    }
}
