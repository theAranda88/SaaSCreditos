import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthServicio } from '../../../nucleo/auth/auth.servicio';
import { rutaInicioPorRol } from '../../../nucleo/auth/roles-negocio';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authServicio = inject(AuthServicio);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly formulario = this.formBuilder.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
  });

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const { correo, contrasena } = this.formulario.getRawValue();

    this.authServicio.iniciarSesion(correo, contrasena).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        void this.router.navigate([rutaInicioPorRol(respuesta.usuario.rol)]);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('auth.login.error_credenciales');
      },
    });
  }
}
