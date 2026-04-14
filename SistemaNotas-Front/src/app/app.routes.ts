import { Routes } from '@angular/router';
import { ProdutosComponent } from './pages/produtos/produtos';
import { NovaNotaComponent } from './pages/nova-nota/nova-nota';
import { ListaNotasComponent } from './pages/lista-notas/lista-notas';

export const routes: Routes = [
  { path: 'produtos', component: ProdutosComponent },
  { path: 'nova-nota', component: NovaNotaComponent },
  { path: 'notas', component: ListaNotasComponent },
  { path: '', redirectTo: '/produtos', pathMatch: 'full' }
];