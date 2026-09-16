import { SetMetadata } from '@nestjs/common';
import type { RolUsuario } from '@creditos/shared-types';
import { CLAVE_ROLES } from '../constantes/auth.constantes';

export const Roles = (...roles: RolUsuario[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(CLAVE_ROLES, roles);
