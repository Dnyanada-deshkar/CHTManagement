using System.ComponentModel.DataAnnotations;

namespace CHTManagement.Models
{
    // One Part-II utilization record is kept for each physical vehicle confirmation.
    public class TransportUtilization
    {
        public int TransportUtilizationId { get; set; }

        [Required]
        public int VehicleDemandConfirmationId { get; set; }

        [Required, MaxLength(40)]
        public string VehicleRegistrationNumber { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string DriverName { get; set; } = string.Empty;

        [Required, MaxLength(60)]
        public string DriverRegistrationNumber { get; set; } = string.Empty;

        [Required]
        public DateTime TransportReceivedDateTime { get; set; }

        // The paper heading reads "Time & date Transport Received No.".
        // Keep the possible receipt/reference number separate and optional until clarified.
        [MaxLength(100)]
        public string? TransportReceivedNumber { get; set; }

        [Required, MaxLength(250)]
        public string JourneyFrom { get; set; } = string.Empty;

        [Required, MaxLength(250)]
        public string JourneyTo { get; set; } = string.Empty;

        [Required]
        public string StoresPersonnelLoadedDetails { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? LoadedTallySheetReference { get; set; }

        [MaxLength(150)]
        public string? RTVoucherReference { get; set; }

        [Required]
        public DateTime TransportLeftDepotDateTime { get; set; }

        [Required, MaxLength(100)]
        public string UtilizingUnitStation { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string UtilizingOfficerRankNameDesignation { get; set; } = string.Empty;

        [Required]
        public DateTime UtilizingOfficerDate { get; set; }

        [Required, MaxLength(150)]
        public string LoadingSupervisedBy { get; set; } = string.Empty;

        // Confirms that the driver's signature was obtained on the source form.
        // This checkbox is not a cryptographic/electronic signature.
        public bool DriverSignatureObtained { get; set; }

        [MaxLength(100)]
        public string? CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [MaxLength(100)]
        public string? UpdatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
