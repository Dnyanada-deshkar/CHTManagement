using System.ComponentModel.DataAnnotations;

namespace CHTManagement.Models
{
    public class Vendor
    {
        public int VendorId { get; set; }

        [Required]
        [MaxLength(50)]
        public string VendorCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string VendorName { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? ContactPerson { get; set; }

        [MaxLength(30)]
        public string? ContactNumber { get; set; }

        [MaxLength(254)]
        [EmailAddress]
        public string? Email { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
