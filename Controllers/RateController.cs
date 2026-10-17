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
    public class RateController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RateController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Rate
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var rates = await _context.ContractRates
                .AsNoTracking()
                .OrderByDescending(x => x.ContractYear)
                .ThenBy(x => x.VehicleCategory)
                .ThenBy(x => x.SerialNo)
                .ToListAsync();

            return Ok(rates);
        }

        // GET: api/Rate/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var rate = await _context.ContractRates
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.RateId == id);

            if (rate == null)
            {
                return NotFound(new { message = "Rate record not found." });
            }

            return Ok(rate);
        }

        // POST: api/Rate
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ContractRate request)
        {
            var validationError = ValidateRate(request);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var contractYear = request.ContractYear.Trim();
            var vehicleCategory = request.VehicleCategory.Trim();
            var serialNo = request.SerialNo;

            var duplicate = await _context.ContractRates.AnyAsync(x =>
                x.ContractYear == contractYear &&
                x.VehicleCategory == vehicleCategory &&
                x.SerialNo == serialNo);

            if (duplicate)
            {
                return Conflict(new
                {
                    message = "That serial number already exists for this vehicle category and contract year."
                });
            }

            var rate = new ContractRate
            {
                ContractYear = contractYear,
                VehicleCategory = vehicleCategory,
                SerialNo = serialNo,
                ItemTitle = request.ItemTitle.Trim(),
                UnitOfMeasure = request.UnitOfMeasure.Trim(),
                RateAmount = request.RateAmount,
                IsActive = request.IsActive
            };

            _context.ContractRates.Add(rate);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = rate.RateId }, rate);
        }

        // PUT: api/Rate/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] ContractRate request)
        {
            var validationError = ValidateRate(request);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var existing = await _context.ContractRates
                .FirstOrDefaultAsync(x => x.RateId == id);

            if (existing == null)
                return NotFound(new { message = "Rate record not found." });

            var contractYear = request.ContractYear.Trim();
            var vehicleCategory = request.VehicleCategory.Trim();

            var duplicate = await _context.ContractRates.AnyAsync(x =>
                x.RateId != id &&
                x.ContractYear == contractYear &&
                x.VehicleCategory == vehicleCategory &&
                x.SerialNo == request.SerialNo);

            if (duplicate)
            {
                return Conflict(new
                {
                    message = "That serial number already exists for this vehicle category and contract year."
                });
            }

            existing.ContractYear = contractYear;
            existing.VehicleCategory = vehicleCategory;
            existing.SerialNo = request.SerialNo;
            existing.ItemTitle = request.ItemTitle.Trim();
            existing.UnitOfMeasure = request.UnitOfMeasure.Trim();
            existing.RateAmount = request.RateAmount;
            existing.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        private static string? ValidateRate(ContractRate request)
        {
            if (string.IsNullOrWhiteSpace(request.ContractYear))
                return "Contract year is required.";
            if (request.ContractYear.Trim().Length > 20)
                return "Contract year cannot exceed 20 characters.";
            if (string.IsNullOrWhiteSpace(request.VehicleCategory))
                return "Vehicle category is required.";
            if (request.VehicleCategory.Trim().Length > 100)
                return "Vehicle category cannot exceed 100 characters.";
            if (request.SerialNo < 1)
                return "Serial number must be 1 or greater.";
            if (string.IsNullOrWhiteSpace(request.ItemTitle))
                return "Item title is required.";
            if (request.ItemTitle.Trim().Length > 100)
                return "Item title cannot exceed 100 characters.";
            if (string.IsNullOrWhiteSpace(request.UnitOfMeasure))
                return "A/U (unit of measure) is required.";
            if (request.UnitOfMeasure.Trim().Length > 20)
                return "A/U cannot exceed 20 characters.";
            if (request.RateAmount < 0 || request.RateAmount > 9999999999999999.99m)
                return "Rate must be between 0 and 9,999,999,999,999,999.99.";
            return null;
        }
    }
}
