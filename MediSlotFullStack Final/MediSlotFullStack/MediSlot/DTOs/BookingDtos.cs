using System.ComponentModel.DataAnnotations;

namespace MediSlot.DTOs
{
    public class BookAppointmentDto
    {
        [Range(1, int.MaxValue)]
        public int DoctorId { get; set; }

        [Range(1, int.MaxValue)]
        public int AppointmentTypeId { get; set; }

        public DateOnly Date { get; set; }   // 2026-12-01

        [Required]
        public string Time { get; set; }     // "08:00"
    }
}