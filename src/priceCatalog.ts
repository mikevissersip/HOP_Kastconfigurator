export interface PriceCatalogEntry {
  name: string;
  price: number;
  deliveryDays: number;
}

export const priceCatalog: PriceCatalogEntry[] = [
  {
    "name": "AX1009000",
    "price": 476.5,
    "deliveryDays": 21
  },
  {
    "name": "Siemens 230V",
    "price": 100,
    "deliveryDays": 3
  },
  {
    "name": "Siemens 400V",
    "price": 100,
    "deliveryDays": 6
  },
  {
    "name": "EATON 230V",
    "price": 34,
    "deliveryDays": 3
  },
  {
    "name": "EATON 400V",
    "price": 45,
    "deliveryDays": 4
  },
  {
    "name": "24V automaat",
    "price": 50,
    "deliveryDays": 2
  },
  {
    "name": "AI",
    "price": 48,
    "deliveryDays": 2
  },
  {
    "name": "AO",
    "price": 34,
    "deliveryDays": 2
  },
  {
    "name": "BaseUnit Continue",
    "price": 34,
    "deliveryDays": 1
  },
  {
    "name": "Baseunit Start",
    "price": 32,
    "deliveryDays": 1
  },
  {
    "name": "DI",
    "price": 67,
    "deliveryDays": 1
  },
  {
    "name": "DO",
    "price": 49,
    "deliveryDays": 11
  },
  {
    "name": "Safe AI",
    "price": 96,
    "deliveryDays": 1
  },
  {
    "name": "Safe DI",
    "price": 48,
    "deliveryDays": 1
  },
  {
    "name": "Safe DO",
    "price": 75,
    "deliveryDays": 1
  },
  {
    "name": "A2C2.5",
    "price": 2,
    "deliveryDays": 1
  },
  {
    "name": "AEB35SC1",
    "price": 3,
    "deliveryDays": 1
  },
  {
    "name": "Phoenix Voeding",
    "price": 135,
    "deliveryDays": 5
  },
  {
    "name": "Weidmuller Voeding",
    "price": 245,
    "deliveryDays": 5
  }
];
