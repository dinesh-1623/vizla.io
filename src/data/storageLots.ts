export const STORAGE_LOTS = [
  { name: 'White Marsh', address: '11051 Pulaski Hwy, White Marsh, MD 21162' },
  { name: 'Newark', address: '12 Peoples Dr, Newark, DE 19702' },
  { name: 'Bladensburg', address: '2507 Bladensburg Road NE, Washington, DC 20018' },
  { name: 'Curtis Ave', address: '4221 Curtis Ave, Baltimore, MD 21226' },
  { name: 'Mountville', address: '5090 Mountville Road, Fredrick, MD 21703' },
  { name: 'Greensboro', address: '700 West Sunset Ave., Greensboro, MD 21639' },
  { name: 'Clinton', address: '7908 Bellefonte Lane, Clinton, MD 20735' },
  { name: 'Annapolis Jct', address: '8595 Dorsey Run Road, Annapolis Junction, MD 20701' },
] as const;

export type StorageLot = typeof STORAGE_LOTS[number];

/**
 * Get storage lot by name
 */
export function getStorageLotByName(name: string): StorageLot | undefined {
  return STORAGE_LOTS.find(lot => lot.name === name);
}

/**
 * Get all storage lot names
 */
export function getStorageLotNames(): string[] {
  return STORAGE_LOTS.map(lot => lot.name);
}
