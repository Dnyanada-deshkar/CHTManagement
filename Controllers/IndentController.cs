using CHTManagement.Data;
using CHTManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CHTManagement.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class IndentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public IndentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Indent
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var indents = await _context.Indents
                .AsNoTracking()
                .Include(x => x.Vehicle)
                .Include(x => x.WhereRequiredLocation)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(indents);
        }

        // GET: api/Indent/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var indent = await _context.Indents
                .AsNoTracking()
                .Include(x => x.Vehicle)
                .Include(x => x.WhereRequiredLocation)
                .FirstOrDefaultAsync(x => x.IndentId == id);

            if (indent == null)
            {
                return NotFound(new { message = "Indent record not found." });
            }

            return Ok(indent);
        }

        // POST: api/Indent
        // Registers Part I only. Transport Utilization is captured separately per confirmed vehicle.
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Indent request)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            if (string.IsNullOrWhiteSpace(request.UnitName) ||
                string.IsNullOrWhiteSpace(request.UserDetails) ||
                string.IsNullOrWhiteSpace(request.IndentNumber) ||
                !request.IndentDate.HasValue ||
                !request.RequiredDateTime.HasValue ||
                request.VehicleQuantity.GetValueOrDefault() < 1 ||
                request.VehicleId.GetValueOrDefault() < 1 ||
                request.WhereRequiredLocationId.GetValueOrDefault() < 1 ||
                string.IsNullOrWhiteSpace(request.TypeOfLoad) ||
                string.IsNullOrWhiteSpace(request.DurationOfEmployment) ||
                string.IsNullOrWhiteSpace(request.ExactNatureOfDutyWithAuthority))
            {
                return BadRequest(new
                {
                    message = "Please complete all mandatory Part I transport requirement fields, including Type of Load."
                });
            }

            var normalizedIndentNumber = request.IndentNumber.Trim();

            int vehicleId = request.VehicleId.Value;
            int locationId = request.WhereRequiredLocationId.Value;

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(x => x.VehicleId == vehicleId && x.IsActive);

            if (vehicle == null)
                return BadRequest(new { message = "Please select an active vehicle type." });

            var location = await _context.Locations
                .FirstOrDefaultAsync(x => x.LocationId == locationId && x.IsActive);

            if (location == null)
                return BadRequest(new { message = "Please select an active location." });

            var indent = new Indent
            {
                UnitName = request.UnitName.Trim(),
                UserDetails = request.UserDetails.Trim(),
                IndentNumber = normalizedIndentNumber,
                IndentDate = request.IndentDate,
                RequiredDateTime = request.RequiredDateTime,
                VehicleQuantity = request.VehicleQuantity,
                VehicleId = vehicleId,
                TypeOfLoad = request.TypeOfLoad.Trim(),
                WhereRequiredLocationId = locationId,
                DurationOfEmployment = request.DurationOfEmployment.Trim(),
                Destination = request.Destination?.Trim(),
                OneWayDistance = request.OneWayDistance,
                ViaRoute = request.ViaRoute?.Trim(),
                ExactNatureOfDutyWithAuthority = request.ExactNatureOfDutyWithAuthority.Trim(),
                ReasonRegimentalStandingDutyTransportNotUtilized = request.ReasonRegimentalStandingDutyTransportNotUtilized?.Trim(),
                ReasonForUsingCHTOnSundayHoliday = request.ReasonForUsingCHTOnSundayHoliday?.Trim(),
                ReasonForUsingCHTToRailConnectedDestination = request.ReasonForUsingCHTToRailConnectedDestination?.Trim(),
                IndentingOfficerStation = request.IndentingOfficerStation?.Trim(),
                IndentingOfficerDate = request.IndentingOfficerDate,
                CertifyingOfficerStation = request.CertifyingOfficerStation?.Trim(),
                CertifyingOfficerDate = request.CertifyingOfficerDate,
                Status = "Pending with Clerk",
                CreatedAt = DateTime.Now
            };

            _context.Indents.Add(indent);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = indent.IndentId }, indent);
        }
    }
}
