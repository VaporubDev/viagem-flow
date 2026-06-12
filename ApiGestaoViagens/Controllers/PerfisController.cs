using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApiGestaoViagens.Data;
using ApiGestaoViagens.Models;

namespace ApiGestaoViagens.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PerfisController : ControllerBase
{
    private readonly AppDbContext _context;

    public PerfisController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("registrar")]
    public async Task<IActionResult> Registrar([FromBody] Perfil profile)
    {
        if (string.IsNullOrWhiteSpace(profile.Email) || string.IsNullOrWhiteSpace(profile.Password))
        {
            return BadRequest("Email and Password are required.");
        }

        var existing = await _context.Perfis.FirstOrDefaultAsync(p => p.Email.ToLower() == profile.Email.ToLower());
        if (existing != null)
        {
            return BadRequest("An account with this email already exists.");
        }

        _context.Perfis.Add(profile);
        await _context.SaveChangesAsync();

        return Ok(profile);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and Password are required.");
        }

        var profile = await _context.Perfis.FirstOrDefaultAsync(p => p.Email.ToLower() == request.Email.ToLower() && p.Password == request.Password);
        if (profile == null)
        {
            return Unauthorized("Incorrect email or password.");
        }

        return Ok(profile);
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            // Fallback: return the first profile in DB if email is not specified
            var first = await _context.Perfis.FirstOrDefaultAsync();
            if (first == null) return NotFound("No profiles found.");
            return Ok(first);
        }

        var profile = await _context.Perfis.FirstOrDefaultAsync(p => p.Email.ToLower() == email.ToLower());
        if (profile == null)
        {
            return NotFound("Profile not found.");
        }

        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] Perfil updatedProfile)
    {
        var existing = await _context.Perfis.FirstOrDefaultAsync(p => p.Email.ToLower() == updatedProfile.Email.ToLower());
        if (existing == null)
        {
            return NotFound("Profile not found.");
        }

        existing.FullName = updatedProfile.FullName;
        existing.Phone = updatedProfile.Phone;
        existing.Timezone = updatedProfile.Timezone;
        existing.Language = updatedProfile.Language;
        existing.Role = updatedProfile.Role;
        
        if (updatedProfile.Avatar != null)
        {
            existing.Avatar = updatedProfile.Avatar;
        }

        if (!string.IsNullOrWhiteSpace(updatedProfile.Password))
        {
            existing.Password = updatedProfile.Password;
        }

        await _context.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProfile(int id)
    {
        var profile = await _context.Perfis.FindAsync(id);
        if (profile == null)
        {
            return NotFound("Profile not found.");
        }

        // Delete all associated tasks
        var tarefas = await _context.Tarefas.Where(t => t.PerfilId == id).ToListAsync();
        if (tarefas.Any())
        {
            _context.Tarefas.RemoveRange(tarefas);
        }

        // Delete all associated trips
        var viagens = await _context.Viagens.Where(v => v.PerfilId == id).ToListAsync();
        if (viagens.Any())
        {
            _context.Viagens.RemoveRange(viagens);
        }

        // Delete the profile
        _context.Perfis.Remove(profile);
        
        await _context.SaveChangesAsync();
        return Ok(new { message = "Account and associated data successfully deleted." });
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
