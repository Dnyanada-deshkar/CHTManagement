using CHTManagement.Data;
using CHTManagement.DTOs;
using CHTManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CHTManagement.Controllers
{
    // The existing application has CHT-Clerk and CHT-CIO roles; both operate the downstream workflow.
    [Authorize(Roles = "CHT-Clerk,CHT-CIO")]
    [ApiController]
    [Route("api/transport-utilization")]
    public class TransportUtilizationController : ControllerBase
    {
        private const string VehicleDemandConfirmed = "Vehicle Demand Confirmed";
        private readonly ApplicationDbContext _context;

        public TransportUtilizationController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/transport-utilization
        // A separate Part-II record is available for each confirmed physical vehicle.
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var confirmations = await _context.VehicleDemandConfirmations
                .AsNoTracking()
                .Include(x => x.Indent).ThenInclude(x => x!.Vehicle)
                .Include(x => x.Indent).ThenInclude(x => x!.WhereRequiredLocation)
                .Where(x => x.Indent != null && x.Indent.Status == VehicleDemandConfirmed)
                .OrderByDescending(x => x.ConfirmationDate)
                .ThenByDescending(x => x.VehicleDemandConfirmationId)
                .ToListAsync();

            if (confirmations.Count == 0)
                return Ok(Array.Empty<object>());

            var indentIds = confirmations.Select(x => x.IndentId).Distinct().ToList();

            var assignments = await _context.VendorAssignments
                .AsNoTracking()
                .Include(x => x.Vendor)
                .Where(x => indentIds.Contains(x.IndentId))
                .ToListAsync();

            var assignmentByIndent = assignments
                .GroupBy(x => x.IndentId)
                .ToDictionary(x => x.Key, x => x.First());

            var confirmationIds = confirmations.Select(x => x.VehicleDemandConfirmationId).ToList();
            var utilizations = await _context.TransportUtilizations
                .AsNoTracking()
                .Where(x => confirmationIds.Contains(x.VehicleDemandConfirmationId))
                .ToListAsync();

            var utilizationByConfirmation = utilizations
                .ToDictionary(x => x.VehicleDemandConfirmationId);

            var rows = confirmations.Select(vehicle =>
            {
                var indent = vehicle.Indent!;
                assignmentByIndent.TryGetValue(indent.IndentId, out var assignment);
                utilizationByConfirmation.TryGetValue(vehicle.VehicleDemandConfirmationId, out var utilization);

                return new
                {
                    vehicleDemandConfirmationId = vehicle.VehicleDemandConfirmationId,
                    indentId = indent.IndentId,
                    logReference = indent.IndentId,
                    indentNumber = indent.IndentNumber,
                    unitName = indent.UnitName,
                    typeOfLoad = indent.TypeOfLoad,
                    vehicleType = indent.Vehicle?.VehicleType,
                    fromLocation = indent.WhereRequiredLocation?.LocationName,
                    destination = indent.Destination,
                    vehicleRegistrationNumber = vehicle.VehicleNumber,
                    driverName = vehicle.DriverName,
                    driverRegistrationNumber = vehicle.LicenseNumber,
                    driverMobileNumber = vehicle.MobileNumber,
                    confirmationDate = vehicle.ConfirmationDate,
                    assignedVendorCode = assignment?.Vendor?.VendorCode,
                    assignedVendorName = assignment?.Vendor?.VendorName,
                    hasTransportUtilization = utilization != null,
                    utilization = utilization == null ? null : new
                    {
                        utilization.TransportUtilizationId,
                        utilization.TransportReceivedDateTime,
                        utilization.TransportReceivedNumber,
                        utilization.JourneyFrom,
                        utilization.JourneyTo,
                        utilization.StoresPersonnelLoadedDetails,
                        utilization.LoadedTallySheetReference,
                        utilization.RTVoucherReference,
                        utilization.TransportLeftDepotDateTime,
                        utilization.UtilizingUnitStation,
                        utilization.UtilizingOfficerRankNameDesignation,
                        utilization.UtilizingOfficerDate,
                        utilization.LoadingSupervisedBy,
                        utilization.DriverSignatureObtained,
                        utilization.CreatedBy,
                        utilization.CreatedAt,
                        utilization.UpdatedBy,
                        utilization.UpdatedAt
                    }
                };
            }).ToList();

            return Ok(rows);
        }

        // GET: api/transport-utilization/vehicle-confirmation/12
        [HttpGet("vehicle-confirmation/{vehicleDemandConfirmationId:int}")]
        public async Task<IActionResult> GetByVehicleConfirmation(int vehicleDemandConfirmationId)
        {
            var record = await _context.TransportUtilizations
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.VehicleDemandConfirmationId == vehicleDemandConfirmationId);

            if (record == null)
                return NotFound(new { message = "Transport Utilization record was not found." });

            return Ok(record);
        }

        // POST: api/transport-utilization/12
        [HttpPost("{vehicleDemandConfirmationId:int}")]
        public async Task<IActionResult> Create(
            int vehicleDemandConfirmationId,
            [FromBody] SaveTransportUtilizationRequest request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var vehicle = await _context.VehicleDemandConfirmations
                .Include(x => x.Indent)
                .FirstOrDefaultAsync(x => x.VehicleDemandConfirmationId == vehicleDemandConfirmationId);

            if (vehicle == null)
                return NotFound(new { message = "Vehicle demand confirmation was not found." });

            if (vehicle.Indent == null || vehicle.Indent.Status != VehicleDemandConfirmed)
                return Conflict(new { message = "Transport Utilization can be recorded only after the indent's vehicle demand is confirmed." });

            var exists = await _context.TransportUtilizations
                .AnyAsync(x => x.VehicleDemandConfirmationId == vehicleDemandConfirmationId);

            if (exists)
                return Conflict(new { message = "Transport Utilization has already been recorded for this vehicle. Use View / Edit to update it." });

            var validationMessage = ValidateRequest(request);
            if (validationMessage != null)
                return BadRequest(new { message = validationMessage });

            var record = new TransportUtilization
            {
                VehicleDemandConfirmationId = vehicle.VehicleDemandConfirmationId,
                VehicleRegistrationNumber = vehicle.VehicleNumber,
                DriverName = vehicle.DriverName,
                DriverRegistrationNumber = vehicle.LicenseNumber,
                TransportReceivedDateTime = request.TransportReceivedDateTime!.Value,
                TransportReceivedNumber = Clean(request.TransportReceivedNumber),
                JourneyFrom = request.JourneyFrom!.Trim(),
                JourneyTo = request.JourneyTo!.Trim(),
                StoresPersonnelLoadedDetails = request.StoresPersonnelLoadedDetails!.Trim(),
                LoadedTallySheetReference = Clean(request.LoadedTallySheetReference),
                RTVoucherReference = Clean(request.RTVoucherReference),
                TransportLeftDepotDateTime = request.TransportLeftDepotDateTime!.Value,
                UtilizingUnitStation = request.UtilizingUnitStation!.Trim(),
                UtilizingOfficerRankNameDesignation = request.UtilizingOfficerRankNameDesignation!.Trim(),
                UtilizingOfficerDate = request.UtilizingOfficerDate!.Value.Date,
                LoadingSupervisedBy = request.LoadingSupervisedBy!.Trim(),
                DriverSignatureObtained = request.DriverSignatureObtained,
                CreatedBy = User.Identity?.Name,
                CreatedAt = DateTime.Now
            };

            _context.TransportUtilizations.Add(record);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetByVehicleConfirmation),
                new { vehicleDemandConfirmationId },
                new
                {
                    message = "Transport Utilization Part II saved successfully.",
                    record.TransportUtilizationId,
                    record.VehicleDemandConfirmationId,
                    record.CreatedAt
                });
        }

        // PUT: api/transport-utilization/12
        [HttpPut("{vehicleDemandConfirmationId:int}")]
        public async Task<IActionResult> Update(
            int vehicleDemandConfirmationId,
            [FromBody] SaveTransportUtilizationRequest request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var record = await _context.TransportUtilizations
                .FirstOrDefaultAsync(x => x.VehicleDemandConfirmationId == vehicleDemandConfirmationId);

            if (record == null)
                return NotFound(new { message = "Transport Utilization record was not found." });

            var validationMessage = ValidateRequest(request);
            if (validationMessage != null)
                return BadRequest(new { message = validationMessage });

            record.TransportReceivedDateTime = request.TransportReceivedDateTime!.Value;
            record.TransportReceivedNumber = Clean(request.TransportReceivedNumber);
            record.JourneyFrom = request.JourneyFrom!.Trim();
            record.JourneyTo = request.JourneyTo!.Trim();
            record.StoresPersonnelLoadedDetails = request.StoresPersonnelLoadedDetails!.Trim();
            record.LoadedTallySheetReference = Clean(request.LoadedTallySheetReference);
            record.RTVoucherReference = Clean(request.RTVoucherReference);
            record.TransportLeftDepotDateTime = request.TransportLeftDepotDateTime!.Value;
            record.UtilizingUnitStation = request.UtilizingUnitStation!.Trim();
            record.UtilizingOfficerRankNameDesignation = request.UtilizingOfficerRankNameDesignation!.Trim();
            record.UtilizingOfficerDate = request.UtilizingOfficerDate!.Value.Date;
            record.LoadingSupervisedBy = request.LoadingSupervisedBy!.Trim();
            record.DriverSignatureObtained = request.DriverSignatureObtained;
            record.UpdatedBy = User.Identity?.Name;
            record.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Transport Utilization record updated successfully.",
                record.TransportUtilizationId,
                record.VehicleDemandConfirmationId,
                record.UpdatedAt
            });
        }

        private static string? ValidateRequest(SaveTransportUtilizationRequest request)
        {
            if (!request.TransportReceivedDateTime.HasValue ||
                !request.TransportLeftDepotDateTime.HasValue ||
                !request.UtilizingOfficerDate.HasValue)
                return "Enter the transport received date/time, transport left depot date/time and officer date.";

            if (request.TransportLeftDepotDateTime.Value < request.TransportReceivedDateTime.Value)
                return "Transport Left Depot date/time cannot be earlier than Transport Received date/time.";

            if (string.IsNullOrWhiteSpace(request.JourneyFrom) ||
                string.IsNullOrWhiteSpace(request.JourneyTo) ||
                string.IsNullOrWhiteSpace(request.StoresPersonnelLoadedDetails) ||
                string.IsNullOrWhiteSpace(request.UtilizingUnitStation) ||
                string.IsNullOrWhiteSpace(request.UtilizingOfficerRankNameDesignation) ||
                string.IsNullOrWhiteSpace(request.LoadingSupervisedBy))
                return "Complete Journey From/To, stores/personnel loaded, station, officer details and loading supervisor.";

            if (!request.DriverSignatureObtained)
                return "Confirm that the driver's signature has been obtained on the source form.";

            return null;
        }

        private static string? Clean(string? value)
            => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
