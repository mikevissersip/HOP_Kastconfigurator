export interface PriceCatalogEntry {
  code: string;
  price: number | null;
  deliveryDays: number | null;
}

export const priceCatalog: PriceCatalogEntry[] = [
  {
    "code": "AX1009000",
    "price": 476.5,
    "deliveryDays": 5
  },
  {
    "code": "5SL4208-7",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "5SL4608-7CC",
    "price": null,
    "deliveryDays": 15
  },
  {
    "code": "FAZ-C82",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "FAZ-C83N",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "S202M-C8",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "S203M-C8NA",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "CBME824DC0.5-10ANO-R",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "6ES7131-6BF00-0CA0",
    "price": 75.99,
    "deliveryDays": 3
  },
  {
    "code": "6ES7132-6BD20-0BA0",
    "price": 74,
    "deliveryDays": 1
  },
  {
    "code": "6ES7134-6FB00-0BA1",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "6ES7135-6FB00-0BA1",
    "price": 180.77,
    "deliveryDays": 1
  },
  {
    "code": "6ES7136-6AA00-0CA1",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "6ES7136-6BA01-0CA0",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "6ES7136-6DB01-0CA0",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "6ES7193-6BP20-0BA0",
    "price": 22.2,
    "deliveryDays": 1
  },
  {
    "code": "6ES7193-6BP20-0DA0",
    "price": 34.89,
    "deliveryDays": 1
  },
  {
    "code": "A2C2.5",
    "price": null,
    "deliveryDays": 0
  },
  {
    "code": "AEB35SC1",
    "price": null,
    "deliveryDays": null
  },
  {
    "code": "PROTOP1480W24V20A",
    "price": 400.99,
    "deliveryDays": 5
  },
  {
    "code": "QUINT4-PS1AC24DC20",
    "price": null,
    "deliveryDays": null
  }
];
