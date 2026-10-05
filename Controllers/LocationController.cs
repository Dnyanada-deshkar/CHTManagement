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
    public class LocationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LocationController(ApplicationDbContext context)
        {
            _context = context;
        }


        // GET: api/Location
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var locations = await _context.Locations
                .OrderBy(x => x.LocationId)
                .ToListAsync();

            return Ok(locations);
        }


        // GET: api/Location/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var location = await _context.Locations
                .FindAsync(id);

            if (location == null)
            {
                return NotFound(new
                {
                    message = "Location not found."
                });
            }

            return Ok(location);
        }


        // POST: api/Location
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] Location location)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }


            var locationTypeExists =
                await _context.LocationTypes
                    .AnyAsync(x =>
                        x.LocationTypeId ==
                        location.LocationTypeId &&
                        x.IsActive);

            if (!locationTypeExists)
            {
                return BadRequest(new
                {
                    message =
                        "Selected location type does not exist or is inactive."
                });
            }


            var codeExists =
                await _context.Locations
                    .AnyAsync(x =>
                        x.LocationCode ==
                        location.LocationCode);

            if (codeExists)
            {
                return Conflict(new
                {
                    message =
                        "Location code already exists."
                });
            }


            _context.Locations.Add(location);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = location.LocationId
                },
                location);
        }


        // PUT: api/Location/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] Location location)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }


            var existingLocation =
                await _context.Locations
                    .FindAsync(id);

            if (existingLocation == null)
            {
                return NotFound(new
                {
                    message = "Location not found."
                });
            }


            var locationTypeExists =
                await _context.LocationTypes
                    .AnyAsync(x =>
                        x.LocationTypeId ==
                        location.LocationTypeId &&
                        x.IsActive);

            if (!locationTypeExists)
            {
                return BadRequest(new
                {
                    message =
                        "Selected location type does not exist or is inactive."
                });
            }


            var duplicateCode =
                await _context.Locations
                    .AnyAsync(x =>
                        x.LocationId != id &&
                        x.LocationCode ==
                        location.LocationCode);

            if (duplicateCode)
            {
                return Conflict(new
                {
                    message =
                        "Location code already exists."
                });
            }


            existingLocation.LocationCode =
                location.LocationCode;

            existingLocation.LocationName =
                location.LocationName;

            existingLocation.LocationTypeId =
                location.LocationTypeId;

            existingLocation.IsActive =
                location.IsActive;


            await _context.SaveChangesAsync();

            return Ok(existingLocation);
        }


        // DELETE: api/Location/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var location =
                await _context.Locations.FindAsync(id);

            if (location == null)
            {
                return NotFound(new
                {
                    message = "Location not found."
                });
            }


            _context.Locations.Remove(location);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}