using System.ComponentModel.DataAnnotations;

namespace CHTManagement.DTOs
{
    public class AssignVendorRequest
    {
        [Range(1, int.MaxValue, ErrorMessage = "Select an active vendor.")]
        public int VendorId { get; set; }
    }
}
