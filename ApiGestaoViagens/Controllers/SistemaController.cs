using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiGestaoViagens.Data;

namespace ApiGestaoViagens.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SistemaController : ControllerBase
{
    private readonly AppDbContext _context;

    public SistemaController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("reiniciar")]
    public async Task<IActionResult> Reiniciar()
    {
        _context.Viagens.RemoveRange(_context.Viagens);
        _context.Tarefas.RemoveRange(_context.Tarefas);
        await _context.SaveChangesAsync();

        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM sqlite_sequence WHERE name IN ('Viagens', 'Tarefas')"
        );

        return Ok(new { mensagem = "Sistema reiniciado com sucesso! IDs resetados para 1." });
    }
}
