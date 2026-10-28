using CHTManagement.Data;
using CHTManagement.DTOs;
using CHTManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CHTManagement.Controllers
{
    // The PDF does not specify a dedicated role for the vehicle register.
    // Require an authenticated user; narrow this to a role if the client specifies one.
    [Authorize]
    [ApiController]
    [Route("api/vehicle-demand-register")]
    public class VehicleDemandRegisterController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VehicleDemandRegisterController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/vehicle-demand-register
        // One row per physical vehicle confirmation, matching the paper ledger.
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var records = await _context.VehicleDemandConfirmations
                .AsNoTracking()
                .Include(x => x.Indent)
                    .ThenInclude(x => x!.Vehicle)
                .Include(x => x.Indent)
                    .ThenInclude(x => x!.WhereRequiredLocation)
                .OrderByDescending(x => x.ConfirmationDate)
                .ThenByDescending(x => x.VehicleDemandConfirmationId)
                .ToListAsync();

            var rows = records.Select(record =>
            {
                var indent = record.Indent;
                return new
                {
                    sNo = record.VehicleDemandConfirmationId,
                    vehicleDemandConfirmationId = record.VehicleDemandConfirmationId,
                    date = record.ConfirmationDate,
                    vehNo = record.VehicleNumber,
                    typeOfVeh = indent?.Vehicle?.VehicleType,
                    nameOfUnit = indent?.UnitName,
                    from = indent?.WhereRequiredLocation?.LocationName,
                    to = indent?.Destination,
                    driverName = record.DriverName,
                    licNo = record.LicenseNumber,
                    mobNo = record.MobileNumber,
                    ncoInCharge = record.NcoInCharge,
                    clk = record.ClerkInitials,
                    oic = record.Oic,
                    challanContNo = record.ChallanControlNumber,
                    remarks = record.Remarks,
                    photoUrl = $"/api/vehicle-demand-confirmation/{record.VehicleDemandConfirmationId}/photo",
                    workflowStatus = indent?.Status
                };
            }).ToList();

            return Ok(rows);
        }

        // PUT: api/vehicle-demand-register/{confirmationId}
        // Updates register-only fields; it does not change the workflow status.
        [HttpPut("{confirmationId:int}")]
        public async Task<IActionResult> UpdateRegisterFields(
            int confirmationId,
            [FromBody] UpdateVehicleDemandRegisterRequest request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var record = await _context.VehicleDemandConfirmations
                .FirstOrDefaultAsync(x =>
                    x.VehicleDemandConfirmationId == confirmationId);

            if (record == null)
                return NotFound(new { message = "Vehicle confirmation was not found." });

            record.NcoInCharge = Clean(request.NcoInCharge);
            record.ClerkInitials = Clean(request.ClerkInitials);
            record.Oic = Clean(request.Oic);
            record.ChallanControlNumber = Clean(request.ChallanControlNumber);
            record.Remarks = Clean(request.Remarks);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Vehicle demand register details saved.",
                vehicleDemandConfirmationId = record.VehicleDemandConfirmationId
            });
        }

        private static string? Clean(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
