import { FormBuilder, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';

describe('LoginComponent formulario', () => {
  it('debe ser inválido sin credenciales completas', () => {
    const formulario = new FormBuilder().nonNullable.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
    });

    expect(formulario.invalid).toBe(true);
  });

  it('debe ser válido con correo y contraseña correctos', () => {
    const formulario = new FormBuilder().nonNullable.group({
      correo: ['ana@ejemplo.com', [Validators.required, Validators.email]],
      contrasena: ['ClaveSegura123', [Validators.required, Validators.minLength(8)]],
    });

    expect(formulario.valid).toBe(true);
  });
});
