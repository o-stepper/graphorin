/**
 * Schema projection surface: the shared Zod-to-JSON-Schema converter
 * used by the agent's `toolToDefinition`, the code-mode signature
 * projection, and `ToolSearchMatch`.
 *
 * @packageDocumentation
 */

export {
  isZodSchema,
  isZodV3Schema,
  isZodV4Schema,
  type JsonSchemaRecord,
  looksLikeJsonSchema,
  type ProjectSchemaOptions,
  projectSchemaToJsonSchema,
  zodToJsonSchema,
} from './to-json-schema.js';
