export type {
  NegocioPerfil,
  PayloadJwt,
  PerfilUsuario,
  RespuestaLogin,
  RolUsuario,
} from './auth';

export type { ClientePerfil, EstadoCliente, TipoDocumento } from './clientes';

export type { CodigoMoneda, CodigoPlan } from './planes';

export type { CobradorPerfil, EstadoUsuario } from './cobradores';

export type {
  CondicionesOriginalesCredito,
  CreditoCreado,
  CreditoPerfil,
  CuotaPerfil,
  EstadoCredito,
  EstadoCuota,
  PeriodicidadCredito,
} from './creditos';

export type {
  AsignacionPerfil,
  CreditoEnCartera,
  EstadoAsignacion,
} from './asignaciones';

export type {
  CobroDelDia,
  CobrosDelDiaRespuesta,
  EstadoPago,
  MetodoPago,
  PagoPerfil,
  ResumenDiarioPago,
} from './pagos';

export type {
  ItemCartera,
  ResultadoAplicarMora,
  SegmentoCartera,
} from './cartera';

export type { DashboardNegocio } from './dashboard';

export type {
  AuditoriaPlataforma,
  EstadoNegocio,
  EstadoPlan,
  EstadoSuscripcion,
  EventoWebhookSuscripcion,
  NegocioPlataforma,
  PlanPerfil,
  SuscripcionPerfil,
  UsuarioPlataforma,
} from './planes';

/** Respuesta estándar del endpoint de salud de la API. */
export interface RespuestaSaludApi {
  estado: 'ok';
  servicio: 'api';
  version: string;
}
