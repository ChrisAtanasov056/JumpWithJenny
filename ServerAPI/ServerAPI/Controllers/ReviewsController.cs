namespace ServerAPI.Controllers
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Cors;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.AspNetCore.RateLimiting;
    using ServerAPI.Common;
    using ServerAPI.Models.Enums;
    using ServerAPI.Models.Reviews;
    using ServerAPI.Services.Reviews;

    [ApiController]
    [Route("api/[controller]")]
    [EnableCors("AllowOrigin")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetApprovedReviews(CancellationToken cancellationToken)
        {
            var reviews = await _reviewService.GetApprovedReviewsAsync(cancellationToken);
            return Ok(reviews);
        }

        [HttpPost]
        [AllowAnonymous]
        [EnableRateLimiting("ReviewPolicy")]
        public async Task<IActionResult> SubmitPublicReview(
            [FromBody] CreatePublicReviewRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _reviewService.CreatePublicReviewAsync(request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { code = result.ErrorCode, message = result.ErrorMessage });
            }

            return StatusCode(StatusCodes.Status201Created, new
            {
                Message = "Review submitted for approval.",
            });
        }

        [HttpGet("admin")]
        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        public async Task<IActionResult> GetAdminReviews(
            [FromQuery] string status,
            [FromQuery] string search,
            CancellationToken cancellationToken)
        {
            ReviewStatus? parsedStatus = null;
            if (!string.IsNullOrWhiteSpace(status) &&
                !status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                if (!Enum.TryParse<ReviewStatus>(status.Trim(), ignoreCase: true, out var statusEnum) ||
                    !Enum.IsDefined(typeof(ReviewStatus), statusEnum))
                {
                    return BadRequest(new { code = "INVALID_STATUS", message = "Status must be Pending, Approved, or Rejected." });
                }

                parsedStatus = statusEnum;
            }

            var response = await _reviewService.GetAdminReviewsAsync(parsedStatus, search, cancellationToken);
            return Ok(response);
        }

        [HttpGet("admin/pending-count")]
        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        public async Task<IActionResult> GetPendingCount(CancellationToken cancellationToken)
        {
            var count = await _reviewService.GetPendingCountAsync(cancellationToken);
            return Ok(new { PendingCount = count });
        }

        [HttpPost("admin")]
        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        public async Task<IActionResult> AdminCreateReview(
            [FromBody] AdminUpsertReviewRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _reviewService.AdminCreateReviewAsync(request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { code = result.ErrorCode, message = result.ErrorMessage });
            }

            return StatusCode(StatusCodes.Status201Created, result.Data);
        }

        [HttpPut("admin/{id}")]
        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        public async Task<IActionResult> AdminUpdateReview(
            string id,
            [FromBody] AdminUpsertReviewRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _reviewService.AdminUpdateReviewAsync(id, request, cancellationToken);
            if (result.NotFound)
            {
                return NotFound(new { code = result.ErrorCode, message = result.ErrorMessage });
            }

            if (!result.Success)
            {
                return BadRequest(new { code = result.ErrorCode, message = result.ErrorMessage });
            }

            return Ok(result.Data);
        }

        [HttpPatch("admin/{id}/status")]
        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        public async Task<IActionResult> UpdateReviewStatus(
            string id,
            [FromBody] UpdateReviewStatusRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _reviewService.UpdateReviewStatusAsync(id, request?.Status ?? string.Empty, cancellationToken);
            if (result.NotFound)
            {
                return NotFound(new { code = result.ErrorCode, message = result.ErrorMessage });
            }

            if (!result.Success)
            {
                return BadRequest(new { code = result.ErrorCode, message = result.ErrorMessage });
            }

            return Ok(result.Data);
        }

        [HttpDelete("admin/{id}")]
        [Authorize(Roles = GlobalConstants.AdministratorRoleName)]
        public async Task<IActionResult> DeleteReview(string id, CancellationToken cancellationToken)
        {
            var result = await _reviewService.DeleteReviewAsync(id, cancellationToken);
            if (result.NotFound)
            {
                return NotFound(new { code = result.ErrorCode, message = result.ErrorMessage });
            }

            return NoContent();
        }
    }
}
