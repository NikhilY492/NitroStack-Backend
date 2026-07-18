/**
 * Integration layer exports.
 * Bridges AI Runtime and NitroStack MCP backend.
 * 
 * CRITICAL: This is the ONLY layer that understands both systems.
 * All other code uses unified interfaces.
 */

export type { MCPToolFunction, MCPToolMetadata } from "./MCPToolAdapter";
export { MCPToolAdapter, MCPAdapterFactory } from "./MCPToolAdapter";

export type { UnifiedToolMetadata, ToolOrigin } from "./MCPRegistry";
export { MCPRegistry } from "./MCPRegistry";

export { ToolResultNormalizer } from "./ToolResultNormalizer";

export type { BackendState } from "./StateNormalizer";
export { StateNormalizer } from "./StateNormalizer";

export { MCPToolFactory } from "./MCPToolFactory";

export type { BridgeRoutingResult } from "./BridgeToolRouter";
export { BridgeToolRouter } from "./BridgeToolRouter";

export type { InitializedRuntime, RuntimeInitOptions } from "./RuntimeInitializer";
export { RuntimeInitializer } from "./RuntimeInitializer";
