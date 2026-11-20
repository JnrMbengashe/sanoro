using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MediSlot.Models
{
    public enum AppointmentStatus
    {
        Booked = 0,
        Cancelled = 1,
        Completed = 2,
        NoShow = 3
    }

    public class Appointment
    {
        [Key]
        public int Id { get; set; }

        public int SurgeryId { get; set; }

        [JsonIgnore]
        public Surgery Surgery { get; set; }

        public int DoctorId { get; set; }

        [JsonIgnore]
        public Doctor Doctor { get; set; }

        public int AppointmentTypeId { get; set; }

        [JsonIgnore]
        public AppointmentType AppointmentType { get; set; }

        // The patient's account. Empty for phone or walk-in bookings made by the surgery (a later step).
        public string PatientId { get; set; }

        [JsonIgnore]
        public ApplicationUser Patient { get; set; }

        [StringLength(100)]
        public string GuestName { get; set; }

        [StringLength(20)]
        public string GuestPhone { get; set; }

        // South African local time
        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public AppointmentStatus Status { get; set; } = AppointmentStatus.Booked;

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public DateTime? CancelledAtUtc { get; set; }
        public DateTime? ReminderSentAtUtc { get; set; }
    }
}