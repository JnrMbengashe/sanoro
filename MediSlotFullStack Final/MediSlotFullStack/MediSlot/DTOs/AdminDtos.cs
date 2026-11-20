using System.ComponentModel.DataAnnotations;

namespace MediSlot.DTOs
{
    public class DoctorDto
    {
        [Required, StringLength(100)]
        public string FullName { get; set; }

        [StringLength(100)]
        public string Speciality { get; set; }
    }

    public class AppointmentTypeDto
    {
        [Required, StringLength(100)]
        public string Name { get; set; }

        [Range(5, 240)]
        public int DurationMinutes { get; set; }
    }

    public class ScheduleBlockDto
    {
        [Range(0, 6)]
        public int DayOfWeek { get; set; }   // 0 = Sunday ... 6 = Saturday

        [Required]
        public string StartTime { get; set; }   // "08:00"

        [Required]
        public string EndTime { get; set; }     // "13:00"
    }

    public class TimeOffDto
    {
        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        [StringLength(100)]
        public string Note { get; set; }
    }
        public class AdminBookingDto
    {
        [Range(1, int.MaxValue)]
        public int DoctorId { get; set; }

        [Range(1, int.MaxValue)]
        public int AppointmentTypeId { get; set; }

        public DateOnly Date { get; set; }

        [Required]
        public string Time { get; set; }   // "08:00"

        [Required, StringLength(100)]
        public string GuestName { get; set; }

        [Phone, StringLength(20)]
        public string GuestPhone { get; set; }
    }

    public class AppointmentStatusDto
    {
        [Required]
        public string Status { get; set; }   // "Cancelled", "Completed" or "NoShow"
    }
}