import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { ProdutoService } from '../../services/produto';
import { NotaFiscalService } from '../../services/nota-fiscal';
import { Produto } from '../../models/produto.model';

interface ItemNota {
  produtoId: number | null;
  quantidade: number;
}

interface NotaFiscal {
  itens: ItemNota[];
}

@Component({
  selector: 'app-nova-nota',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './nova-nota.html',
  styleUrl: './nova-nota.css'
})
export class NovaNotaComponent implements OnInit {

  produtos: Produto[] = [];

  novaNota: NotaFiscal = {
    itens: [
      {
        produtoId: null,
        quantidade: 1
      }
    ]
  };

  constructor(
    private produtoService: ProdutoService,
    private notaService: NotaFiscalService
  ) {}

  ngOnInit() {
    this.produtoService.getProdutos()
      .subscribe(dados => this.produtos = dados);
  }

  salvar() {
    const item = this.novaNota.itens[0];

    if (item.produtoId == null) {
      alert('Selecione um produto!');
      return;
    }

    this.notaService.enviarNota(this.novaNota).subscribe({
      next: () => {
        alert('Nota emitida com sucesso!');
        this.novaNota = {
          itens: [
            {
              produtoId: null,
              quantidade: 1
            }
          ]
        };
      },
      error: (err) => alert('Erro ao emitir nota: ' + err.message)
    });
  }
}