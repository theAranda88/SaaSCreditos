import { Routes } from '@angular/router';
import { crearGuardRol } from './nucleo/auth/guard-rol';
import { guardAutenticacion } from './nucleo/auth/guard-autenticacion';
import { LoginComponent } from './funcionalidades/auth/login/login.component';
import { ShellAppComponent } from './funcionalidades/app/shell-app.component';
import { InicioComponent } from './funcionalidades/app/inicio/inicio.component';
import { ConfiguracionComponent } from './funcionalidades/app/configuracion/configuracion.component';

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
        canActivate: [crearGuardRol(['propietario', 'administrador'])],
      },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
