using CHTManagement.Data;
using CHTManagement.DTOs;
using CHTManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CHTManagement.Controllers
{
    // The client PDF does not specify a dedicated Vendor Assignment role.
    // Require a valid login; apply a role restriction only after the client confirms it.
    [Authorize]
    [ApiController]
    [Route("api/vendor-assignment")]
    public class VendorAssignmentController : ControllerBase
    {
        private const string ApprovedByCio = "Approved by CIO";
        private const string AssignedToVendor = "Assigned to Vendor";

        private readonly ApplicationDbContext _context;

        public VendorAssignmentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/vendor-assignment
        // Includes records approved by CIO and records already assigned to a vendor.
        [HttpGet]
        public async Task<IActionResult> GetRelevantIndentLogs()
        {
            var indents = await _context.Indents
                .AsNoTracking()
                .Include(x => x.Vehicle)
                .Include(x => x.WhereRequiredLocation)
                .Where(x => x.Status == ApprovedByCio || x.Status == AssignedToVendor)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var indentIds = indents.Select(x => x.IndentId).ToList();

            var assignments = await _context.VendorAssignments
                .AsNoTracking()
                .Include(x => x.Vendor)
                .Where(x => indentIds.Contains(x.IndentId))
                .ToListAsync();

            var assignmentsByIndent = assignments.ToDictionary(x => x.IndentId);

            var result = indents.Select(indent =>
            {
                assignmentsByIndent.TryGetValue(indent.IndentId, out var assignment);

                return new
                {
                    indentId = indent.IndentId,
                    logReference = indent.IndentId,
                    indentNumber = indent.IndentNumber,
                    unitName = indent.UnitName,
                    requiredDateTime = indent.RequiredDateTime,
                    vehicleId = indent.VehicleId,
                    vehicleType = indent.Vehicle != null ? indent.Vehicle.VehicleType : null,
                    vehicleQuantity = indent.VehicleQuantity,
                    locationId = indent.WhereRequiredLocationId,
                    locationName = indent.WhereRequiredLocation != null
                        ? indent.WhereRequiredLocation.LocationName
                        : null,
                    destination = indent.Destination,
                    oneWayDistance = indent.OneWayDistance,
                    viaRoute = indent.ViaRoute,
                    durationOfEmployment = indent.DurationOfEmployment,
                    exactNatureOfDutyWithAuthority = indent.ExactNatureOfDutyWithAuthority,
                    status = indent.Status,
                    createdAt = indent.CreatedAt,
                    assignedVendorId = assignment?.VendorId,
                    assignedVendorCode = assignment?.Vendor?.VendorCode,
                    assignedVendorName = assignment?.Vendor?.VendorName,
                    assignedAt = assignment?.AssignedAt,
                    assignedBy = assignment?.AssignedBy
                };
            }).ToList();

            return Ok(result);
        }

        // POST: api/vendor-assignment/{indentId}/assign
        [HttpPost("{indentId:int}/assign")]
        public async Task<IActionResult> AssignVendor(
            int indentId,
            [FromBody] AssignVendorRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var indent = await _context.Indents
                .FirstOrDefaultAsync(x => x.IndentId == indentId);

            if (indent == null)
                return NotFound(new { message = "Indent log was not found." });

            if (!string.Equals(indent.Status, ApprovedByCio, StringComparison.Ordinal))
            {
                return Conflict(new
                {
                    message = "Only indent logs approved by CIO and not yet assigned can be assigned to a vendor.",
                    status = indent.Status
                });
            }

            var alreadyAssigned = await _context.VendorAssignments
                .AnyAsync(x => x.IndentId == indentId);

            if (alreadyAssigned)
            {
                return Conflict(new
                {
                    message = "A vendor is already assigned to this indent log."
                });
            }

            var vendor = await _context.Vendors
                .FirstOrDefaultAsync(x => x.VendorId == request.VendorId && x.IsActive);

            if (vendor == null)
            {
                return BadRequest(new
                {
                    message = "Select a vendor that exists and is active in Vendor Master."
                });
            }

            var assignment = new VendorAssignment
            {
                IndentId = indent.IndentId,
                VendorId = vendor.VendorId,
                AssignedBy = User.Identity?.Name,
                AssignedAt = DateTime.Now
            };

            _context.VendorAssignments.Add(assignment);
            indent.Status = AssignedToVendor;

            // Assignment record and workflow status are saved together.
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Vendor assigned successfully. The indent is ready for Vehicle Demand Confirmation.",
                indentId = indent.IndentId,
                indentNumber = indent.IndentNumber,
                vendorId = vendor.VendorId,
                vendorCode = vendor.VendorCode,
                vendorName = vendor.VendorName,
                status = indent.Status,
                assignedAt = assignment.AssignedAt
            });
        }
    }
}
