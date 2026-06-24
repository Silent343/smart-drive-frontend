/**
 * Access status a supervisor account can be in, as managed by the
 * "Gestión de Usuarios" admin view.
 *
 * @remarks
 * - `active`   — account is operational; admin can suspend it
 * - `locked`   — security lockout (e.g., failed login attempts); admin can reset access
 * - `inactive` — soft deletion / "baja lógica"; history preserved, no actions allowed
 */
export type AccessStatus = 'active' | 'locked' | 'inactive';
