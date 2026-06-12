using System.ComponentModel.DataAnnotations;

namespace ApiGestaoViagens.Models;

public class Perfil
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Timezone { get; set; } = string.Empty;

    public string Language { get; set; } = string.Empty;

    public string Role { get; set; } = "Senior Travel Executive";

    public string Avatar { get; set; } = string.Empty;
}
