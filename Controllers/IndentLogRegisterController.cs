using CHTManagement.Data;
using CHTManagement.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CHTManagement.Controllers
{
    // The paper Log Register is available to the two workflow roles named in the requirement.
    [Authorize(Roles = "CHT-Clerk,CHT-CIO")]
    [ApiController]
    [Route("api/indent-log-register")]
    public class IndentLogRegisterController : ControllerBase
    {
        private const string PendingWithClerk = "Pending with Clerk";
        private const string PendingWithCio = "Pending with CIO";
        private const string ApprovedByCio = "Approved by CIO";
        private const string AssignedToVendor = "Assigned to Vendor";
        private const string VehicleDemandConfirmed = "Vehicle Demand Confirmed";

        private readonly ApplicationDbContext _context;

        public IndentLogRegisterController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/indent-log-register
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var indents = await _context.Indents
                .AsNoTracking()
                .Include(x => x.Vehicle)
                .Include(x => x.WhereRequiredLocation)
                .Where(x => x.Status != "Draft")
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.IndentId)
                .ToListAsync();

            var rows = indents.Select(indent =>
            {
                var status = indent.Status ?? string.Empty;

                var contentParts = new List<string>();
                if (!string.IsNullOrWhiteSpace(indent.IndentNumber))
                    contentParts.Add($"Indent: {indent.IndentNumber}");
                if (indent.VehicleQuantity.HasValue)
                {
                    var type = indent.Vehicle?.VehicleType;
                    contentParts.Add(type == null
                        ? $"Vehicles: {indent.VehicleQuantity.Value}"
                        : $"Vehicles: {indent.VehicleQuantity.Value} x {type}");
                }
                if (!string.IsNullOrWhiteSpace(indent.Destination))
                    contentParts.Add($"Destination: {indent.Destination}");
                if (!string.IsNullOrWhiteSpace(indent.ExactNatureOfDutyWithAuthority))
                    contentParts.Add($"Duty: {indent.ExactNatureOfDutyWithAuthority}");

                return new
                {
                    serNo = indent.IndentId,
                    logReference = indent.IndentId,
                    date = indent.CreatedAt,
                    from = string.IsNullOrWhiteSpace(indent.UnitName)
                        ? indent.UserDetails
                        : indent.UnitName,
                    to = GetRecipient(status),
                    contentOfMsg = string.Join(" | ", contentParts),
                    chtClk = GetClerkRegisterValue(status, indent.ClerkActionBy, indent.ClerkApprovedAt),
                    oicCht = GetCioRegisterValue(status, indent.CioActionBy, indent.CioApprovedAt),
                    remarks = indent.RegisterRemarks,
                    workflowStatus = status
                };
            }).ToList();

            return Ok(rows);
        }

        // PUT: api/indent-log-register/{indentId}/remarks
        [HttpPut("{indentId:int}/remarks")]
        public async Task<IActionResult> UpdateRemarks(
            int indentId,
            [FromBody] UpdateIndentLogRemarksRequest request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var indent = await _context.Indents
                .FirstOrDefaultAsync(x => x.IndentId == indentId);

            if (indent == null)
                return NotFound(new { message = "Indent log was not found." });

            indent.RegisterRemarks = string.IsNullOrWhiteSpace(request.Remarks)
                ? null
                : request.Remarks.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Log register remarks saved.",
                indentId = indent.IndentId,
                remarks = indent.RegisterRemarks
            });
        }

        private static string GetRecipient(string status) => status switch
        {
            PendingWithClerk => "CHT-Clerk",
            PendingWithCio => "CHT-CIO",
            ApprovedByCio => "Vendor Assignment",
            AssignedToVendor => "Vehicle Demand Confirmation",
            VehicleDemandConfirmed => "Completed",
            _ => "—"
        };

        private static string GetClerkRegisterValue(
            string status, string? actionBy, DateTime? approvedAt)
        {
            if (status == PendingWithClerk)
                return "Pending";

            if (status == "Draft")
                return "—";

            if (approvedAt.HasValue)
                return string.IsNullOrWhiteSpace(actionBy)
                    ? $"Approved • {approvedAt.Value:dd MMM yyyy HH:mm}"
                    : $"Approved by {actionBy} • {approvedAt.Value:dd MMM yyyy HH:mm}";

            // Existing records approved before audit fields were added cannot have
            // a reliable approver/time reconstructed. Do not fabricate that history.
            return "Approved (existing record; time not recorded)";
        }

        private static string GetCioRegisterValue(
            string status, string? actionBy, DateTime? approvedAt)
        {
            if (status == PendingWithClerk)
                return "Not yet forwarded";

            if (status == PendingWithCio)
                return "Pending";

            if (approvedAt.HasValue)
                return string.IsNullOrWhiteSpace(actionBy)
                    ? $"Approved • {approvedAt.Value:dd MMM yyyy HH:mm}"
                    : $"Approved by {actionBy} • {approvedAt.Value:dd MMM yyyy HH:mm}";

            if (status == ApprovedByCio || status == AssignedToVendor || status == VehicleDemandConfirmed)
                return "Approved (existing record; time not recorded)";

            return "—";
        }
    }
}
