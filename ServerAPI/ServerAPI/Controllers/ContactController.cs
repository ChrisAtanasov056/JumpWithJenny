using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ServerAPI.Models.Contacts;
using ServerAPI.Services.Contacts;

namespace ServerAPI.Controllers
{
    [ApiController]
        [Route("api/[controller]")]
        public class ContactController : ControllerBase
        {
            private readonly IContactService _contactService;

            public ContactController(IContactService contactService)
            {
                _contactService = contactService;
            }

            [EnableRateLimiting("EmailPolicy")]
            [HttpPost("send")]
            public async Task<IActionResult> SendContactMessage([FromBody] ContactFormDto contactForm)
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var (success, errors) = await _contactService.ProcessContactFormAsync(contactForm);

                if (!success)
                {
                    return BadRequest(new { Errors = errors });
                }

                return Ok(new { Message = "Your message has been sent successfully." });
            }
        }
        

}