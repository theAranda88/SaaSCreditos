import { HttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export const IDIOMA_POR_DEFECTO = 'es';

export function crearCargadorTraducciones(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './i18n/', '.json');
}

/** Registra ngx-translate con JSON en `public/i18n/` (servido en Docker/nginx como `/i18n/`). */
export function proveerTraduccion() {
  return importProvidersFrom(
    TranslateModule.forRoot({
      defaultLanguage: IDIOMA_POR_DEFECTO,
      loader: {
        provide: TranslateLoader,
        useFactory: crearCargadorTraducciones,
        deps: [HttpClient],
      },
    }),
  );
}
