export type VizlaRoute = "Storage Lot Destination" | "Cache Destination";

export const DRIVERS = ['Naz', 'Roger', 'Carla V', 'Dana M'] as const;

export interface Car {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  client: string;
  zone: 'Dallas-North' | 'Dallas-East' | 'Dallas-South' | 'Dallas-West';
  timeLocated: 'Less than 1 hour' | 'Over 1 hour' | 'Over 2 hours' | '5+ hours';
  image: string;
  yearMakeModel: string;
  plate: string;
  address: string;
  lender: string;
  locatedDate: string;
  locatedAgo: string;
  reachable: boolean;
  notRusted: boolean;
  vizlaRoute?: VizlaRoute;
  assignedDriver?: "Naz" | "Roger" | "Carla V" | "Dana M";
  daysSinceLocated?: number;
  pendingOrder?: boolean;
}

export const mockCars: Car[] = [
  // Monday
  {
    id: '1',
    day: 'Monday',
    client: 'Client A',
    zone: 'Dallas-North',
    timeLocated: 'Less than 1 hour',
    image: '/images/cars/cars1.jpg',
    yearMakeModel: '2025 Tesla Model 3, White',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-16',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Storage Lot Destination',
    assignedDriver: 'Naz',
    daysSinceLocated: 0,
    pendingOrder: false,
  },
  {
    id: '2',
    day: 'Monday',
    client: 'Client B',
    zone: 'Dallas-East',
    timeLocated: 'Over 1 hour',
    image: '/images/cars/cars2.jpg',
    yearMakeModel: '2019 Audi A5, Black',  
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-16',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Cache Destination',
    assignedDriver: 'Roger',
    daysSinceLocated: 1,
    pendingOrder: true,
  },
  {
    id: '3',
    day: 'Monday',
    client: 'Client C',
    zone: 'Dallas-South',
    timeLocated: 'Over 2 hours',
    image: '/images/cars/cars3.jpg',
    yearMakeModel: '2024 Chrysler, Black',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-16',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Storage Lot Destination',
    assignedDriver: 'Carla V',
    daysSinceLocated: 2,
    pendingOrder: false,
  },
  // Tuesday
  {
    id: '4',
    day: 'Tuesday',
    client: 'Capital One',
    zone: 'Dallas-West',
    timeLocated: '5+ hours',
    image: '/images/cars/cars4.jpg',
    yearMakeModel: '2021 Honda Civic, Black',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-17',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Cache Destination',
    assignedDriver: 'Dana M',
    daysSinceLocated: 5,
    pendingOrder: false,
  },
  {
    id: '5',
    day: 'Tuesday',
    client: 'Client A',
    zone: 'Dallas-North',
    timeLocated: 'Less than 1 hour',
    image: '/images/cars/cars5.jpg',
    yearMakeModel: '2019 Dodge Ram, Silver',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-17',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Storage Lot Destination',
    assignedDriver: 'Naz',
    daysSinceLocated: 6,
    pendingOrder: true,
  },
  {
    id: '6',
    day: 'Tuesday',
    client: 'Client B',
    zone: 'Dallas-East',
    timeLocated: 'Over 1 hour',
    image: '/images/cars/cars6.jpg',
    yearMakeModel: '2011 Ford Escape, Silver',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-17',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Cache Destination',
    assignedDriver: 'Roger',
    daysSinceLocated: 7,
    pendingOrder: false,
  },
  // Wednesday
  {
    id: '7',
    day: 'Wednesday',
    client: 'Client C',
    zone: 'Dallas-South',
    timeLocated: 'Over 2 hours',
    image: '/images/cars/cars7.jpg',
    yearMakeModel: '2022 BMW M8, Silver',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-18',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Storage Lot Destination',
    assignedDriver: 'Carla V',
    daysSinceLocated: 3,
    pendingOrder: false,
  },
  {
    id: '8',
    day: 'Wednesday',
    client: 'Capital One',
    zone: 'Dallas-West',
    timeLocated: '5+ hours',
    image: '/images/cars/cars8.jpg',
    yearMakeModel: '2019 Fiat 500, Silver',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-18',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Cache Destination',
    assignedDriver: 'Dana M',
    daysSinceLocated: 8,
    pendingOrder: false,
  },
  {
    id: '9',
    day: 'Wednesday',
    client: 'Client A',
    zone: 'Dallas-North',
    timeLocated: 'Less than 1 hour',
    image: '/images/cars/cars9.jpg',
    yearMakeModel: '2023 Ford F150, Silver',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-18',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Storage Lot Destination',
    assignedDriver: 'Naz',
    daysSinceLocated: 4,
    pendingOrder: true,
  },
  // Thursday
  {
    id: '10',
    day: 'Thursday',
    client: 'Client B',
    zone: 'Dallas-East',
    timeLocated: 'Over 1 hour',
    image: '/images/cars/cars10.jpg',
    yearMakeModel: '2021 Hyundai, White',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-19',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Cache Destination',
    assignedDriver: 'Roger',
    daysSinceLocated: 1,
    pendingOrder: false,
  },
  {
    id: '11',
    day: 'Thursday',
    client: 'Client C',
    zone: 'Dallas-South',
    timeLocated: 'Over 2 hours',
    image: '/images/cars/cars11.jpg',
    yearMakeModel: '2012 Nissan Rogue, Silver',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-19',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Storage Lot Destination',
    assignedDriver: 'Carla V',
    daysSinceLocated: 2,
    pendingOrder: false,
  },
  // Friday
  {
    id: '12',
    day: 'Friday',
    client: 'Capital One',
    zone: 'Dallas-West',
    timeLocated: '5+ hours',
    image: '/images/cars/cars12.jpg',
    yearMakeModel: '2010 Ford Expedition, Maroon',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-20',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Cache Destination',
    assignedDriver: 'Dana M',
    daysSinceLocated: 6,
    pendingOrder: false,
  },
  {
    id: '13',
    day: 'Friday',
    client: 'Client A',
    zone: 'Dallas-North',
    timeLocated: 'Less than 1 hour',
    image: '/images/cars/cars13.jpg',
    yearMakeModel: '2022 Kia Silvr, Silver',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-16',
    locatedAgo: '103 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Storage Lot Destination',
    assignedDriver: 'Naz',
    daysSinceLocated: 0,
    pendingOrder: false,
  },
  {
    id: '14',
    day: 'Friday',
    client: 'Client B',
    zone: 'Dallas-East',
    timeLocated: 'Over 1 hour',
    image: '/images/cars/cars14.jpg',
    yearMakeModel: '2015 Kia Sorrento, White',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-20',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Cache Destination',
    assignedDriver: 'Roger',
    daysSinceLocated: 1,
    pendingOrder: false,
  },
  // Saturday
  {
    id: '15',
    day: 'Saturday',
    client: 'Client C',
    zone: 'Dallas-South',
    timeLocated: 'Over 2 hours',
    image: '/images/cars/cars15.jpg',
    yearMakeModel: '2023 Toyota Rav 4, Gray',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-21',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Storage Lot Destination',
    assignedDriver: 'Carla V',
    daysSinceLocated: 3,
    pendingOrder: false,
  },
  {
    id: '16',
    day: 'Saturday',
    client: 'Capital One',
    zone: 'Dallas-West',
    timeLocated: '5+ hours',
    image: '/images/cars/cars16.jpg',
    yearMakeModel: '2012 Chrysler 200, Maroon',
    plate: 'ABC-123',
    address: '456 Street, Maryland',
    lender: 'Capital One',
    locatedDate: '2025-09-21',
    locatedAgo: '3 minutes ago',
    reachable: true,
    notRusted: true,
    vizlaRoute: 'Cache Destination',
    assignedDriver: 'Dana M',
    daysSinceLocated: 5,
    pendingOrder: false,
  },
];

// Helper functions for dashboard
export function kpiTotals(cars: Car[]) {
  const total = cars.length;
  // avg time since located (rough): from `locatedAgo` strings -> minutes (support "minutes", "hour", "hours")
  const toMin = (s: string) => s.includes("minute")
      ? parseInt(s)
      : s.includes("hour")
        ? parseInt(s) * 60
        : 0;
  const avgMins = Math.round(cars.reduce((a,c)=>a+toMin(c.locatedAgo),0) / Math.max(1,total));
  const fivePlus = cars.filter(c=> (c.daysSinceLocated ?? 0) >= 5).length;
  const missedRevenue = fivePlus * 550; // placeholder rate
  const pending = cars.filter(c=> c.pendingOrder).length;
  return { total, avgMins, fivePlus, missedRevenue, pending };
}

export function breakdownBy<K extends "client"|"zone"|"assignedDriver">(cars: Car[], key: K) {
  const total = cars.length || 1;
  const map = new Map<string, number>();
  for (const c of cars) {
    const k = String((c as any)[key] ?? "Unassigned");
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name,count])=>({ name, count, pct: Math.round((count/total)*100) }))
    .sort((a,b)=> b.count - a.count);
}