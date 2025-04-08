namespace ServerAPI.Models
{
    using System;
    public class ImageModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Url { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}