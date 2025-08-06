using AutoMapper;
using ServerAPI.Models;
using ServerAPI.Services.Mapper;

namespace ServerAPI.ViewModels.Users
{
    public class UserSearchResultModel :  IHaveCustomMappings
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }

        public void CreateMappings(IProfileExpression configuration)
        {
            configuration.CreateMap<User, UserSearchResultModel>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FirstName + " " + src.LastName))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email));
        }
    }
}