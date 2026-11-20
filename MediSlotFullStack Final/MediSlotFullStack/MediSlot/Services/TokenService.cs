using System.Security.Claims;
using System.Text;
using MediSlot.Models;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace MediSlot.Services
{
    public class TokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public string CreateToken(ApplicationUser user, IList<string> roles)
        {
            var claims = new List<Claim>
            {
                new Claim("sub", user.Id),
                new Claim("email", user.Email),
                new Claim("fullName", user.FullName)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim("role", role));
            }

            // Surgery admins carry the surgery they manage. The server uses this,
            // never a value sent by the browser.
            if (user.SurgeryId.HasValue)
            {
                claims.Add(new Claim("surgeryId", user.SurgeryId.Value.ToString()));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));

            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                Expires = DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:ExpiryMinutes"])),
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            };

            return new JsonWebTokenHandler().CreateToken(descriptor);
        }
    }
}