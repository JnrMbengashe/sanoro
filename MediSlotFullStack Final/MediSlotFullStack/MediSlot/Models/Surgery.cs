using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MediSlot.Models
{
    public class Surgery
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(100)]
        public string Name { get; set; }

        [Required, StringLength(100)]
        public string Town { get; set; }

        [Required, StringLength(200)]
        public string Address { get; set; }

        [Required, StringLength(20), Phone]
        public string PhoneNumber { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        public bool IsApproved { get; set; }

        // One surgery has many doctors and many appointment types.
        // [JsonIgnore] stops the API returning a surgery -> doctors -> surgery loop.
        [JsonIgnore]
        public List<Doctor> Doctors { get; set; } = new List<Doctor>();

        [JsonIgnore]
        public List<AppointmentType> AppointmentTypes { get; set; } = new List<AppointmentType>();
    }
}
