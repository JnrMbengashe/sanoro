using System.Data;
using MediSlot.DTOs;
using MediSlot.Models;
using MediSlot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.Patient)]
    public class AppointmentsController : ControllerBase
    {
        private const int MaxUpcomingBookings = 5;

        private readonly MediSlotContext _context;
        private readonly SlotService _slots;

                private readonly AppointmentNotifier _notifier;

        public AppointmentsController(MediSlotContext context, SlotService slots, AppointmentNotifier notifier)
        {
            _context = context;
            _slots = slots;
            _notifier = notifier;
        }

        private string CurrentUserId => User.FindFirst("sub")?.Value;

        // GET: api/appointments/mine
        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            var userId = CurrentUserId;
            var now = SlotService.SaNow;

            var rows = await _context.Appointments
                .Where(a => a.PatientId == userId)
                .OrderByDescending(a => a.StartTime)
                .Select(a => new
                {
                    a.Id,
                    a.StartTime,
                    a.EndTime,
                    a.Status,
                    DoctorName = a.Doctor.FullName,
                    AppointmentType = a.AppointmentType.Name,
                    a.SurgeryId,
                    SurgeryName = a.Surgery.Name,
                    SurgeryAddress = a.Surgery.Address,
                    SurgeryTown = a.Surgery.Town,
                    SurgeryPhone = a.Surgery.PhoneNumber,
                    CanCancel = a.Status == AppointmentStatus.Booked && a.StartTime > now
                })
                .ToListAsync();

            return Ok(rows.Select(r => new
            {
                r.Id,
                r.StartTime,
                r.EndTime,
                Status = r.Status.ToString(),
                r.DoctorName,
                r.AppointmentType,
                r.SurgeryId,
                r.SurgeryName,
                r.SurgeryAddress,
                r.SurgeryTown,
                r.SurgeryPhone,
                r.CanCancel
            }));
        }

        // POST: api/appointments   (books a slot, confirmed straight away)
        [HttpPost]
        public async Task<IActionResult> Book(BookAppointmentDto dto)
        {
            var userId = CurrentUserId;

            if (!TimeOnly.TryParseExact(dto.Time, "HH:mm", out var time))
            {
                return BadRequest(new { message = "The time must look like 08:00." });
            }

            var doctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.Id == dto.DoctorId && d.Surgery.IsApproved);
            if (doctor == null)
            {
                return NotFound(new { message = "That doctor could not be found." });
            }

            var type = await _context.AppointmentTypes
                .FirstOrDefaultAsync(a => a.Id == dto.AppointmentTypeId && a.SurgeryId == doctor.SurgeryId);
            if (type == null)
            {
                return NotFound(new { message = "That appointment type could not be found." });
            }

            var start = dto.Date.ToDateTime(time);
            var end = start.AddMinutes(type.DurationMinutes);
            var now = SlotService.SaNow;

            try
            {
                // Serializable = the database locks the range we read, so two people
                // booking the same time cannot both succeed.
                await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

                var upcoming = await _context.Appointments.CountAsync(a =>
                    a.PatientId == userId && a.Status == AppointmentStatus.Booked && a.StartTime > now);
                if (upcoming >= MaxUpcomingBookings)
                {
                    return Conflict(new { message = "You already have 5 upcoming appointments. Please cancel one before booking another." });
                }

                var free = await _slots.GetAvailableSlotsAsync(doctor, type, dto.Date);
                if (!free.Contains(start))
                {
                    return Conflict(new { message = "Sorry, that time is no longer available. Please choose another time." });
                }

                var clash = await _context.Appointments.AnyAsync(a =>
                    a.PatientId == userId && a.Status == AppointmentStatus.Booked && a.StartTime < end && a.EndTime > start);
                if (clash)
                {
                    return Conflict(new { message = "You already have an appointment at that time." });
                }

                var appointment = new Appointment
                {
                    SurgeryId = doctor.SurgeryId,
                    DoctorId = doctor.Id,
                    AppointmentTypeId = type.Id,
                    PatientId = userId,
                    StartTime = start,
                    EndTime = end,
                    Status = AppointmentStatus.Booked
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                await _notifier.SendConfirmationAsync(appointment.Id);

                return Ok(new { appointment.Id, appointment.StartTime, appointment.EndTime });
            }
            catch (Exception ex) when (ex is DbUpdateException || ex is Microsoft.Data.SqlClient.SqlException)
            {
                return Conflict(new { message = "Sorry, that time was just taken. Please choose another time." });
            }
        }

        // POST: api/appointments/5/cancel
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var userId = CurrentUserId;

            // Only the patient's OWN appointments are found
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == id && a.PatientId == userId);
            if (appointment == null)
            {
                return NotFound();
            }

            if (appointment.Status != AppointmentStatus.Booked)
            {
                return BadRequest(new { message = "This appointment is already cancelled or finished." });
            }

            if (appointment.StartTime <= SlotService.SaNow)
            {
                return BadRequest(new { message = "Past appointments cannot be cancelled." });
            }

            appointment.Status = AppointmentStatus.Cancelled;
            appointment.CancelledAtUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await _notifier.SendCancelledByPatientAsync(appointment.Id);

            return NoContent();
        }
    }
}