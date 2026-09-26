import { RushCard, schemaVersion } from './types';

// Phase 2 replaces this with per-template defaults
export const defaultCard: RushCard = {
  schemaVersion,
  template: 'effect',
  name: '',
  attribute: 'none',
  level: 4,
  typeLine: '',
  icon: 'none',
  effect: '',
  atk: '',
  def: '',
  setId: '',
  serial: '',
  image: null,
};
