using MediSlot.Models;
using MediSlot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.PlatformAdmin)]
    public class PlatformController : ControllerBase
    {
        private readonly MediSlotContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public PlatformController(MediSlotContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/platform/overview
        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var now = SlotService.SaNow;
            var todayStart = now.Date;
            var tomorrowStart = todayStart.AddDays(1);
            var weekAgoUtc = DateTime.UtcNow.AddDays(-7);

            var patientRoleId = await _context.Roles
                .Where(r => r.Name == Roles.Patient).Select(r => r.Id).FirstOrDefaultAsync();
            var adminRoleId = await _context.Roles
                .Where(r => r.Name == Roles.SurgeryAdmin).Select(r => r.Id).FirstOrDefaultAsync();

            return Ok(new
            {
                SurgeriesApproved = await _context.Surgeries.CountAsync(s => s.IsApproved),
                SurgeriesPending = await _context.Surgeries.CountAsync(s => !s.IsApproved),
                Patients = await _context.UserRoles.CountAsync(ur => ur.RoleId == patientRoleId),
                SurgeryAdmins = await _context.UserRoles.CountAsync(ur => ur.RoleId == adminRoleId),
                AppointmentsToday = await _context.Appointments.CountAsync(a =>
                    a.Status != AppointmentStatus.Cancelled && a.StartTime >= todayStart && a.StartTime < tomorrowStart),
                AppointmentsNext7Days = await _context.Appointments.CountAsync(a =>
                    a.Status == AppointmentStatus.Booked && a.StartTime >= now && a.StartTime < now.AddDays(7)),
                BookingsLast7Days = await _context.Appointments.CountAsync(a => a.CreatedAtUtc >= weekAgoUtc),
                CancellationsLast7Days = await _context.Appointments.CountAsync(a =>
                    a.CancelledAtUtc != null && a.CancelledAtUtc >= weekAgoUtc)
            });
        }

        // GET: api/platform/pending-surgeries
        [HttpGet("pending-surgeries")]
        public async Task<IActionResult> GetPendingSurgeries()
        {
            var pending = await _context.Surgeries
                .Where(s => !s.IsApproved)
                .OrderBy(s => s.Name)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Town,
                    s.Address,
                    s.PhoneNumber,
                    s.Description,
                    AdminName = _context.Users
                        .Where(u => u.SurgeryId == s.Id)
                        .Select(u => u.FullName)
                        .FirstOrDefault(),
                    AdminEmail = _context.Users
                        .Where(u => u.SurgeryId == s.Id)
                        .Select(u => u.Email)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(pending);
        }

        // POST: api/platform/surgeries/5/approve
        [HttpPost("surgeries/{id}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            var surgery = await _context.Surgeries.FindAsync(id);
            if (surgery == null)
            {
                return NotFound();
            }

            surgery.IsApproved = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/platform/surgeries/5/reject
        // Removes a pending surgery together with its admin account.
        [HttpPost("surgeries/{id}/reject")]
        public async Task<IActionResult> Reject(int id)
        {
            var surgery = await _context.Surgeries.FindAsync(id);
            if (surgery == null)
            {
                return NotFound();
            }

            if (surgery.IsApproved)
            {
                return BadRequest(new { message = "An approved surgery cannot be rejected. Edit or suspend it instead." });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var admins = await _userManager.Users.Where(u => u.SurgeryId == id).ToListAsync();
            foreach (var admin in admins)
            {
                var result = await _userManager.DeleteAsync(admin);
                if (!result.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { message = "Could not remove the surgery's account." });
                }
            }

            _context.Surgeries.Remove(surgery);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return NoContent();
        }

        // GET: api/platform/users?search=thandi
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string search)
        {
            var query = _userManager.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(u => u.Email.Contains(term) || u.FullName.Contains(term));
            }

            var users = await query
                .OrderBy(u => u.FullName)
                .Take(100)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    SurgeryName = u.Surgery != null ? u.Surgery.Name : null,
                    u.LockoutEnd
                })
                .ToListAsync();

            var ids = users.Select(u => u.Id).ToList();
            var roleRows = await (
                from ur in _context.UserRoles
                join r in _context.Roles on ur.RoleId equals r.Id
                where ids.Contains(ur.UserId)
                select new { ur.UserId, r.Name }).ToListAsync();

            var now = DateTimeOffset.UtcNow;

            return Ok(users.Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.SurgeryName,
                Role = roleRows.FirstOrDefault(r => r.UserId == u.Id)?.Name,
                IsDisabled = u.LockoutEnd.HasValue && u.LockoutEnd.Value > now
            }));
        }

        // POST: api/platform/users/abc/disable
        [HttpPost("users/{id}/disable")]
        public async Task<IActionResult> DisableUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            if (user.Id == User.FindFirst("sub")?.Value)
            {
                return BadRequest(new { message = "You cannot disable your own account." });
            }

            if (await _userManager.IsInRoleAsync(user, Roles.PlatformAdmin))
            {
                return BadRequest(new { message = "Platform admin accounts cannot be disabled here." });
            }

            await _userManager.SetLockoutEnabledAsync(user, true);
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);

            return NoContent();
        }

        // POST: api/platform/users/abc/enable
        [HttpPost("users/{id}/enable")]
        public async Task<IActionResult> EnableUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            await _userManager.SetLockoutEndDateAsync(user, null);
            await _userManager.ResetAccessFailedCountAsync(user);

            return NoContent();
        }
    }
}