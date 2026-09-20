import { SetMetadata } from '@nestjs/common';
import { CLAVE_PERMITIR_NEGOCIO_NO_OPERATIVO } from '../constantes/auth.constantes';

export const PermitirNegocioNoOperativo = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(CLAVE_PERMITIR_NEGOCIO_NO_OPERATIVO, true);
