# CellBody.gd
# Singola cella del calendario come corpo fisico
#
# Ogni cella è un RigidBody2D che:
# - Ha massa proporzionale agli eventi/pagamenti
# - È connessa alle celle adiacenti tramite molle
# - Si deforma visivamente in base alle forze
# - Emette particelle per feedback visivo

extends RigidBody2D

class_name CellBody

# ============================================
# SEGNALI
# ============================================
signal clicked(cell: CellBody)
signal mouse_entered_cell(cell: CellBody)

# ============================================
# PROPRIETÀ
# ============================================
@export var grid_pos: Vector2i = Vector2i.ZERO
@export var base_size: Vector2 = Vector2(120, 100)
@export var base_position: Vector2 = Vector2.ZERO

var events: Array[Dictionary] = []
var is_current_month: bool = true
var is_today: bool = false
var day_number: int = 0

# Visual
var background_color: Color = Color("#15151f")
var border_color: Color = Color("#6366f1")
var glow_intensity: float = 0.0

# Riferimenti nodi figli
@onready var collision_shape: CollisionShape2D = $CollisionShape
@onready var visual: Control = $Visual
@onready var day_label: Label = $Visual/DayLabel
@onready var events_container: VBoxContainer = $Visual/EventsContainer
@onready var glow_effect: ColorRect = $Visual/GlowEffect

# ============================================
# INIZIALIZZAZIONE
# ============================================
func _ready() -> void:
	# Configura collision shape
	var shape := RectangleShape2D.new()
	shape.size = base_size * 0.9
	collision_shape.shape = shape

	# Configura visual
	visual.size = base_size
	visual.position = -base_size / 2

	# Input
	input_pickable = true
	connect("input_event", _on_input_event)
	connect("mouse_entered", _on_mouse_entered)
	connect("mouse_exited", _on_mouse_exited)

func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		clicked.emit(self)
		_on_click_effect()

func _on_mouse_entered() -> void:
	mouse_entered_cell.emit(self)
	_on_hover_enter()

func _on_mouse_exited() -> void:
	_on_hover_exit()

# ============================================
# GESTIONE EVENTI
# ============================================
func set_events(new_events: Array) -> void:
	events.clear()
	for e in new_events:
		events.append(e)
	update_visual()

func set_inactive() -> void:
	is_current_month = false
	background_color = Color("#0a0a0f")
	border_color = Color("#1a1a2a")
	modulate.a = 0.3
	update_visual()

func set_day(day: int, today: bool = false) -> void:
	day_number = day
	is_today = today
	if is_today:
		border_color = Color("#818cf8")
	update_visual()

# ============================================
# VISUAL UPDATE
# ============================================
func update_visual() -> void:
	if not is_inside_tree():
		await ready

	# Numero del giorno
	day_label.text = str(day_number)
	day_label.add_theme_color_override("font_color",
		Color("#818cf8") if is_today else
		Color("#ffffff") if events.size() > 0 else
		Color("#666666")
	)

	# Background basato sulla massa
	var mass_normalized := clampf((mass - 1.0) / 10.0, 0.0, 1.0)

	if events.size() > 0:
		var primary_type: String = events[0].type
		var type_data: Dictionary = SpacetimeCalendar.PAYMENT_TYPES.get(primary_type, {})
		var type_color: Color = type_data.get("color", Color("#6366f1"))

		background_color = type_color.darkened(0.8)
		border_color = type_color
		glow_intensity = mass_normalized
	else:
		background_color = Color("#15151f")
		border_color = Color("#2a2a3a") if not is_today else Color("#6366f1")
		glow_intensity = 0.0

	# Applica colori
	_update_background()
	_update_glow()
	_update_events_display()

func _update_background() -> void:
	# In produzione: usa StyleBoxFlat o shader
	visual.modulate = background_color

func _update_glow() -> void:
	if glow_effect:
		glow_effect.visible = glow_intensity > 0.1
		glow_effect.modulate.a = glow_intensity * 0.5

func _update_events_display() -> void:
	if not events_container:
		return

	# Pulisci eventi esistenti
	for child in events_container.get_children():
		child.queue_free()

	# Mostra max 2 eventi
	var display_count := mini(events.size(), 2)
	for i in range(display_count):
		var event: Dictionary = events[i]
		var type_data: Dictionary = SpacetimeCalendar.PAYMENT_TYPES.get(event.type, {})

		var event_label := Label.new()
		event_label.text = "%s €%s" % [
			type_data.get("icon", "•"),
			_format_amount(event.amount)
		]
		event_label.add_theme_font_size_override("font_size", 10)
		event_label.add_theme_color_override("font_color", type_data.get("color", Color.WHITE))
		events_container.add_child(event_label)

	# Indicatore "altri eventi"
	if events.size() > 2:
		var more_label := Label.new()
		more_label.text = "+%d" % (events.size() - 2)
		more_label.add_theme_font_size_override("font_size", 9)
		more_label.add_theme_color_override("font_color", Color("#666666"))
		events_container.add_child(more_label)

func _format_amount(amount: float) -> String:
	if amount >= 1000:
		return "%dk" % int(amount / 1000)
	return str(int(amount))

# ============================================
# EFFETTI INTERAZIONE
# ============================================
func _on_hover_enter() -> void:
	if not is_current_month:
		return

	# Scala leggermente
	var tween := create_tween()
	tween.tween_property(visual, "scale", Vector2(1.05, 1.05), 0.1)

	# Illumina bordo
	border_color = border_color.lightened(0.3)
	_update_background()

func _on_hover_exit() -> void:
	var tween := create_tween()
	tween.tween_property(visual, "scale", Vector2.ONE, 0.1)

	# Ripristina bordo
	update_visual()

func _on_click_effect() -> void:
	if not is_current_month:
		return

	# Impulso visivo
	var tween := create_tween()
	tween.tween_property(visual, "scale", Vector2(0.95, 0.95), 0.05)
	tween.tween_property(visual, "scale", Vector2(1.0, 1.0), 0.1)

	# Impulso fisico (piccola onda)
	apply_central_impulse(Vector2(0, -100))

# ============================================
# DEFORMAZIONE VISIVA
# ============================================
func _process(_delta: float) -> void:
	# Adatta la dimensione visiva alla deformazione fisica
	# (in un sistema completo, la visual seguirebbe la mesh deformata)
	_update_size_from_neighbors()

func _update_size_from_neighbors() -> void:
	# Calcola dimensione basata sulla distanza dai vicini
	# Questo crea l'effetto di celle che si espandono/comprimono
	var parent := get_parent()
	if parent == null:
		return

	# Trova celle adiacenti
	var neighbors: Array[CellBody] = []
	for child in parent.get_children():
		if child is CellBody and child != self:
			var dist := position.distance_to(child.position)
			if dist < base_size.x * 2:
				neighbors.append(child)

	if neighbors.is_empty():
		return

	# Calcola scala basata sulla distanza media
	var total_dist := 0.0
	for neighbor in neighbors:
		total_dist += position.distance_to(neighbor.position)
	var avg_dist := total_dist / neighbors.size()

	# Se i vicini sono più lontani del normale, questa cella è "espansa"
	var expected_dist := base_size.x
	var scale_factor := clampf(avg_dist / expected_dist, 0.7, 1.5)

	visual.scale = Vector2(scale_factor, scale_factor)
