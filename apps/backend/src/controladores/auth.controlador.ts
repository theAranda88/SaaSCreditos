import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { PerfilUsuario, RespuestaLogin } from '@creditos/shared-types';
import { LoginDto } from '../dtos/login.dto';
import { RecuperarAccesoDto } from '../dtos/recuperar-acceso.dto';
import { RegistroDto } from '../dtos/registro.dto';
import { Publico } from '../nucleo/decoradores/publico.decorador';
import { PermitirNegocioNoOperativo } from '../nucleo/decoradores/permitir-negocio-no-operativo.decorador';
import { UsuarioActual } from '../nucleo/decoradores/usuario-actual.decorador';
import { GuardLimiteLogin } from '../nucleo/guards/guard-limite-login';
import { AuthServicio } from '../servicios/auth.servicio';

@ApiTags('auth')
@Controller('auth')
export class AuthControlador {
  constructor(@Inject(AuthServicio) private readonly authServicio: AuthServicio) {}

  @Post('registro')
  @Publico()
  @ApiOperation({ summary: 'Registra un negocio y su usuario propietario inicial' })
  @ApiCreatedResponse({ description: 'Registro exitoso con JWT' })
  @ApiConflictResponse({ description: 'Correo ya registrado' })
  async registrar(@Body() dto: RegistroDto): Promise<RespuestaLogin> {
    return this.authServicio.registrar(dto);
  }

  @Post('login')
  @Publico()
  @UseGuards(GuardLimiteLogin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión con correo y contraseña' })
  @ApiOkResponse({ description: 'Login exitoso con JWT' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  async iniciarSesion(@Body() dto: LoginDto): Promise<RespuestaLogin> {
    return this.authServicio.iniciarSesion(dto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @PermitirNegocioNoOperativo()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cierra sesión (stateless: el cliente descarta el token)' })
  @ApiOkResponse({ description: 'Sesión cerrada' })
  cerrarSesion(): { mensaje: string } {
    return this.authServicio.cerrarSesion();
  }

  @Post('recuperar-acceso')
  @Publico()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Solicita recuperación de acceso (stub MVP — sin envío de correo)',
  })
  @ApiAcceptedResponse({ description: 'Solicitud aceptada (stub)' })
  async recuperarAcceso(@Body() dto: RecuperarAccesoDto): Promise<{ mensaje: string }> {
    return this.authServicio.recuperarAcceso(dto.correo);
  }

  @Get('perfil')
  @ApiBearerAuth()
  @PermitirNegocioNoOperativo()
  @ApiOperation({ summary: 'Obtiene el perfil del usuario autenticado' })
  @ApiOkResponse({ description: 'Perfil del usuario' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  obtenerPerfil(@UsuarioActual() usuario: PerfilUsuario): PerfilUsuario {
    return this.authServicio.obtenerPerfil(usuario);
  }
}
