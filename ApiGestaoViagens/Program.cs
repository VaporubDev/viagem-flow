using Microsoft.EntityFrameworkCore;
using ApiGestaoViagens.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Database (SQLite)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=gestaoviagens.db"));

// Configure CORS to allow the frontend to access the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

var app = builder.Build();

// Migrate legacy data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var primeiroPerfil = context.Perfis.OrderBy(p => p.Id).FirstOrDefault();
    if (primeiroPerfil != null)
    {
        context.Database.ExecuteSqlRaw($"UPDATE Viagens SET PerfilId = {primeiroPerfil.Id} WHERE PerfilId = 0");
        context.Database.ExecuteSqlRaw($"UPDATE Tarefas SET PerfilId = {primeiroPerfil.Id} WHERE PerfilId = 0");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();
