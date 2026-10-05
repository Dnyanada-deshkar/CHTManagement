using System.ComponentModel.DataAnnotations;

namespace CHTManagement.Models
{
    public class Location
    {
        public int LocationId { get; set; }

        [Required]
        [MaxLength(50)]
        public string LocationCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LocationName { get; set; } = string.Empty;

        [Required]
        public int LocationTypeId { get; set; }

        public bool IsActive { get; set; } = true;
    }
}