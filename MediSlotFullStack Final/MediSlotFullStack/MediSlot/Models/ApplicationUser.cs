using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;

namespace MediSlot.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required, StringLength(100)]
        public string FullName { get; set; }

        // Only set for surgery admins: the one surgery they manage
        public int? SurgeryId { get; set; }

        [JsonIgnore]
        public Surgery Surgery { get; set; }

        // When the user accepted the privacy policy (POPIA consent)
        public DateTime? PrivacyConsentAt { get; set; }
    }
}
