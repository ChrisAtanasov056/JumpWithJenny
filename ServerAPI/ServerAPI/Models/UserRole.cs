using Microsoft.AspNetCore.Identity;
using ServerAPI.Models.Common;

namespace ServerAPI.Models
{
    public class UserRole : IdentityRole, IAuditInfo, IDeletableEntity
    {
        public UserRole()
            : this(null)
        {

        }
        public UserRole(string name)
            : base(name)
        {
            this.Id = Guid.NewGuid().ToString();
        }
        // AuditInfo
        public DateTime CreatedOn { get; set; }

        public DateTime? ModifiedOn { get; set; }

        // Deletable Entity
        public DateTime? DeletedOn { get; set; }
        public bool IsDeleted { get; set; }

    }
}
