
using System;
using System.ComponentModel.DataAnnotations;

namespace CHTManagement.Models
{
    public class Indent
    {
        public int IndentId { get; set; }

        // Part I - Transport Requirement
        [MaxLength(100)]
        public string? UnitName { get; set; }

        public string? UserDetails { get; set; }

        [MaxLength(100)]
        public string? IndentNumber { get; set; }

        public DateTime? IndentDate { get; set; }

        public DateTime? RequiredDateTime { get; set; }

        [Range(1, int.MaxValue)]
        public int? VehicleQuantity { get; set; }

        public int? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        public int? WhereRequiredLocationId { get; set; }
        public Location? WhereRequiredLocation { get; set; }

        public string? DurationOfEmployment { get; set; }

        [MaxLength(250)]
        public string? Destination { get; set; }

        public decimal? OneWayDistance { get; set; }

        [MaxLength(500)]
        public string? ViaRoute { get; set; }

        public string? ExactNatureOfDutyWithAuthority
        { get; set; }

        public string?
            ReasonRegimentalStandingDutyTransportNotUtilized
        { get; set; }

        public string? ReasonForUsingCHTOnSundayHoliday
        { get; set; }

        public string? ReasonForUsingCHTToRailConnectedDestination
        { get; set; }

        // Part I - Certification
        [MaxLength(100)]
        public string? IndentingOfficerStation { get; set; }

        public DateTime? IndentingOfficerDate { get; set; }

        [MaxLength(100)]
        public string? CertifyingOfficerStation { get; set; }

        public DateTime? CertifyingOfficerDate { get; set; }

        // Part II - STO's Transport Order
        [MaxLength(100)]
        public string? HiringTransportRegisterSerialNumber
        { get; set; }

        [MaxLength(100)]
        public string? BudgetHead { get; set; }

        public DateTime? TransportSupplyDateTime { get; set; }

        public string? DetailsOfJourney { get; set; }

        [MaxLength(100)]
        public string? DurationOfDutyDaysHours { get; set; }

        [MaxLength(100)]
        public string? OrderStation { get; set; }

        public DateTime? OrderDate { get; set; }

        [MaxLength(200)]
        public string? IssuingOfficerRankNameDesignation
        { get; set; }

        // Workflow
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Draft";

        public DateTime CreatedAt { get; set; }
            = DateTime.Now;
    }
}
