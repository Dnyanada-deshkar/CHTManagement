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

        public DbSet<Vehicle> Vehicles { get; set; }

        public DbSet<Indent> Indents { get; set; }

        public DbSet<ContractRate> ContractRates { get; set; }
        public DbSet<Vendor> Vendors { get; set; }


        public DbSet<VendorAssignment> VendorAssignments { get; set; }

        public DbSet<VehicleDemandConfirmation> VehicleDemandConfirmations { get; set; }



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

            modelBuilder.Entity<Vehicle>()
                .HasIndex(x => x.VehicleCode)
                .IsUnique();

            modelBuilder.Entity<ContractRate>()
    .Property(x => x.RateAmount)
    .HasPrecision(18, 2);

            modelBuilder.Entity<ContractRate>()
                .HasIndex(x => new { x.ContractYear, x.VehicleCategory, x.SerialNo })
                .IsUnique();

            modelBuilder.Entity<Vendor>()
                .HasIndex(x => x.VendorCode)
                .IsUnique();

            modelBuilder.Entity<VendorAssignment>()
    .HasIndex(x => x.IndentId)
    .IsUnique();

            modelBuilder.Entity<VendorAssignment>()
                .HasOne(x => x.Indent)
                .WithOne()
                .HasForeignKey<VendorAssignment>(x => x.IndentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<VendorAssignment>()
                .HasOne(x => x.Vendor)
                .WithMany()
                .HasForeignKey(x => x.VendorId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<VehicleDemandConfirmation>()
    .HasIndex(x => new { x.IndentId, x.VehicleNumber })
    .IsUnique();

            modelBuilder.Entity<VehicleDemandConfirmation>()
                .HasOne(x => x.Indent)
                .WithMany()
                .HasForeignKey(x => x.IndentId)
                .OnDelete(DeleteBehavior.Restrict);


        }
    }
}