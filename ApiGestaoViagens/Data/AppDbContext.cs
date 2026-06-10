using Microsoft.EntityFrameworkCore;
using ApiGestaoViagens.Models;

namespace ApiGestaoViagens.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Viagem> Viagens { get; set; } = null!;
    public DbSet<Tarefa> Tarefas { get; set; } = null!;
}
