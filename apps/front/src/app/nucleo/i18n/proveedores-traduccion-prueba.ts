import { importProvidersFrom } from '@angular/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { IDIOMA_POR_DEFECTO } from './proveedor-traduccion';

/** En pruebas el pipe devuelve la clave si no hay traducción cargada. */
export function proveedoresTraduccionPrueba() {
  return importProvidersFrom(
    TranslateModule.forRoot({
      defaultLanguage: IDIOMA_POR_DEFECTO,
      loader: {
        provide: TranslateLoader,
        useClass: TranslateFakeLoader,
      },
    }),
  );
}
