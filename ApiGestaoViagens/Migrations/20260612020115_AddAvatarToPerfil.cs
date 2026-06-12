using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiGestaoViagens.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarToPerfil : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Avatar",
                table: "Perfis",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Avatar",
                table: "Perfis");
        }
    }
}
