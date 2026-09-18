import { Routes } from '@angular/router';
import { crearGuardRol } from './nucleo/auth/guard-rol';
import { guardAutenticacion } from './nucleo/auth/guard-autenticacion';
import { ROLES_ADMINISTRACION_NEGOCIO } from './nucleo/auth/roles-negocio';
import { LoginComponent } from './funcionalidades/auth/login/login.component';
import { ShellAppComponent } from './funcionalidades/app/shell-app.component';
import { InicioComponent } from './funcionalidades/app/inicio/inicio.component';
import { ConfiguracionComponent } from './funcionalidades/app/configuracion/configuracion.component';

const guardAdministracion = crearGuardRol([...ROLES_ADMINISTRACION_NEGOCIO]);
const guardCartera = crearGuardRol([...ROLES_ADMINISTRACION_NEGOCIO, 'cobrador']);

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
        path: 'creditos',
        canActivate: [guardAdministracion],
        loadComponent: () =>
          import('./funcionalidades/creditos/listado-creditos.component').then(
            (modulo) => modulo.ListadoCreditosComponent,
          ),
      },
      {
        path: 'creditos/nuevo',
        canActivate: [guardAdministracion],
        loadComponent: () =>
          import('./funcionalidades/creditos/formulario-credito.component').then(
            (modulo) => modulo.FormularioCreditoComponent,
          ),
      },
      {
        path: 'creditos/:id',
        canActivate: [guardAdministracion],
        loadComponent: () =>
          import('./funcionalidades/creditos/detalle-credito.component').then(
            (modulo) => modulo.DetalleCreditoComponent,
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
      {
        path: 'asignaciones',
        canActivate: [guardCartera],
        loadComponent: () =>
          import('./funcionalidades/asignaciones/listado-asignaciones.component').then(
            (modulo) => modulo.ListadoAsignacionesComponent,
          ),
      },
      {
        path: 'asignaciones/nueva',
        canActivate: [guardAdministracion],
        loadComponent: () =>
          import('./funcionalidades/asignaciones/formulario-asignacion.component').then(
            (modulo) => modulo.FormularioAsignacionComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
