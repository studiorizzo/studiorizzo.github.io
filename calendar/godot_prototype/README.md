# Prototipo Godot - Calendario Gravitazionale

## Struttura Scene

```
SpacetimeCalendar (Control)
├── Background (ColorRect)
├── CellContainer (Node2D)
│   └── CellBody x 42 (RigidBody2D)
│       ├── CollisionShape2D
│       └── Visual (Control)
│           ├── Background (ColorRect)
│           ├── DayLabel (Label)
│           ├── EventsContainer (VBoxContainer)
│           └── GlowEffect (ColorRect + Shader)
├── SpringContainer (Node2D)
│   └── SpringJoint2D x ~77 (connessioni tra celle)
├── ParticleContainer (Node2D)
│   └── GPUParticles2D (spawn dinamico)
└── UILayer (CanvasLayer)
    ├── Header
    ├── Stats
    └── Modal
```

## Come Funziona

### 1. Fisica Reale
Ogni cella è un `RigidBody2D` con:
- **Massa** proporzionale agli eventi/pagamenti
- **Smorzamento lineare** per evitare oscillazioni infinite
- **Nessuna gravità verticale** (gravity_scale = 0)

### 2. Molle Elastiche
Le celle sono connesse da `SpringJoint2D`:
- **Orizzontali**: tra celle adiacenti nella stessa riga
- **Verticali**: tra celle adiacenti nella stessa colonna
- **Rigidezza**: determina quanto resistono alla deformazione
- **Smorzamento**: quanto velocemente tornano a riposo

### 3. Attrazione Gravitazionale Custom
In `_physics_process()`:
```gdscript
# Celle massive attraggono le altre
var force_magnitude := (cell_b.mass * 100.0) / (distance * distance)
cell_a.apply_central_force(direction.normalized() * force_magnitude)
```

Questo crea l'effetto "curvatura spazio-temporale" dove:
- Celle con molti pagamenti "attraggono" spazio
- Celle vicine si avvicinano (comprimendosi visivamente)
- Celle lontane restano meno influenzate

### 4. Ancora Elastica
Ogni cella ha una forza che la riporta verso la posizione base:
```gdscript
var anchor_force := (base_position - position) * 50.0
cell.apply_central_force(anchor_force)
```

Questo impedisce che la griglia "esploda" o collassi.

## Differenze da Canvas

| Aspetto | Canvas (JS) | Godot |
|---------|-------------|-------|
| Fisica | Simulata (geometria) | Reale (RigidBody2D) |
| Molle | Interpolazione lineare | SpringJoint2D |
| Collisioni | Hit test manuale | CollisionShape2D |
| Particelle | Disegno manuale | GPUParticles2D |
| Shader | Non disponibile | Shader language |
| Performance | 60fps con ottimizzazione | 60fps nativo |

## Effetti Possibili con Godot

1. **Particelle al click**: burst di particelle colorate
2. **Onde di shock**: quando aggiungi un pagamento grosso
3. **Pulsazione**: celle massive che "respirano"
4. **Distorsione shader**: curvatura visiva del background
5. **Suoni**: feedback audio per interazioni
6. **Vibrazione**: su mobile (haptic feedback)

## Come Testare

1. Installa Godot 4.x
2. Crea nuovo progetto
3. Copia i file .gd
4. Crea la struttura scene come sopra
5. Esegui

## Export Web

```bash
# Godot può esportare in HTML5/WebAssembly
# File risultante: ~8-15MB
```

## Integrazione con React

Opzione 1: **iframe**
```jsx
<iframe src="/godot-calendar/index.html" />
```

Opzione 2: **Comunicazione postMessage**
```javascript
// React → Godot
iframe.contentWindow.postMessage({ type: 'ADD_EVENT', data: {...} }, '*')

// Godot → React (in GDScript)
JavaScriptBridge.eval("window.parent.postMessage({type: 'CELL_CLICKED', cell: %d}, '*')" % cell_index)
```
