export type TowCard = {
  id: string;
  day: 'Friday';
  client: string;
  year: number;
  make: string;
  model: string;
  color: string;
  plate: string;
  vin: string;
  street: string;
  city: string;
  zip: string;
  fullAddress: string;
  img: string;
  images?: string[]; // Multiple images from spotter submissions
  // New fields for coordinate handling
  lat?: number;
  lng?: number;
  isDefaultCoords?: boolean; // true if using default Baltimore coordinates
  // Spotter information fields
  reachable?: 'Reachable' | 'Not reachable';
  rusted?: 'Rusted' | 'Not rusted';
  locationType?: 'Apartment Secured' | 'Apartment Unsecured' | 'Parking Lot Secured' | 'Parking Lot Unsecured' | 'POE' | 'Retail' | 'Single Family Home' | 'Single Family Home Gated' | 'Townhouse';
  parked?: 'Pulled in' | 'Backed in' | 'Parallel';
  notes?: string[];
};

export const LOT_ADDRESS = "4221 Curtis Ave, Baltimore, MD 21226";
export const STASH_ADDRESS = "751 W Patapsco Ave, Halethorpe, MD 21227";

// Vehicle data for realistic generation
const VEHICLE_MODELS = [
  { make: 'Toyota', model: 'Camry' },
  { make: 'Honda', model: 'Civic' },
  { make: 'Ford', model: 'F-150' },
  { make: 'Nissan', model: 'Altima' },
  { make: 'Chevy', model: 'Malibu' },
  { make: 'Hyundai', model: 'Elantra' },
  { make: 'Kia', model: 'Optima' },
  { make: 'Jeep', model: 'Grand Cherokee' },
  { make: 'Toyota', model: 'Corolla' },
  { make: 'Honda', model: 'Accord' }
];

const COLORS = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red'];

// Generate realistic VIN (17 chars, no I/O)
function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return vin;
}

// Generate MD plate format
function generatePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  const letter1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const letter2 = letters.charAt(Math.floor(Math.random() * letters.length));
  const letter3 = letters.charAt(Math.floor(Math.random() * letters.length));
  const num1 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const num2 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const num3 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const num4 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  
  return `MD-${letter1}${letter2}${letter3}-${num1}${num2}${num3}${num4}`;
}

// Parse address into components
function parseAddress(fullAddress: string): { street: string; city: string; zip: string } {
  // Handle coordinate-only addresses
  if (fullAddress.includes(',') && !isNaN(parseFloat(fullAddress.split(',')[0]))) {
    return {
      street: fullAddress,
      city: '',
      zip: ''
    };
  }
  
  // Handle regular addresses
  const parts = fullAddress.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    const zipMatch = parts[parts.length - 1].match(/(\d{5})/);
    const zip = zipMatch ? zipMatch[1] : '';
    const city = parts[parts.length - 2] || '';
    const street = parts.slice(0, -2).join(', ') || fullAddress;
    
    return { street, city, zip };
  }
  
  return {
    street: fullAddress,
    city: '',
    zip: ''
  };
}

// Generate TowCard from address and client data
function generateTowCard(id: string, client: string, fullAddress: string): TowCard {
  const { street, city, zip } = parseAddress(fullAddress);
  const vehicleModel = VEHICLE_MODELS[parseInt(id) % VEHICLE_MODELS.length];
  const year = 2016 + (parseInt(id) % 7); // 2016-2022
  const color = COLORS[parseInt(id) % COLORS.length];
  const imgIndex = (parseInt(id) % 16) + 1; // 1-16
  
  return {
    id,
    day: 'Friday',
    client,
    year,
    make: vehicleModel.make,
    model: vehicleModel.model,
    color,
    plate: generatePlate(),
    vin: generateVIN(),
    street,
    city,
    zip,
    fullAddress,
    img: `/images/cars/vehicle-${imgIndex}.jpg`
  };
}

export const TOW_CARDS: TowCard[] = [
  generateTowCard("1", "PK", "15 Colony Hill Ct, Arbutus, MD 21227"),
  generateTowCard("2", "First Commonwealth", "111 W Heath St, Baltimore, MD 21230"),
  generateTowCard("3", "Capital One", "3613 Mactavish Ave, Baltimore, MD 21229"),
  generateTowCard("4", "MV", "39.282037149426003, -76.635591732533996"),
  generateTowCard("5", "PK", "11 S Eutaw St, Baltimore, MD 21201"),
  generateTowCard("6", "GM", "200 E Cross St, Baltimore, MD 21230"),
  generateTowCard("7", "MV", "12 N Calvert St, Baltimore, MD 21202"),
  generateTowCard("8", "United Bank", "23 S Gay St, Baltimore, MD 21202"),
  generateTowCard("9", "Automotive Fleet", "421 West Lexington Street, Baltimore, MD 21201"),
  generateTowCard("10", "Primeritus", "7 Saint Paul St Ste 625, Baltimore, MD 21202"),
  generateTowCard("11", "PK Willis", "100 Violet Hill White Way, Baltimore, MD 21201"),
  generateTowCard("12", "Summs Skip", "828 Harlem Ave, Baltimore, MD 21201"),
  generateTowCard("13", "MV", "443 Watty Ct, Baltimore, MD 21201"),
  generateTowCard("14", "MV", "859 Washington Blvd, Baltimore, MD 21230"),
  generateTowCard("15", "Bridgecrest", "39.296204203161999, -76.625554409623007"),
  generateTowCard("16", "LPS", "611 S Charles St #2123, Baltimore, MD 21230"),
  generateTowCard("17", "GM", "200 E Cross St, Baltimore, MD 21230"),
  generateTowCard("18", "Advanced Alert", "39.288894095066, -76.60893709911"),
  generateTowCard("19", "PAR", "1415 Bush St, Baltimore, MD 21230"),
  generateTowCard("20", "MV", "39.282037149426003, -76.635591732533996")
];
