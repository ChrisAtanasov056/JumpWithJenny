using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPhoneNumberToAppointments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Appointments",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
                UPDATE ""Appointments"" a
                SET ""PhoneNumber"" = LEFT(btrim(u.""PhoneNumber""), 30)
                FROM ""AspNetUsers"" u
                WHERE a.""UserId"" = u.""Id""
                  AND u.""PhoneNumber"" IS NOT NULL
                  AND btrim(u.""PhoneNumber"") <> '';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "Appointments");
        }
    }
}
