using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MediSlot.Models
{
    public class Doctor
    {
        [Key]
        public int Id { get; set; }

        // Foreign key: the surgery this doctor works at
        public int SurgeryId { get; set; }

        [JsonIgnore]
        public Surgery Surgery { get; set; }

        [Required, StringLength(100)]
        public string FullName { get; set; }

        [StringLength(100)]
        public string Speciality { get; set; }

        [JsonIgnore]
        public List<DoctorSchedule> Schedules { get; set; } = new List<DoctorSchedule>();

        [JsonIgnore]
        public List<DoctorTimeOff> TimeOffPeriods { get; set; } = new List<DoctorTimeOff>();
    }
}