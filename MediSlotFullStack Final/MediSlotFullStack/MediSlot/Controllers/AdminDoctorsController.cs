using MediSlot.DTOs;
using MediSlot.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Controllers
{
    [Route("api/admin/doctors")]
    [ApiController]
    [Authorize(Roles = Roles.SurgeryAdmin)]
    public class AdminDoctorsController : SurgeryAdminControllerBase
    {
        private readonly MediSlotContext _context;

        public AdminDoctorsController(MediSlotContext context)
        {
            _context = context;
        }

        // Every lookup includes "SurgeryId == mine", so another surgery's doctor
        // simply does not exist as far as this admin is concerned.
        private Task<Doctor> FindMyDoctor(int doctorId, int surgeryId) =>
            _context.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId && d.SurgeryId == surgeryId);

        // ---------- Doctors ----------

        [HttpGet]
        public async Task<IActionResult> GetDoctors()
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            var doctors = await _context.Doctors
                .Where(d => d.SurgeryId == surgeryId)
                .OrderBy(d => d.FullName)
                .Select(d => new { d.Id, d.FullName, d.Speciality })
                .ToListAsync();

            return Ok(doctors);
        }

        [HttpPost]
        public async Task<IActionResult> AddDoctor(DoctorDto dto)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            var doctor = new Doctor
            {
                SurgeryId = surgeryId,
                FullName = dto.FullName.Trim(),
                Speciality = dto.Speciality?.Trim()
            };

            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            return Ok(new { doctor.Id, doctor.FullName, doctor.Speciality });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDoctor(int id, DoctorDto dto)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            var doctor = await FindMyDoctor(id, surgeryId);
            if (doctor == null) return NotFound();

            doctor.FullName = dto.FullName.Trim();
            doctor.Speciality = dto.Speciality?.Trim();
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDoctor(int id)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            var doctor = await FindMyDoctor(id, surgeryId);
            if (doctor == null) return NotFound();
                        if (await _context.Appointments.AnyAsync(a => a.DoctorId == id))
            {
                return Conflict(new { message = "This doctor has appointments, so they cannot be deleted." });
            }

            _context.Doctors.Remove(doctor);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ---------- Weekly hours ----------

        [HttpGet("{id}/schedule")]
        public async Task<IActionResult> GetSchedule(int id)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();
            if (await FindMyDoctor(id, surgeryId) == null) return NotFound();

            var rows = await _context.DoctorSchedules
                .Where(s => s.DoctorId == id)
                .OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime)
                .ToListAsync();

            return Ok(rows.Select(s => new
            {
                dayOfWeek = (int)s.DayOfWeek,
                startTime = s.StartTime.ToString("HH:mm"),
                endTime = s.EndTime.ToString("HH:mm")
            }));
        }

        // Replaces the doctor's whole week with the list that is sent.
        [HttpPut("{id}/schedule")]
        public async Task<IActionResult> SaveSchedule(int id, List<ScheduleBlockDto> blocks)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();
            if (await FindMyDoctor(id, surgeryId) == null) return NotFound();

            if (blocks.Count > 28)
            {
                return BadRequest(new { message = "Too many time blocks." });
            }

            var parsed = new List<DoctorSchedule>();
            foreach (var block in blocks)
            {
                if (!TimeOnly.TryParseExact(block.StartTime, "HH:mm", out var start) ||
                    !TimeOnly.TryParseExact(block.EndTime, "HH:mm", out var end))
                {
                    return BadRequest(new { message = "Times must look like 08:00." });
                }

                if (end <= start)
                {
                    return BadRequest(new { message = "Each block must finish after it starts." });
                }

                parsed.Add(new DoctorSchedule
                {
                    DoctorId = id,
                    DayOfWeek = (DayOfWeek)block.DayOfWeek,
                    StartTime = start,
                    EndTime = end
                });
            }

            // No two blocks on the same day may overlap
            foreach (var day in parsed.GroupBy(p => p.DayOfWeek))
            {
                var ordered = day.OrderBy(p => p.StartTime).ToList();
                for (int i = 1; i < ordered.Count; i++)
                {
                    if (ordered[i].StartTime < ordered[i - 1].EndTime)
                    {
                        return BadRequest(new { message = "Time blocks on the same day cannot overlap." });
                    }
                }
            }

            var existing = await _context.DoctorSchedules.Where(s => s.DoctorId == id).ToListAsync();
            _context.DoctorSchedules.RemoveRange(existing);
            _context.DoctorSchedules.AddRange(parsed);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ---------- Time off ----------

        [HttpGet("{id}/time-off")]
        public async Task<IActionResult> GetTimeOff(int id)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();
            if (await FindMyDoctor(id, surgeryId) == null) return NotFound();

            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(2)); // South African time

            var periods = await _context.DoctorTimeOffs
                .Where(t => t.DoctorId == id && t.EndDate >= today)
                .OrderBy(t => t.StartDate)
                .Select(t => new { t.Id, t.StartDate, t.EndDate, t.Note })
                .ToListAsync();

            return Ok(periods);
        }

        [HttpPost("{id}/time-off")]
        public async Task<IActionResult> AddTimeOff(int id, TimeOffDto dto)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();
            if (await FindMyDoctor(id, surgeryId) == null) return NotFound();

            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(2));

            if (dto.EndDate < dto.StartDate)
            {
                return BadRequest(new { message = "The end date cannot be before the start date." });
            }

            if (dto.EndDate < today)
            {
                return BadRequest(new { message = "The time off must not be entirely in the past." });
            }

            var period = new DoctorTimeOff
            {
                DoctorId = id,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Note = dto.Note?.Trim()
            };

            _context.DoctorTimeOffs.Add(period);
            await _context.SaveChangesAsync();

            return Ok(new { period.Id, period.StartDate, period.EndDate, period.Note });
        }

        [HttpDelete("{id}/time-off/{timeOffId}")]
        public async Task<IActionResult> DeleteTimeOff(int id, int timeOffId)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();
            if (await FindMyDoctor(id, surgeryId) == null) return NotFound();

            var period = await _context.DoctorTimeOffs
                .FirstOrDefaultAsync(t => t.Id == timeOffId && t.DoctorId == id);
            if (period == null) return NotFound();

            _context.DoctorTimeOffs.Remove(period);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}