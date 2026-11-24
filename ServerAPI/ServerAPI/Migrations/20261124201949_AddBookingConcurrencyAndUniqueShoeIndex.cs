using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServerAPI.Migrations
{
    public partial class AddBookingConcurrencyAndUniqueShoeIndex : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_WorkoutId",
                table: "Appointments");

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "WorkoutShoes",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Workouts",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_WorkoutId_ShoeId",
                table: "Appointments",
                columns: new[] { "WorkoutId", "ShoeId" },
                unique: true,
                filter: "\"ShoeId\" IS NOT NULL AND \"IsDeleted\" = false");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_WorkoutId_ShoeId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "WorkoutShoes");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Workouts");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_WorkoutId",
                table: "Appointments",
                column: "WorkoutId");
        }
    }
}
