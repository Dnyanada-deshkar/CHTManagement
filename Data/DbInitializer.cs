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
            // Do not use EnsureCreated here because
            // we are using EF Core migrations.

            if (await context.Users.AnyAsync())
                return;

            var passwordHasher = new PasswordHasher<AppUser>();

            var clerk = new AppUser
            {
                Username = "chtclerk",
                Role = "CHT-Clerk",
                IsActive = true
            };

            clerk.PasswordHash = passwordHasher.HashPassword(
                clerk,
                "Clerk@123");

            var cio = new AppUser
            {
                Username = "chtcio",
                Role = "CHT-CIO",
                IsActive = true
            };

            cio.PasswordHash = passwordHasher.HashPassword(
                cio,
                "Cio@123");

            context.Users.AddRange(clerk, cio);

            await context.SaveChangesAsync();
        }
    }
}