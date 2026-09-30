# Field Mapping Patterns Reference

**IMPORTANT**: This reference may become outdated. Always verify patterns against actual connector behavior with `--debug`.

## Field Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text values | Names, IDs, emails |
| `number` | Numeric values | Counts, amounts |
| `boolean` | True/false | is_active |
| `datetime_string` | ISO date strings | hire_date |
| `enum` | Constrained values | status (requires enumMapper) |
| `object` | Nested structure | work_location |

## Action-Level fieldConfigs

Define fields in the action's `fieldConfigs`. The `map_fields` step takes only a `dataSource` and applies them:

```yaml
fieldConfigs:
  - targetFieldKey: email
    expression: $.email           # Relative to each record, NO step prefix
    type: string
  - targetFieldKey: department
    expression: $.work.department  # Nested field reference
    type: string

steps:
  - stepId: map_data
    stepFunction:
      functionName: map_fields
      version: '2'
      parameters:
        dataSource: $.steps.get_data.output.data
```

The field snippets below are entries in `fieldConfigs`.

## Enum Mapping

### Basic Enum

```yaml
fieldConfigs:
  - targetFieldKey: status
    expression: $.status
    type: enum
    enumMapper:
      matcher:
        - matchExpression: '{{$.status == "Active"}}'
          value: active
        - matchExpression: '{{$.status == "Inactive"}}'
          value: inactive
        - matchExpression: '{{$.status == null}}'
          value: unknown
```

### Case-Insensitive Matching

```yaml
enumMapper:
  matcher:
    - matchExpression: '{{lower($.status) == "active"}}'
      value: active
```

### Multiple Source Values

```yaml
enumMapper:
  matcher:
    - matchExpression: '{{$.type == "Full-Time" || $.type == "FT"}}'
      value: full_time
```

### Built-in Mappers

```yaml
- targetFieldKey: file_format
  expression: '{{$.fullFileExtension || $.mimeType}}'
  type: enum
  enumMapper:
    matcher: 'document_file_format_from_extension'
```

### Always Include Fallback

```yaml
enumMapper:
  matcher:
    - matchExpression: '{{$.status == "Active"}}'
      value: active
    - matchExpression: '{{$.status == "Inactive"}}'
      value: inactive
    # ALWAYS include null/unknown fallback
    - matchExpression: '{{$.status == null || $.status == ""}}'
      value: unknown
```

## Nested Objects

### Simple Nested Field

```yaml
fieldConfigs:
  - targetFieldKey: city
    expression: $.location.city
    type: string
  - targetFieldKey: country
    expression: $.location.country
    type: string
```

### Flattening Nested Data

Provider returns:
```json
{ "work": { "department": "Sales", "title": "Manager" } }
```

Your schema is flat:
```yaml
fieldConfigs:
  - targetFieldKey: department
    expression: $.work.department
    type: string
  - targetFieldKey: job_title
    expression: $.work.title
    type: string
```

## Array Fields

### Simple Array

```yaml
fieldConfigs:
  - targetFieldKey: email_addresses
    expression: $.emails[*]
    type: string
    array: true
```

### JEXL Array Operations

```yaml
fieldConfigs:
  - targetFieldKey: export_formats
    expression: '{{keys(exportLinks)}}'
    type: string
    array: true
```

## Computed/Transformed Fields

### Fallback Values

```yaml
fieldConfigs:
  - targetFieldKey: file_format
    expression: '{{$.fullFileExtension || $.mimeType}}'
    type: string
```

### Conditional Logic

```yaml
fieldConfigs:
  - targetFieldKey: default_format
    expression: '{{exportLinks ? (keys(exportLinks)[0] || "application/pdf") : $.mimeType}}'
    type: string
```

### Boolean Check

```yaml
fieldConfigs:
  - targetFieldKey: is_exportable
    expression: '{{$.exportLinks != null}}'
    type: boolean
```

## Complete Working Example

Mapping HiBob employee data:

```yaml
fieldConfigs:
  - targetFieldKey: email
    expression: $.email
    type: string
  - targetFieldKey: employee_id
    expression: $.id
    type: string
  - targetFieldKey: department
    expression: $.work.department
    type: string
  - targetFieldKey: job_title
    expression: $.work.title
    type: string

steps:
  - stepId: get_employees
    stepFunction:
      functionName: paginated_request
      parameters:
        url: /v1/people/search
        method: post
        args:
          - name: fields
            value:
              - root.id
              - root.email
              - work.department
              - work.title
            in: body
        response:
          dataKey: employees
          nextKey: nextCursor
        iterator:
          key: cursor
          in: body

  - stepId: map_data
    stepFunction:
      functionName: map_fields
      version: '2'
      parameters:
        dataSource: $.steps.get_employees.output.data

  - stepId: typecast_data
    stepFunction:
      functionName: typecast
      version: '2'
      parameters:
        dataSource: $.steps.map_data.output.data

result:
  data: $.steps.typecast_data.output.data
```

## Common Mistakes

### Wrong Expression Context

```yaml
# WRONG - Using step prefix in fieldConfigs
fieldConfigs:
  - expression: $.get_employees.email    # Don't use step prefix!

# CORRECT - Direct field reference
fieldConfigs:
  - expression: $.email
```

### Missing Version

```yaml
# WRONG - No version
stepFunction:
  functionName: map_fields
  parameters: ...

# CORRECT - Version 2 specified
stepFunction:
  functionName: map_fields
  version: '2'
  parameters: ...
```

### Using Provider Field Names

```yaml
# WRONG - Provider naming
- targetFieldKey: firstName

# CORRECT - YOUR schema naming
- targetFieldKey: first_name
```

## Validation Checklist

- [ ] All schema fields declared in action-level `fieldConfigs`
- [ ] Expressions use correct context (no step prefix in `fieldConfigs`)
- [ ] `version: '2'` specified for map_fields and typecast
- [ ] All `targetFieldKey` values match YOUR schema
- [ ] All enum fields have `enumMapper` with null handler
- [ ] typecast step runs on the map_fields output
