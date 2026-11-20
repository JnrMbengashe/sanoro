using System.Globalization;
using MediSlot.Models;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Services
{
    public record AppointmentEmailInfo(
        string PatientName,
        string PatientEmail,
        DateTime StartTime,
        string DoctorName,
        string TypeName,
        string SurgeryName,
        string SurgeryAddress,
        string SurgeryTown,
        string SurgeryPhone);

    public class AppointmentNotifier
    {
        private static readonly CultureInfo SouthAfrica = CultureInfo.GetCultureInfo("en-ZA");

        private readonly MediSlotContext _context;
        private readonly MailQueue _queue;
        private readonly IConfiguration _config;
        private readonly ILogger<AppointmentNotifier> _logger;

        public AppointmentNotifier(
            MediSlotContext context,
            MailQueue queue,
            IConfiguration config,
            ILogger<AppointmentNotifier> logger)
        {
            _context = context;
            _queue = queue;
            _config = config;
            _logger = logger;
        }

        public Task SendConfirmationAsync(int appointmentId) =>
            SendAsync(appointmentId, info => (
                $"Your appointment is confirmed: {Day(info)} at {Time(info)}",
                $"Hello {info.PatientName},\n\nYour appointment is confirmed.\n\n{Details(info)}\n\n" +
                $"Need to cancel? Log in at {Site()}/patient and open My appointments.\n\n{Signature()}"));

        public Task SendCancelledByPatientAsync(int appointmentId) =>
            SendAsync(appointmentId, info => (
                $"Your appointment has been cancelled: {Day(info)} at {Time(info)}",
                $"Hello {info.PatientName},\n\nYou have cancelled this appointment:\n\n{Details(info)}\n\n" +
                $"You can book another time at {Site()}/surgeries\n\n{Signature()}"));

        public Task SendCancelledBySurgeryAsync(int appointmentId) =>
            SendAsync(appointmentId, info => (
                $"Your appointment was cancelled by {info.SurgeryName}",
                $"Hello {info.PatientName},\n\nWe are sorry, but {info.SurgeryName} had to cancel this appointment:\n\n" +
                $"{Details(info)}\n\nPlease book another time at {Site()}/surgeries or phone the surgery on {info.SurgeryPhone}.\n\n{Signature()}"));

        public Task SendReminderAsync(int appointmentId) =>
            SendAsync(appointmentId, info => (
                $"Reminder: your appointment on {Day(info)} at {Time(info)}",
                $"Hello {info.PatientName},\n\nThis is a reminder of your appointment.\n\n{Details(info)}\n\n" +
                $"Cannot make it? Please cancel at {Site()}/patient so someone else can use the time.\n\n{Signature()}"));

        private static string Day(AppointmentEmailInfo info) =>
            info.StartTime.ToString("dddd, d MMMM yyyy", SouthAfrica);

        private static string Time(AppointmentEmailInfo info) =>
            info.StartTime.ToString("HH:mm", SouthAfrica);

        private static string Details(AppointmentEmailInfo info) =>
            $"{info.TypeName} with {info.DoctorName}\n{Day(info)} at {Time(info)}\n" +
            $"{info.SurgeryName}\n{info.SurgeryAddress}, {info.SurgeryTown}\nPhone: {info.SurgeryPhone}";

        private static string Signature() => "Sanoro\nIxesha lakho. Impilo yethu.";

        private string Site() => (_config["App:PublicUrl"] ?? "http://localhost:3000").TrimEnd('/');

        // Loads the appointment, builds the email and puts it in the queue.
        // It never throws: a failed email must never break a booking.
        private async Task SendAsync(int appointmentId, Func<AppointmentEmailInfo, (string Subject, string Body)> build)
        {
            try
            {
                var info = await _context.Appointments
                    .Where(a => a.Id == appointmentId && a.PatientId != null)
                    .Select(a => new AppointmentEmailInfo(
                        a.Patient.FullName,
                        a.Patient.Email,
                        a.StartTime,
                        a.Doctor.FullName,
                        a.AppointmentType.Name,
                        a.Surgery.Name,
                        a.Surgery.Address,
                        a.Surgery.Town,
                        a.Surgery.PhoneNumber))
                    .FirstOrDefaultAsync();

                // Phone and walk-in bookings have no email address
                if (info == null || string.IsNullOrWhiteSpace(info.PatientEmail))
                {
                    return;
                }

                var (subject, body) = build(info);
                _queue.Enqueue(new MailMessage(info.PatientName, info.PatientEmail, subject, body));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not prepare an email for appointment {Id}.", appointmentId);
            }
        }
    }
}