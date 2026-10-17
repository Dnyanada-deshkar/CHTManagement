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
    public class VendorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VendorController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Vendor
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var vendors = await _context.Vendors
                .AsNoTracking()
                .OrderBy(x => x.VendorName)
                .ToListAsync();

            return Ok(vendors);
        }

        // GET: api/Vendor/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var vendor = await _context.Vendors
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.VendorId == id);

            if (vendor == null)
                return NotFound(new { message = "Vendor not found." });

            return Ok(vendor);
        }

        // POST: api/Vendor
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Vendor request)
        {
            var validationError = ValidateVendor(request);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var code = request.VendorCode.Trim();
            var duplicate = await _context.Vendors.AnyAsync(x => x.VendorCode == code);
            if (duplicate)
                return Conflict(new { message = "Vendor code already exists." });

            var vendor = new Vendor
            {
                VendorCode = code,
                VendorName = request.VendorName.Trim(),
                ContactPerson = Clean(request.ContactPerson),
                ContactNumber = Clean(request.ContactNumber),
                Email = Clean(request.Email),
                Address = Clean(request.Address),
                IsActive = request.IsActive
            };

            _context.Vendors.Add(vendor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = vendor.VendorId }, vendor);
        }

        // PUT: api/Vendor/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Vendor request)
        {
            var validationError = ValidateVendor(request);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var existing = await _context.Vendors.FirstOrDefaultAsync(x => x.VendorId == id);
            if (existing == null)
                return NotFound(new { message = "Vendor not found." });

            var code = request.VendorCode.Trim();
            var duplicate = await _context.Vendors.AnyAsync(x => x.VendorId != id && x.VendorCode == code);
            if (duplicate)
                return Conflict(new { message = "Vendor code already exists." });

            existing.VendorCode = code;
            existing.VendorName = request.VendorName.Trim();
            existing.ContactPerson = Clean(request.ContactPerson);
            existing.ContactNumber = Clean(request.ContactNumber);
            existing.Email = Clean(request.Email);
            existing.Address = Clean(request.Address);
            existing.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        private static string? ValidateVendor(Vendor request)
        {
            if (string.IsNullOrWhiteSpace(request.VendorCode))
                return "Vendor code is required.";
            if (request.VendorCode.Trim().Length > 50)
                return "Vendor code cannot exceed 50 characters.";
            if (string.IsNullOrWhiteSpace(request.VendorName))
                return "Vendor name is required.";
            if (request.VendorName.Trim().Length > 150)
                return "Vendor name cannot exceed 150 characters.";
            if (request.ContactPerson?.Length > 150)
                return "Contact person cannot exceed 150 characters.";
            if (request.ContactNumber?.Length > 30)
                return "Contact number cannot exceed 30 characters.";
            if (request.Email?.Length > 254)
                return "Email cannot exceed 254 characters.";
            if (request.Address?.Length > 500)
                return "Address cannot exceed 500 characters.";
            return null;
        }

        private static string? Clean(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }
}
