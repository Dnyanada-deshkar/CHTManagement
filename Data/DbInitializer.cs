
using CHTManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CHTManagement.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(
            ApplicationDbContext context)
        {
            var passwordHasher = new PasswordHasher<AppUser>();

            // Find or create the CHT-Clerk account.
            var clerk = await context.Users
                .FirstOrDefaultAsync(x => x.Username == "chtclerk");

            if (clerk == null)
            {
                clerk = new AppUser
                {
                    Username = "chtclerk"
                };

                context.Users.Add(clerk);
            }

            clerk.Role = "CHT-Clerk";
            clerk.IsActive = true;
            clerk.PasswordHash = passwordHasher.HashPassword(
                clerk, "Clerk@123");

            // Find or create the CHT-CIO account.
            var cio = await context.Users
                .FirstOrDefaultAsync(x => x.Username == "chtcio");

            if (cio == null)
            {
                cio = new AppUser
                {
                    Username = "chtcio"
                };

                context.Users.Add(cio);
            }

            cio.Role = "CHT-CIO";
            cio.IsActive = true;
            cio.PasswordHash = passwordHasher.HashPassword(
                cio, "Cio@123");

            await context.SaveChangesAsync();
        }
    }
}
