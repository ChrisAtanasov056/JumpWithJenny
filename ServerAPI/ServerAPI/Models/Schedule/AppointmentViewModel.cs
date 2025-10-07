using AutoMapper;
using ServerAPI.Models.Enums;
using ServerAPI.Services.Mapper;

namespace ServerAPI.Models.Schedule
{
    public class AppointmentViewModel : IHaveCustomMappings
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public string UserFullName { get; set; }
        public string UserEmail { get; set; }

        public CardType ?CardType { get; set; } 
        
        public string ShoeId { get; set; } 
        public ShoesSize? ShoeSize { get; set; } 
        public bool UsesOwnShoes { get; set; } 

        public void CreateMappings(IProfileExpression configuration)
        {
            configuration.CreateMap<Appointment, AppointmentViewModel>()
                .ForMember(dest => dest.UserFullName, opt => opt.MapFrom(src => src.User.FirstName + " " + src.User.LastName))
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.ShoeId,
                    opt => opt.MapFrom(src => src.ShoeId)) 
                .ForMember(dest => dest.ShoeSize,
                    opt => opt.MapFrom(src => src.Shoe.Size))
                .ForMember(dest => dest.UsesOwnShoes,
                    opt => opt.MapFrom(src => src.UsesOwnShoes))
                .ForMember(dest => dest.CardType,
                    opt => opt.MapFrom(src => src.CardType));
        }
    }
}