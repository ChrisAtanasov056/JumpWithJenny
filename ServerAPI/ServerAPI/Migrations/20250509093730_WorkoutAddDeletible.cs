using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ServerAPI.Migrations
{
    public partial class WorkoutAddDeletible : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedOn",
                table: "WorkoutShoes",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedOn",
                table: "WorkoutShoes",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "WorkoutShoes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedOn",
                table: "WorkoutShoes",
                type: "timestamp without time zone",
                nullable: true);

        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedOn",
                table: "WorkoutShoes");

            migrationBuilder.DropColumn(
                name: "DeletedOn",
                table: "WorkoutShoes");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "WorkoutShoes");

            migrationBuilder.DropColumn(
                name: "ModifiedOn",
                table: "WorkoutShoes");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "WorkoutCardTypes",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);
        }
    }
}
