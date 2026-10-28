using CHTManagement.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CHTManagement.Controllers
{
    // Only the CHT-CIO role can read this queue or approve an indent for Vendor Assignment.
    [Authorize(Roles = "CHT-CIO")]
    [ApiController]
    [Route("api/indent-cio-approval")]
    public class IndentCioApprovalController : ControllerBase
    {
        private const string PendingWithCio = "Pending with CIO";
        private const string ApprovedByCio = "Approved by CIO";

        private readonly ApplicationDbContext _context;

        public IndentCioApprovalController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /api/indent-cio-approval/pending
        // Only logs already approved by the Clerk are visible in this queue.
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingForCio()
        {
            var pendingIndents = await _context.Indents
                .AsNoTracking()
                .Where(x => x.Status == PendingWithCio)
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
                    x.WhereRequiredLocationId,
                    LocationName = x.WhereRequiredLocation != null
                        ? x.WhereRequiredLocation.LocationName
                        : null,
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
                    x.HiringTransportRegisterSerialNumber,
                    x.BudgetHead,
                    x.TransportSupplyDateTime,
                    x.DetailsOfJourney,
                    x.DurationOfDutyDaysHours,
                    x.OrderStation,
                    x.OrderDate,
                    x.IssuingOfficerRankNameDesignation,
                    x.Status,
                    x.CreatedAt
                })
                .ToListAsync();

            return Ok(pendingIndents);
        }

        // POST: /api/indent-cio-approval/{id}/approve
        // CIO approval changes the workflow state so the next step can assign a vendor.
        [HttpPost("{id:int}/approve")]
        public async Task<IActionResult> ApproveForVendorAssignment(int id)
        {
            var indent = await _context.Indents
                .FirstOrDefaultAsync(x => x.IndentId == id);

            if (indent == null)
            {
                return NotFound(new { message = "Indent log was not found." });
            }

            if (!string.Equals(indent.Status, PendingWithCio, StringComparison.Ordinal))
            {
                return Conflict(new
                {
                    message = "This indent log is no longer pending with the CIO.",
                    status = indent.Status
                });
            }

            indent.Status = ApprovedByCio;
            indent.CioActionBy = User.Identity?.Name;
            indent.CioApprovedAt = DateTime.Now;


            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Indent log approved by CHT-CIO and marked ready for Vendor Assignment.",
                indentId = indent.IndentId,
                status = indent.Status
            });
        }
    }
}
