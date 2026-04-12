using Microsoft.EntityFrameworkCore;
using SistemaEstoque.API.Models;

namespace SistemaEstoque.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<Produto> Produtos { get; set; }
    }
}
