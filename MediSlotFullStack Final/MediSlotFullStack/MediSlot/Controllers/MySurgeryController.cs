using MediSlot.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.SurgeryAdmin)]
    public class MySurgeryController : ControllerBase
    {
        private readonly MediSlotContext _context;

        public MySurgeryController(MediSlotContext context)
        {
            _context = context;
        }

        // GET: api/MySurgery
        // The surgery comes from the logged-in account's token, never from the browser,
        // so a surgery admin can only ever see their own surgery.
        [HttpGet]
        public async Task<IActionResult> GetMySurgery()
        {
            if (!int.TryParse(User.FindFirst("surgeryId")?.Value, out var surgeryId))
            {
                return Forbid();
            }

            var surgery = await _context.Surgeries
                .Where(s => s.Id == surgeryId)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Town,
                    s.Address,
                    s.PhoneNumber,
                    s.Description,
                    s.IsApproved,
                    DoctorCount = s.Doctors.Count,
                    AppointmentTypeCount = s.AppointmentTypes.Count
                })
                .FirstOrDefaultAsync();

            if (surgery == null)
            {
                return NotFound();
            }

            return Ok(surgery);
        }
    }
}