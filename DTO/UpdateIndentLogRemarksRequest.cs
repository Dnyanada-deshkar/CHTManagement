using System.ComponentModel.DataAnnotations;

namespace CHTManagement.DTOs
{
    public class UpdateIndentLogRemarksRequest
    {
        [StringLength(1000)]
        public string? Remarks { get; set; }
    }
}
