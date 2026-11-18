using CHTManagement.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CHTManagement.Controllers
{
    [Authorize(Roles = "CHT-Clerk")]
    [ApiController]
    [Route("api/indent-approval")]
    public class IndentApprovalController : ControllerBase
    {
        private const string PendingWithClerk = "Pending with Clerk";
        private const string PendingWithCio = "Pending with CIO";
        private readonly ApplicationDbContext _context;

        public IndentApprovalController(ApplicationDbContext context) => _context = context;

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingForClerk()
        {
            var pendingIndents = await _context.Indents
                .AsNoTracking()
                .Where(x => x.Status == PendingWithClerk)
                .OrderBy(x => x.CreatedAt)
                .Select(x => new
                {
                    x.IndentId,
                    x.UnitName,
                    x.UserDetails,
                    x.IndentNumber,
                    x.IndentDate,
                    x.RequiredDateTime,
                    x.VehicleQuantity,
                    x.VehicleId,
                    VehicleType = x.Vehicle != null ? x.Vehicle.VehicleType : null,
                    x.TypeOfLoad,
                    x.WhereRequiredLocationId,
                    LocationName = x.WhereRequiredLocation != null ? x.WhereRequiredLocation.LocationName : null,
                    x.DurationOfEmployment,
                    x.Destination,
                    x.OneWayDistance,
                    x.ViaRoute,
                    x.ExactNatureOfDutyWithAuthority,
                    x.ReasonRegimentalStandingDutyTransportNotUtilized,
                    x.ReasonForUsingCHTOnSundayHoliday,
                    x.ReasonForUsingCHTToRailConnectedDestination,
                    x.IndentingOfficerStation,
                    x.IndentingOfficerDate,
                    x.CertifyingOfficerStation,
                    x.CertifyingOfficerDate,
                    x.Status,
                    x.CreatedAt
                })
                .ToListAsync();

            return Ok(pendingIndents);
        }

        [HttpPost("{id:int}/approve")]
        public async Task<IActionResult> ApproveForCio(int id)
        {
            var indent = await _context.Indents.FirstOrDefaultAsync(x => x.IndentId == id);
            if (indent == null)
                return NotFound(new { message = "Indent log was not found." });

            if (!string.Equals(indent.Status, PendingWithClerk, StringComparison.Ordinal))
                return Conflict(new { message = "This indent log is no longer pending with the Clerk.", status = indent.Status });

            indent.Status = PendingWithCio;
            indent.ClerkActionBy = User.Identity?.Name;
            indent.ClerkApprovedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Indent log approved by Clerk and forwarded to CHT-CIO.",
                indentId = indent.IndentId,
                status = indent.Status
            });
        }
    }
}
