using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CHTManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddIndentRegistration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Indents",
                columns: table => new
                {
                    IndentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UnitName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UserDetails = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IndentNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IndentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RequiredDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    VehicleQuantity = table.Column<int>(type: "int", nullable: false),
                    VehicleId = table.Column<int>(type: "int", nullable: false),
                    WhereRequiredLocationId = table.Column<int>(type: "int", nullable: false),
                    DurationOfEmployment = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Destination = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    OneWayDistance = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ViaRoute = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ExactNatureOfDutyWithAuthority = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReasonRegimentalStandingDutyTransportNotUtilized = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReasonForUsingCHTOnSundayHoliday = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReasonForUsingCHTToRailConnectedDestination = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IndentingOfficerStation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IndentingOfficerDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CertifyingOfficerStation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CertifyingOfficerDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    HiringTransportRegisterSerialNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    BudgetHead = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TransportSupplyDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DetailsOfJourney = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DurationOfDutyDaysHours = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OrderStation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OrderDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IssuingOfficerRankNameDesignation = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Indents", x => x.IndentId);
                    table.ForeignKey(
                        name: "FK_Indents_Locations_WhereRequiredLocationId",
                        column: x => x.WhereRequiredLocationId,
                        principalTable: "Locations",
                        principalColumn: "LocationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Indents_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "VehicleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Indents_VehicleId",
                table: "Indents",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Indents_WhereRequiredLocationId",
                table: "Indents",
                column: "WhereRequiredLocationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Indents");
        }
    }
}
