import { Module } from '@nestjs/common';
import { RutasModule } from './routes/rutas.module';

@Module({
  imports: [RutasModule],
})
export class AppModule {}
