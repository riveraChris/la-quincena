# La Quincena — MVP Document
> Aplicación PWA de finanzas familiares quincenales  
> Stack: SvelteKit + Supabase + Web Push Notifications

---

## 1. Contexto del Proyecto

**La Quincena** es una PWA personal construida para reemplazar un Excel familiar que Christian y Aracelis han usado por años para manejar sus finanzas. El objetivo NO es construir otra app de finanzas genérica — es digitalizar y mejorar su flujo actual, respetando los hábitos que ya tienen.

### Usuarios
- **Christian** (owner, developer) — salario quincenal fijo + bonos trimestrales (~$800 cada 3 meses: marzo, junio, sep, dic) + bonos esporádicos
- **Aracelis** — salario quincenal fijo + bonos esporádicos (navidad, planillas, etc.)
- Ambos usuarios comparten una sola "familia" en la app con sincronización en tiempo real

### Concepto central
El presupuesto se organiza en **quincenas** (Q1 = días 1-15, Q2 = días 16-fin de mes). Cada mes tiene dos quincenas independientes, cada una con sus propios ingresos, gastos y sobrante.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | SvelteKit (TypeScript) |
| PWA | vite-plugin-pwa |
| Backend / DB | Supabase (Auth + PostgreSQL + Realtime) |
| Notificaciones | Web Push API + Service Worker |
| Deploy | Vercel |
| Estilos | Tailwind CSS |

---

## 3. Identidad Visual

- **Nombre:** La Quincena
- **Color primario:** `#3d7a4e` (verde esmeralda)
- **Color texto dark:** `#1a2e1a`
- **Subtítulo:** FINANZAS FAMILIARES
- **Logo:** Ícono de reloj con manecillas que forman una Q + badge "15" en la esquina superior derecha
- **Assets disponibles en `/static/`:**
  - `LaQuincena-16.png`
  - `LaQuincena-32.png`
  - `LaQuincena-180.png` (Apple touch icon)
  - `LaQuincena-192.png` (PWA manifest)
  - `LaQuincena-512.png` (PWA manifest)

---

## 4. Modelo de Datos (Supabase)

### 4.1 Tablas Principales

```sql
-- Familia (unidad central compartida)
families
  id            uuid PK
  name          text
  created_at    timestamptz

-- Miembros de la familia (vincula auth.users con family)
family_members
  id            uuid PK
  family_id     uuid FK → families
  user_id       uuid FK → auth.users
  display_name  text          -- "Christian" | "Aracelis"
  role          text          -- 'owner' | 'member'
  color         text          -- color identificador en UI
  created_at    timestamptz

-- Quincena (unidad de presupuesto)
budgets
  id            uuid PK
  family_id     uuid FK → families
  year          int
  month         int           -- 1-12
  period        int           -- 1 | 2 (Q1 | Q2)
  created_at    timestamptz
  UNIQUE(family_id, year, month, period)

-- Ingresos de la quincena
incomes
  id            uuid PK
  budget_id     uuid FK → budgets
  member_id     uuid FK → family_members
  amount        numeric
  type          text          -- 'salary' | 'bonus'
  label         text          -- ej: "Bono trimestral", "Reintegro planilla"
  created_at    timestamptz

-- Gastos / pagos de la quincena
expense_items
  id            uuid PK
  budget_id     uuid FK → budgets
  name          text
  amount        numeric       -- siempre negativo
  category      text          -- 'fixed' | 'operational_card' | 'installment'
  debt_id       uuid FK → debts (nullable) -- si está ligado a una deuda
  is_paid       boolean       DEFAULT false
  paid_at       timestamptz
  paid_by       uuid FK → family_members (nullable)
  notes         text
  created_at    timestamptz

-- Deudas activas
debts
  id            uuid PK
  family_id     uuid FK → families
  name          text          -- "Capitol One", "AMEX Delta", "BestBuy Mami"
  type          text          -- 'fixed' | 'operational' | 'installment_no_interest'
  current_balance   numeric
  our_minimum_payment numeric -- el mínimo que ELLOS establecieron (no el del banco)
  interest_free_deadline date  -- nullable, solo para installment_no_interest
  is_auto_recalculate boolean  DEFAULT true
  status        text          -- 'active' | 'paid_off'
  notes         text
  created_at    timestamptz

-- Historial de pagos a deudas
debt_payments
  id            uuid PK
  debt_id       uuid FK → debts
  budget_id     uuid FK → budgets
  amount        numeric
  new_balance   numeric       -- balance después del pago
  paid_at       timestamptz

-- Reglas de distribución por persona (los porcientos)
allocation_rules
  id            uuid PK
  member_id     uuid FK → family_members
  debts_pct     numeric       -- ej: 0.23 (23%)
  expenses_pct  numeric       -- ej: 0.62 (62%)
  savings_pct   numeric       -- ej: 0.15 (15%)
  updated_at    timestamptz

-- Ahorros por quincena
savings
  id            uuid PK
  budget_id     uuid FK → budgets
  amount        numeric
  label         text          -- opcional

-- Subscripciones push (Web Push API)
push_subscriptions
  id            uuid PK
  member_id     uuid FK → family_members
  subscription  jsonb         -- objeto PushSubscription serializado
  created_at    timestamptz
```

### 4.2 Valores de referencia (datos reales del Excel)

```
-- Salarios base (se configuran en app, no hardcodeados)
Christian: $2,106 / quincena  (Q1)
           $2,816.25 / quincena (Q2 — incluye bono trimestral)
Aracelis:  $2,652.36 / quincena

-- Porcientos de distribución
Christian:  Deudas 23% | Gastos 62% | Ahorros 15%
Aracelis:   Deudas 53% | Gastos 32% | Ahorros 15%

-- Ahorros fijos
$400 / quincena (familia)
```

### 4.3 Los 3 tipos de gasto/deuda

#### Tipo 1 — Gastos Fijos / Utilidades (`category: 'fixed'`)
Montos relativamente estables cada quincena. No tienen balance acumulado ni fecha de liquidación. Solo se marcan como pagados con checkbox.

**Ejemplos actuales:** Casa ($850), Sunrun ($221), Luma ($60-$86), Mantenimiento ($140), Celular ($146), Agua ($29), Pickup ($398), Internet ($75), Plan Médico ($103), Cuido ($655)

#### Tipo 2 — Tarjeta Operacional (`category: 'operational_card'`, `debt.type: 'operational'`)
Tarjetas usadas como "débito de facto" para gastos diarios (gas, comida, etc.). Tienen DOS capas:
- **Capa A:** Gasto del período actual → se registra como expense_item, se paga completo cada quincena
- **Capa B:** Balance arrastrado histórico → tiene su propio `our_minimum_payment` en la tabla `debts`

El usuario registra UN SOLO MONTO en la quincena. La app muestra un hint: *"$X de estos van al balance arrastrado"*.

**Ejemplos actuales:** AMEX Delta (principal), Apple Card (ocasional)

#### Tipo 3 — Deuda a Plazos sin Intereses (`debt.type: 'installment_no_interest'`)
Compras grandes con X meses sin intereses. Tienen fecha límite real (`interest_free_deadline`).

**Lógica de recálculo automático:**
- `our_minimum_payment = current_balance / meses_hasta_deadline`
- Si el pago registrado > mínimo → app sugiere recalcular
- Banner: *"Pagaste $X extra. Nuevo mínimo: $Y/quinc. ¿Actualizar?"* → [Sí] [No]

**Ejemplos actuales:**
- Capitol One: $6,220 | $390/quinc | Noviembre 2026
- BestBuy Mami: $887 | $90/mes | Enero 2027
- Home Depot: $300 | vence marzo 2026
- Apple Card (balance separado del operacional): $2,100 | vence abril 2026

---

## 5. Estructura del Proyecto SvelteKit

```
la-quincena/
├── static/
│   ├── LaQuincena-16.png
│   ├── LaQuincena-32.png
│   ├── LaQuincena-180.png
│   ├── LaQuincena-192.png
│   ├── LaQuincena-512.png
│   └── manifest.json
├── src/
│   ├── app.html
│   ├── app.css                    -- variables CSS, tema verde
│   ├── service-worker.ts          -- Web Push + cache strategy
│   ├── lib/
│   │   ├── supabase.ts            -- cliente Supabase (SSR-safe)
│   │   ├── types/
│   │   │   └── database.ts        -- tipos generados de Supabase
│   │   ├── stores/
│   │   │   ├── auth.ts            -- usuario, familia, miembro activo
│   │   │   ├── budget.ts          -- quincena activa + Realtime
│   │   │   └── debts.ts           -- deudas con estado reactivo
│   │   ├── utils/
│   │   │   ├── calculations.ts    -- sobrante, porcientos, recálculo deuda
│   │   │   └── notifications.ts   -- helpers de push notifications
│   │   └── components/
│   │       ├── layout/
│   │       │   ├── BottomNav.svelte
│   │       │   └── TopBar.svelte
│   │       ├── budget/
│   │       │   ├── IncomeRow.svelte
│   │       │   ├── ExpenseRow.svelte      -- con checkbox is_paid
│   │       │   ├── SavingsRow.svelte
│   │       │   ├── SobrasteCard.svelte
│   │       │   └── AllocationChart.svelte -- barras porcientos por persona
│   │       └── debts/
│   │           ├── DebtCard.svelte         -- con progress bar
│   │           ├── DebtRecalcBanner.svelte -- banner recálculo automático
│   │           └── DebtBadge.svelte        -- badge fecha vencimiento
│   └── routes/
│       ├── +layout.svelte         -- auth guard, bottom nav
│       ├── +layout.ts             -- load session
│       ├── (auth)/
│       │   ├── login/+page.svelte
│       │   └── register/+page.svelte
│       └── (app)/
│           ├── +layout.svelte     -- shell con nav
│           ├── +page.svelte       -- Dashboard
│           ├── quincena/
│           │   └── [year]/[month]/[period]/+page.svelte
│           ├── deudas/
│           │   └── +page.svelte
│           └── config/
│               └── +page.svelte
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── vite.config.ts
└── package.json
```

---

## 6. Screens del MVP

### Screen 1 — Dashboard (`/`)
- Header: nombre del usuario + mes/quincena actual
- Cards: Total Budget | Sobrante | Deuda Total Activa
- Sección Alertas: deudas urgentes (rojo = este mes, amarillo = 30 días)
- Preview rápido de deudas con barra de progreso
- Bottom nav: Inicio | Quincena | Deudas | Config

### Screen 2 — Vista Quincena (`/quincena/[year]/[month]/[period]`)
- Header con toggle Q1 ↔ Q2
- Sección INGRESOS (fondo verde): salary + bonos por persona
- Sección GASTOS: lista con checkbox `is_paid` (el `*` del Excel digitalizado)
  - Tag visual "Deuda" en items vinculados a una deuda
  - Botón "+ Agregar gasto"
- Sección AHORROS (fondo amarillo)
- Card SOBRANTE destacado (fondo verde oscuro)
- Sección SEPARACIÓN DE PORCIENTOS: barras por persona (Deudas / Gastos / Ahorros)

### Screen 3 — Deudas (`/deudas`)
- Tabs: A Plazos | Operacional | Fijos
- Cada deuda como card con:
  - Header con color por urgencia (rojo = vence pronto, morado = largo plazo, verde = saludable)
  - Balance actual + `our_minimum_payment`
  - Barra de progreso (% pagado del balance original)
  - Badge con fecha de vencimiento + meses restantes
- Banner amarillo de recálculo automático al pagar extra
- Botón "+ Nueva deuda"

### Screen 4 — Notificaciones (sistema push)
- Rojo `!!`: deuda vence este mes
- Amarillo `!`: deuda vence en 30 días
- Verde `OK`: sincronización ("Aracelis marcó Pickup como pagado")
- Azul `Q`: recordatorio de quincena sin actividad (3+ días)

---

## 7. Sincronización en Tiempo Real (Supabase Realtime)

Subscriptions activas en:
- `expense_items` → cuando uno marca `is_paid`, el otro lo ve al instante
- `debts` → actualización de `current_balance` o `our_minimum_payment`
- `budgets` → creación de nueva quincena

```typescript
supabase
  .channel('family-expenses')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'expense_items',
    filter: `budget_id=eq.${budgetId}`
  }, (payload) => {
    // Actualizar store local reactivamente
  })
  .subscribe()
```

---

## 8. Web Push Notifications

### Setup
1. Generar VAPID keys: `npx web-push generate-vapid-keys`
2. Guardar `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` como secrets en Supabase
3. Service Worker registra la subscription y la persiste en `push_subscriptions`

### Triggers de notificación
| Evento | Timing | Tipo |
|--------|--------|------|
| Deuda vence este mes | Día 1 del mes | Rojo urgente |
| Deuda vence en 30 días | 30 días antes | Amarillo aviso |
| Quincena sin actividad | 3 días sin login | Azul recordatorio |
| Deuda liquidada 🎉 | Al llegar a $0 | Verde celebración |
| Gasto marcado pagado por otro usuario | Inmediato (Realtime) | Verde sync |

### Edge Function para envío
```
supabase/functions/send-notification/index.ts
```
Se invoca desde cron job diario (revisar deudas próximas) y desde triggers de DB (sync en tiempo real).

---

## 9. Manifest PWA

```json
{
  "name": "La Quincena",
  "short_name": "La Quincena",
  "description": "Finanzas familiares quincenales",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#3d7a4e",
  "background_color": "#3d7a4e",
  "icons": [
    { "src": "/LaQuincena-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/LaQuincena-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

---

## 10. Plan de Implementación

### Step 1 — Supabase Setup
- [ ] Crear proyecto en Supabase
- [ ] Ejecutar migración `001_initial_schema.sql`
- [ ] Configurar Row Level Security (RLS) en todas las tablas
- [ ] Generar tipos TypeScript: `supabase gen types typescript --local > src/lib/types/database.ts`
- [ ] Seed de datos iniciales (familia, 2 miembros, deudas actuales, porcientos)

### Step 2 — SvelteKit Base
- [ ] `npm create svelte@latest la-quincena` (TypeScript + ESLint + Prettier)
- [ ] Instalar dependencias: `@supabase/supabase-js @supabase/ssr tailwindcss vite-plugin-pwa`
- [ ] Configurar `vite.config.ts` con PWA plugin
- [ ] Configurar Supabase client SSR-safe en `src/lib/supabase.ts`
- [ ] Copiar logo assets a `/static/`
- [ ] Crear `static/manifest.json`
- [ ] Configurar variables de entorno (`.env`)

### Step 3 — Auth Flow
- [ ] Página login (email + password con Supabase Auth)
- [ ] Página registro (crea usuario + familia + family_member)
- [ ] Flujo invitación: Christian invita a Aracelis → email → se une a familia existente
- [ ] Auth guard en `+layout.ts`
- [ ] Store de auth reactivo

### Step 4 — Vista Quincena (CORE)
- [ ] Store de budget con Supabase Realtime
- [ ] CRUD ingresos (salario + bonos por persona)
- [ ] CRUD gastos con checkbox `is_paid` (con timestamp y quién pagó)
- [ ] Cálculo automático de sobrante
- [ ] Separación de porcientos por persona con barras visuales
- [ ] Toggle Q1 ↔ Q2
- [ ] Auto-creación de quincena si no existe al navegar a ella

### Step 5 — Módulo de Deudas
- [ ] CRUD deudas (los 3 tipos con sus campos específicos)
- [ ] Barras de progreso con color por urgencia
- [ ] Lógica recálculo automático de mínimo (Tipo 3)
- [ ] Banner de sugerencia de recálculo al registrar pago extra
- [ ] Vinculación expense_item → debt

### Step 6 — Notificaciones Push
- [ ] Generar VAPID keys y configurar en Supabase secrets
- [ ] Service Worker con push event handler
- [ ] Registro y persistencia de PushSubscription
- [ ] Edge Function `send-notification`
- [ ] Cron job diario en Supabase para revisar deudas próximas
- [ ] Trigger en tiempo real para notificación de pagos entre usuarios

---

## 11. Row Level Security (RLS)

Política base — el usuario solo accede a datos de su propia familia:

```sql
-- Ejemplo para expense_items (replicar para todas las tablas)
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_access" ON expense_items
  FOR ALL USING (
    budget_id IN (
      SELECT id FROM budgets WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );
```

Aplicar a: `budgets`, `incomes`, `expense_items`, `debts`, `debt_payments`, `savings`, `allocation_rules`, `push_subscriptions`.

---

## 12. Variables de Entorno

```bash
# .env (nunca commitear al repo)
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxxx

# Solo en Edge Functions / servidor, nunca exponer al cliente
SUPABASE_SERVICE_ROLE_KEY=xxxx
PRIVATE_VAPID_KEY=xxxx

# Pública (safe para cliente)
PUBLIC_VAPID_KEY=xxxx
```

---

## 13. Notas Importantes

1. **Preguntar antes de cambios estructurales** al schema o flujo de datos
2. **Respetar el modelo mental del Excel:** Q1 y Q2 son la unidad central, no el mes
3. **Los montos de gastos son negativos en la DB**, positivos en la UI
4. **`our_minimum_payment` es el mínimo de ellos**, nunca el mínimo del banco
5. **Sobrante:** `sum(incomes) + sum(expenses) + sum(savings)` — expenses y savings son negativos
6. **Bonos son flexibles:** pueden ser recurrentes (trimestrales Christian) o esporádicos; siempre como `income` separado del salario base
7. **Un `expense_item` puede vincularse a una deuda** via `debt_id` nullable — permite trackear qué pago quincenal corresponde a qué deuda
8. **AMEX operacional tiene dual tracking:** el expense_item en la quincena (gasto del período) + el debt para el balance arrastrado histórico. El usuario registra un solo monto; la app hace la separación visualmente
