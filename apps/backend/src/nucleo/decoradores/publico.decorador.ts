import { SetMetadata } from '@nestjs/common';
import { CLAVE_ES_PUBLICO } from '../constantes/auth.constantes';

export const Publico = (): ReturnType<typeof SetMetadata> => SetMetadata(CLAVE_ES_PUBLICO, true);
