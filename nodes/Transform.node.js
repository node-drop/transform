const TransformNode = {
  identifier: "transform",
  displayName: "Transform",
  name: "transform",
  group: ["transform"],
  version: 1,
  description: "Add, modify, rename, or remove properties from data",
  icon: "🔄",
  color: "#8B5CF6",
  defaults: {
    name: "Transform",
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Action",
      name: "action",
      type: "options",
      default: "set",
      options: [
        { name: "Set/Add Field", value: "set" },
        { name: "Rename Field", value: "rename" },
        { name: "Remove Field", value: "remove" },
        { name: "Multiple Operations", value: "multiple" },
      ],
    },
    {
      displayName: "Field Name",
      name: "fieldName",
      type: "string",
      default: "",
      displayOptions: {
        show: {
          action: ["set", "remove"],
        },
      },
      placeholder: "status",
      description: "Name of the field",
    },
    {
      displayName: "Value",
      name: "value",
      type: "string",
      default: "",
      displayOptions: {
        show: {
          action: ["set"],
        },
      },
      placeholder: "active",
      description: "Value to set (use {{fieldName}} to reference other fields)",
    },
    {
      displayName: "Old Field Name",
      name: "oldName",
      type: "string",
      default: "",
      displayOptions: {
        show: {
          action: ["rename"],
        },
      },
      placeholder: "old_name",
    },
    {
      displayName: "New Field Name",
      name: "newName",
      type: "string",
      default: "",
      displayOptions: {
        show: {
          action: ["rename"],
        },
      },
      placeholder: "new_name",
    },
    {
      displayName: "Operations (JSON)",
      name: "operations",
      type: "json",
      default: '{\n  "set": {"status": "active"},\n  "rename": {"old_name": "new_name"},\n  "remove": ["password", "token"]\n}',
      displayOptions: {
        show: {
          action: ["multiple"],
        },
      },
      description: "Multiple operations in JSON format",
      typeOptions: {
        rows: 10,
      },
    },
  ],

  execute: async function (inputData) {
    let items = [];
    if (inputData?.main?.[0]) {
      items = Array.isArray(inputData.main[0]) ? inputData.main[0] : [inputData.main[0]];
    }

    const action = await this.getNodeParameter("action");

    // Helper to get nested value (e.g., "user.name" or "items[0].id")
    const getNestedValue = (obj, path) => {
      const keys = path.split('.');
      let result = obj;
      
      for (const key of keys) {
        // Handle array notation: items[0]
        const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
          const [, arrayKey, index] = arrayMatch;
          result = result?.[arrayKey]?.[parseInt(index)];
        } else {
          result = result?.[key];
        }
        
        if (result === undefined) return undefined;
      }
      
      return result;
    };

    // Helper to set nested value (e.g., "user.name" = "John")
    const setNestedValue = (obj, path, value) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let target = obj;
      
      // Create nested structure if needed
      for (const key of keys) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        target = target[key];
      }
      
      target[lastKey] = value;
    };

    // Helper to delete nested value
    const deleteNestedValue = (obj, path) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let target = obj;
      
      for (const key of keys) {
        if (!target[key]) return;
        target = target[key];
      }
      
      delete target[lastKey];
    };

    // Helper to replace {{field}} syntax (supports nested)
    const replaceTemplate = (template, data) => {
      if (typeof template !== "string") return template;
      
      return template.replace(/\{\{([^}]+)\}\}/g, (match, fieldPath) => {
        const path = fieldPath.trim();
        const value = getNestedValue(data, path);
        return value !== undefined ? value : match;
      });
    };

    // Get parameters once
    let fieldName, value, oldName, newName, operations;
    
    if (action === "set") {
      fieldName = await this.getNodeParameter("fieldName");
      value = await this.getNodeParameter("value");
    } else if (action === "rename") {
      oldName = await this.getNodeParameter("oldName");
      newName = await this.getNodeParameter("newName");
    } else if (action === "remove") {
      fieldName = await this.getNodeParameter("fieldName");
    } else if (action === "multiple") {
      const opsStr = await this.getNodeParameter("operations");
      operations = typeof opsStr === "string" ? JSON.parse(opsStr) : opsStr;
    }

    // Transform function
    const transformItem = (item) => {
      const data = JSON.parse(JSON.stringify(item.json)); // Deep clone

      if (action === "set") {
        if (fieldName) {
          const processedValue = replaceTemplate(value, data);
          if (fieldName.includes('.')) {
            setNestedValue(data, fieldName, processedValue);
          } else {
            data[fieldName] = processedValue;
          }
        }
      } else if (action === "rename") {
        if (oldName && newName) {
          const oldValue = oldName.includes('.') 
            ? getNestedValue(data, oldName)
            : data[oldName];
            
          if (oldValue !== undefined) {
            if (newName.includes('.')) {
              setNestedValue(data, newName, oldValue);
            } else {
              data[newName] = oldValue;
            }
            
            if (oldName.includes('.')) {
              deleteNestedValue(data, oldName);
            } else {
              delete data[oldName];
            }
          }
        }
      } else if (action === "remove") {
        if (fieldName) {
          if (fieldName.includes('.')) {
            deleteNestedValue(data, fieldName);
          } else {
            delete data[fieldName];
          }
        }
      } else if (action === "multiple") {
        // Apply SET operations
        if (operations.set && typeof operations.set === "object") {
          for (const [key, val] of Object.entries(operations.set)) {
            const processedValue = replaceTemplate(String(val), data);
            if (key.includes('.')) {
              setNestedValue(data, key, processedValue);
            } else {
              data[key] = processedValue;
            }
          }
        }

        // Apply RENAME operations
        if (operations.rename && typeof operations.rename === "object") {
          for (const [old, newKey] of Object.entries(operations.rename)) {
            const oldValue = old.includes('.') 
              ? getNestedValue(data, old)
              : data[old];
              
            if (oldValue !== undefined) {
              if (newKey.includes('.')) {
                setNestedValue(data, newKey, oldValue);
              } else {
                data[newKey] = oldValue;
              }
              
              if (old.includes('.')) {
                deleteNestedValue(data, old);
              } else {
                delete data[old];
              }
            }
          }
        }

        // Apply REMOVE operations
        if (operations.remove && Array.isArray(operations.remove)) {
          for (const field of operations.remove) {
            if (field.includes('.')) {
              deleteNestedValue(data, field);
            } else {
              delete data[field];
            }
          }
        }
      }

      return { json: data };
    };

    // Apply transformations
    const results = items.map(item => transformItem(item));

    this.logger.info("Transform completed", {
      itemCount: results.length,
      action,
    });

    return [{ main: results }];
  },
};

module.exports = TransformNode;
