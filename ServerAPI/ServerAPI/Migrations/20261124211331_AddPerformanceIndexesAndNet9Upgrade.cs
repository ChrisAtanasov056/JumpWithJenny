using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexesAndNet9Upgrade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Workouts_Date",
                table: "Workouts",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Workouts_IsDeleted_Date",
                table: "Workouts",
                columns: new[] { "IsDeleted", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Workouts_Status",
                table: "Workouts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Shoes_IsDeleted_Size",
                table: "Shoes",
                columns: new[] { "IsDeleted", "Size" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Token",
                table: "RefreshTokens",
                column: "Token");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId_Revoked",
                table: "RefreshTokens",
                columns: new[] { "UserId", "Revoked" });

            migrationBuilder.CreateIndex(
                name: "IX_Images_CreatedAt",
                table: "Images",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_IsDeleted_UserName",
                table: "AspNetUsers",
                columns: new[] { "IsDeleted", "UserName" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_WorkoutId_IsDeleted",
                table: "Appointments",
                columns: new[] { "WorkoutId", "IsDeleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Workouts_Date",
                table: "Workouts");

            migrationBuilder.DropIndex(
                name: "IX_Workouts_IsDeleted_Date",
                table: "Workouts");

            migrationBuilder.DropIndex(
                name: "IX_Workouts_Status",
                table: "Workouts");

            migrationBuilder.DropIndex(
                name: "IX_Shoes_IsDeleted_Size",
                table: "Shoes");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_Token",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_UserId_Revoked",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_Images_CreatedAt",
                table: "Images");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_IsDeleted_UserName",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_WorkoutId_IsDeleted",
                table: "Appointments");
        }
    }
}
