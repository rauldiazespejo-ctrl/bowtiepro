# Bowtie Studio Pro — Mejoras estéticas y funcionales

## Implementación completa de 18 mejoras

### [x] Step 1: Shared BowtieMark component
- Created `src/components/BowtieMark.tsx` using `useId()` for unique SVG filter/gradient IDs
- Updated `src/App.tsx` to import from shared component
- Updated `src/pages/LoginPage.tsx` to import from shared component (eliminates duplicate ID conflicts)

### [x] Step 2: New backend endpoints (src/api/diagrams.ts)
- `DELETE /:id` — delete diagram (owner or super only), cascades to diagram_access
- `POST /:id/duplicate` — duplicate diagram with "(copia)" suffix
- `DELETE /:id/access/:userId` — revoke collaborator access

### [x] Step 3: Additional HSE templates (src/lib/template.ts)
- Added `TemplateDefinition` type and `TEMPLATES` array
- 4 templates: Incendio/Explosión, Derrame Químico, Fallo de Equipo Mecánico, Accidente de Tránsito

### [x] Step 4: FlowWorkspace improvements (src/components/FlowWorkspace.tsx)
- `DiagramSkeleton` shimmer animation (replaces plain "Cargando…" text)
- Canvas `animate-fade-in` on load completion
- Insights panel starts closed (`insightsOpen` default `false`)
- Fullscreen toggle button (Maximize2/Minimize2) with `fullscreenchange` listener
- `TemplateMenu` dropdown with all 4 templates (replaces single Plantilla button)
- JSON import schema validation against `VALID_NODE_TYPES`
- `saveSignal` prop — increments trigger immediate `doSave()` call
- Stats panel redesigned: color-coded chip grid instead of text abbreviations

### [x] Step 5: App.tsx overhaul
- `DiagramPicker` custom dropdown: search input, per-row rename/duplicate/delete actions, role badge
- `UserMenu` avatar dropdown: profile info, Colaboradores, Enlace demo, Crear usuario, Cerrar sesión
- Delete diagram with confirmation modal (rose-themed)
- Duplicate diagram via `POST /api/diagrams/:id/duplicate`
- Fixed `Ctrl+S`: increments `saveSignal` → real save (was misleading toast)
- Collaboration modal: shows collaborator list with revoke (X) button, editor/viewer role toggle
- Demo modal: "Generar y copiar" button, auto-clipboard copy, Check icon feedback
- `isReadOnly` derived from `myRole === 'viewer'` → passes `readOnly` to FlowWorkspace
- Header simplified: [Logo+Name] | [DiagramPicker+SavedAt] | [ThemeToggle+UserMenu]

### [x] Step 6: CSS & final polish (src/client.css + src/pages/LoginPage.tsx)
- Added `@keyframes fadeIn` + `.animate-fade-in` for canvas fade-in
- LoginPage updated to use shared BowtieMark (no more duplicate SVG filter IDs)
