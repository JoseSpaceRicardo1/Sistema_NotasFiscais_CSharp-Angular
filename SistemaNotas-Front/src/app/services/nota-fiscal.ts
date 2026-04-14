import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotaFiscal } from '../models/nota-fiscal.model';

@Injectable({
  providedIn: 'root'
})
export class NotaFiscalService {
  getNotasFiscais(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  
  private apiUrl = 'https://localhost:44340/api/NotaFiscal';

  constructor(private http: HttpClient) { }

  enviarNota(nota: any): Observable<any> {
    return this.http.post(this.apiUrl, nota);
  }

  imprimirNota(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/imprimir`, {}); 
  }
}