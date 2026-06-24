/**
 * Infrastructure resource contract. Mirrors how an entity is shaped on the wire.
 */
export interface BaseResource {
  id: string;
}

/**
 * Marker contract for response envelopes returned by collection endpoints.
 */
export interface BaseResponse {}
