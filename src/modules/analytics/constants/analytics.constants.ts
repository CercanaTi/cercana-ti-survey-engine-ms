/** hierarchy node "type" labels returned by admin-ms (the engine has no hierarchy table of its own). */
export const HIERARCHY_NODE_TYPES = {
  CENTRO: 'CENTRO',
  DISTRITO: 'DISTRITO',
  REGIONAL: 'REGIONAL',
  MINISTERIO: 'MINISTERIO',
} as const;

export const DISTRIBUTION_KEYS = ['excelente', 'bueno', 'regular', 'deficiente'] as const;
