using Microsoft.AspNetCore.Identity;
using ServerAPI.Data;
using ServerAPI.Models;
using ServerAPI.Models.Authentication;

namespace ServerAPI.Services
{
    public class AuthService
    {
        private readonly JumpWithJennyDbContext dbContext;

        private readonly SignInManager<User> _signInManager;
        private readonly UserManager<User> _userManager;

        //public AuthService(JumpWithJennyDbContext dbContext, UserManager<User> userManager, SignInManager<User> signInManager)
        //{
        //    this.dbContext = dbContext;
        //    this._userManager = userManager;
        //    this._signInManager = signInManager;
        //}

        //public async Task CreateUser(SignUpModel model)
        //{
        //    var user = new User
        //    {
        //        UserName = model.UserName,
        //        Email = model.Email
        //    };
        //    var result = await this._userManager.CreateAsync(user, model.Password);
        //    if (result.Succeeded)
        //    {
        //        foreach (var error in result.Errors)
        //        {
        //            ModelState.AddModelError(error.Code, error.Description);
        //        }
        //        return BadRequest(ModelState);
        //    }
        //    return Accepted();
        //}
    }
}
