// DTOs/WorkoutDTO.cs

using System;

namespace ServerAPI.DTOs
{
    public class WorkoutDTO
    {
        public string Id { get; set; }
        public DateTime Date { get; set; }
        public string Day { get; set; }
        public string Time { get; set; }
        // Ако имате други свойства на Workout, добавете ги тук.
    }
}