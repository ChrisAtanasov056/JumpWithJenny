
using AutoMapper;
using ServerAPI.Services.Mapper;

namespace ServerAPI.Models.Schedule
{
    public class AdminWorkoutViewModel : IHaveCustomMappings
{
    public string Id { get; set; }
    public string Day { get; set; }
    public string Time { get; set; }
    public string Status { get; set; }
    public int AvailableSpots { get; set; }

    public DateTime Date { get; set; }

    public ICollection<WorkoutShoes> WorkoutShoes { get; set; } = new List<WorkoutShoes>();
    public ICollection<AppointmentViewModel> Appointments { get; set; } = new List<AppointmentViewModel>();

    public void CreateMappings(IProfileExpression configuration)
    {
        configuration.CreateMap<Workout, AdminWorkoutViewModel>()
            .ForMember(dest => dest.WorkoutShoes, opt => opt.MapFrom(src => src.WorkoutShoes))
            .ForMember(dest => dest.Appointments, opt => opt.MapFrom(src => src.Appointments));
    }
}
}