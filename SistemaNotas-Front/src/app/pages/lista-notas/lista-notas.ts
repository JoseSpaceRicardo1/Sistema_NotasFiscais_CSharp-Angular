import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { NotaFiscalService } from '../../services/nota-fiscal';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-lista-notas',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './lista-notas.html',
  styleUrl: './lista-notas.css'
})
export class ListaNotasComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]); 
  
  colunasExibidas: string[] = ['numero', 'status', 'acoes'];
  
  carregandoId: number | null = null;

  constructor(private notaService: NotaFiscalService) {}

  ngOnInit() {
    this.carregarNotas();
  }

  carregarNotas() {
    this.notaService.getNotasFiscais().subscribe({
      next: (dados) => {
        this.dataSource.data = dados; 
      },
      error: (err) => console.error('Erro ao buscar notas', err)
    });
  }

  imprimir(id: number) {
    console.log('Botão clicado para a nota:', id);
    this.carregandoId = id;
  
    this.notaService.imprimirNota(id).subscribe({
      next: (res) => {
        console.log('Resposta do servidor:', res);
        alert('Nota Fechada!');
        this.carregarNotas();
        this.carregandoId = null;
      },
      error: (err) => {
        console.error('Erro na impressão:', err);
        alert('Erro ao processar: ' + err.message);
        this.carregandoId = null;
      }
    });
  }
}