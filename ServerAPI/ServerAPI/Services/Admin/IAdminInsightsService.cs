using ServerAPI.Models.Admin;
using ServerAPI.Models.Common;

namespace ServerAPI.Services.Admin
{
    public interface IAdminInsightsService
    {
        Task<AdminDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default);

        Task<PagedResult<AdminClientSummaryDto>> GetClientsPagedAsync(
            int page = 1,
            int pageSize = 25,
            string search = null,
            string sortBy = "lastVisit",
            CancellationToken cancellationToken = default);

        Task<IReadOnlyList<AdminClientAutocompleteDto>> AutocompleteClientsAsync(
            string query,
            CancellationToken cancellationToken = default);

        Task<AdminAnalyticsDto> GetAnalyticsAsync(
            string range = "30d",
            DateTime? from = null,
            DateTime? to = null,
            CancellationToken cancellationToken = default);

        Task<(byte[] Content, string FileName)> ExportAnalyticsCsvAsync(
            string type = "workouts",
            string range = "30d",
            DateTime? from = null,
            DateTime? to = null,
            CancellationToken cancellationToken = default);
    }
}
