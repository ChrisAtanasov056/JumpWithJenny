    using Microsoft.AspNetCore.Cors;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.AspNetCore.Mvc;
    using ServerAPI.Models.Authentication;
    using ServerAPI.Models;
    using ServerAPI.Services;

    namespace ServerAPI.Controllers
    {
        [Route("/[controller]")]
        [EnableCors("AllowOrigin")]
        [ApiController]
        public class AccountController : ControllerBase
        {
            private readonly SignInManager<User> _signInManager;
            private readonly UserManager<User> _userManager;
            private readonly JwtTokenService _jwtTokenService;

            public AccountController(UserManager<User> userManager, SignInManager<User> signInManager, JwtTokenService jwtTokenService)
            {
                _userManager = userManager;
                _signInManager = signInManager;
                _jwtTokenService = jwtTokenService;
            }

            // POST /Account/signup
            [HttpPost]
            [Route("signup")]
            public async Task<IActionResult> SignUp([FromBody] SignUpModel model)
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                try
                {
                    var user = new User
                    {
                        UserName = model.UserName,
                        Email = model.Email,
                        FirstName = model.FirstName,
                        LastName = model.LastName,
                    };

                    // Create the user
                    var result = await _userManager.CreateAsync(user, model.Password);
                    if (!result.Succeeded)
                    {
                        foreach (var error in result.Errors)
                        {
                            ModelState.AddModelError(error.Code, error.Description);
                        }
                        return BadRequest(ModelState);
                    }

                    // Automatically sign in the user after registration
                    var signInResult = await _signInManager.PasswordSignInAsync(user.UserName, model.Password, false, false);
                    if (!signInResult.Succeeded)
                    {
                        return Unauthorized(new { message = "Error logging in after registration" });
                    }

                    // Generate token using the injected service
                    var token = _jwtTokenService.GenerateJwtToken(user);

                    // Return the token and user data in the response
                    return Ok(new
                    {
                        token = token,
                        user = new
                        {
                            id = user.Id,
                            email = user.Email,
                            username = user.UserName,
                            firstname = user.FirstName,
                            lastname = user.LastName,
                        }
                    });
                }
                catch (Exception ex)
                {
                    return Problem($"Something Went Wrong in the {nameof(SignUp)}", statusCode: 500);
                }
            }   

            [HttpPost]
            [Route("login")]
            public async Task<IActionResult> Login([FromBody] LoginModel model)
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                var result = await _signInManager.PasswordSignInAsync(user.UserName, model.Password, false, false);
                if (!result.Succeeded)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Generate token using the injected service
                var token = _jwtTokenService.GenerateJwtToken(user);

                return Ok(new
                {
                    token = token,
                    user = new
                    {
                        id = user.Id,  // Include user ID
                        email = user.Email,
                        username = user.UserName,
                        firstname = user.FirstName,
                        lastname = user.LastName,
                    }
                });
            }

        }
    }
