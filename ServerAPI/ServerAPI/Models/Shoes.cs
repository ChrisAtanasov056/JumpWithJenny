namespace ServerAPI.Models
{
    using ServerAPI.Models.Common;
    using ServerAPI.Models.Enums;
    using System.ComponentModel.DataAnnotations;

    public class Shoes  : BaseDeletableModel
    {
        public Shoes()
        {
            UsersHistory = new List<User>();
        }
        [Required]
        public ShoesSize Size { get; set; }

        public bool IsTaken { get; set; }

        public ICollection<User> UsersHistory { get; set; }
    }  
}
