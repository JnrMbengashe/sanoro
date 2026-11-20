using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MediSlot.Models
{
    // One block of working hours for a doctor on one weekday, e.g. Monday 08:00 to 13:00
    public class DoctorSchedule
    {
        [Key]
        public int Id { get; set; }

        public int DoctorId { get; set; }

        [JsonIgnore]
        public Doctor Doctor { get; set; }

        public DayOfWeek DayOfWeek { get; set; }

        public TimeOnly StartTime { get; set; }

        public TimeOnly EndTime { get; set; }
    }
}