using MediSlot.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace MediSlot.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.PlatformAdmin)]
    public class DoctorsController : ControllerBase
    {
        private readonly MediSlotContext _context;

        public DoctorsController(MediSlotContext context)
        {
            _context = context;
        }

        // GET: api/Doctors or api/Doctors?surgeryId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Doctor>>> GetDoctors([FromQuery] int? surgeryId)
        {
            var query = _context.Doctors.AsQueryable();

            if (surgeryId.HasValue)
            {
                query = query.Where(d => d.SurgeryId == surgeryId.Value);
            }

            return await query.OrderBy(d => d.FullName).ToListAsync();
        }

        // GET: api/Doctors/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Doctor>> GetDoctor(int id)
        {
            var item = await _context.Doctors.FindAsync(id);

            if (item == null)
            {
                return NotFound();
            }

            return item;
        }

        // POST: api/Doctors
        [HttpPost]
        public async Task<ActionResult<Doctor>> AddDoctor(Doctor item)
        {
            if (!await _context.Surgeries.AnyAsync(s => s.Id == item.SurgeryId))
            {
                return BadRequest("The surgery does not exist.");
            }

            item.Id = 0; // the database generates the Id
            _context.Doctors.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDoctor), new { id = item.Id }, item);
        }

        // PUT: api/Doctors/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDoctor(int id, Doctor item)
        {
            if (id != item.Id)
            {
                return BadRequest();
            }

            if (!await _context.Doctors.AnyAsync(x => x.Id == id))
            {
                return NotFound();
            }

            if (!await _context.Surgeries.AnyAsync(s => s.Id == item.SurgeryId))
            {
                return BadRequest("The surgery does not exist.");
            }

            _context.Entry(item).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Doctors/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDoctor(int id)
        {
            var item = await _context.Doctors.FindAsync(id);

            if (item == null)
            {
                return NotFound();
            }

            _context.Doctors.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
