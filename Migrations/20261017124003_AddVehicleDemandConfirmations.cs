using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CHTManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleDemandConfirmations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VendorAssignments_Indents_IndentId",
                table: "VendorAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_VendorAssignments_Vendors_VendorId",
                table: "VendorAssignments");

            migrationBuilder.DropIndex(
                name: "IX_VendorAssignments_IndentId",
                table: "VendorAssignments");

            migrationBuilder.CreateTable(
                name: "VehicleDemandConfirmations",
                columns: table => new
                {
                    VehicleDemandConfirmationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IndentId = table.Column<int>(type: "int", nullable: false),
                    VehicleNumber = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    ConfirmationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DriverName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    LicenseNumber = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    MobileNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    VehiclePhotoFileName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    VehiclePhotoContentType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ConfirmedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ConfirmedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleDemandConfirmations", x => x.VehicleDemandConfirmationId);
                    table.ForeignKey(
                        name: "FK_VehicleDemandConfirmations_Indents_IndentId",
                        column: x => x.IndentId,
                        principalTable: "Indents",
                        principalColumn: "IndentId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VendorAssignments_IndentId",
                table: "VendorAssignments",
                column: "IndentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleDemandConfirmations_IndentId_VehicleNumber",
                table: "VehicleDemandConfirmations",
                columns: new[] { "IndentId", "VehicleNumber" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_VendorAssignments_Indents_IndentId",
                table: "VendorAssignments",
                column: "IndentId",
                principalTable: "Indents",
                principalColumn: "IndentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_VendorAssignments_Vendors_VendorId",
                table: "VendorAssignments",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "VendorId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VendorAssignments_Indents_IndentId",
                table: "VendorAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_VendorAssignments_Vendors_VendorId",
                table: "VendorAssignments");

            migrationBuilder.DropTable(
                name: "VehicleDemandConfirmations");

            migrationBuilder.DropIndex(
                name: "IX_VendorAssignments_IndentId",
                table: "VendorAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_VendorAssignments_IndentId",
                table: "VendorAssignments",
                column: "IndentId");

            migrationBuilder.AddForeignKey(
                name: "FK_VendorAssignments_Indents_IndentId",
                table: "VendorAssignments",
                column: "IndentId",
                principalTable: "Indents",
                principalColumn: "IndentId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VendorAssignments_Vendors_VendorId",
                table: "VendorAssignments",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "VendorId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
