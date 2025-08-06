using ServerAPI.Models.Common;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServerAPI.Models
{
    public class User : IdentityUser<string>, IAuditInfo, IDeletableEntity
    {
        public User()
        {
            Id = Guid.NewGuid().ToString();
            Appointments = new List<Appointment>();
        }

        [Column(TypeName = "varchar(50)")] 
        public string FirstName { get; set; }
        [Column(TypeName = "varchar(50)")] 
        public string LastName { get; set; }

        public int? Age { get; set; }

        [Column(TypeName = "varchar(100)")] 
        public string City { get; set; }

        public string ProfilePictureUrl { get; set; }

        [Column(TypeName = "text")] 
        public string Description { get; set; }

        [Column(TypeName = "varchar(100)")]
        public string ProviderId { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string ProviderName { get; set; } 

        public bool IsExternalLogin { get; set; } = false;


        public ICollection<Appointment> Appointments { get; set; }

        // Audit Info
        public DateTime CreatedOn { get; set; }

        public DateTime? ModifiedOn { get; set; }

        // Deletable Entity
        public DateTime? DeletedOn { get; set; }

        public bool IsDeleted { get; set; }
    }
}
