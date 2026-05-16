import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, finalize } from 'rxjs/operators';

import { ProdutoService } from '../../services/produto';
import { NotaFiscalService } from '../../services/nota-fiscal';
import { Produto } from '../../models/produto.model';
import { CriarNotaFiscalDto } from '../../models/nota-fiscal.model';

interface ItemNota {
  produtoId: number | null;
  quantidade: number;
  resultadosBusca: Produto[];
  termoBusca: string;
  buscando: boolean;
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
export class NovaNotaComponent implements OnInit, OnDestroy {
  itens: ItemNota[] = [];
  salvando = false;
 
  private buscaSubjects: Subject<{ index: number; termo: string }>[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private produtoService: ProdutoService,
    private notaService: NotaFiscalService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void 
  {
    this.adicionarItem();
  }
 
  ngOnDestroy(): void 
  {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private criarItemVazio(): ItemNota 
  {
    return { produtoId: null, quantidade: 1, resultadosBusca: [], termoBusca: '', buscando: false };
  }

  adicionarItem(): void 
  {
    const index = this.itens.length;
    this.itens = [...this.itens, this.criarItemVazio()];
    const subject = new Subject<{ index: number; termo: string }>();
    this.buscaSubjects.push(subject);
    subject.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => a.termo === b.termo),
      switchMap(({ index: i, termo }) => 
      {
        this.itens[i].buscando = true;
        this.cdr.markForCheck();
        return this.produtoService.getTodosProdutos(termo);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (produtos) => 
      {
        const i = this.buscaSubjects.indexOf(subject);
        if (i !== -1) {
          this.itens[i].resultadosBusca = produtos;
          this.itens[i].buscando = false;
        }
        this.cdr.markForCheck();
      },
      error: () => 
      {
        const i = this.buscaSubjects.indexOf(subject);
        if (i !== -1) this.itens[i].buscando = false;
        this.cdr.markForCheck();
      },
    });
    subject.next({ index, termo: '' });
    this.cdr.markForCheck();
  }

  onTermoBuscaChange(index: number, termo: string): void 
  {
    this.itens[index].termoBusca = termo;
    this.itens[index].produtoId = null;
    this.buscaSubjects[index]?.next({ index, termo });
  }

  onProdutoSelecionado(index: number, produtoId: number): void 
  {
    this.itens[index].produtoId = produtoId;
    const prod = this.itens[index].resultadosBusca.find((p) => p.codigo === produtoId);
    if (prod) this.itens[index].termoBusca = prod.descricao;
    this.cdr.markForCheck();
  }

  removerItem(index: number): void 
  {
    if (this.itens.length > 1) {
      this.itens = this.itens.filter((_, i) => i !== index);
      const [removido] = this.buscaSubjects.splice(index, 1);
      removido.complete();
      this.cdr.markForCheck();
    }
  }

  saldoProduto(item: ItemNota): number | null 
  {
    if (!item.produtoId) return null;
    return item.resultadosBusca.find((p) => p.codigo === item.produtoId)?.saldo ?? null;
  }

  salvar(): void 
  {
    for (let i = 0; i < this.itens.length; i++) {
      const item = this.itens[i];
      if (item.produtoId == null) 
      {
        this.snackBar.open(`Selecione o produto na linha ${i + 1}.`, 'Fechar', { duration: 4000 });
        return;
      }
      if (item.quantidade <= 0) 
      {
        this.snackBar.open(`Quantidade inválida na linha ${i + 1}.`, 'Fechar', { duration: 4000 });
        return;
      }
      const saldo = this.saldoProduto(item);
      if (saldo !== null && item.quantidade > saldo) 
      {
        const prod = item.resultadosBusca.find((p) => p.codigo === item.produtoId);
        this.snackBar.open(
          `Saldo insuficiente para "${prod?.descricao}". Disponível: ${saldo}.`,
          'Fechar', { duration: 5000 }
        );
        return;
      }
    }

    const ids = this.itens.map((i) => i.produtoId);
    if (new Set(ids).size !== ids.length) 
    {
      this.snackBar.open('Produtos duplicados na nota. Combine as quantidades em uma linha só.', 'Fechar', { duration: 4000 });
      return;
    }

    const dto: CriarNotaFiscalDto = 
    {
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
        next: (notaCriada) => 
        {
          this.snackBar.open(
            `Nota Nº ${notaCriada.numero} emitida com sucesso!`,
            'Fechar', { duration: 4000 }
          );
          this.buscaSubjects.forEach((s) => s.complete());
          this.buscaSubjects = [];
          this.itens = [];
          this.adicionarItem();
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.snackBar.open(`❌ ${err.message}`, 'Fechar', { duration: 6000 }),
      });
  }
}