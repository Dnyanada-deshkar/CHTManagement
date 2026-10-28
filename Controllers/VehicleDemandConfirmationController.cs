using System.Data;
using CHTManagement.Data;
using CHTManagement.DTOs;
using CHTManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CHTManagement.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/vehicle-demand-confirmation")]
    public class VehicleDemandConfirmationController : ControllerBase
    {
        private const string AssignedToVendor = "Assigned to Vendor";
        private const string VehicleDemandConfirmed = "Vehicle Demand Confirmed";
        private const int MaxPhotoBytes = 5 * 1024 * 1024;

        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public VehicleDemandConfirmationController(
            ApplicationDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/vehicle-demand-confirmation
        // Lists assigned indent logs and already-confirmed vehicle details.
        [HttpGet]
        public async Task<IActionResult> GetAssignedIndentLogs()
        {
            var indents = await _context.Indents
                .AsNoTracking()
                .Include(x => x.Vehicle)
                .Include(x => x.WhereRequiredLocation)
                .Where(x => x.Status == AssignedToVendor || x.Status == VehicleDemandConfirmed)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var indentIds = indents.Select(x => x.IndentId).ToList();
            if (indentIds.Count == 0)
                return Ok(Array.Empty<object>());

            var assignments = await _context.VendorAssignments
                .AsNoTracking()
                .Include(x => x.Vendor)
                .Where(x => indentIds.Contains(x.IndentId))
                .ToListAsync();

            var assignmentByIndent = assignments
                .GroupBy(x => x.IndentId)
                .ToDictionary(x => x.Key, x => x.First());

            var confirmedVehicles = await _context.VehicleDemandConfirmations
                .AsNoTracking()
                .Where(x => indentIds.Contains(x.IndentId))
                .OrderBy(x => x.ConfirmationDate)
                .ThenBy(x => x.VehicleDemandConfirmationId)
                .ToListAsync();

            var result = indents
                .Where(indent => assignmentByIndent.ContainsKey(indent.IndentId))
                .Select(indent =>
                {
                    var assignment = assignmentByIndent[indent.IndentId];
                    var vehicleRecords = confirmedVehicles
                        .Where(x => x.IndentId == indent.IndentId)
                        .Select(x => new
                        {
                            vehicleDemandConfirmationId = x.VehicleDemandConfirmationId,
                            confirmationDate = x.ConfirmationDate,
                            vehicleNumber = x.VehicleNumber,
                            driverName = x.DriverName,
                            licenseNumber = x.LicenseNumber,
                            mobileNumber = x.MobileNumber,
                            photoUrl = $"/api/vehicle-demand-confirmation/{x.VehicleDemandConfirmationId}/photo",
                            confirmedBy = x.ConfirmedBy,
                            confirmedAt = x.ConfirmedAt
                        }).ToList();

                    return new
                    {
                        indentId = indent.IndentId,
                        logReference = indent.IndentId,
                        indentNumber = indent.IndentNumber,
                        unitName = indent.UnitName,
                        requiredDateTime = indent.RequiredDateTime,
                        vehicleType = indent.Vehicle != null ? indent.Vehicle.VehicleType : null,
                        requestedQuantity = indent.VehicleQuantity,
                        fromLocation = indent.WhereRequiredLocation != null
                            ? indent.WhereRequiredLocation.LocationName : null,
                        destination = indent.Destination,
                        viaRoute = indent.ViaRoute,
                        durationOfEmployment = indent.DurationOfEmployment,
                        assignedVendorId = assignment.VendorId,
                        assignedVendorCode = assignment.Vendor != null ? assignment.Vendor.VendorCode : null,
                        assignedVendorName = assignment.Vendor != null ? assignment.Vendor.VendorName : null,
                        status = indent.Status,
                        confirmedVehicleCount = vehicleRecords.Count,
                        confirmations = vehicleRecords
                    };
                })
                .ToList();

            return Ok(result);
        }

        // POST: api/vehicle-demand-confirmation/{indentId}
        // One submission records one physical vehicle. Multiple vehicles can be
        // entered against a multi-vehicle indent, until the requested quantity is met.
        [HttpPost("{indentId:int}")]
        [RequestSizeLimit(6 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
        public async Task<IActionResult> ConfirmVehicle(
            int indentId,
            [FromForm] ConfirmVehicleDemandRequest request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var vehicleNumber = (request.VehicleNumber ?? string.Empty).Trim().ToUpperInvariant();
            var driverName = (request.DriverName ?? string.Empty).Trim();
            var licenseNumber = (request.LicenseNumber ?? string.Empty).Trim();
            var mobileNumber = (request.MobileNumber ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(vehicleNumber) ||
                string.IsNullOrWhiteSpace(driverName) ||
                string.IsNullOrWhiteSpace(licenseNumber) ||
                string.IsNullOrWhiteSpace(mobileNumber))
            {
                return BadRequest(new { message = "Vehicle number and all driver details are required." });
            }

            if (mobileNumber.Length > 30 || mobileNumber.Count(char.IsDigit) < 7 ||
                mobileNumber.Any(c => !(char.IsDigit(c) || c == '+' || c == ' ' || c == '-' || c == '(' || c == ')')))
            {
                return BadRequest(new { message = "Enter a valid mobile number (at least 7 digits)." });
            }

            if (request.VehiclePhoto == null || request.VehiclePhoto.Length == 0)
                return BadRequest(new { message = "Upload a photo of the actual vehicle to complete this confirmation." });

            if (request.VehiclePhoto.Length > MaxPhotoBytes)
                return BadRequest(new { message = "Vehicle photo must be 5 MB or smaller." });

            byte[] photoBytes;
            await using (var input = request.VehiclePhoto.OpenReadStream())
            await using (var memory = new MemoryStream())
            {
                await input.CopyToAsync(memory);
                photoBytes = memory.ToArray();
            }

            var photoType = DetectImageType(photoBytes);
            if (photoType == null)
            {
                return BadRequest(new
                {
                    message = "Unsupported or invalid image. Upload a JPEG, PNG, or WebP vehicle photo."
                });
            }

            // Serializable transaction protects requested-quantity checks when more
            // than one operator submits vehicle confirmations concurrently.
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            string? savedPhotoPath = null;

            try
            {
                var indent = await _context.Indents
                    .Include(x => x.Vehicle)
                    .Include(x => x.WhereRequiredLocation)
                    .FirstOrDefaultAsync(x => x.IndentId == indentId);

                if (indent == null)
                    return NotFound(new { message = "Indent log was not found." });

                if (indent.Status != AssignedToVendor)
                {
                    return Conflict(new
                    {
                        message = "Only indent logs with status 'Assigned to Vendor' can receive vehicle confirmations.",
                        status = indent.Status
                    });
                }

                var hasVendorAssignment = await _context.VendorAssignments
                    .AnyAsync(x => x.IndentId == indentId);

                if (!hasVendorAssignment)
                    return Conflict(new { message = "This indent has no saved vendor assignment. Assign a vendor first." });

                var requestedQuantity = indent.VehicleQuantity.GetValueOrDefault();
                if (requestedQuantity < 1)
                {
                    return Conflict(new
                    {
                        message = "The requested vehicle quantity is missing or invalid. Check the original indent before confirming vehicles."
                    });
                }

                var existingCount = await _context.VehicleDemandConfirmations
                    .CountAsync(x => x.IndentId == indentId);

                if (existingCount >= requestedQuantity)
                {
                    return Conflict(new
                    {
                        message = "All requested vehicles have already been confirmed.",
                        requestedQuantity,
                        confirmedQuantity = existingCount
                    });
                }

                var duplicateVehicle = await _context.VehicleDemandConfirmations
                    .AnyAsync(x => x.IndentId == indentId && x.VehicleNumber == vehicleNumber);

                if (duplicateVehicle)
                    return Conflict(new { message = "This vehicle number is already recorded for this indent." });

                var photoFolder = Path.Combine(
                    _environment.ContentRootPath,
                    "App_Data",
                    "VehicleDemandPhotos");
                Directory.CreateDirectory(photoFolder);

                var photoFileName = $"{Guid.NewGuid():N}{photoType.Value.Extension}";
                savedPhotoPath = Path.Combine(photoFolder, photoFileName);
                await System.IO.File.WriteAllBytesAsync(savedPhotoPath, photoBytes);

                var confirmation = new VehicleDemandConfirmation
                {
                    IndentId = indentId,
                    VehicleNumber = vehicleNumber,
                    ConfirmationDate = request.ConfirmationDate!.Value.Date,
                    DriverName = driverName,
                    LicenseNumber = licenseNumber,
                    MobileNumber = mobileNumber,
                    VehiclePhotoFileName = photoFileName,
                    VehiclePhotoContentType = photoType.Value.ContentType,
                    ConfirmedBy = User.Identity?.Name,
                    ConfirmedAt = DateTime.Now
                };

                _context.VehicleDemandConfirmations.Add(confirmation);

                var newCount = existingCount + 1;
                var allVehiclesConfirmed = newCount >= requestedQuantity;
                if (allVehiclesConfirmed)
                    indent.Status = VehicleDemandConfirmed;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = allVehiclesConfirmed
                        ? "All requested vehicles have been confirmed. Vehicle Demand Confirmation is complete for this indent."
                        : $"Vehicle confirmation saved ({newCount} of {requestedQuantity}). Add the remaining vehicle details to complete this demand.",
                    indentId = indent.IndentId,
                    indentNumber = indent.IndentNumber,
                    confirmedVehicles = newCount,
                    requestedVehicles = requestedQuantity,
                    status = indent.Status
                });
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                TryDeleteFile(savedPhotoPath);

                var baseError = ex.GetBaseException();
                if (baseError is Microsoft.Data.SqlClient.SqlException sqlError &&
                    (sqlError.Number == 2601 || sqlError.Number == 2627))
                {
                    return Conflict(new
                    {
                        message = "This vehicle number is already recorded for this indent. Refresh the list and try again."
                    });
                }

                throw;
            }
            catch
            {
                await transaction.RollbackAsync();
                TryDeleteFile(savedPhotoPath);
                throw;
            }
        }

        // GET: api/vehicle-demand-confirmation/{confirmationId}/photo
        // Photo access is authenticated; the file is stored outside wwwroot.
        [HttpGet("{confirmationId:int}/photo")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<IActionResult> GetVehiclePhoto(int confirmationId)
        {
            var photo = await _context.VehicleDemandConfirmations
                .AsNoTracking()
                .Where(x => x.VehicleDemandConfirmationId == confirmationId)
                .Select(x => new { x.VehiclePhotoFileName, x.VehiclePhotoContentType })
                .FirstOrDefaultAsync();

            if (photo == null)
                return NotFound(new { message = "Vehicle confirmation photo record was not found." });

            var safeFileName = Path.GetFileName(photo.VehiclePhotoFileName);
            var fullPath = Path.Combine(
                _environment.ContentRootPath,
                "App_Data",
                "VehicleDemandPhotos",
                safeFileName);

            if (!System.IO.File.Exists(fullPath))
                return NotFound(new { message = "The stored vehicle photo file is missing." });

            return PhysicalFile(fullPath, photo.VehiclePhotoContentType, enableRangeProcessing: false);
        }

        private static (string ContentType, string Extension)? DetectImageType(byte[] bytes)
        {
            if (bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF)
                return ("image/jpeg", ".jpg");

            if (bytes.Length >= 8 &&
                bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47 &&
                bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A)
                return ("image/png", ".png");

            if (bytes.Length >= 12 &&
                bytes[0] == (byte)'R' && bytes[1] == (byte)'I' && bytes[2] == (byte)'F' && bytes[3] == (byte)'F' &&
                bytes[8] == (byte)'W' && bytes[9] == (byte)'E' && bytes[10] == (byte)'B' && bytes[11] == (byte)'P')
                return ("image/webp", ".webp");

            return null;
        }

        private static void TryDeleteFile(string? path)
        {
            if (string.IsNullOrWhiteSpace(path)) return;
            try
            {
                if (System.IO.File.Exists(path))
                    System.IO.File.Delete(path);
            }
            catch
            {
                // Preserve the original database error; cleanup can be retried manually.
            }
        }
    }
}
