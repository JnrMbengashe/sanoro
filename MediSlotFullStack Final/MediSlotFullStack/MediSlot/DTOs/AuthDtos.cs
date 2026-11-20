using System.ComponentModel.DataAnnotations;

namespace MediSlot.DTOs
{
    public class RegisterDto
    {
        [Required, StringLength(100)]
        public string FullName { get; set; }

        [Required, EmailAddress, StringLength(256)]
        public string Email { get; set; }

        [Phone, StringLength(20)]
        public string PhoneNumber { get; set; }

        [Required, StringLength(100, MinimumLength = 8)]
        public string Password { get; set; }

        public bool AcceptedPrivacyPolicy { get; set; }
    }

    public class LoginDto
    {
        [Required, EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class AuthResponse
    {
        public string Token { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public List<string> Roles { get; set; }
        public int? SurgeryId { get; set; }
    }
        public class RegisterSurgeryDto
    {
        [Required, StringLength(100)]
        public string SurgeryName { get; set; }

        [Required, StringLength(100)]
        public string Town { get; set; }

        [Required, StringLength(200)]
        public string Address { get; set; }

        [Required, Phone, StringLength(20)]
        public string SurgeryPhone { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        [Required, StringLength(100)]
        public string FullName { get; set; }

        [Required, EmailAddress, StringLength(256)]
        public string Email { get; set; }

        [Phone, StringLength(20)]
        public string PhoneNumber { get; set; }

        [Required, StringLength(100, MinimumLength = 8)]
        public string Password { get; set; }

        public bool AcceptedPrivacyPolicy { get; set; }
    }
}