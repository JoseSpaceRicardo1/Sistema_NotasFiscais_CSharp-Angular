using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SistemaFaturamento.API.Models
{
    public class ItemNotaFiscal
    {
        [Key]
        public int Id { get; set; }

        public int ProdutoId { get; set; }

        public int Quantidade { get; set; }

        public int NotaFiscalId { get; set; }
        
        [JsonIgnore]
        public NotaFiscal? NotaFiscal { get; set; }
    }
}
