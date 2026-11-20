using MediSlot.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace MediSlot.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.PlatformAdmin)]
    public class SurgeriesController : ControllerBase
    {
        private readonly MediSlotContext _context;

        public SurgeriesController(MediSlotContext context)
        {
            _context = context;
        }

        // GET: api/Surgeries
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Surgery>>> GetSurgeries()
        {
            return await _context.Surgeries.OrderBy(s => s.Name).ToListAsync();
        }

        // GET: api/Surgeries/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Surgery>> GetSurgery(int id)
        {
            var surgery = await _context.Surgeries.FindAsync(id);

            if (surgery == null)
            {
                return NotFound();
            }

            return surgery;
        }

        // POST: api/Surgeries
        [HttpPost]
        public async Task<ActionResult<Surgery>> AddSurgery(Surgery surgery)
        {
            surgery.Id = 0; // the database generates the Id
            _context.Surgeries.Add(surgery);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSurgery), new { id = surgery.Id }, surgery);
        }

        // PUT: api/Surgeries/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSurgery(int id, Surgery surgery)
        {
            if (id != surgery.Id)
            {
                return BadRequest();
            }

            if (!await _context.Surgeries.AnyAsync(s => s.Id == id))
            {
                return NotFound();
            }

            _context.Entry(surgery).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Surgeries/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSurgery(int id)
        {
            var surgery = await _context.Surgeries.FindAsync(id);

            if (await _context.Appointments.AnyAsync(a => a.SurgeryId == id) ||
                await _context.Users.AnyAsync(u => u.SurgeryId == id))
            {
                return Conflict(new
                {
                    message = "This surgery has accounts or appointments, so it cannot be deleted. Suspend it instead by turning off Approved."
                });
            }

            _context.Surgeries.Remove(surgery);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
