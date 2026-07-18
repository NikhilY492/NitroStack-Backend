/**
 * Common reusable interfaces to reduce duplication across the codebase.
 * 
 * These interfaces provide standard patterns for IDs, timestamps,
 * and metadata that are used throughout the agent state and tool contracts.
 */

/**
 * Provides a unique identifier.
 */
export interface Identifiable {
  /**
   * Unique identifier for this entity.
   */
  readonly id: string;
}

/**
 * Provides timestamp information.
 */
export interface Timestamped {
  /**
   * ISO 8601 timestamp of creation.
   */
  readonly createdAt: string;

  /**
   * ISO 8601 timestamp of last update (if applicable).
   */
  readonly updatedAt?: string;
}

/**
 * Provides extensible metadata storage.
 */
export interface MetadataCarrier {
  /**
   * Extensible metadata field for additional context.
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Combines common interfaces for entities that need ID, timestamps, and metadata.
 */
export interface Entity extends Identifiable, Timestamped, MetadataCarrier {}

/**
 * Represents a versioned entity.
 */
export interface Versioned {
  /**
   * Version number or identifier.
   */
  readonly version: string | number;
}

/**
 * Represents something that can be labeled with a human-readable name.
 */
export interface Labeled {
  /**
   * Human-readable label.
   */
  readonly label: string;

  /**
   * Optional longer description.
   */
  readonly description?: string;
}

/**
 * Represents the result of an operation that can succeed or fail.
 */
export interface Outcome {
  /**
   * Whether the operation succeeded.
   */
  readonly success: boolean;

  /**
   * Optional error message if failed.
   */
  readonly error?: string;
}
