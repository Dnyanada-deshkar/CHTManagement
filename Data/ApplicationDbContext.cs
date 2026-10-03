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
    }
}