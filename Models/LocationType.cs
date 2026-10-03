using System.ComponentModel.DataAnnotations;

namespace CHTManagement.Models
{
    public class LocationType
    {
        public int LocationTypeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string LocationTypeCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LocationTypeName { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }
}