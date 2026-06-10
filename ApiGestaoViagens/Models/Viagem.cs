namespace ApiGestaoViagens.Models;

public class Viagem
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty;
    public string DataIda { get; set; } = string.Empty;
    public string DataVolta { get; set; } = string.Empty;
    public string Hotel { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Valor { get; set; }
}
