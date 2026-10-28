using System.ComponentModel.DataAnnotations;

namespace CHTManagement.DTOs
{
    public class UpdateVehicleDemandRegisterRequest
    {
        [StringLength(150)]
        public string? NcoInCharge { get; set; }

        [StringLength(100)]
        public string? ClerkInitials { get; set; }

        [StringLength(100)]
        public string? Oic { get; set; }

        [StringLength(100)]
        public string? ChallanControlNumber { get; set; }

        [StringLength(1000)]
        public string? Remarks { get; set; }
    }
}
