using CHTManagement.Models;
using Microsoft.EntityFrameworkCore;

namespace CHTManagement.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<AppUser> Users { get; set; }

        public DbSet<LocationType> LocationTypes { get; set; }

        public DbSet<Location> Locations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Location>()
                .HasIndex(x => x.LocationCode)
                .IsUnique();

            modelBuilder.Entity<Location>()
                .HasOne<LocationType>()
                .WithMany()
                .HasForeignKey(x => x.LocationTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}