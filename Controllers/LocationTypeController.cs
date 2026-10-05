using CHTManagement.Data;
using CHTManagement.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace CHTManagement.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LocationTypeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LocationTypeController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var locationTypes = await _context.LocationTypes
                .OrderBy(x => x.LocationTypeId)
                .ToListAsync();

            return Ok(locationTypes);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var locationType = await _context.LocationTypes
                .FindAsync(id);

            if (locationType == null)
            {
                return NotFound(new
                {
                    message = "Location type not found."
                });
            }

            return Ok(locationType);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] LocationType locationType)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            bool codeExists = await _context.LocationTypes
                .AnyAsync(x =>
                    x.LocationTypeCode == locationType.LocationTypeCode);

            if (codeExists)
            {
                return Conflict(new
                {
                    message = "Location type code already exists."
                });
            }

            bool nameExists = await _context.LocationTypes
                .AnyAsync(x =>
                    x.LocationTypeName == locationType.LocationTypeName);

            if (nameExists)
            {
                return Conflict(new
                {
                    message = "Location type name already exists."
                });
            }

            _context.LocationTypes.Add(locationType);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = locationType.LocationTypeId },
                locationType);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] LocationType locationType)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingLocationType =
                await _context.LocationTypes.FindAsync(id);

            if (existingLocationType == null)
            {
                return NotFound(new
                {
                    message = "Location type not found."
                });
            }

            bool duplicateCode = await _context.LocationTypes
                .AnyAsync(x =>
                    x.LocationTypeId != id &&
                    x.LocationTypeCode == locationType.LocationTypeCode);

            if (duplicateCode)
            {
                return Conflict(new
                {
                    message = "Location type code already exists."
                });
            }

            bool duplicateName = await _context.LocationTypes
                .AnyAsync(x =>
                    x.LocationTypeId != id &&
                    x.LocationTypeName == locationType.LocationTypeName);

            if (duplicateName)
            {
                return Conflict(new
                {
                    message = "Location type name already exists."
                });
            }

            existingLocationType.LocationTypeCode =
                locationType.LocationTypeCode;

            existingLocationType.LocationTypeName =
                locationType.LocationTypeName;

            existingLocationType.IsActive =
                locationType.IsActive;

            await _context.SaveChangesAsync();

            return Ok(existingLocationType);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var locationType =
                await _context.LocationTypes.FindAsync(id);

            if (locationType == null)
            {
                return NotFound(new
                {
                    message = "Location type not found."
                });
            }

            _context.LocationTypes.Remove(locationType);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}