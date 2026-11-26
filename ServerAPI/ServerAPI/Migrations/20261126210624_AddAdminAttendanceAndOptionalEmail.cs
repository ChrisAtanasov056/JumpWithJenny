using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminAttendanceAndOptionalEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_WorkoutId_NormalizedEmail",
                table: "Appointments");

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedEmail",
                table: "Appointments",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Appointments",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254);

            migrationBuilder.AddColumn<DateTime>(
                name: "AttendedAt",
                table: "Appointments",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAttended",
                table: "Appointments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PhoneNumber_IsDeleted",
                table: "Appointments",
                columns: new[] { "PhoneNumber", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_WorkoutId_NormalizedEmail",
                table: "Appointments",
                columns: new[] { "WorkoutId", "NormalizedEmail" },
                unique: true,
                filter: "\"NormalizedEmail\" IS NOT NULL AND \"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_PhoneNumber_IsDeleted",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_WorkoutId_NormalizedEmail",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "AttendedAt",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "IsAttended",
                table: "Appointments");

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedEmail",
                table: "Appointments",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Appointments",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_WorkoutId_NormalizedEmail",
                table: "Appointments",
                columns: new[] { "WorkoutId", "NormalizedEmail" },
                unique: true,
                filter: "\"IsDeleted\" = false");
        }
    }
}
