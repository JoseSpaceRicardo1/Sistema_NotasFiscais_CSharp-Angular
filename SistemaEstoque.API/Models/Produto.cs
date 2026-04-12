using System.ComponentModel.DataAnnotations;

namespace SistemaEstoque.API.Models
{
    public class Produto
    {
        [Key]
        public int Codigo { get; set; }

        [Required]
        public string Descricao { get; set; }

        public int Saldo { get; set; }
    }
}
