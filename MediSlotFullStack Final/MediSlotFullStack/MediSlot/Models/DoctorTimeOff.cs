using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MediSlot.Models
{
    // A period when a doctor is away (leave, training, public holiday)
    public class DoctorTimeOff
    {
        [Key]
        public int Id { get; set; }

        public int DoctorId { get; set; }

        [JsonIgnore]
        public Doctor Doctor { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        [StringLength(100)]
        public string Note { get; set; }
    }
}