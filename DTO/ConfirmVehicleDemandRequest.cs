using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace CHTManagement.DTOs
{
    public class ConfirmVehicleDemandRequest
    {
        [Required]
        [MaxLength(40)]
        public string VehicleNumber { get; set; } = string.Empty;

        [Required]
        public DateTime? ConfirmationDate { get; set; }

        [Required]
        [MaxLength(150)]
        public string DriverName { get; set; } = string.Empty;

        [Required]
        [MaxLength(60)]
        public string LicenseNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string MobileNumber { get; set; } = string.Empty;

        [Required]
        public IFormFile? VehiclePhoto { get; set; }
    }
}
