using MediSlot.DTOs;
using MediSlot.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Controllers
{
    [Route("api/admin/appointment-types")]
    [ApiController]
    [Authorize(Roles = Roles.SurgeryAdmin)]
    public class AdminAppointmentTypesController : SurgeryAdminControllerBase
    {
        private readonly MediSlotContext _context;

        public AdminAppointmentTypesController(MediSlotContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTypes()
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            var types = await _context.AppointmentTypes
                .Where(a => a.SurgeryId == surgeryId)
                .OrderBy(a => a.Name)
                .Select(a => new { a.Id, a.Name, a.DurationMinutes })
                .ToListAsync();

            return Ok(types);
        }

        [HttpPost]
        public async Task<IActionResult> AddType(AppointmentTypeDto dto)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            var type = new AppointmentType
            {
                SurgeryId = surgeryId,
                Name = dto.Name.Trim(),
                DurationMinutes = dto.DurationMinutes
            };

            _context.AppointmentTypes.Add(type);
            await _context.SaveChangesAsync();

            return Ok(new { type.Id, type.Name, type.DurationMinutes });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateType(int id, AppointmentTypeDto dto)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            var type = await _context.AppointmentTypes
                .FirstOrDefaultAsync(a => a.Id == id && a.SurgeryId == surgeryId);
            if (type == null) return NotFound();

            type.Name = dto.Name.Trim();
            type.DurationMinutes = dto.DurationMinutes;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteType(int id)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            var type = await _context.AppointmentTypes
                .FirstOrDefaultAsync(a => a.Id == id && a.SurgeryId == surgeryId);
            if (type == null) return NotFound();
                        if (await _context.Appointments.AnyAsync(a => a.AppointmentTypeId == id))
            {
                return Conflict(new { message = "This appointment type has been booked before, so it cannot be deleted." });
            }

            _context.AppointmentTypes.Remove(type);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}