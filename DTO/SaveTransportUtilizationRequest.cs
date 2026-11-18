using System.ComponentModel.DataAnnotations;

namespace CHTManagement.DTOs
{
    public class SaveTransportUtilizationRequest
    {
        [Required]
        public DateTime? TransportReceivedDateTime { get; set; }

        [MaxLength(100)]
        public string? TransportReceivedNumber { get; set; }

        [Required, MaxLength(250)]
        public string? JourneyFrom { get; set; }

        [Required, MaxLength(250)]
        public string? JourneyTo { get; set; }

        [Required]
        public string? StoresPersonnelLoadedDetails { get; set; }

        [MaxLength(150)]
        public string? LoadedTallySheetReference { get; set; }

        [MaxLength(150)]
        public string? RTVoucherReference { get; set; }

        [Required]
        public DateTime? TransportLeftDepotDateTime { get; set; }

        [Required, MaxLength(100)]
        public string? UtilizingUnitStation { get; set; }

        [Required, MaxLength(200)]
        public string? UtilizingOfficerRankNameDesignation { get; set; }

        [Required]
        public DateTime? UtilizingOfficerDate { get; set; }

        [Required, MaxLength(150)]
        public string? LoadingSupervisedBy { get; set; }

        public bool DriverSignatureObtained { get; set; }
    }
}
