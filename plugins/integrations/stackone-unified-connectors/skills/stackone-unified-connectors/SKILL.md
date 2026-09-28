---
name: stackone-unified-connectors
description: Baseline skill for building unified/schema-based connectors that transform provider data into standardized schemas. Use alongside domain-specific schema skills that you create to define your organization's standard schemas. Use when user says "start unified build for [provider]", "build a schema-based connector", "map fields to schema", "test unified connector", or asks about field mapping, enum mapping, pagination configuration, or scope decisions. This skill provides implementation patterns; schema skills provide field definitions. Do NOT use for agentic/custom connectors (use stackone-cli), discovering existing connectors (use stackone-connectors), or building AI agents (use stackone-agents).
license: MIT
compatibility: Requires StackOne CLI (@stackone/cli). Requires access to provider API documentation.
metadata:
  author: stackone
  version: "2.2"
---

# StackOne Unified Connectors

Build connectors that transform provider-specific data into standardized schemas with consistent field names, enum values, and pagination.

## Skill Architecture

This is a **baseline skill** that provides the core workflow and patterns for building unified connectors. It is designed to work alongside **domain-specific schema skills** that you create for your organization's specific use cases.

**Recommended approach:**
1. Use this skill as your foundation for all unified connector work
2. Create domain-specific skills for each category you build connectors for (e.g., `unified-hris-schema`, `unified-messaging-schema`, `unified-crm-schema`)
3. Your domain-specific skills provide the schema definitions, field naming conventions, and enum value standards
4. This baseline skill provides the implementation patterns, CLI commands, and troubleshooting guidance

This separation allows you to maintain consistent schemas across all providers within a category while leveraging the shared technical patterns from this baseline skill.

## Important

Before building unified connectors:
1. Read the CLI documentation: https://docs.stackone.com/connector-building/stackone-cli.md
2. Use `stackone help <command>` for command-specific details
3. Always verify response structures with `--debug` before configuring mappings

When fetching a `docs.stackone.com` page whose URL doesn't already end in `.md`, append `.md` to get it as markdown. `llms.txt` is already plain text, so fetch it as is.

**If any URL in this skill returns 404** (StackOne reorganizes its docs from time to time), fetch `https://docs.stackone.com/llms.txt`, which indexes every docs page by title and description. Search it for the page's topic (e.g. "StackOne CLI", "Defined Output Schemas", "Connector YAML Reference") and use the URL listed there.

## Core Principles

These principles apply to ALL unified connector work. Violations cause silent failures or broken mappings.

### 1. All Config Field Names Use camelCase

Every YAML configuration field uses camelCase, not snake_case:

```yaml
# CORRECT
scopeDefinitions:      fieldConfigs:         targetFieldKey:
enumMapper:            matchExpression:      dataKey:
nextKey:               pageSize:             indexField:
stepFunction:          functionName:         dataSource:

# WRONG - causes validation errors or silent failures
scope_definitions:     field_configs:        target_field_key:
```

### 2. Schema Field Names Use YOUR Naming Convention

While config fields are camelCase, `targetFieldKey` values match YOUR schema (often snake_case):

```yaml
fieldConfigs:
  - targetFieldKey: first_name    # YOUR schema field
    expression: $.firstName       # Provider's field
```

### 3. Always Use Version '2' for map_fields and typecast

```yaml
stepFunction:
  functionName: map_fields
  version: '2'          # REQUIRED - omitting causes empty results
```

### 4. Define Fields in Action-Level fieldConfigs

Declare the field mapping once in the action's `fieldConfigs`. The `map_fields` and `typecast` steps then take only a `dataSource` and apply those `fieldConfigs`.

```yaml
fieldConfigs:
  - targetFieldKey: email
    expression: $.email           # Relative to each record, NO step prefix
    type: string

steps:
  - stepId: map_data
    stepFunction:
      functionName: map_fields
      version: '2'
      parameters:
        dataSource: $.steps.get_data.output.data
```

### 5. Expressions Are Relative to Each Record

`fieldConfigs` expressions are evaluated against each record of the `map_fields` `dataSource`, so reference the record's fields directly: `$.email`, `$.work.department`. Do not prefix them with a step ID.

### 6. Never Suggest User-Side Mapping

The entire purpose of unified connectors is standardized output. Never suggest users handle mapping in application code.

### 7. Verify Every Path Against Raw Response

Never assume response structure. Always run with `--debug` first:

```bash
stackone run --debug --connector <file> --credentials <file> --action-id <action>
```

## Instructions

### Step 1: Resolve Schema

**Check for a domain-specific schema skill first.**

Domain-specific schema skills (e.g., `unified-hris-schema`, `unified-crm-schema`) should define your organization's standard schema for that category. These skills complement this baseline skill by providing:
- Target field names and types
- Enum values and their meanings
- Required vs optional fields
- Nested object structures

**If schema skill exists:**
- Use the schema definitions from that skill immediately
- Confirm which resource you're building (e.g., "employees", "contacts")
- Proceed to Step 2

**If no schema skill exists:**
- Ask user for schema in any format (YAML, JSON, markdown table, field list)
- Recommend creating a domain-specific schema skill for future builds in this category
- This ensures consistency across all providers you integrate

**What a schema skill should contain:**
```yaml
# Example: unified-hris-schema skill structure
# - Field definitions with types
# - Enum values (e.g., employment_status: active, inactive, terminated)
# - Required fields marked
# - Nested structures documented
```

Creating domain-specific schema skills prevents drift between providers and reduces repeated schema discussions.

### Step 2: Research Provider Endpoints (MANDATORY)

**Do not skip this step.** Research ALL available endpoints before proceeding.

For each endpoint, document:
- **Field Coverage**: Which schema fields does it return?
- **Performance**: Pagination support, rate limits
- **Permissions**: Required scopes (narrower is better)
- **Deprecation**: Never use deprecated endpoints

### Step 3: Present Options to User (CHECKPOINT)

Present a comparison table and get explicit user approval before implementing:

```markdown
| Option | Endpoint | Field Coverage | Permissions | Status |
|--------|----------|----------------|-------------|--------|
| A | GET /v2/employees | 70% | Narrow | Active |
| B | POST /reports | 100% | Moderate | Active |
| C | POST /v1/data | 100% | Broad | Deprecated |

Recommendation: Option B - Full coverage, not deprecated
```

**Do not proceed without user selection.**

### Step 4: Configure Scopes

Use `scopeDefinitions` (not `scope_definitions`):

```yaml
scopeDefinitions:
  employees:read:
    description: Read employee data
  employees:extended:read:
    description: Extended employee data
    includes: employees:read  # Scope inheritance
```

**Principles:**
- Narrower scopes always preferred
- Never use deprecated endpoints
- Document trade-offs explicitly

See `references/scope-patterns.md` for detailed patterns.

### Step 5: Map Fields to Schema

Declare the mapping in action-level `fieldConfigs`, then run `map_fields` and `typecast` over the data:

```yaml
fieldConfigs:
  - targetFieldKey: id
    expression: $.id
    type: string
  - targetFieldKey: email
    expression: $.email
    type: string
  - targetFieldKey: department
    expression: $.work.department  # Nested field
    type: string
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

steps:
  - stepId: map_data
    stepFunction:
      functionName: map_fields
      version: '2'
      parameters:
        dataSource: $.steps.get_data.output.data

  - stepId: typecast_data
    stepFunction:
      functionName: typecast
      version: '2'
      parameters:
        dataSource: $.steps.map_data.output.data

result:
  data: $.steps.typecast_data.output.data
```

See `references/field-mapping-patterns.md` for enum mapping, nested objects, and transformations.

### Step 6: Configure Pagination

For list endpoints, use cursor pagination with the `request` function:

```yaml
cursor:
  enabled: true
  pageSize: 50

inputs:
  - name: page_size
    type: number
    in: query
    required: false
  - name: cursor
    type: string
    in: query
    required: false

steps:
  - stepId: get_data
    stepFunction:
      functionName: request
      parameters:
        url: /items
        method: get
        args:
          # Dual-condition pattern for defaults
          - name: limit
            value: $.inputs.page_size
            in: query
            condition: "{{present(inputs.page_size)}}"
          - name: limit
            value: 50
            in: query
            condition: "{{!present(inputs.page_size)}}"
          - name: cursor
            value: $.inputs.cursor
            in: query
            condition: "{{present(inputs.cursor)}}"

result:
  data: $.steps.get_data.output.data
  next: $.steps.get_data.output.data.meta.nextCursor
```

**Important:** Use `request` function (not `paginated_request`) when you need dynamic inputs like `page_size`. The `paginated_request` function can have issues with `$.inputs.*` resolving to `undefined`.

See `references/pagination-patterns.md` for detailed configuration.

### Step 7: Validate Configuration

```bash
stackone validate connectors/<provider>/<provider>.connector.s1.yaml
```

### Step 8: Test Mappings

**Phase 1: Raw Response**
```bash
stackone run --debug --connector <file> --credentials <file> --action-id <action>
```

**Phase 2: Field Mapping** - Verify all fields use YOUR schema names, not provider names

**Phase 3: Pagination** - Test first page, next page, last page, empty results

**Phase 4: Schema Completeness** - All required fields present and populated

### Step 9: Document Coverage

Create a coverage document listing:
- Required fields: mapped status
- Optional fields: mapped or documented why not
- Scopes required
- Limitations

## Examples

### Example 1: Building a unified employee connector (with schema skill)

User says: "start unified build for BambooHR"

Actions:
1. Check for domain-specific schema skill (e.g., `unified-hris-schema`)
2. **If skill exists**: Load employee schema from skill, confirm fields, proceed
3. **If no skill**: Ask for schema, recommend creating `unified-hris-schema` skill for consistency across HRIS providers
4. Research BambooHR endpoints: `/v1/employees`, `/v1/employees/directory`, custom reports
5. Present options with trade-offs (field coverage, scopes, deprecation)
6. After user selects, declare `fieldConfigs` using schema from skill and add map_fields and typecast steps
7. Configure pagination with cursor support
8. Test with `--debug`, verify field names match schema
9. Document coverage

Result: Working unified connector with standardized employee schema that matches other HRIS connectors.

### Example 2: First connector in a new category

User says: "build a unified messaging connector for Slack"

Actions:
1. Check for `unified-messaging-schema` skill - none exists
2. Ask: "I don't see a messaging schema skill. What fields do you need for messages? I recommend we create a `unified-messaging-schema` skill so future messaging connectors (Teams, Discord) use the same schema."
3. Collaborate on schema definition
4. Suggest creating the schema skill before proceeding
5. Once schema is defined, proceed with standard workflow

Result: New schema skill created, connector built, future messaging connectors will use same schema.

### Example 3: Debugging field mapping issues

User says: "My unified connector returns provider field names instead of my schema"

Actions:
1. Check if `targetFieldKey` uses YOUR schema names (not provider names)
2. Verify `version: '2'` is specified on map_fields and typecast
3. Check expression context - `fieldConfigs` expressions should NOT have a step prefix
4. Run with `--debug` to see raw response structure
5. Verify dataSource path is correct

Result: Fields correctly mapped to user's schema.

### Example 4: Pagination not working

User says: "Pagination cursor isn't being passed correctly"

Actions:
1. Run with `--debug` to see raw response structure
2. Verify `dataKey` path matches actual response (e.g., `data.employees` not just `employees`)
3. Verify `nextKey` path points to cursor value
4. Check if using `paginated_request` with dynamic inputs - switch to `request` with dual-condition pattern
5. Verify `result.next` returns the cursor value

Result: Working pagination with correct cursor handling.

## Troubleshooting

### Fields return provider names instead of schema names
**Cause**: Missing or incorrect field mapping configuration.
**Fix**: Ensure `targetFieldKey` uses YOUR schema field names, not provider names. Verify map_fields step is present and dataSource is correct.

### Mapping produces empty results
**Cause**: Missing `version: '2'` or wrong expression context.
**Fix**: Add `version: '2'` to map_fields and typecast. In `fieldConfigs`, use direct references (`$.email`) without step prefix.

### Enum values not translating
**Cause**: `matchExpression` doesn't match provider values (case-sensitive).
**Fix**: Check exact provider values with `--debug`. Use the `lower()` function for case-insensitive matching (e.g. `'{{lower($.status) == "active"}}'`). Always include null/unknown fallback.

### Pagination returns same records
**Cause**: Cursor not being sent or extracted correctly.
**Fix**: Verify `iterator.key` matches API's expected parameter name. Check `nextKey` path against raw response. Verify `iterator.in` is correct (query/body/headers).

### Dynamic inputs resolve to undefined
**Cause**: Using `paginated_request` which doesn't handle `$.inputs.*` well.
**Fix**: Use standard `request` function with dual-condition pattern for defaults.

## Key URLs

| Resource | URL |
|----------|-----|
| CLI Package | https://www.npmjs.com/package/@stackone/cli |
| Connector Building Docs | https://docs.stackone.com/connector-building/overview.md |
| CLI Reference | https://docs.stackone.com/connector-building/stackone-cli.md |
| Defined Output Schemas | https://docs.stackone.com/connector-building/defined-output-schemas.md |
| Connector YAML Reference | https://docs.stackone.com/connector-yaml-reference/overview.md |

## Creating Domain-Specific Schema Skills

To maintain consistency across providers, create schema skills for each category you work with. A domain-specific schema skill should include:

**Required content:**
- Field definitions with types (`string`, `number`, `boolean`, `datetime_string`, `enum`)
- Enum value definitions with descriptions
- Required vs optional field indicators
- Nested object structures

**Example skill structure:**
```markdown
# Unified HRIS Schema

## Employee Resource

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| email | string | Primary email address |
| first_name | string | Employee first name |
| last_name | string | Employee last name |
| employment_status | enum | Current employment status |

### Enum: employment_status
| Value | Description |
|-------|-------------|
| active | Currently employed |
| inactive | On leave or suspended |
| terminated | No longer employed |

### Optional Fields
| Field | Type | Description |
|-------|------|-------------|
| department | string | Department name |
| hire_date | datetime_string | Date of hire |
```

**Naming convention:** `unified-{category}-schema` (e.g., `unified-hris-schema`, `unified-crm-schema`, `unified-messaging-schema`)

## Related Skills

- **stackone-cli**: For deploying connectors and CLI commands
- **stackone-connectors**: For discovering existing connector capabilities
- **stackone-agents**: For building AI agents that use connectors
- **Your domain-specific schema skills**: For category-specific schemas (create as needed)
