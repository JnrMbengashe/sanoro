using System.Data;
using MediSlot.DTOs;
using MediSlot.Models;
using MediSlot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Controllers
{
    [Route("api/admin/appointments")]
    [ApiController]
    [Authorize(Roles = Roles.SurgeryAdmin)]
    public class AdminAppointmentsController : SurgeryAdminControllerBase
    {
        private readonly MediSlotContext _context;
        private readonly SlotService _slots;
        private readonly AppointmentNotifier _notifier;

        public AdminAppointmentsController(MediSlotContext context, SlotService slots, AppointmentNotifier notifier)
        {
            _context = context;
            _slots = slots;
            _notifier = notifier;
        }

        // GET: api/admin/appointments?date=2026-12-07   (defaults to today)
        [HttpGet]
        public async Task<IActionResult> GetForDate([FromQuery] DateOnly? date)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            var day = date ?? DateOnly.FromDateTime(SlotService.SaNow);
            var dayStart = day.ToDateTime(TimeOnly.MinValue);
            var dayEnd = dayStart.AddDays(1);

            var rows = await _context.Appointments
                .Where(a => a.SurgeryId == surgeryId && a.StartTime >= dayStart && a.StartTime < dayEnd)
                .OrderBy(a => a.StartTime)
                .Select(a => new
                {
                    a.Id,
                    a.StartTime,
                    a.EndTime,
                    a.Status,
                    a.DoctorId,
                    DoctorName = a.Doctor.FullName,
                    AppointmentType = a.AppointmentType.Name,
                    PatientName = a.Patient != null ? a.Patient.FullName : a.GuestName,
                    PatientPhone = a.Patient != null ? a.Patient.PhoneNumber : a.GuestPhone,
                    IsWalkIn = a.PatientId == null
                })
                .ToListAsync();

            return Ok(rows.Select(r => new
            {
                r.Id,
                r.StartTime,
                r.EndTime,
                Status = r.Status.ToString(),
                r.DoctorId,
                r.DoctorName,
                r.AppointmentType,
                r.PatientName,
                r.PatientPhone,
                r.IsWalkIn
            }));
        }

        // GET: api/admin/appointments/availability?doctorId=1&appointmentTypeId=2&date=2026-12-07
        // Free times for the surgery's OWN doctors. No one-hour notice rule, so walk-ins work.
        [HttpGet("availability")]
        public async Task<IActionResult> GetAvailability(
            [FromQuery] int doctorId,
            [FromQuery] int appointmentTypeId,
            [FromQuery] DateOnly date)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            var doctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.Id == doctorId && d.SurgeryId == surgeryId);
            var type = await _context.AppointmentTypes
                .FirstOrDefaultAsync(a => a.Id == appointmentTypeId && a.SurgeryId == surgeryId);
            if (doctor == null || type == null) return NotFound();

            var free = await _slots.GetAvailableSlotsAsync(doctor, type, date, minNoticeMinutes: 0);

            return Ok(free.Select(s => s.ToString("HH:mm")));
        }

        // POST: api/admin/appointments   (a phone or walk-in booking for someone without an account)
        [HttpPost]
        public async Task<IActionResult> BookForGuest(AdminBookingDto dto)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            if (!TimeOnly.TryParseExact(dto.Time, "HH:mm", out var time))
            {
                return BadRequest(new { message = "The time must look like 08:00." });
            }

            var doctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.Id == dto.DoctorId && d.SurgeryId == surgeryId);
            var type = await _context.AppointmentTypes
                .FirstOrDefaultAsync(a => a.Id == dto.AppointmentTypeId && a.SurgeryId == surgeryId);
            if (doctor == null || type == null)
            {
                return NotFound(new { message = "That doctor or appointment type could not be found." });
            }

            var start = dto.Date.ToDateTime(time);
            var end = start.AddMinutes(type.DurationMinutes);

            try
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

                var free = await _slots.GetAvailableSlotsAsync(doctor, type, dto.Date, minNoticeMinutes: 0);
                if (!free.Contains(start))
                {
                    return Conflict(new { message = "That time is not available. Please choose another." });
                }

                var appointment = new Appointment
                {
                    SurgeryId = surgeryId,
                    DoctorId = doctor.Id,
                    AppointmentTypeId = type.Id,
                    PatientId = null,
                    GuestName = dto.GuestName.Trim(),
                    GuestPhone = dto.GuestPhone?.Trim(),
                    StartTime = start,
                    EndTime = end,
                    Status = AppointmentStatus.Booked
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { appointment.Id, appointment.StartTime, appointment.EndTime });
            }
            catch (Exception ex) when (ex is DbUpdateException || ex is Microsoft.Data.SqlClient.SqlException)
            {
                return Conflict(new { message = "That time was just taken. Please choose another." });
            }
        }

        // POST: api/admin/appointments/5/status   body: { "status": "Completed" }
        [HttpPost("{id}/status")]
        public async Task<IActionResult> SetStatus(int id, AppointmentStatusDto dto)
        {
            if (CurrentSurgeryId is not int surgeryId) return Forbid();

            // Only this surgery's own appointments are found
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == id && a.SurgeryId == surgeryId);
            if (appointment == null) return NotFound();

            if (appointment.Status != AppointmentStatus.Booked)
            {
                return BadRequest(new { message = "Only booked appointments can be changed." });
            }

            var now = SlotService.SaNow;

            switch (dto.Status)
            {
                case "Cancelled":
                    if (appointment.StartTime <= now)
                    {
                        return BadRequest(new { message = "This appointment has already started. Mark it as completed or missed instead." });
                    }
                    appointment.Status = AppointmentStatus.Cancelled;
                    appointment.CancelledAtUtc = DateTime.UtcNow;
                    break;

                case "Completed":
                case "NoShow":
                    if (appointment.StartTime > now)
                    {
                        return BadRequest(new { message = "This appointment has not started yet." });
                    }
                    appointment.Status = dto.Status == "Completed"
                        ? AppointmentStatus.Completed
                        : AppointmentStatus.NoShow;
                    break;

                default:
                    return BadRequest(new { message = "The status must be Cancelled, Completed or NoShow." });
            }

                       await _context.SaveChangesAsync();

            if (appointment.Status == AppointmentStatus.Cancelled)
            {
                await _notifier.SendCancelledBySurgeryAsync(appointment.Id);
            }

            return NoContent();
        }
    }
}