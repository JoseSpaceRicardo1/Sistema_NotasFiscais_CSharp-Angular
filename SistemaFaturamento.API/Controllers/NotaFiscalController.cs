using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaFaturamento.API.Data;
using SistemaFaturamento.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace SistemaFaturamento.API.Controllers

{

    [Route("api/[controller]")]
    [ApiController]
    public class NotaFiscalController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;

        public NotaFiscalController(AppDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        // GET: api/NotaFiscal
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotaFiscal>>> GetNotasFiscais()
        {
            return await _context.NotasFiscais.ToListAsync();
        }

        // GET: api/NotaFiscal/5
        [HttpGet("{id}")]
        public async Task<ActionResult<NotaFiscal>> GetNotaFiscal(int id)
        {
            var notaFiscal = await _context.NotasFiscais.FindAsync(id);

            if (notaFiscal == null)
            {
                return NotFound();
            }

            return notaFiscal;
        }

        // PUT: api/NotaFiscal/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNotaFiscal(int id, NotaFiscal notaFiscal)
        {
            if (id != notaFiscal.Numero)
            {
                return BadRequest();
            }

            _context.Entry(notaFiscal).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!NotaFiscalExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/NotaFiscal
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<NotaFiscal>> PostNotaFiscal(NotaFiscal notaFiscal)
        {
            _context.NotasFiscais.Add(notaFiscal);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetNotaFiscal", new { id = notaFiscal.Numero }, notaFiscal);
        }

        [HttpPost("{id}/imprimir")]
        public async Task <IActionResult> Imprimir(int id)
        {
            var nota = await _context.NotasFiscais.Include(n => n.Itens).FirstOrDefaultAsync(n => n.Numero == id);

            if (nota == null) 
                return NotFound("Nota não encontrada.");

            if(nota.Status != StatusNota.Aberta)
                return BadRequest("A nota fiscal deve estar com status 'Aberta' para ser impressa.");

            var client = _httpClientFactory.CreateClient();

            string estoqueUrl = "http://localhost:53313/api/Produtos/baixa-estoque";

            try
            {
                foreach (var item in nota.Itens)
                {
                    // Chamada para o outro microserviço
                    var response = await client.PutAsJsonAsync($"{estoqueUrl}{item.ProdutoId}", item.Quantidade);

                    if (!response.IsSuccessStatusCode)
                    {
                        var erro = await response.Content.ReadAsStringAsync();
                        return StatusCode((int)response.StatusCode, $"Falha no Estoque: {erro}");
                    }
                }
            }
            
            catch (HttpRequestException)
            {
                return StatusCode(503, "Serviço de Estoque indisponível.");
            }

            nota.Status = StatusNota.Fechada;
            await _context.SaveChangesAsync();

            return Ok( new { message = "Nota fiscal impressa e estoque atualizado com sucesso.", nota });
        }

        // DELETE: api/NotaFiscal/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotaFiscal(int id)
        {
            var notaFiscal = await _context.NotasFiscais.FindAsync(id);
            if (notaFiscal == null)
            {
                return NotFound();
            }

            _context.NotasFiscais.Remove(notaFiscal);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool NotaFiscalExists(int id)
        {
            return _context.NotasFiscais.Any(e => e.Numero == id);
        }

    }
}
