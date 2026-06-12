using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiGestaoViagens.Data;
using ApiGestaoViagens.Models;

namespace ApiGestaoViagens.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ViagensController : ControllerBase
{
    private readonly AppDbContext _context;

    public ViagensController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Viagem>>> GetViagens([FromQuery] int perfilId)
    {
        if (perfilId <= 0) return BadRequest("PerfilId é obrigatório.");
        return await _context.Viagens.Where(v => v.PerfilId == perfilId).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Viagem>> GetViagem(int id)
    {
        var viagem = await _context.Viagens.FindAsync(id);
        if (viagem == null) return NotFound();
        return viagem;
    }

    [HttpPost]
    public async Task<ActionResult<Viagem>> PostViagem(Viagem viagem)
    {
        _context.Viagens.Add(viagem);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetViagem), new { id = viagem.Id }, viagem);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutViagem(int id, Viagem viagem)
    {
        if (id != viagem.Id) return BadRequest();

        _context.Entry(viagem).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ViagemExists(id)) return NotFound();
            else throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteViagem(int id)
    {
        var viagem = await _context.Viagens.FindAsync(id);
        if (viagem == null) return NotFound();

        _context.Viagens.Remove(viagem);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ViagemExists(int id)
    {
        return _context.Viagens.Any(e => e.Id == id);
    }
}
