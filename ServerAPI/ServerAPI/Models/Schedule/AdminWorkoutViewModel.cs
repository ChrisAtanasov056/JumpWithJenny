using ServerAPI.Models.Enums;

namespace ServerAPI.Models.Schedule
{
    public class AdminWorkoutViewModel
{
    public string Id { get; set; }
    public string Day { get; set; }
    public string Time { get; set; }
    public string Status { get; set; }

    public CardType ?CardType { get; set; } 
    public int AvailableSpots { get; set; }

    public DateTime Date { get; set; }

    public ICollection<WorkoutShoes> WorkoutShoes { get; set; } = new List<WorkoutShoes>();
    public ICollection<AppointmentViewModel> Appointments { get; set; } = new List<AppointmentViewModel>();
}
}