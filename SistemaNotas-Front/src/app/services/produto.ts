import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Produto } from '../models/produto.model';
 

export interface PaginaProdutos {
  dados: Produto[];
  total: number;
  paginaAtual: number;
  totalPaginas: number;
}

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private apiUrl = 'https://localhost:44334/api/Produtos';
 
  constructor(private http: HttpClient) {}
 
  getProdutos(pagina: number = 1, tamanhoPagina: number = 15): Observable<PaginaProdutos> {
    return this.http
      .get<Produto[]>(`${this.apiUrl}?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`, {
        observe: 'response',
      })
      .pipe(
        map((response: HttpResponse<Produto[]>) => ({
          dados: response.body ?? [],
          total: parseInt(response.headers.get('X-Total-Count') ?? '0', 10),
          paginaAtual: parseInt(response.headers.get('X-Pagina-Atual') ?? '1', 10),
          totalPaginas: parseInt(response.headers.get('X-Total-Paginas') ?? '1', 10),
        })),
        catchError(this.tratarErro)
      );
  }
   // Retorna todos os produtos sem paginação — usado por lista-notas para montar o Map de nomes
   // Agora pesquisa por termo e o Back filtra no banco
  getTodosProdutos(termo?: string): Observable<Produto[]> {
    const params = termo ? `?termo=${encodeURIComponent(termo)}` : '';
    return this.http
      .get<Produto[]>(`${this.apiUrl}/todos${params}`)
      .pipe(catchError(this.tratarErro));
  }
 
  salvarProduto(produto: Produto): Observable<Produto> {
    return this.http.post<Produto>(this.apiUrl, produto).pipe(catchError(this.tratarErro));
  }
 
  deletarProduto(codigo: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${codigo}`).pipe(catchError(this.tratarErro));
  }
 
  adicionarSaldo(codigo: number, quantidade: number): Observable<Produto> {
    return this.http
      .patch<Produto>(`${this.apiUrl}/adicionar-saldo/${codigo}`, quantidade)
      .pipe(catchError(this.tratarErro));
  }
 
  private tratarErro(erro: HttpErrorResponse): Observable<never> {
    let mensagem = 'Erro desconhecido.';
    if (erro.status === 0)
      mensagem = 'Serviço de Estoque indisponível. Verifique se o servidor está rodando.';
    else if (erro.status === 400)
      mensagem = typeof erro.error === 'string' ? erro.error : 'Requisição inválida.';
    else if (erro.status === 404)
      mensagem = 'Produto não encontrado.';
    else if (erro.status >= 500)
      mensagem = 'Erro interno no servidor de Estoque.';
    return throwError(() => new Error(mensagem));
  }
}