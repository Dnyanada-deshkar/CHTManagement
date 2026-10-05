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
    public class VehicleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VehicleController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Vehicle
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var vehicles = await _context.Vehicles
                .OrderBy(x => x.VehicleId)
                .ToListAsync();

            return Ok(vehicles);
        }

        // GET: api/Vehicle/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var vehicle = await _context.Vehicles
                .FindAsync(id);

            if (vehicle == null)
            {
                return NotFound(new
                {
                    message = "Vehicle not found."
                });
            }

            return Ok(vehicle);
        }

        // POST: api/Vehicle
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] Vehicle vehicle)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            bool codeExists = await _context.Vehicles
                .AnyAsync(x =>
                    x.VehicleCode == vehicle.VehicleCode);

            if (codeExists)
            {
                return Conflict(new
                {
                    message = "Vehicle code already exists."
                });
            }

            bool typeExists = await _context.Vehicles
                .AnyAsync(x =>
                    x.VehicleType == vehicle.VehicleType);

            if (typeExists)
            {
                return Conflict(new
                {
                    message = "Vehicle type already exists."
                });
            }

            _context.Vehicles.Add(vehicle);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = vehicle.VehicleId },
                vehicle);
        }

        // PUT: api/Vehicle/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] Vehicle vehicle)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingVehicle =
                await _context.Vehicles.FindAsync(id);

            if (existingVehicle == null)
            {
                return NotFound(new
                {
                    message = "Vehicle not found."
                });
            }

            bool duplicateCode = await _context.Vehicles
                .AnyAsync(x =>
                    x.VehicleId != id &&
                    x.VehicleCode == vehicle.VehicleCode);

            if (duplicateCode)
            {
                return Conflict(new
                {
                    message = "Vehicle code already exists."
                });
            }

            bool duplicateType = await _context.Vehicles
                .AnyAsync(x =>
                    x.VehicleId != id &&
                    x.VehicleType == vehicle.VehicleType);

            if (duplicateType)
            {
                return Conflict(new
                {
                    message = "Vehicle type already exists."
                });
            }

            existingVehicle.VehicleCode =
                vehicle.VehicleCode;

            existingVehicle.VehicleType =
                vehicle.VehicleType;

            existingVehicle.IsActive =
                vehicle.IsActive;

            await _context.SaveChangesAsync();

            return Ok(existingVehicle);
        }

        // DELETE: api/Vehicle/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var vehicle =
                await _context.Vehicles.FindAsync(id);

            if (vehicle == null)
            {
                return NotFound(new
                {
                    message = "Vehicle not found."
                });
            }

            _context.Vehicles.Remove(vehicle);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}