using ServerAPI.Models.Enums;

namespace ServerAPI.Models.Schedule
{
    public class ShoeViewModel 
    {
        public string Id { get; set; }
        public ShoesSize Size { get; set; }
        public bool IsTaken { get; set; }
    }
}