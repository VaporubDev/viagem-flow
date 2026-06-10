namespace ApiGestaoViagens.Models;

public class Tarefa
{
    public int Id { get; set; }
    public string Texto { get; set; } = string.Empty;
    public bool Concluida { get; set; }
}
