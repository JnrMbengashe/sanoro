using MediSlot.Models;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Services
{
    // Every few minutes, sends a reminder for appointments starting in the next 24 hours.
    public class ReminderWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<ReminderWorker> _logger;

        public ReminderWorker(IServiceScopeFactory scopeFactory, IConfiguration config, ILogger<ReminderWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _config = config;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                // Give the app a moment to finish starting
                await Task.Delay(TimeSpan.FromSeconds(20), stoppingToken);

                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        await SendDueRemindersAsync(stoppingToken);
                    }
                    catch (Exception ex) when (ex is not OperationCanceledException)
                    {
                        _logger.LogError(ex, "The reminder check failed.");
                    }

                    var minutes = _config.GetValue("Reminders:CheckEveryMinutes", 15);
                    await Task.Delay(TimeSpan.FromMinutes(minutes), stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                // The app is shutting down.
            }
        }

        private async Task SendDueRemindersAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MediSlotContext>();
            var notifier = scope.ServiceProvider.GetRequiredService<AppointmentNotifier>();

            var now = SlotService.SaNow;
            var windowEnd = now.AddHours(24);
            var bookedBefore = DateTime.UtcNow.AddHours(-3);

            var due = await context.Appointments
                .Where(a => a.Status == AppointmentStatus.Booked
                            && a.ReminderSentAtUtc == null
                            && a.PatientId != null
                            && a.StartTime > now
                            && a.StartTime <= windowEnd
                            && a.CreatedAtUtc <= bookedBefore)
                .ToListAsync(cancellationToken);

            foreach (var appointment in due)
            {
                await notifier.SendReminderAsync(appointment.Id);
                appointment.ReminderSentAtUtc = DateTime.UtcNow;
            }

            if (due.Count > 0)
            {
                await context.SaveChangesAsync(cancellationToken);
            }
        }
    }
}