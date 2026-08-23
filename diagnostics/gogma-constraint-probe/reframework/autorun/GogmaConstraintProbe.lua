-- Gogma Constraint Probe
-- Read-only REFramework diagnostic for Artian/Gogma lottery research.

local MOD_NAME = "Gogma Constraint Probe"
local VERSION = "0.1.0"
local OUTPUT_DIRECTORY = "reframework/data/Gogma Seed Finder"
local OUTPUT_PATH = "Gogma Seed Finder/GogmaConstraintProbe.json"
local AUTO_EXPORT_DELAY_FRAMES = 180

local REQUIRED_BONUS_FIELDS = {
    "_Probability",
    "_SubProbability",
    "_GrindingMaxNum",
    "_Em0078_GrindingMaxNum",
}

local state = {
    frames = 0,
    automatic_export_attempted = false,
    status = "Waiting for the game type database...",
    last_error = nil,
    last_bonus_count = nil,
}

local function safe_call(callback)
    local ok, value = pcall(callback)
    if ok then
        return value, nil
    end
    return nil, tostring(value)
end

local function type_full_name(type_definition)
    if type_definition == nil then
        return nil
    end
    local name = safe_call(function()
        return type_definition:get_full_name()
    end)
    return name ~= nil and tostring(name) or nil
end

local function value_as_number(value)
    if value == nil then
        return nil
    end
    local direct = tonumber(value)
    if direct ~= nil then
        return direct
    end
    local converted = safe_call(function()
        return tonumber(sdk.to_int64(value))
    end)
    return converted
end

local function json_scalar(value)
    if value == nil then
        return nil
    end
    local value_type = type(value)
    if value_type == "boolean" or value_type == "number" or value_type == "string" then
        return value
    end
    local numeric = value_as_number(value)
    if numeric ~= nil then
        return numeric
    end
    return tostring(value)
end

local function read_static_field(field)
    local value, err = safe_call(function()
        return field:get_data(nil)
    end)
    if err == nil then
        return value, nil
    end
    return safe_call(function()
        return field:get_data()
    end)
end

local function enum_members(type_name)
    local type_definition = sdk.find_type_definition(type_name)
    if type_definition == nil then
        return nil, "Type not found: " .. type_name
    end

    local fields, fields_error = safe_call(function()
        return type_definition:get_fields()
    end)
    if fields == nil then
        return nil, "Could not enumerate " .. type_name .. ": " .. tostring(fields_error)
    end

    local members = {}
    for _, field in ipairs(fields) do
        local is_static = safe_call(function()
            return field:is_static()
        end)
        if is_static then
            local name = safe_call(function()
                return field:get_name()
            end)
            local raw_value, value_error = read_static_field(field)
            local value = value_as_number(raw_value)
            if name ~= nil and value ~= nil then
                table.insert(members, {
                    name = tostring(name),
                    value = value,
                })
            elseif name ~= nil then
                table.insert(members, {
                    name = tostring(name),
                    valueError = tostring(value_error or "value was not numeric"),
                })
            end
        end
    end

    table.sort(members, function(left, right)
        if left.value == right.value then
            return left.name < right.name
        end
        if left.value == nil then
            return false
        end
        if right.value == nil then
            return true
        end
        return left.value < right.value
    end)
    return members, nil
end

local function enum_by_name(members)
    local result = {}
    for _, member in ipairs(members or {}) do
        if member.value ~= nil then
            result[member.name] = member.value
        end
    end
    return result
end

local function field_metadata(object, field, declaring_type)
    local entry = {
        declaringType = declaring_type,
    }
    entry.name = tostring(safe_call(function()
        return field:get_name()
    end) or "<unknown>")
    entry.type = type_full_name(safe_call(function()
        return field:get_type()
    end)) or "<unknown>"
    entry.isStatic = safe_call(function()
        return field:is_static()
    end) == true

    local raw_value, value_error
    if entry.isStatic then
        raw_value, value_error = read_static_field(field)
    else
        raw_value, value_error = safe_call(function()
            return object:get_field(entry.name)
        end)
    end

    if value_error ~= nil then
        entry.valueError = value_error
    elseif raw_value == nil then
        entry.isNull = true
    else
        entry.value = json_scalar(raw_value)
    end
    return entry
end

local function object_fields(object)
    if object == nil then
        return {}, nil, "Object was nil"
    end
    local type_definition, type_error = safe_call(function()
        return object:get_type_definition()
    end)
    if type_definition == nil then
        return {}, nil, "Could not resolve object type: " .. tostring(type_error)
    end

    local root_type = type_full_name(type_definition)
    local entries = {}
    local visited = {}
    while type_definition ~= nil do
        local declaring_type = type_full_name(type_definition) or "<unknown>"
        if visited[declaring_type] then
            break
        end
        visited[declaring_type] = true

        local fields = safe_call(function()
            return type_definition:get_fields()
        end)
        for _, field in ipairs(fields or {}) do
            table.insert(entries, field_metadata(object, field, declaring_type))
        end

        type_definition = safe_call(function()
            return type_definition:get_parent_type()
        end)
    end

    table.sort(entries, function(left, right)
        if left.declaringType == right.declaringType then
            return left.name < right.name
        end
        return left.declaringType < right.declaringType
    end)
    return entries, root_type, nil
end

local function key_bonus_fields(fields)
    local wanted = {}
    for _, field_name in ipairs(REQUIRED_BONUS_FIELDS) do
        wanted[field_name] = true
    end

    local result = {}
    for _, field in ipairs(fields or {}) do
        if wanted[field.name] then
            if field.valueError ~= nil then
                result[field.name] = { error = field.valueError }
            elseif field.isNull then
                result[field.name] = { isNull = true }
            else
                result[field.name] = field.value
            end
        end
    end
    return result
end

local function method_metadata(method)
    local entry = {}
    entry.name = tostring(safe_call(function()
        return method:get_name()
    end) or "<unknown>")
    entry.declaringType = type_full_name(safe_call(function()
        return method:get_declaring_type()
    end)) or "<unknown>"
    entry.returnType = type_full_name(safe_call(function()
        return method:get_return_type()
    end)) or "<unknown>"
    entry.isStatic = safe_call(function()
        return method:is_static()
    end) == true

    local parameter_types = safe_call(function()
        return method:get_param_types()
    end) or {}
    local parameter_names = safe_call(function()
        return method:get_param_names()
    end) or {}
    entry.parameters = {}
    local signature_types = {}
    for index, parameter_type in ipairs(parameter_types) do
        local parameter_type_name = type_full_name(parameter_type) or "<unknown>"
        table.insert(entry.parameters, {
            index = index,
            name = tostring(parameter_names[index] or ("arg" .. tostring(index))),
            type = parameter_type_name,
        })
        table.insert(signature_types, parameter_type_name)
    end
    entry.signature = entry.returnType .. " " .. entry.declaringType .. "."
        .. entry.name .. "(" .. table.concat(signature_types, ", ") .. ")"

    local address = safe_call(function()
        return method:get_address()
    end)
    if address ~= nil then
        entry.address = string.format("0x%X", address)
    end
    return entry
end

local function type_inventory(type_name)
    local type_definition = sdk.find_type_definition(type_name)
    if type_definition == nil then
        return {
            name = type_name,
            error = "Type not found",
        }
    end

    local entry = {
        name = type_name,
        methods = {},
        fields = {},
    }
    local methods = safe_call(function()
        return type_definition:get_methods()
    end)
    for _, method in ipairs(methods or {}) do
        table.insert(entry.methods, method_metadata(method))
    end
    table.sort(entry.methods, function(left, right)
        return left.signature < right.signature
    end)

    local fields = safe_call(function()
        return type_definition:get_fields()
    end)
    for _, field in ipairs(fields or {}) do
        local field_entry = {
            name = tostring(safe_call(function()
                return field:get_name()
            end) or "<unknown>"),
            type = type_full_name(safe_call(function()
                return field:get_type()
            end)) or "<unknown>",
            isStatic = safe_call(function()
                return field:is_static()
            end) == true,
        }
        if field_entry.isStatic then
            local value, value_error = read_static_field(field)
            if value_error ~= nil then
                field_entry.valueError = value_error
            elseif value == nil then
                field_entry.isNull = true
            else
                field_entry.value = json_scalar(value)
            end
        end
        table.insert(entry.fields, field_entry)
    end
    table.sort(entry.fields, function(left, right)
        return left.name < right.name
    end)
    return entry
end

local function localized_bonus_name(name_method, localized_message_method, bonus_id)
    if name_method == nil then
        return nil, "app.ArtianUtil.Name method not found"
    end
    local guid, guid_error = safe_call(function()
        return name_method:call(nil, bonus_id)
    end)
    if guid == nil then
        return nil, guid_error or "Name returned nil"
    end
    if localized_message_method == nil then
        return tostring(guid), "app.GUIMessageUtil.get method not found"
    end
    local localized, localized_error = safe_call(function()
        return localized_message_method:call(nil, guid)
    end)
    if localized == nil then
        return tostring(guid), localized_error or "Localized name returned nil"
    end
    return tostring(localized), nil
end

local function collect_bonus_data()
    local bonus_members, bonus_members_error = enum_members("app.ArtianDef.BONUS_ID")
    if bonus_members == nil then
        error(bonus_members_error)
    end
    local fixed_members = enum_members("app.ArtianDef.BONUS_ID_Fixed") or {}
    local fixed_by_name = enum_by_name(fixed_members)

    local artian_type = sdk.find_type_definition("app.ArtianUtil")
    if artian_type == nil then
        error("Type not found: app.ArtianUtil")
    end
    local data_method = artian_type:get_method("Data(app.ArtianDef.BONUS_ID)")
        or artian_type:get_method("Data")
    if data_method == nil then
        error("Method not found: app.ArtianUtil.Data(app.ArtianDef.BONUS_ID)")
    end
    local name_method = artian_type:get_method("Name(app.ArtianDef.BONUS_ID)")
        or artian_type:get_method("Name")
    local gui_message_type = sdk.find_type_definition("app.GUIMessageUtil")
    local localized_message_method = gui_message_type ~= nil
        and gui_message_type:get_method("get(System.Guid)") or nil

    local bonuses = {}
    local seen_values = {}
    for _, member in ipairs(bonus_members) do
        local is_sentinel = member.name == "INVALID" or member.name == "MAX"
        if member.value ~= nil and not is_sentinel and not seen_values[member.value] then
            seen_values[member.value] = true
            local bonus = {
                enumName = member.name,
                bonusId = member.value,
                fixedId = fixed_by_name[member.name],
            }
            bonus.localizedName, bonus.localizedNameError = localized_bonus_name(
                name_method, localized_message_method, member.value)

            local data, data_error = safe_call(function()
                return data_method:call(nil, member.value)
            end)
            if data == nil then
                bonus.dataError = data_error or "Data returned nil"
            else
                bonus.fields, bonus.dataType, bonus.dataError = object_fields(data)
                bonus.keyFields = key_bonus_fields(bonus.fields)
            end
            table.insert(bonuses, bonus)
        end
    end
    table.sort(bonuses, function(left, right)
        return left.bonusId < right.bonusId
    end)
    return bonuses, bonus_members, fixed_members
end

local function missing_required_fields(bonuses)
    local missing = {}
    for _, bonus in ipairs(bonuses) do
        local absent = {}
        for _, field_name in ipairs(REQUIRED_BONUS_FIELDS) do
            if bonus.keyFields == nil or bonus.keyFields[field_name] == nil then
                table.insert(absent, field_name)
            end
        end
        if #absent > 0 then
            table.insert(missing, {
                bonusId = bonus.bonusId,
                enumName = bonus.enumName,
                fields = absent,
            })
        end
    end
    return missing
end

local function build_payload()
    local bonuses, bonus_members, fixed_members = collect_bonus_data()
    local game_name = safe_call(function()
        return reframework.get_game_name()
    end)
    return {
        schemaVersion = 1,
        probe = {
            name = MOD_NAME,
            version = VERSION,
            exportedAtUtc = os.date("!%Y-%m-%dT%H:%M:%SZ"),
            gameName = game_name ~= nil and tostring(game_name) or nil,
            readOnly = true,
        },
        notes = {
            "Raw reflected metadata only; this does not by itself prove lottery control flow.",
            "The probe does not invoke a lottery, hook a method, or edit equipment/save data.",
            "Method addresses are runtime addresses and may change after restarting the game.",
        },
        requiredBonusFields = REQUIRED_BONUS_FIELDS,
        bonusEnum = bonus_members,
        bonusFixedEnum = fixed_members,
        bonuses = bonuses,
        missingRequiredFields = missing_required_fields(bonuses),
        typeInventory = {
            type_inventory("app.ArtianUtil"),
            type_inventory("app.Em0078_ArtianUtil"),
        },
    }
end

local function ensure_output_directory()
    if fs ~= nil and fs.create_directory ~= nil and fs.get_game_path ~= nil then
        local directory = fs.get_game_path(OUTPUT_DIRECTORY)
        local _, err = safe_call(function()
            return fs.create_directory(directory)
        end)
        return err
    end
    return nil
end

local function export_probe()
    state.last_error = nil
    state.status = "Collecting reflected bonus metadata..."
    local payload, build_error = safe_call(build_payload)
    if payload == nil then
        state.last_error = build_error or "Unknown collection failure"
        state.status = "Export failed"
        log.error("[" .. MOD_NAME .. "] " .. state.last_error)
        return false
    end

    local directory_error = ensure_output_directory()
    if directory_error ~= nil then
        state.last_error = "Could not create output directory: " .. directory_error
        state.status = "Export failed"
        log.error("[" .. MOD_NAME .. "] " .. state.last_error)
        return false
    end

    local write_result, write_error = safe_call(function()
        return json.dump_file(OUTPUT_PATH, payload)
    end)
    if write_error ~= nil or write_result == false then
        state.last_error = write_error or "json.dump_file returned false"
        state.status = "Export failed"
        log.error("[" .. MOD_NAME .. "] " .. state.last_error)
        return false
    end

    state.last_bonus_count = #payload.bonuses
    state.status = "Exported " .. tostring(state.last_bonus_count)
        .. " bonus records to " .. OUTPUT_PATH
    log.info("[" .. MOD_NAME .. "] " .. state.status)
    return true
end

re.on_frame(function()
    state.frames = state.frames + 1
    if not state.automatic_export_attempted and state.frames >= AUTO_EXPORT_DELAY_FRAMES then
        state.automatic_export_attempted = true
        export_probe()
    end
end)

re.on_draw_ui(function()
    if not imgui.tree_node(MOD_NAME) then
        return
    end
    imgui.text("Version " .. VERSION)
    imgui.text("Read-only: exports metadata and does not run a lottery or edit equipment.")
    imgui.text("Output: " .. OUTPUT_PATH)
    if imgui.button("Export constraint metadata now") then
        export_probe()
    end
    imgui.text(state.status)
    if state.last_error ~= nil then
        imgui.text_colored(state.last_error, 0xff6060ff)
    end
    imgui.tree_pop()
end)
