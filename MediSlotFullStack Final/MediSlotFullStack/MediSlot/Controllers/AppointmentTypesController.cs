using MediSlot.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace MediSlot.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.PlatformAdmin)]
    public class AppointmentTypesController : ControllerBase
    {
        private readonly MediSlotContext _context;

        public AppointmentTypesController(MediSlotContext context)
        {
            _context = context;
        }

        // GET: api/AppointmentTypes or api/AppointmentTypes?surgeryId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AppointmentType>>> GetAppointmentTypes([FromQuery] int? surgeryId)
        {
            var query = _context.AppointmentTypes.AsQueryable();

            if (surgeryId.HasValue)
            {
                query = query.Where(a => a.SurgeryId == surgeryId.Value);
            }

            return await query.OrderBy(a => a.Name).ToListAsync();
        }

        // GET: api/AppointmentTypes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AppointmentType>> GetAppointmentType(int id)
        {
            var item = await _context.AppointmentTypes.FindAsync(id);

            if (item == null)
            {
                return NotFound();
            }

            return item;
        }

        // POST: api/AppointmentTypes
        [HttpPost]
        public async Task<ActionResult<AppointmentType>> AddAppointmentType(AppointmentType item)
        {
            if (!await _context.Surgeries.AnyAsync(s => s.Id == item.SurgeryId))
            {
                return BadRequest("The surgery does not exist.");
            }

            item.Id = 0; // the database generates the Id
            _context.AppointmentTypes.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAppointmentType), new { id = item.Id }, item);
        }

        // PUT: api/AppointmentTypes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAppointmentType(int id, AppointmentType item)
        {
            if (id != item.Id)
            {
                return BadRequest();
            }

            if (!await _context.AppointmentTypes.AnyAsync(x => x.Id == id))
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

        // DELETE: api/AppointmentTypes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointmentType(int id)
        {
            var item = await _context.AppointmentTypes.FindAsync(id);

            if (item == null)
            {
                return NotFound();
            }

            _context.AppointmentTypes.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
