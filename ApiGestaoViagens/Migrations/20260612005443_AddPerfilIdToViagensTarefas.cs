using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiGestaoViagens.Migrations
{
    /// <inheritdoc />
    public partial class AddPerfilIdToViagensTarefas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PerfilId",
                table: "Viagens",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PerfilId",
                table: "Tarefas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PerfilId",
                table: "Viagens");

            migrationBuilder.DropColumn(
                name: "PerfilId",
                table: "Tarefas");
        }
    }
}
