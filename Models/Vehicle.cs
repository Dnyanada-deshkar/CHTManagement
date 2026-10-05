using System.ComponentModel.DataAnnotations;

namespace CHTManagement.Models
{
    public class Vehicle
    {
        public int VehicleId { get; set; }

        [Required]
        [MaxLength(50)]
        public string VehicleCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string VehicleType { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}