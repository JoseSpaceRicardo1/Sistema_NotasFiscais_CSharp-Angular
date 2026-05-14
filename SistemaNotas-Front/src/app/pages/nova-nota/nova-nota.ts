import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { finalize } from 'rxjs/operators';

import { ProdutoService } from '../../services/produto';
import { NotaFiscalService } from '../../services/nota-fiscal';
import { Produto } from '../../models/produto.model';
import { CriarNotaFiscalDto } from '../../models/nota-fiscal.model';

interface ItemNota {
  produtoId: number | null;
  quantidade: number;
}

@Component({
  selector: 'app-nova-nota',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule,
  ],
  templateUrl: './nova-nota.html',
  styleUrl: './nova-nota.css',
})
export class NovaNotaComponent implements OnInit {
  produtos: Produto[] = [];
  itens: ItemNota[] = [{ produtoId: null, quantidade: 1 }];
  salvando = false;

  constructor(
    private produtoService: ProdutoService,
    private notaService: NotaFiscalService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.produtoService.getTodosProdutos().subscribe({
      next: (dados) => {
        this.produtos = dados;
        this.cdr.markForCheck();
      },
      error: (err) => this.snackBar.open(`Erro: ${err.message}`, 'Fechar', { duration: 5000 }),
    });
  }

  adicionarItem(): void {
    this.itens = [...this.itens, { produtoId: null, quantidade: 1 }];
    this.cdr.markForCheck();
  }

  removerItem(index: number): void {
    if (this.itens.length > 1) {
      this.itens = this.itens.filter((_, i) => i !== index);
      this.cdr.markForCheck();
    }
  }

  saldoProduto(produtoId: number | null): number | null {
    if (!produtoId) return null;
    return this.produtos.find((p) => p.codigo === produtoId)?.saldo ?? null;
  }

  salvar(): void {
    for (let i = 0; i < this.itens.length; i++) {
      const item = this.itens[i];
      if (item.produtoId == null) {
        this.snackBar.open(`Selecione o produto na linha ${i + 1}.`, 'Fechar', { duration: 4000 });
        return;
      }
      if (item.quantidade <= 0) {
        this.snackBar.open(`Quantidade inválida na linha ${i + 1}.`, 'Fechar', { duration: 4000 });
        return;
      }
      const saldo = this.saldoProduto(item.produtoId);
      if (saldo !== null && item.quantidade > saldo) {
        const prod = this.produtos.find((p) => p.codigo === item.produtoId);
        this.snackBar.open(
          `Saldo insuficiente para "${prod?.descricao}". Disponível: ${saldo}.`,
          'Fechar', { duration: 5000 }
        );
        return;
      }
    }

    const ids = this.itens.map((i) => i.produtoId);
    if (new Set(ids).size !== ids.length) {
      this.snackBar.open('Produtos duplicados na nota. Combine as quantidades em uma linha só.', 'Fechar', { duration: 4000 });
      return;
    }

    const dto: CriarNotaFiscalDto = {
      itens: this.itens.map((i) => ({
        produtoId: i.produtoId as number,
        quantidade: i.quantidade,
      })),
    };

    this.salvando = true;
    this.cdr.markForCheck();

    this.notaService
      .enviarNota(dto)
      .pipe(finalize(() => { this.salvando = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (notaCriada) => {
          this.snackBar.open(
            `Nota Nº ${notaCriada.numero} emitida com sucesso!`,
            'Fechar', { duration: 4000 }
          );
          this.itens = [{ produtoId: null, quantidade: 1 }];
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.snackBar.open(`❌ ${err.message}`, 'Fechar', { duration: 6000 }),
      });
  }
}