import { Module } from '@nestjs/common';
import { SaludRoutes } from './salud.routes';

@Module({
  imports: [SaludRoutes],
})
export class RutasModule {}
