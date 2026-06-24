import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Who authored a chat message in the advisor conversation.
 */
export type ChatRole = 'user' | 'assistant';

/**
 * A single message in the loan advisor conversation.
 *
 * Implements {@link BaseEntity} to stay consistent with the rest of the
 * domain layer, where every entity is identified by its `id`.
 */
export interface ChatMessage extends BaseEntity {
  /** Stable id of the message. */
  id: string;
  /** Author of the message. */
  role: ChatRole;
  /** The message text. */
  content: string;
  /** Whether the assistant message is still being generated. */
  pending?: boolean;
}
