# OpenSpec: pasos obligatorios en tasks.md e implementación

Aplica al crear/actualizar `tasks.md` (vía `/opsx:propose`) y al implementar (vía `/opsx:apply`).
Complementa `openspec/config.yaml`.

## 0. Plan técnico previo (OBLIGATORIO, antes de `/opsx:apply`)

Antes de implementar un cambio DEBE existir un **plan técnico a nivel de archivos** generado por el
agente `developer` y guardado en `.claude/doc/<change-name>/developer.md`.

`/opsx:apply` DEBE **leer ese plan** además de los artefactos del cambio antes de tocar código.
Si el plan no existe, créalo primero con el agente `developer`; no empieces a implementar sin él.

## 1. Estructura obligatoria de `tasks.md`

- **Paso 0 (el primero):** crear y cambiar a rama `feature/<change-name>`.
- **TDD** donde tenga sentido: primero tests que fallan, luego implementación.
- Incluye SIEMPRE, además del trabajo funcional, estos pasos marcados `(OBLIGATORIO)`:
  - Revisar/actualizar tests unitarios afectados (Vitest + Testing Library).
  - E2E con Playwright MCP **(EL AGENTE LO EJECUTA, si hay cambios de UI)**.
  - Verificación completa: `npm run lint && npm run test && npm run build`.
  - Actualizar `content/` y `messages/` si cambia contenido o strings de UI.
  - Abrir PR con `gh` (skill `write-pr-report`).

## 2. El agente ejecuta las pruebas — nunca las delega

**CRÍTICO:** el agente (IA) DEBE ejecutar él mismo todas las pruebas. **Nunca** pidas al usuario
que ejecute tests o E2E. Una tarea solo se marca `[x]` tras ejecutar y verificar.

### Verificación de frontend (OBLIGATORIO)

```powershell
npm run lint && npm run test && npm run build
```

Debe pasar sin errores antes de marcar ninguna tarea de implementación como completada.

### E2E con Playwright MCP (OBLIGATORIO si hay cambios de UI — EL AGENTE LO EJECUTA)

1. Arranca el servidor de desarrollo: `npm run dev`.
2. Usa las herramientas Playwright MCP (`browser_navigate`, `browser_click`, `browser_type`,
   `browser_snapshot`...) para recorrer el flujo de usuario completo en ES y EN.
3. Verifica el toggle de tema (claro/oscuro) y el cambio de locale.
4. Verifica que las animaciones cargan sin bloquear el LCP.
5. Documenta los pasos y capturas en el informe del cambio.

### Informe del cambio

Guarda el informe en `openspec/changes/<change-name>/reports/YYYY-MM-DD-verification.md`
(comandos ejecutados, resultados, capturas de E2E si aplica).

## 3. Cierre del cambio

- Actualiza `content/` y `messages/` si el cambio añade/modifica datos o strings.
- Genera la descripción del PR con la skill `write-pr-report` y créalo con `gh pr create`.
- Solo entonces procede `/opsx:archive`.

## 4. Checklist antes de finalizar `tasks.md`

- [ ] Existe el plan técnico previo en `.claude/doc/<change-name>/developer.md` y `apply` lo ha leído.
- [ ] Paso 0 de tasks.md (rama `feature/<change-name>`) es el primero.
- [ ] Todos los pasos `(OBLIGATORIO)` presentes y numerados.
- [ ] Paso E2E marcado "EL AGENTE LO EJECUTA" si hay cambios de UI.
- [ ] Verificación `npm run lint && npm run test && npm run build` incluida.
- [ ] Paso de actualización de `content/` y `messages/` si aplica.
- [ ] Paso de PR (`gh` + `write-pr-report`).

## 5. Ejemplo de estructura

```markdown
## 0. Setup (OBLIGATORIO - PRIMER PASO)
- [ ] 0.1 Crear rama `feature/<change-name>` desde main

## 1. Contenido e i18n
- [ ] 1.1 Añadir/actualizar `content/{es,en}/` con los datos necesarios
- [ ] 1.2 Añadir/actualizar strings en `messages/{es,en}.json`

## 2. Componentes (TDD)
- [ ] 2.1 Tests Vitest para el/los componente/s nuevo/s (que fallan)
- [ ] 2.2 Implementar componentes en `components/sections/` o `components/ui/`
- [ ] 2.3 Integrar animaciones desde `components/animations/`

## 3. Páginas y rutas
- [ ] 3.1 Actualizar/crear páginas en `app/[locale]/`
- [ ] 3.2 `generateStaticParams` si hay rutas dinámicas nuevas

## 4. Verificación (OBLIGATORIO)
- [ ] 4.1 `npm run lint && npm run test && npm run build` en verde

## 5. E2E Playwright MCP (OBLIGATORIO si hay cambios de UI - EL AGENTE LO EJECUTA)
- [ ] 5.1 Flujo completo en ES y EN; toggle de tema; verificación de animaciones

## 6. Cierre (OBLIGATORIO)
- [ ] 6.1 Actualizar content/ y messages/ si aplica
- [ ] 6.2 PR con gh (write-pr-report)
```

**Si implementas sin ejecutar tú mismo las pruebas, estás violando esta regla.**
