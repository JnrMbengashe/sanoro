using MediSlot.Models;
using MediSlot.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Controllers
{
    [Route("api/public/availability")]
    [ApiController]
    public class PublicAvailabilityController : ControllerBase
    {
        private readonly MediSlotContext _context;
        private readonly SlotService _slots;

        public PublicAvailabilityController(MediSlotContext context, SlotService slots)
        {
            _context = context;
            _slots = slots;
        }

        // GET: api/public/availability?doctorId=1&appointmentTypeId=2&date=2026-12-01
        [HttpGet]
        public async Task<IActionResult> GetAvailability(
            [FromQuery] int doctorId,
            [FromQuery] int appointmentTypeId,
            [FromQuery] DateOnly date)
        {
            // Only doctors at approved surgeries can be booked
            var doctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.Id == doctorId && d.Surgery.IsApproved);
            if (doctor == null)
            {
                return NotFound();
            }

            var type = await _context.AppointmentTypes
                .FirstOrDefaultAsync(a => a.Id == appointmentTypeId && a.SurgeryId == doctor.SurgeryId);
            if (type == null)
            {
                return NotFound();
            }

            var slots = await _slots.GetAvailableSlotsAsync(doctor, type, date);

            return Ok(slots.Select(s => s.ToString("HH:mm")));
        }
    }
}