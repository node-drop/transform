# Transform Node 🔄

Modify data by adding, changing, renaming, or removing fields.

## Use Cases

### 1. **Add/Set a Field**
Add a new field or change an existing one.

**Example:** Add status field
```
Action: Set/Add Field
Field Name: status
Value: active
```

**Input:**
```json
{"id": 1, "name": "John"}
```

**Output:**
```json
{"id": 1, "name": "John", "status": "active"}
```

---

### 2. **Combine Fields**
Use `{{fieldName}}` syntax to reference other fields.

**Example:** Create full name
```
Action: Set/Add Field
Field Name: fullName
Value: {{firstName}} {{lastName}}
```

**Input:**
```json
{"firstName": "John", "lastName": "Doe"}
```

**Output:**
```json
{"firstName": "John", "lastName": "Doe", "fullName": "John Doe"}
```

---

### 3. **Rename a Field**
Change a field name.

**Example:** Rename user_id to userId
```
Action: Rename Field
Old Field Name: user_id
New Field Name: userId
```

**Input:**
```json
{"user_id": 123, "name": "John"}
```

**Output:**
```json
{"userId": 123, "name": "John"}
```

---

### 4. **Remove a Field**
Delete a field (useful for removing sensitive data).

**Example:** Remove password
```
Action: Remove Field
Field Name: password
```

**Input:**
```json
{"id": 1, "name": "John", "password": "secret"}
```

**Output:**
```json
{"id": 1, "name": "John"}
```

---

### 5. **Multiple Operations**
Do multiple transformations at once using JSON.

**Example:**
```json
{
  "set": {
    "status": "active",
    "updatedAt": "2024-01-01"
  },
  "rename": {
    "user_id": "userId",
    "email_address": "email"
  },
  "remove": ["password", "resetToken"]
}
```

**Input:**
```json
{
  "user_id": 1,
  "email_address": "john@example.com",
  "password": "secret",
  "resetToken": "abc123"
}
```

**Output:**
```json
{
  "userId": 1,
  "email": "john@example.com",
  "status": "active",
  "updatedAt": "2024-01-01"
}
```

---

## Common Patterns

### Pattern 1: Add Timestamp
```
Field Name: createdAt
Value: {{$now}}
```

### Pattern 2: Format Display Name
```
Field Name: displayName
Value: {{name}} ({{email}})
```

### Pattern 3: Clean Database Response
```json
{
  "rename": {
    "created_at": "createdAt",
    "updated_at": "updatedAt"
  },
  "remove": ["password", "resetToken", "resetTokenExpiry"]
}
```

### Pattern 4: Add API Metadata
```json
{
  "set": {
    "version": "1.0",
    "timestamp": "{{$now}}",
    "source": "api"
  }
}
```

---

## Template Syntax

Use `{{fieldName}}` to reference other fields:

- `{{name}}` → Value of name field
- `{{user.email}}` → Nested field (if supported)
- `Hello {{name}}!` → Mix text and fields

---

## Tips

1. **Order matters** in Multiple Operations:
   - SET runs first
   - RENAME runs second
   - REMOVE runs last

2. **Use with API Response**:
   ```
   PostgreSQL → Transform → API Response
   ```
   Transform cleans data, API Response formats it.

3. **Chain multiple Transform nodes** for complex operations.

4. **Template syntax** only works in SET operations.
