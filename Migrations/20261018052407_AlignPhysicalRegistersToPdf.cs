using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CHTManagement.Migrations
{
    /// <inheritdoc />
    public partial class AlignPhysicalRegistersToPdf : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChallanControlNumber",
                table: "VehicleDemandConfirmations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClerkInitials",
                table: "VehicleDemandConfirmations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NcoInCharge",
                table: "VehicleDemandConfirmations",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Oic",
                table: "VehicleDemandConfirmations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Remarks",
                table: "VehicleDemandConfirmations",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CioActionBy",
                table: "Indents",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CioApprovedAt",
                table: "Indents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClerkActionBy",
                table: "Indents",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ClerkApprovedAt",
                table: "Indents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegisterRemarks",
                table: "Indents",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChallanControlNumber",
                table: "VehicleDemandConfirmations");

            migrationBuilder.DropColumn(
                name: "ClerkInitials",
                table: "VehicleDemandConfirmations");

            migrationBuilder.DropColumn(
                name: "NcoInCharge",
                table: "VehicleDemandConfirmations");

            migrationBuilder.DropColumn(
                name: "Oic",
                table: "VehicleDemandConfirmations");

            migrationBuilder.DropColumn(
                name: "Remarks",
                table: "VehicleDemandConfirmations");

            migrationBuilder.DropColumn(
                name: "CioActionBy",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "CioApprovedAt",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "ClerkActionBy",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "ClerkApprovedAt",
                table: "Indents");

            migrationBuilder.DropColumn(
                name: "RegisterRemarks",
                table: "Indents");
        }
    }
}
