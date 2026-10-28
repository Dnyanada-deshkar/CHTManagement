using System.ComponentModel.DataAnnotations;

namespace CHTManagement.Models
{
    public class VehicleDemandConfirmation
    {
        [Key]
        public int VehicleDemandConfirmationId { get; set; }

        [Required]
        public int IndentId { get; set; }
        public Indent? Indent { get; set; }

        // Registration / vehicle details from the Vehicle Demand Confirmation register.
        [Required]
        [MaxLength(40)]
        public string VehicleNumber { get; set; } = string.Empty;

        [Required]
        public DateTime ConfirmationDate { get; set; }

        [Required]
        [MaxLength(150)]
        public string DriverName { get; set; } = string.Empty;

        [Required]
        [MaxLength(60)]
        public string LicenseNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string MobileNumber { get; set; } = string.Empty;

        // Photos are stored outside wwwroot; only a generated file name is stored here.
        [Required]
        [MaxLength(80)]
        public string VehiclePhotoFileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string VehiclePhotoContentType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ConfirmedBy { get; set; }

        public DateTime ConfirmedAt { get; set; } = DateTime.Now;


        [MaxLength(150)]
        public string? NcoInCharge { get; set; }

        [MaxLength(100)]
        public string? ClerkInitials { get; set; }

        [MaxLength(100)]
        public string? Oic { get; set; }

        [MaxLength(100)]
        public string? ChallanControlNumber { get; set; }

        [MaxLength(1000)]
        public string? Remarks { get; set; }

    }
}
