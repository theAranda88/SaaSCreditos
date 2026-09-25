import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { interceptorJwt } from './nucleo/auth/interceptor-jwt';
import { IDIOMA_POR_DEFECTO, proveerTraduccion } from './nucleo/i18n/proveedor-traduccion';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([interceptorJwt])),
    proveerTraduccion(),
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      translate.setDefaultLang(IDIOMA_POR_DEFECTO);
      return firstValueFrom(translate.use(IDIOMA_POR_DEFECTO));
    }),
  ],
};
