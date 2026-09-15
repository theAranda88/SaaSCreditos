import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { obtenerEstadoShellInicial } from './shell.modelo';

const shellInicial = obtenerEstadoShellInicial();

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly titulo = signal(shellInicial.titulo);
  readonly mensaje = signal(shellInicial.mensaje);
  readonly estadoFront = signal(shellInicial.estadoFront);
}
