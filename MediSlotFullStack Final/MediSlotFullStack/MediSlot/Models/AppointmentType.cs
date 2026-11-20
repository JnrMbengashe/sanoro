using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MediSlot.Models
{
    public class AppointmentType
    {
        [Key]
        public int Id { get; set; }

        // Foreign key: the surgery that offers this appointment type
        public int SurgeryId { get; set; }

        [JsonIgnore]
        public Surgery Surgery { get; set; }

        [Required, StringLength(100)]
        public string Name { get; set; }

        [Range(5, 240)]
        public int DurationMinutes { get; set; } = 30;
    }
}
