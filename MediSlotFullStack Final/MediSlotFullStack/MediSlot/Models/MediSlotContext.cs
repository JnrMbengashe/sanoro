using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace MediSlot.Models
{
    public class MediSlotContext : IdentityDbContext<ApplicationUser>
    {
        public MediSlotContext(DbContextOptions<MediSlotContext> options) : base(options)
        {
        }

        public DbSet<Surgery> Surgeries { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<AppointmentType> AppointmentTypes { get; set; }
        public DbSet<DoctorSchedule> DoctorSchedules { get; set; }
        public DbSet<DoctorTimeOff> DoctorTimeOffs { get; set; }
        public DbSet<Appointment> Appointments { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Appointments never cascade-delete. (SQL Server also rejects multiple cascade paths.)
            builder.Entity<Appointment>().HasOne(a => a.Surgery).WithMany()
                .HasForeignKey(a => a.SurgeryId).OnDelete(DeleteBehavior.Restrict);
            builder.Entity<Appointment>().HasOne(a => a.Doctor).WithMany()
                .HasForeignKey(a => a.DoctorId).OnDelete(DeleteBehavior.Restrict);
            builder.Entity<Appointment>().HasOne(a => a.AppointmentType).WithMany()
                .HasForeignKey(a => a.AppointmentTypeId).OnDelete(DeleteBehavior.Restrict);
            builder.Entity<Appointment>().HasOne(a => a.Patient).WithMany()
                .HasForeignKey(a => a.PatientId).OnDelete(DeleteBehavior.Restrict);

            // Second line of defence against double-booking: one ACTIVE booking per doctor per start time.
            // Cancelled (1) appointments are ignored so the slot can be booked again.
            builder.Entity<Appointment>()
                .HasIndex(a => new { a.DoctorId, a.StartTime })
                .IsUnique()
                .HasFilter("[Status] <> 1");
        }
    }
}