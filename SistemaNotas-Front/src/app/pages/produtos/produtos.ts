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
  ],
  templateUrl: './produtos.html',
  styleUrl: './produtos.css',
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];
  colunasExibidas: string[] = ['codigo', 'descricao', 'saldo', 'acoes'];
  carregando = false;
  salvando = false;
  paginaAtual = 1;
  totalPaginas = 1;
  tamanhoPagina = 15;

  novoProduto: Produto = { codigo: 0, descricao: '', saldo: 0 };

  constructor(
    private produtoService: ProdutoService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.listarProdutos();
  }

  listarProdutos(): void {
    this.carregando = true;
    this.cdr.markForCheck(); 
    this.produtoService
      .getProdutos(this.paginaAtual, this.tamanhoPagina)
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.markForCheck(); 
        })
      )
      .subscribe({
        next: (pagina) => {
          this.produtos = pagina.dados;
          this.cdr.markForCheck();
        },
        error: (err) => this.mostrarErro(err.message),
      });
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

  deletar(codigo: number): void {
    if (!confirm('Deseja realmente excluir este produto?')) return;

    this.produtoService.deletarProduto(codigo).subscribe({
      next: () => {
        this.snackBar.open('Produto removido.', 'Fechar', { duration: 3000 });
        this.listarProdutos();
      },
      error: (err) => this.mostrarErro(err.message),
    });
  }

  private mostrarErro(msg: string): void {
    this.snackBar.open(`Algo deu errado: ${msg}`, 'Fechar', { duration: 5000 });
  }
}