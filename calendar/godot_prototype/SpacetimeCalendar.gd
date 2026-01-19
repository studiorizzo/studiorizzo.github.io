# SpacetimeCalendar.gd
# GODOT 4.x - Calendario Gravitazionale con Fisica Reale
#
# Differenze chiave rispetto a Canvas:
# - RigidBody2D per ogni cella (fisica reale)
# - SpringJoint2D tra celle adiacenti (connessioni elastiche)
# - Massa reale influenza il movimento
# - Particelle native per effetti visivi
# - Shader per distorsione spazio-temporale

extends Control

class_name SpacetimeCalendar

# ============================================
# CONFIGURAZIONE
# ============================================
const COLS := 7
const ROWS := 6
const CELL_BASE_SIZE := Vector2(120, 100)
const SPRING_STIFFNESS := 150.0
const SPRING_DAMPING := 10.0
const MASS_MULTIPLIER := 0.01

# Tipi di pagamento
const PAYMENT_TYPES := {
	"mutui": { "label": "Mutui", "icon": "🏠", "color": Color("#e53935"), "multiplier": 1.20 },
	"riscossione": { "label": "Riscossione", "icon": "⚠️", "color": Color("#ff7043"), "multiplier": 1.15 },
	"stipendi": { "label": "Stipendi", "icon": "💼", "color": Color("#fdd835"), "multiplier": 1.10 },
	"imposte": { "label": "Imposte", "icon": "🏛️", "color": Color("#66bb6a"), "multiplier": 1.05 },
	"altro": { "label": "Altro", "icon": "📌", "color": Color("#42a5f5"), "multiplier": 1.0 },
}

# ============================================
# NODI E STATO
# ============================================
var cells: Array[CellBody] = []
var springs: Array[SpringJoint2D] = []
var current_date: Dictionary
var events: Array[Dictionary] = []

# Riferimenti scene
@onready var cell_container: Node2D = $CellContainer
@onready var spring_container: Node2D = $SpringContainer
@onready var particle_container: Node2D = $ParticleContainer
@onready var ui_layer: CanvasLayer = $UILayer

# ============================================
# INIZIALIZZAZIONE
# ============================================
func _ready() -> void:
	current_date = Time.get_date_dict_from_system()
	_create_grid()
	_create_springs()
	_add_demo_events()

func _create_grid() -> void:
	var start_pos := Vector2(100, 150)

	for row in range(ROWS):
		for col in range(COLS):
			var cell := CellBody.new()
			cell.position = start_pos + Vector2(col * CELL_BASE_SIZE.x, row * CELL_BASE_SIZE.y)
			cell.base_position = cell.position
			cell.grid_pos = Vector2i(col, row)
			cell.base_size = CELL_BASE_SIZE

			# Configurazione fisica
			cell.mass = 1.0  # Massa base
			cell.gravity_scale = 0  # No gravità verso il basso
			cell.linear_damp = 5.0  # Smorzamento movimento

			cell_container.add_child(cell)
			cells.append(cell)

			# Segnali
			cell.clicked.connect(_on_cell_clicked)
			cell.mouse_entered.connect(_on_cell_hover.bind(cell))

func _create_springs() -> void:
	# Crea molle tra celle adiacenti
	for row in range(ROWS):
		for col in range(COLS):
			var idx := row * COLS + col
			var cell := cells[idx]

			# Molla verso destra
			if col < COLS - 1:
				var right_cell := cells[idx + 1]
				var spring := _create_spring(cell, right_cell, CELL_BASE_SIZE.x)
				springs.append(spring)

			# Molla verso il basso
			if row < ROWS - 1:
				var bottom_cell := cells[idx + COLS]
				var spring := _create_spring(cell, bottom_cell, CELL_BASE_SIZE.y)
				springs.append(spring)

func _create_spring(cell_a: CellBody, cell_b: CellBody, rest_length: float) -> SpringJoint2D:
	var spring := SpringJoint2D.new()
	spring.node_a = cell_a.get_path()
	spring.node_b = cell_b.get_path()
	spring.rest_length = rest_length
	spring.stiffness = SPRING_STIFFNESS
	spring.damping = SPRING_DAMPING
	spring_container.add_child(spring)
	return spring

# ============================================
# GESTIONE EVENTI/PAGAMENTI
# ============================================
func add_event(date: Dictionary, type: String, amount: float, description: String = "") -> void:
	var event := {
		"date": date,
		"type": type,
		"amount": amount,
		"description": description
	}
	events.append(event)
	_update_cell_masses()
	_spawn_add_particles(date)

func _update_cell_masses() -> void:
	# Raggruppa eventi per data
	var events_by_date := {}
	for event in events:
		var key := _date_to_string(event.date)
		if not events_by_date.has(key):
			events_by_date[key] = []
		events_by_date[key].append(event)

	# Calcola massa per ogni cella
	var calendar_days := _get_calendar_days()

	for i in range(cells.size()):
		var cell := cells[i]
		var day_data: Dictionary = calendar_days[i]

		if not day_data.is_current_month:
			cell.mass = 0.5  # Celle fuori mese: massa ridotta
			cell.set_inactive()
			continue

		var day_events: Array = events_by_date.get(_date_to_string(day_data.date), [])
		var calculated_mass := _calculate_mass(day_events)

		# Massa minima per celle vuote
		var final_mass := maxf(calculated_mass, 1.0)

		# Applica massa al RigidBody
		cell.mass = final_mass
		cell.set_events(day_events)
		cell.update_visual()

func _calculate_mass(day_events: Array) -> float:
	if day_events.is_empty():
		return 1.0

	var total := 0.0
	for event in day_events:
		var type_data: Dictionary = PAYMENT_TYPES.get(event.type, PAYMENT_TYPES.altro)
		var multiplier: float = type_data.multiplier
		total += log(event.amount + 1) / log(10) * multiplier * 100

	return total * MASS_MULTIPLIER + 1.0  # +1 per massa base

# ============================================
# FISICA GRAVITAZIONALE CUSTOM
# ============================================
func _physics_process(delta: float) -> void:
	# Applica forze gravitazionali tra celle
	for i in range(cells.size()):
		var cell_a := cells[i]
		if cell_a.mass <= 0.5:
			continue

		# Forza verso posizione base (ancora elastica)
		var to_base := cell_a.base_position - cell_a.position
		var anchor_force := to_base * 50.0  # Forza di ancoraggio
		cell_a.apply_central_force(anchor_force)

		# Attrazione/repulsione da celle massive
		for j in range(cells.size()):
			if i == j:
				continue

			var cell_b := cells[j]
			var direction := cell_b.position - cell_a.position
			var distance := direction.length()

			if distance < 10:
				continue

			# Celle massive attraggono spazio (le celle vicine si avvicinano)
			# Questo crea l'effetto di "curvatura spazio-temporale"
			var force_magnitude := (cell_b.mass * 100.0) / (distance * distance)
			var force := direction.normalized() * force_magnitude

			cell_a.apply_central_force(force)

# ============================================
# EFFETTI PARTICELLE
# ============================================
func _spawn_add_particles(date: Dictionary) -> void:
	var cell := _get_cell_for_date(date)
	if cell == null:
		return

	var particles := GPUParticles2D.new()
	particles.position = cell.position
	particles.amount = 30
	particles.lifetime = 1.0
	particles.one_shot = true
	particles.emitting = true

	# Configurazione particelle (in produzione: usa ParticleProcessMaterial)
	var material := ParticleProcessMaterial.new()
	material.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
	material.emission_sphere_radius = 20.0
	material.direction = Vector3(0, -1, 0)
	material.spread = 180.0
	material.initial_velocity_min = 50.0
	material.initial_velocity_max = 100.0
	material.gravity = Vector3(0, 100, 0)
	material.scale_min = 2.0
	material.scale_max = 5.0

	var type_data: Dictionary = PAYMENT_TYPES.get(events[-1].type, PAYMENT_TYPES.altro)
	material.color = type_data.color

	particles.process_material = material
	particle_container.add_child(particles)

	# Auto-rimozione
	await get_tree().create_timer(2.0).timeout
	particles.queue_free()

# ============================================
# SHADER DISTORSIONE (da applicare al background)
# ============================================
# Questo shader crea un effetto di curvatura visiva attorno alle celle massive
const DISTORTION_SHADER := """
shader_type canvas_item;

uniform sampler2D screen_texture : hint_screen_texture;
uniform vec2 mass_positions[42];  // Max 42 celle
uniform float mass_values[42];
uniform int active_masses;

void fragment() {
	vec2 uv = SCREEN_UV;
	vec2 distortion = vec2(0.0);

	for (int i = 0; i < active_masses; i++) {
		vec2 to_mass = mass_positions[i] - uv;
		float dist = length(to_mass);
		float strength = mass_values[i] * 0.001 / (dist * dist + 0.01);
		distortion += normalize(to_mass) * strength;
	}

	vec4 color = texture(screen_texture, uv + distortion);
	COLOR = color;
}
"""

# ============================================
# UTILITÀ
# ============================================
func _get_calendar_days() -> Array[Dictionary]:
	var days: Array[Dictionary] = []
	var year := current_date.year
	var month := current_date.month

	var first_day := Time.get_unix_time_from_datetime_dict({
		"year": year, "month": month, "day": 1,
		"hour": 0, "minute": 0, "second": 0
	})

	var first_weekday := Time.get_date_dict_from_unix_time(first_day).weekday
	# Converti da domenica=0 a lunedì=0
	first_weekday = (first_weekday + 6) % 7

	var days_in_month := _get_days_in_month(year, month)
	var days_in_prev_month := _get_days_in_month(year, month - 1 if month > 1 else 12)

	# Giorni mese precedente
	for i in range(first_weekday - 1, -1, -1):
		days.append({
			"day": days_in_prev_month - i,
			"is_current_month": false,
			"date": {"year": year, "month": month - 1 if month > 1 else 12, "day": days_in_prev_month - i}
		})

	# Giorni mese corrente
	var today := Time.get_date_dict_from_system()
	for d in range(1, days_in_month + 1):
		days.append({
			"day": d,
			"is_current_month": true,
			"is_today": d == today.day and month == today.month and year == today.year,
			"date": {"year": year, "month": month, "day": d}
		})

	# Giorni mese successivo
	var remaining := 42 - days.size()
	for d in range(1, remaining + 1):
		days.append({
			"day": d,
			"is_current_month": false,
			"date": {"year": year, "month": month + 1 if month < 12 else 1, "day": d}
		})

	return days

func _get_days_in_month(year: int, month: int) -> int:
	if month in [4, 6, 9, 11]:
		return 30
	elif month == 2:
		if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0):
			return 29
		return 28
	return 31

func _date_to_string(date: Dictionary) -> String:
	return "%d-%02d-%02d" % [date.year, date.month, date.day]

func _get_cell_for_date(date: Dictionary) -> CellBody:
	var calendar_days := _get_calendar_days()
	for i in range(calendar_days.size()):
		var day_data: Dictionary = calendar_days[i]
		if day_data.date.year == date.year and day_data.date.month == date.month and day_data.date.day == date.day:
			return cells[i]
	return null

# ============================================
# EVENTI UI
# ============================================
func _on_cell_clicked(cell: CellBody) -> void:
	# Apri modal per aggiungere evento
	print("Cella cliccata: ", cell.grid_pos)
	# In produzione: emit signal per UI

func _on_cell_hover(cell: CellBody) -> void:
	# Effetto hover - piccolo impulso
	cell.apply_central_impulse(Vector2(0, -50))

func _add_demo_events() -> void:
	var today := Time.get_date_dict_from_system()

	add_event({"year": today.year, "month": today.month, "day": 16}, "imposte", 45000, "IVA trimestrale")
	add_event({"year": today.year, "month": today.month, "day": 16}, "imposte", 12000, "IRES acconto")
	add_event({"year": today.year, "month": today.month, "day": 27}, "stipendi", 25000, "Dipendenti")
	add_event({"year": today.year, "month": today.month, "day": 28}, "mutui", 3200, "Rata mutuo")
	add_event({"year": today.year, "month": today.month, "day": 10}, "altro", 450, "Utenze")
