using System.ComponentModel.DataAnnotations;

namespace CHTManagement.Models
{
    public class VendorAssignment
    {
        public int VendorAssignmentId { get; set; }

        [Required]
        public int IndentId { get; set; }
        public Indent? Indent { get; set; }

        [Required]
        public int VendorId { get; set; }
        public Vendor? Vendor { get; set; }

        [MaxLength(100)]
        public string? AssignedBy { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.Now;
    }
}
