using ServerAPI.Models.Common;

namespace ServerAPI.Models
{
    using Microsoft.AspNetCore.Identity;
    using System.ComponentModel.DataAnnotations.Schema;

    public class User : IdentityUser<string>, IAuditInfo, IDeletableEntity
    {
        public User()
        {
            Id = Guid.NewGuid().ToString();
            Appointments = new LinkedList<Appointment>();
        }
        [Column(TypeName = "nvarchar(50)")]
        public string? FirstName { get; set; }
        [Column(TypeName = "nvarchar(50)")]
        public string? LastName { get; set; }

        public int? Age { get; set; }

        [Column(TypeName = "nvarchar(100)")]
        public string? City { get; set; }

        public string? ProfilePictureUrl { get; set; }

        [Column(TypeName = "nvarchar(500)")]

        public string? Description { get; set; }

        public ICollection<Appointment> Appointments { get; set; }


        // Audit Info
        public DateTime CreatedOn { get; set; }

        public DateTime? ModifiedOn { get; set; }

        // Deletable Entity
        public DateTime? DeletedOn { get; set; }

        public bool IsDeleted { get; set; }
    }
}
