using System.ComponentModel.DataAnnotations;

namespace CHTManagement.Models
{
    public class ContractRate
    {
        [Key]
        public int RateId { get; set; }

        [Required]
        [MaxLength(20)]
        public string ContractYear { get; set; } = "2026-27";

        [Required]
        [MaxLength(100)]
        public string VehicleCategory { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int SerialNo { get; set; }

        [Required]
        [MaxLength(100)]
        public string ItemTitle { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string UnitOfMeasure { get; set; } = string.Empty;

        [Range(typeof(decimal), "0", "9999999999999999.99")]
        public decimal RateAmount { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
