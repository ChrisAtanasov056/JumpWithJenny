namespace ServerAPI.Models
{
    using ServerAPI.Models.Common;
    using ServerAPI.Models.Enums;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;

    public class Shoes : BaseDeletableModel
    {
        public Shoes()
        {
            this.UsersHistory = new List<UserHistory>();  // To track the history of users who used this shoe
            this.Workouts = new List<WorkoutShoes>();      // To store workouts associated with this shoe
        }

        [Required]
        public ShoesSize Size { get; set; }  // Enum for shoe sizes (S, M, L, XL)

        public ICollection<UserHistory> UsersHistory { get; set; }  // Collection to track shoe usage history

        public ICollection<WorkoutShoes> Workouts { get; set; }  // Many-to-many relationship with workouts (through WorkoutShoes)
    }
}