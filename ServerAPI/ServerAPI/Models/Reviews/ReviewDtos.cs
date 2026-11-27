namespace ServerAPI.Models.Reviews
{
    using System;
    using System.Collections.Generic;

    public class PublicReviewDto
    {
        public string Id { get; set; } = string.Empty;

        public string AuthorName { get; set; } = string.Empty;

        public string Comment { get; set; } = string.Empty;

        public int Rating { get; set; }

        public string Source { get; set; } = "Site";

        public DateTime CreatedOn { get; set; }
    }

    public class AdminReviewDto
    {
        public string Id { get; set; } = string.Empty;

        public string AuthorName { get; set; } = string.Empty;

        public string Comment { get; set; } = string.Empty;

        public int Rating { get; set; }

        public string Status { get; set; } = "Pending";

        public string Source { get; set; } = "Site";

        public DateTime CreatedOn { get; set; }

        public DateTime? ApprovedOn { get; set; }
    }

    public class AdminReviewCountsDto
    {
        public int All { get; set; }

        public int Pending { get; set; }

        public int Approved { get; set; }

        public int Rejected { get; set; }
    }

    public class AdminReviewsListResponseDto
    {
        public List<AdminReviewDto> Items { get; set; } = new();

        public AdminReviewCountsDto Counts { get; set; } = new();
    }

    public class CreatePublicReviewRequest
    {
        public string AuthorName { get; set; } = string.Empty;

        public string Comment { get; set; } = string.Empty;

        public int Rating { get; set; } = 5;

        public string Website { get; set; }
    }

    public class AdminUpsertReviewRequest
    {
        public string AuthorName { get; set; } = string.Empty;

        public string Comment { get; set; } = string.Empty;

        public int Rating { get; set; } = 5;

        public string Status { get; set; }

        public string Source { get; set; }
    }

    public class UpdateReviewStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class ReviewOperationResult<T>
    {
        public bool Success { get; set; }

        public bool NotFound { get; set; }

        public string ErrorCode { get; set; }

        public string ErrorMessage { get; set; }

        public T Data { get; set; }

        public static ReviewOperationResult<T> Ok(T data) => new()
        {
            Success = true,
            Data = data,
        };

        public static ReviewOperationResult<T> Fail(string errorCode, string errorMessage) => new()
        {
            Success = false,
            ErrorCode = errorCode,
            ErrorMessage = errorMessage,
        };

        public static ReviewOperationResult<T> Missing(string errorMessage = "Review not found.") => new()
        {
            Success = false,
            NotFound = true,
            ErrorCode = "REVIEW_NOT_FOUND",
            ErrorMessage = errorMessage,
        };
    }
}
