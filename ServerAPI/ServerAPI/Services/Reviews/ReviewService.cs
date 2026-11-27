namespace ServerAPI.Services.Reviews
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Data;
    using ServerAPI.Models;
    using ServerAPI.Models.Enums;
    using ServerAPI.Models.Reviews;

    public class ReviewService : IReviewService
    {
        private const int MinAuthorLength = 2;
        private const int MaxAuthorLength = 80;
        private const int MinCommentLength = 10;
        private const int MaxCommentLength = 200;

        private static readonly HashSet<string> AllowedSources = new(StringComparer.OrdinalIgnoreCase)
        {
            "Site",
            "Google",
            "Admin",
        };

        private static readonly Regex WhitespaceRegex = new(@"\s+", RegexOptions.Compiled);
        private static readonly Regex UrlRegex = new(@"(https?://|www\.)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private readonly JumpWithJennyDbContext _dbContext;

        public ReviewService(JumpWithJennyDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<PublicReviewDto>> GetApprovedReviewsAsync(CancellationToken cancellationToken = default)
        {
            return await _dbContext.Reviews
                .AsNoTracking()
                .Where(r => r.Status == ReviewStatus.Approved)
                .OrderByDescending(r => r.ApprovedOn ?? r.CreatedOn)
                .ThenByDescending(r => r.CreatedOn)
                .Select(r => new PublicReviewDto
                {
                    Id = r.Id,
                    AuthorName = r.AuthorName,
                    Comment = r.Comment,
                    Rating = r.Rating,
                    Source = r.Source,
                    CreatedOn = r.CreatedOn,
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<ReviewOperationResult<bool>> CreatePublicReviewAsync(
            CreatePublicReviewRequest request,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return ReviewOperationResult<bool>.Fail("INVALID_REQUEST", "Request body is required.");
            }

            // Silently succeed if the honeypot field was filled by a bot.
            if (!string.IsNullOrWhiteSpace(request.Website))
            {
                return ReviewOperationResult<bool>.Ok(true);
            }

            var (isValid, errorCode, errorMessage, normalizedAuthor, normalizedComment) =
                ValidateCoreFields(request.AuthorName, request.Comment, request.Rating);

            if (!isValid)
            {
                return ReviewOperationResult<bool>.Fail(errorCode!, errorMessage!);
            }

            if (ContainsUrl(normalizedAuthor) || ContainsUrl(normalizedComment))
            {
                return ReviewOperationResult<bool>.Fail("LINKS_NOT_ALLOWED", "Links are not allowed in reviews.");
            }

            var review = new Review
            {
                AuthorName = normalizedAuthor,
                Comment = normalizedComment,
                Rating = request.Rating,
                Status = ReviewStatus.Pending,
                Source = "Site",
                ApprovedOn = null,
            };

            await _dbContext.Reviews.AddAsync(review, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return ReviewOperationResult<bool>.Ok(true);
        }

        public async Task<AdminReviewsListResponseDto> GetAdminReviewsAsync(
            ReviewStatus? statusFilter,
            string search,
            CancellationToken cancellationToken = default)
        {
            var groupedCounts = await _dbContext.Reviews
                .AsNoTracking()
                .GroupBy(r => r.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync(cancellationToken);

            var counts = new AdminReviewCountsDto();
            foreach (var entry in groupedCounts)
            {
                switch (entry.Status)
                {
                    case ReviewStatus.Pending:
                        counts.Pending = entry.Count;
                        break;
                    case ReviewStatus.Approved:
                        counts.Approved = entry.Count;
                        break;
                    case ReviewStatus.Rejected:
                        counts.Rejected = entry.Count;
                        break;
                }
            }
            counts.All = counts.Pending + counts.Approved + counts.Rejected;

            var query = _dbContext.Reviews.AsNoTracking();

            if (statusFilter.HasValue)
            {
                query = query.Where(r => r.Status == statusFilter.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmedSearch = search.Trim();
                var escaped = trimmedSearch
                    .Replace("\\", "\\\\")
                    .Replace("%", "\\%")
                    .Replace("_", "\\_");
                var pattern = $"%{escaped}%";

                query = query.Where(r =>
                    EF.Functions.ILike(r.AuthorName, pattern, "\\") ||
                    EF.Functions.ILike(r.Comment, pattern, "\\"));
            }

            var items = await query
                .OrderBy(r => r.Status == ReviewStatus.Pending ? 0 : 1)
                .ThenByDescending(r => r.CreatedOn)
                .Select(r => new AdminReviewDto
                {
                    Id = r.Id,
                    AuthorName = r.AuthorName,
                    Comment = r.Comment,
                    Rating = r.Rating,
                    Status = r.Status.ToString(),
                    Source = r.Source,
                    CreatedOn = r.CreatedOn,
                    ApprovedOn = r.ApprovedOn,
                })
                .ToListAsync(cancellationToken);

            return new AdminReviewsListResponseDto
            {
                Items = items,
                Counts = counts,
            };
        }

        public async Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default)
        {
            return await _dbContext.Reviews
                .AsNoTracking()
                .CountAsync(r => r.Status == ReviewStatus.Pending, cancellationToken);
        }

        public async Task<ReviewOperationResult<AdminReviewDto>> AdminCreateReviewAsync(
            AdminUpsertReviewRequest request,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return ReviewOperationResult<AdminReviewDto>.Fail("INVALID_REQUEST", "Request body is required.");
            }

            var (isValid, errorCode, errorMessage, normalizedAuthor, normalizedComment) =
                ValidateCoreFields(request.AuthorName, request.Comment, request.Rating);

            if (!isValid)
            {
                return ReviewOperationResult<AdminReviewDto>.Fail(errorCode!, errorMessage!);
            }

            var sourceResult = NormalizeSource(request.Source, "Admin");
            if (sourceResult == null)
            {
                return ReviewOperationResult<AdminReviewDto>.Fail("INVALID_SOURCE", "Source must be Site, Google, or Admin.");
            }

            var status = ReviewStatus.Approved;
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                if (!Enum.TryParse<ReviewStatus>(request.Status.Trim(), ignoreCase: true, out status) ||
                    !Enum.IsDefined(typeof(ReviewStatus), status))
                {
                    return ReviewOperationResult<AdminReviewDto>.Fail("INVALID_STATUS", "Status must be Pending, Approved, or Rejected.");
                }
            }

            var nowUtc = DateTime.UtcNow;
            var review = new Review
            {
                AuthorName = normalizedAuthor,
                Comment = normalizedComment,
                Rating = request.Rating,
                Source = sourceResult,
                Status = status,
                ApprovedOn = status == ReviewStatus.Approved ? nowUtc : null,
            };

            await _dbContext.Reviews.AddAsync(review, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return ReviewOperationResult<AdminReviewDto>.Ok(MapAdminDto(review));
        }

        public async Task<ReviewOperationResult<AdminReviewDto>> AdminUpdateReviewAsync(
            string id,
            AdminUpsertReviewRequest request,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return ReviewOperationResult<AdminReviewDto>.Missing();
            }

            if (request == null)
            {
                return ReviewOperationResult<AdminReviewDto>.Fail("INVALID_REQUEST", "Request body is required.");
            }

            var review = await _dbContext.Reviews.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
            if (review == null)
            {
                return ReviewOperationResult<AdminReviewDto>.Missing();
            }

            var (isValid, errorCode, errorMessage, normalizedAuthor, normalizedComment) =
                ValidateCoreFields(request.AuthorName, request.Comment, request.Rating);

            if (!isValid)
            {
                return ReviewOperationResult<AdminReviewDto>.Fail(errorCode!, errorMessage!);
            }

            var sourceResult = NormalizeSource(request.Source, review.Source);
            if (sourceResult == null)
            {
                return ReviewOperationResult<AdminReviewDto>.Fail("INVALID_SOURCE", "Source must be Site, Google, or Admin.");
            }

            var targetStatus = review.Status;
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                if (!Enum.TryParse<ReviewStatus>(request.Status.Trim(), ignoreCase: true, out targetStatus) ||
                    !Enum.IsDefined(typeof(ReviewStatus), targetStatus))
                {
                    return ReviewOperationResult<AdminReviewDto>.Fail("INVALID_STATUS", "Status must be Pending, Approved, or Rejected.");
                }
            }

            review.AuthorName = normalizedAuthor;
            review.Comment = normalizedComment;
            review.Rating = request.Rating;
            review.Source = sourceResult;
            ApplyStatusTransition(review, targetStatus);

            await _dbContext.SaveChangesAsync(cancellationToken);

            return ReviewOperationResult<AdminReviewDto>.Ok(MapAdminDto(review));
        }

        public async Task<ReviewOperationResult<AdminReviewDto>> UpdateReviewStatusAsync(
            string id,
            string statusValue,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return ReviewOperationResult<AdminReviewDto>.Missing();
            }

            if (string.IsNullOrWhiteSpace(statusValue) ||
                !Enum.TryParse<ReviewStatus>(statusValue.Trim(), ignoreCase: true, out var targetStatus) ||
                !Enum.IsDefined(typeof(ReviewStatus), targetStatus))
            {
                return ReviewOperationResult<AdminReviewDto>.Fail("INVALID_STATUS", "Status must be Pending, Approved, or Rejected.");
            }

            var review = await _dbContext.Reviews.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
            if (review == null)
            {
                return ReviewOperationResult<AdminReviewDto>.Missing();
            }

            ApplyStatusTransition(review, targetStatus);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return ReviewOperationResult<AdminReviewDto>.Ok(MapAdminDto(review));
        }

        public async Task<ReviewOperationResult<bool>> DeleteReviewAsync(
            string id,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return ReviewOperationResult<bool>.Missing();
            }

            var review = await _dbContext.Reviews.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
            if (review == null)
            {
                return ReviewOperationResult<bool>.Missing();
            }

            review.IsDeleted = true;
            review.DeletedOn = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);

            return ReviewOperationResult<bool>.Ok(true);
        }

        private static (bool IsValid, string ErrorCode, string ErrorMessage, string Author, string Comment) ValidateCoreFields(
            string rawAuthorName,
            string rawComment,
            int rating)
        {
            var normalizedAuthor = NormalizeText(rawAuthorName);
            if (normalizedAuthor.Length < MinAuthorLength || normalizedAuthor.Length > MaxAuthorLength)
            {
                return (
                    false,
                    "INVALID_AUTHOR_NAME",
                    $"Author name must be between {MinAuthorLength} and {MaxAuthorLength} characters.",
                    normalizedAuthor,
                    string.Empty);
            }

            var normalizedComment = NormalizeText(rawComment);
            if (normalizedComment.Length < MinCommentLength || normalizedComment.Length > MaxCommentLength)
            {
                return (
                    false,
                    "INVALID_COMMENT",
                    $"Comment must be between {MinCommentLength} and {MaxCommentLength} characters.",
                    normalizedAuthor,
                    normalizedComment);
            }

            if (rating < 1 || rating > 5)
            {
                return (
                    false,
                    "INVALID_RATING",
                    "Rating must be between 1 and 5.",
                    normalizedAuthor,
                    normalizedComment);
            }

            return (true, null, null, normalizedAuthor, normalizedComment);
        }

        private static string NormalizeText(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            return WhitespaceRegex.Replace(value.Trim(), " ");
        }

        private static bool ContainsUrl(string value)
            => UrlRegex.IsMatch(value);

        private static string NormalizeSource(string source, string fallback)
        {
            if (string.IsNullOrWhiteSpace(source))
            {
                return fallback;
            }

            var trimmed = source.Trim();
            if (!AllowedSources.Contains(trimmed))
            {
                return null;
            }

            if (trimmed.Equals("Google", StringComparison.OrdinalIgnoreCase))
            {
                return "Google";
            }

            if (trimmed.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            {
                return "Admin";
            }

            return "Site";
        }

        private static void ApplyStatusTransition(Review review, ReviewStatus targetStatus)
        {
            if (targetStatus == ReviewStatus.Approved)
            {
                if (review.Status != ReviewStatus.Approved || !review.ApprovedOn.HasValue)
                {
                    review.ApprovedOn = DateTime.UtcNow;
                }
            }
            else
            {
                review.ApprovedOn = null;
            }

            review.Status = targetStatus;
        }

        private static AdminReviewDto MapAdminDto(Review review) => new()
        {
            Id = review.Id,
            AuthorName = review.AuthorName,
            Comment = review.Comment,
            Rating = review.Rating,
            Status = review.Status.ToString(),
            Source = review.Source,
            CreatedOn = review.CreatedOn,
            ApprovedOn = review.ApprovedOn,
        };
    }
}
