namespace ServerAPI.Services.Reviews
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using ServerAPI.Models.Enums;
    using ServerAPI.Models.Reviews;

    public interface IReviewService
    {
        Task<List<PublicReviewDto>> GetApprovedReviewsAsync(CancellationToken cancellationToken = default);

        Task<ReviewOperationResult<bool>> CreatePublicReviewAsync(
            CreatePublicReviewRequest request,
            CancellationToken cancellationToken = default);

        Task<AdminReviewsListResponseDto> GetAdminReviewsAsync(
            ReviewStatus? statusFilter,
            string search,
            CancellationToken cancellationToken = default);

        Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default);

        Task<ReviewOperationResult<AdminReviewDto>> AdminCreateReviewAsync(
            AdminUpsertReviewRequest request,
            CancellationToken cancellationToken = default);

        Task<ReviewOperationResult<AdminReviewDto>> AdminUpdateReviewAsync(
            string id,
            AdminUpsertReviewRequest request,
            CancellationToken cancellationToken = default);

        Task<ReviewOperationResult<AdminReviewDto>> UpdateReviewStatusAsync(
            string id,
            string statusValue,
            CancellationToken cancellationToken = default);

        Task<ReviewOperationResult<bool>> DeleteReviewAsync(
            string id,
            CancellationToken cancellationToken = default);
    }
}
