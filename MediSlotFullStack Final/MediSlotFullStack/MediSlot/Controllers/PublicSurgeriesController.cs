using MediSlot.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Controllers
{
    [Route("api/public/surgeries")]
    [ApiController]
    public class PublicSurgeriesController : ControllerBase
    {
        private readonly MediSlotContext _context;

        public PublicSurgeriesController(MediSlotContext context)
        {
            _context = context;
        }

        // GET: api/public/surgeries?search=port
        // Anyone can call this. It only ever returns approved surgeries.
        [HttpGet]
        public async Task<IActionResult> GetApprovedSurgeries([FromQuery] string search)
        {
            var query = _context.Surgeries.Where(s => s.IsApproved);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(s => s.Name.Contains(term) || s.Town.Contains(term));
            }

            var surgeries = await query
                .OrderBy(s => s.Town)
                .ThenBy(s => s.Name)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Town,
                    s.Address,
                    s.PhoneNumber,
                    s.Description,
                    DoctorCount = s.Doctors.Count
                })
                .ToListAsync();

            return Ok(surgeries);
        }

        // GET: api/public/surgeries/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetApprovedSurgery(int id)
        {
            var surgery = await _context.Surgeries
                .Where(s => s.Id == id && s.IsApproved)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Town,
                    s.Address,
                    s.PhoneNumber,
                    s.Description,
                    Doctors = s.Doctors
                        .OrderBy(d => d.FullName)
                        .Select(d => new { d.Id, d.FullName, d.Speciality }),
                    AppointmentTypes = s.AppointmentTypes
                        .OrderBy(a => a.Name)
                        .Select(a => new { a.Id, a.Name, a.DurationMinutes })
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