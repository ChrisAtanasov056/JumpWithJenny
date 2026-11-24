namespace ServerAPI.Models.Common
{
    using System;
    using System.ComponentModel.DataAnnotations;

    public abstract class BaseModel : IAuditInfo
    {
        public BaseModel()
        {
            this.Id = Guid.NewGuid().ToString();
        }
        [Key]
        public string Id { get; set; }

        public DateTime CreatedOn { get; set; }

        public DateTime? ModifiedOn { get; set; }
    }
}
