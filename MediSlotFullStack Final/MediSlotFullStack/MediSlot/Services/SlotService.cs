using MediSlot.Models;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Services
{
    public class SlotService
    {
        public const int MaxDaysAhead = 60;
        public const int MinNoticeMinutes = 60;

        private readonly MediSlotContext _context;

        public SlotService(MediSlotContext context)
        {
            _context = context;
        }

        // South Africa has one time zone (UTC+2, no daylight saving)
        public static DateTime SaNow => DateTime.UtcNow.AddHours(2);

        // Works out the free start times for one doctor, one appointment type, on one date.
        public async Task<List<DateTime>> GetAvailableSlotsAsync(
        Doctor doctor, AppointmentType type, DateOnly date, int minNoticeMinutes = MinNoticeMinutes)
        {
            var slots = new List<DateTime>();
            var now = SaNow;
            var today = DateOnly.FromDateTime(now);

            if (date < today || date > today.AddDays(MaxDaysAhead))
            {
                return slots;
            }

            var onLeave = await _context.DoctorTimeOffs
                .AnyAsync(t => t.DoctorId == doctor.Id && t.StartDate <= date && t.EndDate >= date);
            if (onLeave)
            {
                return slots;
            }

            var weekday = date.DayOfWeek;
            var blocks = await _context.DoctorSchedules
                .Where(s => s.DoctorId == doctor.Id && s.DayOfWeek == weekday)
                .OrderBy(s => s.StartTime)
                .ToListAsync();
            if (blocks.Count == 0)
            {
                return slots;
            }

            var dayStart = date.ToDateTime(TimeOnly.MinValue);
            var dayEnd = dayStart.AddDays(1);
            var booked = await _context.Appointments
                .Where(a => a.DoctorId == doctor.Id
                            && a.Status != AppointmentStatus.Cancelled
                            && a.StartTime >= dayStart
                            && a.StartTime < dayEnd)
                .Select(a => new { a.StartTime, a.EndTime })
                .ToListAsync();

            var duration = TimeSpan.FromMinutes(type.DurationMinutes);
            var earliest = now.AddMinutes(minNoticeMinutes);

            foreach (var block in blocks)
            {
                var blockEnd = date.ToDateTime(block.EndTime);

                for (var start = date.ToDateTime(block.StartTime); start + duration <= blockEnd; start += duration)
                {
                    if (start < earliest)
                    {
                        continue;
                    }

                    var end = start + duration;
                    if (booked.Any(b => start < b.EndTime && end > b.StartTime))
                    {
                        continue;
                    }

                    slots.Add(start);
                }
            }

            return slots;
        }
    }
}