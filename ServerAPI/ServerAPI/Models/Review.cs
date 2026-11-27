namespace ServerAPI.Models
{
    using System;
    using System.ComponentModel.DataAnnotations;
    using ServerAPI.Models.Common;
    using ServerAPI.Models.Enums;

    public class Review : BaseDeletableModel
    {
        [Required]
        [MaxLength(80)]
        public string AuthorName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Comment { get; set; } = string.Empty;

        [Range(1, 5)]
        public int Rating { get; set; } = 5;

        public ReviewStatus Status { get; set; } = ReviewStatus.Pending;

        [Required]
        [MaxLength(20)]
        public string Source { get; set; } = "Site";

        public DateTime? ApprovedOn { get; set; }
    }
}
