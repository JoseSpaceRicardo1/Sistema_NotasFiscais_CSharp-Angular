import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';

import { ProdutoService } from '../../services/produto';
import { Produto } from '../../models/produto.model';

@Component({
  selector: 'app-produtos',
  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './produtos.html',
  styleUrl: './produtos.css',
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];
  colunasExibidas: string[] = ['codigo', 'descricao', 'saldo', 'adicionar', 'acoes'];
  carregando = false;
  salvando = false;
  paginaAtual = 1;
  totalPaginas = 1;
  totalRegistros = 0;
  readonly tamanhoPagina = 15;

  quantidadesAdicionais: { [codigo: number]: number } = {};
  adicionandoId: number | null = null;

  novoProduto: Produto = { codigo: 0, descricao: '', saldo: 0 };

  constructor(
    private produtoService: ProdutoService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.listarProdutos();
  }

  listarProdutos(): void 
  {
    this.carregando = true;
    this.cdr.markForCheck(); 
    this.produtoService
      .getProdutos(this.paginaAtual, this.tamanhoPagina)
      .pipe(finalize(() => { this.carregando = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (pagina) => 
        {
          this.produtos = pagina.dados;
          this.totalPaginas = pagina.totalPaginas;
          this.totalRegistros = pagina.total;
          pagina.dados.forEach((p) => 
          {
            if (this.quantidadesAdicionais[p.codigo] === undefined)
              this.quantidadesAdicionais[p.codigo] = 1;
          });
          this.cdr.markForCheck();
        },
        error: (err) => this.mostrarErro(err.message),
      });
  }

//Navegação <- (pag) ->
paginaAnterior(): void 
{

  if (this.paginaAtual > 1) 
    {
    this.paginaAtual--;
    this.listarProdutos();
    }
}

proximaPagina(): void 
{
  if (this.paginaAtual < this.totalPaginas) 
  {
    this.paginaAtual++;
    this.listarProdutos();
  }
}

irParaPagina(pagina: number): void 
{
  if (pagina >= 1 && pagina <= this.totalPaginas && pagina !== this.paginaAtual) 
  {
    this.paginaAtual = pagina;
    this.listarProdutos();
  }
}

get paginas(): number[] 
{
  return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
}

  salvar(): void {
    
    if (!this.novoProduto.descricao.trim()) {
      this.mostrarErro('A descrição do produto é obrigatória.');
      return;
    }
    if (this.novoProduto.saldo <= 0) {
      this.mostrarErro('O saldo não pode ser negativo, ou igual a zero.');
      return;
    }

    this.salvando = true;
    this.cdr.markForCheck();

    this.produtoService
      .salvarProduto(this.novoProduto)
      .pipe(finalize(() => { this.salvando = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.snackBar.open('Produto cadastrado com sucesso!', 'Fechar', { duration: 3000 });
          this.novoProduto = { codigo: 0, descricao: '', saldo: 0 };
          this.listarProdutos();
        },
        error: (err) => this.mostrarErro(err.message),
      });
  }

  adicionarSaldo(produto: Produto): void {
    const qtd = this.quantidadesAdicionais[produto.codigo];
    if (!qtd || qtd <= 0) 
    {
      this.mostrarErro('A quantidade a adicionar deve ser maior que zero.');
      return;
    }
 
    this.adicionandoId = produto.codigo;
    this.cdr.markForCheck();
 
    this.produtoService
      .adicionarSaldo(produto.codigo, qtd)
      .pipe(finalize(() => { this.adicionandoId = null; this.cdr.markForCheck(); }))
      .subscribe({
        next: (produtoAtualizado) => 
        {
          
          const idx = this.produtos.findIndex((p) => p.codigo === produto.codigo);
         
          if (idx !== -1) 
          {
            this.produtos[idx] = produtoAtualizado;
            this.produtos = [...this.produtos];
          }
          this.quantidadesAdicionais[produto.codigo] = 1;
          this.snackBar.open(
            `+${qtd} un. adicionadas a "${produto.descricao}". Novo saldo: ${produtoAtualizado.saldo}`,
            'Fechar', { duration: 4000 }
          );
          this.cdr.markForCheck();
        },
        error: (err) => this.mostrarErro(err.message),
      });
  }

  deletar(codigo: number): void {
    
    if (!confirm('Deseja realmente excluir este produto?')) return;

    this.produtoService.deletarProduto(codigo).subscribe({
      next: () => 
      {
        this.snackBar.open('Produto removido.', 'Fechar', { duration: 3000 });
        if (this.produtos.length === 1 && this.paginaAtual > 1) this.paginaAtual--;
        this.listarProdutos();
      },

      error: (err) => this.mostrarErro(err.message),

    });
  }

  private mostrarErro(msg: string): void {
    this.snackBar.open(`Algo deu errado: ${msg}`, 'Fechar', { duration: 5000 });
  }
}