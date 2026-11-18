using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CHTManagement.Migrations
{
    /// <inheritdoc />
    public partial class SplitIndentTransportUtilization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BudgetHead",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "DetailsOfJourney",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "DurationOfDutyDaysHours",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "HiringTransportRegisterSerialNumber",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "IssuingOfficerRankNameDesignation",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "OrderDate",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "OrderStation",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "TransportSupplyDateTime",
                table: "Indents");

            migrationBuilder.AddColumn<string>(
                name: "TypeOfLoad",
                table: "Indents",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TransportUtilizations",
                columns: table => new
                {
                    TransportUtilizationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VehicleDemandConfirmationId = table.Column<int>(type: "int", nullable: false),
                    VehicleRegistrationNumber = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    DriverName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    DriverRegistrationNumber = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    TransportReceivedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TransportReceivedNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    JourneyFrom = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    JourneyTo = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    StoresPersonnelLoadedDetails = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LoadedTallySheetReference = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    RTVoucherReference = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    TransportLeftDepotDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UtilizingUnitStation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UtilizingOfficerRankNameDesignation = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UtilizingOfficerDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LoadingSupervisedBy = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    DriverSignatureObtained = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransportUtilizations", x => x.TransportUtilizationId);
                    table.ForeignKey(
                        name: "FK_TransportUtilizations_VehicleDemandConfirmations_VehicleDemandConfirmationId",
                        column: x => x.VehicleDemandConfirmationId,
                        principalTable: "VehicleDemandConfirmations",
                        principalColumn: "VehicleDemandConfirmationId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TransportUtilizations_VehicleDemandConfirmationId",
                table: "TransportUtilizations",
                column: "VehicleDemandConfirmationId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TransportUtilizations");

            migrationBuilder.DropColumn(
                name: "TypeOfLoad",
                table: "Indents");

            migrationBuilder.AddColumn<string>(
                name: "BudgetHead",
                table: "Indents",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DetailsOfJourney",
                table: "Indents",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DurationOfDutyDaysHours",
                table: "Indents",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HiringTransportRegisterSerialNumber",
                table: "Indents",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IssuingOfficerRankNameDesignation",
                table: "Indents",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OrderDate",
                table: "Indents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderStation",
                table: "Indents",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TransportSupplyDateTime",
                table: "Indents",
                type: "datetime2",
                nullable: true);
        }
    }
}
