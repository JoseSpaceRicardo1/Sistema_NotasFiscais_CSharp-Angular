using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaEstoque.API.Data;
using SistemaEstoque.API.Models;

namespace SistemaEstoque.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProdutosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private const int TamanhoPaginaPadrao = 15;

        public ProdutosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Produtos?pagina=1&tamanhoPagina=15
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Produto>>> GetProdutos(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanhoPagina = TamanhoPaginaPadrao)
        {
            if (pagina < 1) pagina = 1;
            if (tamanhoPagina < 1 || tamanhoPagina > 100) tamanhoPagina = TamanhoPaginaPadrao;

            var total = await _context.Produtos.CountAsync();

            var produtos = await _context.Produtos.OrderBy(p => p.Codigo).Skip((pagina - 1) * tamanhoPagina).Take(tamanhoPagina).ToListAsync();

            var totalPaginas = (int)Math.Ceiling((double)total / tamanhoPagina);

            // Headers HTTP com metadados de paginação — padrão REST amplamente adotado
            Response.Headers.Append("X-Total-Count", total.ToString());
            Response.Headers.Append("X-Pagina-Atual", pagina.ToString());
            Response.Headers.Append("X-Total-Paginas", totalPaginas.ToString());
            Response.Headers.Append("Access-Control-Expose-Headers",
                "X-Total-Count, X-Pagina-Atual, X-Total-Paginas");

            return Ok(produtos);
        }

        // GET: api/Produtos/todos
        // Retorna todos os produtos sem paginação.
        // Usado pelo frontend em lista-notas (forkJoin) para montar o Map<codigo, descricao>.
        [HttpGet("todos")]
        public async Task<ActionResult<IEnumerable<Produto>>> GetTodosProdutos()
        {
            return await _context.Produtos.OrderBy(p => p.Codigo).ToListAsync();
        }

        // GET: api/Produtos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Produto>> GetProduto(int id)
        {
            var produto = await _context.Produtos.FindAsync(id);

            if (produto == null)
            {
                return NotFound();
            }

            return produto;
        }

        // PUT: api/Produtos/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduto(int id, Produto produto)
        {
            if (id != produto.Codigo)
                return BadRequest();

            _context.Entry(produto).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProdutoExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // POST: api/Produtos
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Produto>> PostProduto(Produto produto)
        {
            _context.Produtos.Add(produto);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProduto", new { id = produto.Codigo }, produto);
        }

        // DELETE: api/Produtos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduto(int id)
        {
            var produto = await _context.Produtos.FindAsync(id);
            if (produto == null)
            {
                return NotFound();
            }

            _context.Produtos.Remove(produto);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("baixa-estoque/{id}")]
        public async Task<IActionResult> BaixaEstoque(int id, [FromBody] int quantidade)
        {
            if (quantidade <= 0)
            {
                return BadRequest("A quantidade deve ser maior que zero.");
            }

            var produto = await _context.Produtos.FirstOrDefaultAsync(p => p.Codigo == id);

            if (produto == null)
            {
                return NotFound("Produto não econtrado no estoque.");
            }

            if (produto.Saldo < quantidade)
            {
                return BadRequest($"Saldo insuficiente para realizar a baixa. Quantidade em estoque: {produto.Saldo}");
            }
            produto.Saldo -= quantidade;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(500, "Erro ao atualizar o estoque. Tente novamente.");
            }

            return Ok(produto);

        }

        // PATCH: api/Produtos/adicionar-saldo/{id}
        [HttpPatch("adicionar-saldo/{id}")]
        public async Task<IActionResult> AdicionarSaldo(int id, [FromBody] int quantidade)
        {
            if (quantidade <= 0)
                return BadRequest("A quantidade a adicionar deve ser maior que zero.");

            var produto = await _context.Produtos.FirstOrDefaultAsync(p => p.Codigo == id);

            if (produto == null)
                return NotFound("Produto não encontrado.");

            produto.Saldo += quantidade;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(500, "Erro ao atualizar o saldo. Tente novamente.");
            }

            return Ok(produto);
        }

        private bool ProdutoExists(int id) =>
            _context.Produtos.Any(e => e.Codigo == id);


        //Correção...
    }
}