import { Routes } from '@angular/router';
import { crearGuardRol } from './nucleo/auth/guard-rol';
import { guardAutenticacion } from './nucleo/auth/guard-autenticacion';
import { ROLES_ADMINISTRACION_NEGOCIO } from './nucleo/auth/roles-negocio';
import { LoginComponent } from './funcionalidades/auth/login/login.component';
import { ShellAppComponent } from './funcionalidades/app/shell-app.component';
import { InicioComponent } from './funcionalidades/app/inicio/inicio.component';
import { ConfiguracionComponent } from './funcionalidades/app/configuracion/configuracion.component';

const guardAdministracion = crearGuardRol([...ROLES_ADMINISTRACION_NEGOCIO]);

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'app',
    component: ShellAppComponent,
    canActivate: [guardAutenticacion],
    children: [
      { path: 'inicio', component: InicioComponent },
      {
        path: 'configuracion',
        component: ConfiguracionComponent,
        canActivate: [guardAdministracion],
      },
      {
        path: 'clientes',
        canActivate: [guardAdministracion],
        loadComponent: () =>
          import('./funcionalidades/clientes/listado-clientes.component').then(
            (modulo) => modulo.ListadoClientesComponent,
          ),
      },
      {
        path: 'clientes/nuevo',
        canActivate: [guardAdministracion],
        loadComponent: () =>
          import('./funcionalidades/clientes/formulario-cliente.component').then(
            (modulo) => modulo.FormularioClienteComponent,
          ),
      },
      {
        path: 'clientes/:id',
        canActivate: [guardAdministracion],
        loadComponent: () =>
          import('./funcionalidades/clientes/formulario-cliente.component').then(
            (modulo) => modulo.FormularioClienteComponent,
          ),
      },
      {
        path: 'cobradores',
        canActivate: [guardAdministracion],
        loadComponent: () =>
          import('./funcionalidades/cobradores/listado-cobradores.component').then(
            (modulo) => modulo.ListadoCobradoresComponent,
          ),
      },
      {
        path: 'cobradores/nuevo',
        canActivate: [guardAdministracion],
        loadComponent: () =>
          import('./funcionalidades/cobradores/formulario-cobrador.component').then(
            (modulo) => modulo.FormularioCobradorComponent,
          ),
      },
      {
        path: 'cobradores/:id',
        canActivate: [guardAdministracion],
        loadComponent: () =>
          import('./funcionalidades/cobradores/formulario-cobrador.component').then(
            (modulo) => modulo.FormularioCobradorComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
