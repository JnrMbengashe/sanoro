using MediSlot.DTOs;
using MediSlot.Models;
using MediSlot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace MediSlot.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly TokenService _tokenService;
        private readonly MediSlotContext _context;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            TokenService tokenService,
            MediSlotContext context)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _context = context;
        }

        // POST: api/auth/register  (creates a Patient account)
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (!dto.AcceptedPrivacyPolicy)
            {
                return BadRequest(new { message = "You must accept the privacy policy to create an account." });
            }

            var user = new ApplicationUser
            {
                UserName = dto.Email.Trim(),
                Email = dto.Email.Trim(),
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber,
                PrivacyConsentAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "We could not create your account.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            await _userManager.AddToRoleAsync(user, Roles.Patient);

            return Ok(await BuildResponse(user));
        }

        // POST: api/auth/register-surgery
        // Creates an UNAPPROVED surgery and its SurgeryAdmin account together.
        [HttpPost("register-surgery")]
        public async Task<IActionResult> RegisterSurgery(RegisterSurgeryDto dto)
        {
            if (!dto.AcceptedPrivacyPolicy)
            {
                return BadRequest(new { message = "You must accept the privacy policy to register." });
            }

            // All-or-nothing: if the account cannot be created, the surgery is removed too.
            await using var transaction = await _context.Database.BeginTransactionAsync();

            var surgery = new Surgery
            {
                Name = dto.SurgeryName.Trim(),
                Town = dto.Town.Trim(),
                Address = dto.Address.Trim(),
                PhoneNumber = dto.SurgeryPhone.Trim(),
                Description = dto.Description?.Trim(),
                IsApproved = false
            };
            _context.Surgeries.Add(surgery);
            await _context.SaveChangesAsync();

            var user = new ApplicationUser
            {
                UserName = dto.Email.Trim(),
                Email = dto.Email.Trim(),
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber,
                SurgeryId = surgery.Id,
                PrivacyConsentAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                await transaction.RollbackAsync();
                return BadRequest(new
                {
                    message = "We could not create your account.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            await _userManager.AddToRoleAsync(user, Roles.SurgeryAdmin);
            await transaction.CommitAsync();

            return Ok(await BuildResponse(user));
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email.Trim());

            // The same message for "no such user" and "wrong password"
            // so attackers cannot find out which emails are registered.
            if (user == null)
            {
                return Unauthorized(new { message = "Incorrect email or password." });
            }

            if (await _userManager.IsLockedOutAsync(user))
            {
                var until = await _userManager.GetLockoutEndDateAsync(user);
                if (until.HasValue && until.Value > DateTimeOffset.UtcNow.AddDays(1))
                {
                    return StatusCode(403, new { message = "This account has been disabled. Please contact Sanoro support." });
                }

                return StatusCode(429, new { message = "Too many failed attempts. Please try again in 15 minutes." });
            }

            if (!await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                await _userManager.AccessFailedAsync(user);
                return Unauthorized(new { message = "Incorrect email or password." });
            }

            await _userManager.ResetAccessFailedCountAsync(user);

            return Ok(await BuildResponse(user));
        }

        // GET: api/auth/me  (who am I? needs a valid token)
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirst("sub")?.Value;
            var user = userId == null ? null : await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return Unauthorized();
            }

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                user.Email,
                user.FullName,
                Roles = roles,
                user.SurgeryId
            });
        }

        private async Task<AuthResponse> BuildResponse(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);

            return new AuthResponse
            {
                Token = _tokenService.CreateToken(user, roles),
                Email = user.Email,
                FullName = user.FullName,
                Roles = roles.ToList(),
                SurgeryId = user.SurgeryId
            };
        }
    }
}