using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServerAPI.Migrations
{
    /// <inheritdoc />
    public partial class RefactorGuestWorkoutBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_AspNetUsers_UserId",
                table: "Appointments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Appointments",
                table: "Appointments");

            migrationBuilder.Sql(@"
                UPDATE ""Appointments""
                SET ""Id"" = md5(random()::text || clock_timestamp()::text || COALESCE(""UserId"", '') || COALESCE(""WorkoutId"", ''))
                WHERE ""Id"" IS NULL OR btrim(""Id"") = '';

                WITH ranked_ids AS (
                    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY ""Id"" ORDER BY ""CreatedOn"", ctid) AS rn
                    FROM ""Appointments""
                )
                UPDATE ""Appointments"" a
                SET ""Id"" = md5(random()::text || clock_timestamp()::text || a.""Id"" || a.ctid::text)
                FROM ranked_ids r
                WHERE a.ctid = r.ctid AND r.rn > 1;
            ");

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "Appointments",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "Appointments",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "CancellationToken",
                table: "Appointments",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Appointments",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FullName",
                table: "Appointments",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NormalizedEmail",
                table: "Appointments",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Appointments"" a
                SET
                    ""FullName"" = LEFT(COALESCE(NULLIF(btrim(COALESCE(u.""FirstName"", '') || ' ' || COALESCE(u.""LastName"", '')), ''), NULLIF(btrim(u.""UserName""), ''), 'Guest Participant'), 120),
                    ""Email"" = LEFT(COALESCE(NULLIF(btrim(u.""Email""), ''), 'legacy-' || a.""Id"" || '@jumpwithjenny.local'), 254),
                    ""NormalizedEmail"" = LEFT(LOWER(COALESCE(NULLIF(btrim(u.""Email""), ''), 'legacy-' || a.""Id"" || '@jumpwithjenny.local')), 254),
                    ""CancellationToken"" = md5(random()::text || clock_timestamp()::text || a.""Id"") || md5(random()::text || COALESCE(a.""WorkoutId"", '') || a.ctid::text)
                FROM ""AspNetUsers"" u
                WHERE a.""UserId"" = u.""Id"";

                UPDATE ""Appointments""
                SET
                    ""FullName"" = COALESCE(""FullName"", 'Guest Participant'),
                    ""Email"" = COALESCE(""Email"", LEFT('legacy-' || ""Id"" || '@jumpwithjenny.local', 254)),
                    ""NormalizedEmail"" = COALESCE(""NormalizedEmail"", LEFT(LOWER('legacy-' || ""Id"" || '@jumpwithjenny.local'), 254)),
                    ""CancellationToken"" = COALESCE(""CancellationToken"", md5(random()::text || clock_timestamp()::text || ""Id"") || md5(random()::text || COALESCE(""WorkoutId"", '') || ctid::text))
                WHERE ""FullName"" IS NULL OR ""Email"" IS NULL OR ""NormalizedEmail"" IS NULL OR ""CancellationToken"" IS NULL;

                WITH duplicate_active_emails AS (
                    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY ""WorkoutId"", ""NormalizedEmail"" ORDER BY ""CreatedOn"", ctid) AS rn
                    FROM ""Appointments""
                    WHERE ""IsDeleted"" = false
                )
                UPDATE ""Appointments"" a
                SET ""IsDeleted"" = true, ""DeletedOn"" = COALESCE(a.""DeletedOn"", NOW())
                FROM duplicate_active_emails d
                WHERE a.ctid = d.ctid AND d.rn > 1;
            ");

            migrationBuilder.AlterColumn<string>(
                name: "CancellationToken",
                table: "Appointments",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(128)",
                oldMaxLength: 128,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Appointments",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "Appointments",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(120)",
                oldMaxLength: 120,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedEmail",
                table: "Appointments",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(254)",
                oldMaxLength: 254,
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Appointments",
                table: "Appointments",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_CancellationToken",
                table: "Appointments",
                column: "CancellationToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_NormalizedEmail_IsDeleted",
                table: "Appointments",
                columns: new[] { "NormalizedEmail", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_UserId",
                table: "Appointments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_WorkoutId_NormalizedEmail",
                table: "Appointments",
                columns: new[] { "WorkoutId", "NormalizedEmail" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_AspNetUsers_UserId",
                table: "Appointments",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_AspNetUsers_UserId",
                table: "Appointments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Appointments",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_CancellationToken",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_NormalizedEmail_IsDeleted",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_UserId",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_WorkoutId_NormalizedEmail",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "CancellationToken",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "FullName",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "NormalizedEmail",
                table: "Appointments");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "Appointments",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "Appointments",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Appointments",
                table: "Appointments",
                columns: new[] { "UserId", "WorkoutId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_AspNetUsers_UserId",
                table: "Appointments",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
