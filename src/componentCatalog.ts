export interface ComponentCatalogEntry {
  code: string;
  category: string;
  brand: string | null;
  name: string;
  modelFile: string;
  price: number | null;
  deliveryDays: number | null;
  properties: Record<string, string | number>;
}

export const componentCatalog: ComponentCatalogEntry[] = [
  {
    "code": "AX1009000",
    "category": "Kastbehuizing",
    "brand": "Rittal",
    "name": "AX1009000",
    "modelFile": "Onderdelen/AX1009000/kast.gltf",
    "price": 476.5,
    "deliveryDays": 5,
    "properties": {
      "Afmetingen (mm)": "600x380x210",
      "Materiaal": "RVS"
    }
  },
  {
    "code": "5SL4208-7",
    "category": "Installatieautomaat",
    "brand": "Siemens",
    "name": "5SL4208-7",
    "modelFile": "Onderdelen/5SL4208-7/component.gltf",
    "price": 90,
    "deliveryDays": null,
    "properties": {
      "Spanning (V)": 230,
      "Stroom (A)": 8,
      "Karakteristiek": "C"
    }
  },
  {
    "code": "5SL4608-7CC",
    "category": "Installatieautomaat",
    "brand": "Siemens",
    "name": "5SL4608-7CC",
    "modelFile": "Onderdelen/5SL4608-7CC/component.gltf",
    "price": 90,
    "deliveryDays": 15,
    "properties": {
      "Spanning (V)": 400,
      "Stroom (A)": 8,
      "Karakteristiek": "C"
    }
  },
  {
    "code": "FAZ-C82",
    "category": "Installatieautomaat",
    "brand": "Eaton",
    "name": "FAZ-C82",
    "modelFile": "Onderdelen/FAZ-C82/component.gltf",
    "price": 90,
    "deliveryDays": null,
    "properties": {
      "Spanning (V)": 415,
      "Stroom (A)": 8,
      "Karakteristiek": "C"
    }
  },
  {
    "code": "FAZ-C83N",
    "category": "Installatieautomaat",
    "brand": "Eaton",
    "name": "FAZ-C83N",
    "modelFile": "Onderdelen/FAZ-C83N/component.gltf",
    "price": 90,
    "deliveryDays": null,
    "properties": {
      "Spanning (V)": 400,
      "Stroom (A)": 8,
      "Karakteristiek": "C"
    }
  },
  {
    "code": "S202M-C8",
    "category": "Installatieautomaat",
    "brand": "ABB",
    "name": "S202M-C8",
    "modelFile": "Onderdelen/S202M-C8/component.gltf",
    "price": 90,
    "deliveryDays": null,
    "properties": {
      "Spanning (V)": 400,
      "Stroom (A)": 8,
      "Karakteristiek": "C"
    }
  },
  {
    "code": "S203M-C8NA",
    "category": "Installatieautomaat",
    "brand": "ABB",
    "name": "S203M-C8NA",
    "modelFile": "Onderdelen/S203M-C8NA/component.gltf",
    "price": 90,
    "deliveryDays": null,
    "properties": {
      "Spanning (V)": 400,
      "Stroom (A)": 8,
      "Karakteristiek": "C"
    }
  },
  {
    "code": "CBME824DC0.5-10ANO-R",
    "category": "Installatieautomaat",
    "brand": "Phoenix Contact",
    "name": "CBME824DC0.5-10ANO-R",
    "modelFile": "Onderdelen/CBME824DC0.5-10ANO-R/component.gltf",
    "price": 90,
    "deliveryDays": null,
    "properties": {
      "Spanning (V)": 24,
      "Stroom (A)": 10,
      "Karakteristiek": "Elektronisch"
    }
  },
  {
    "code": "6ES7131-6BF00-0CA0",
    "category": "IO-unit",
    "brand": "Siemens",
    "name": "6ES7131-6BF00-0CA0",
    "modelFile": "Onderdelen/6ES7131-6BF00-0CA0/component.gltf",
    "price": 75.99,
    "deliveryDays": 3,
    "properties": {
      "Type": "DI",
      "Aantal analoge ingangen": 0,
      "Aantal analoge uitgangen": 0,
      "Aantal digitale ingangen": 8,
      "Aantal digitale uitgangen": 0,
      "Aantal safe digitale ingangen": 0,
      "Aantal safe digitale uitgangen": 0,
      "Aantal safe analoge uitgangen": 0
    }
  },
  {
    "code": "6ES7132-6BD20-0BA0",
    "category": "IO-unit",
    "brand": "Siemens",
    "name": "6ES7132-6BD20-0BA0",
    "modelFile": "Onderdelen/6ES7132-6BD20-0BA0/component.gltf",
    "price": 74,
    "deliveryDays": 1,
    "properties": {
      "Type": "DQ",
      "Aantal analoge ingangen": 0,
      "Aantal analoge uitgangen": 0,
      "Aantal digitale ingangen": 0,
      "Aantal digitale uitgangen": 4,
      "Aantal safe digitale ingangen": 0,
      "Aantal safe digitale uitgangen": 0,
      "Aantal safe analoge uitgangen": 0
    }
  },
  {
    "code": "6ES7134-6FB00-0BA1",
    "category": "IO-unit",
    "brand": "Siemens",
    "name": "6ES7134-6FB00-0BA1",
    "modelFile": "Onderdelen/6ES7134-6FB00-0BA1/component.gltf",
    "price": null,
    "deliveryDays": null,
    "properties": {
      "Type": "AI",
      "Aantal analoge ingangen": 2,
      "Aantal analoge uitgangen": 0,
      "Aantal digitale ingangen": 0,
      "Aantal digitale uitgangen": 0,
      "Aantal safe digitale ingangen": 0,
      "Aantal safe digitale uitgangen": 0,
      "Aantal safe analoge uitgangen": 0
    }
  },
  {
    "code": "6ES7135-6FB00-0BA1",
    "category": "IO-unit",
    "brand": "Siemens",
    "name": "6ES7135-6FB00-0BA1",
    "modelFile": "Onderdelen/6ES7135-6FB00-0BA1/component.gltf",
    "price": 180.77,
    "deliveryDays": 1,
    "properties": {
      "Type": "AQ",
      "Aantal analoge ingangen": 0,
      "Aantal analoge uitgangen": 2,
      "Aantal digitale ingangen": 0,
      "Aantal digitale uitgangen": 0,
      "Aantal safe digitale ingangen": 0,
      "Aantal safe digitale uitgangen": 0,
      "Aantal safe analoge uitgangen": 0
    }
  },
  {
    "code": "6ES7136-6AA00-0CA1",
    "category": "IO-unit",
    "brand": "Siemens",
    "name": "6ES7136-6AA00-0CA1",
    "modelFile": "Onderdelen/6ES7136-6AA00-0CA1/component.gltf",
    "price": null,
    "deliveryDays": null,
    "properties": {
      "Type": "F-AI",
      "Aantal analoge ingangen": 4,
      "Aantal analoge uitgangen": 0,
      "Aantal digitale ingangen": 0,
      "Aantal digitale uitgangen": 0,
      "Aantal safe digitale ingangen": 0,
      "Aantal safe digitale uitgangen": 0,
      "Aantal safe analoge uitgangen": 0
    }
  },
  {
    "code": "6ES7136-6BA01-0CA0",
    "category": "IO-unit",
    "brand": "Siemens",
    "name": "6ES7136-6BA01-0CA0",
    "modelFile": "Onderdelen/6ES7136-6BA01-0CA0/component.gltf",
    "price": null,
    "deliveryDays": null,
    "properties": {
      "Type": "F-DI",
      "Aantal analoge ingangen": 0,
      "Aantal analoge uitgangen": 0,
      "Aantal digitale ingangen": 0,
      "Aantal digitale uitgangen": 0,
      "Aantal safe digitale ingangen": 8,
      "Aantal safe digitale uitgangen": 0,
      "Aantal safe analoge uitgangen": 0
    }
  },
  {
    "code": "6ES7136-6DB01-0CA0",
    "category": "IO-unit",
    "brand": "Siemens",
    "name": "6ES7136-6DB01-0CA0",
    "modelFile": "Onderdelen/6ES7136-6DB01-0CA0/component.gltf",
    "price": null,
    "deliveryDays": null,
    "properties": {
      "Type": "F-DQ",
      "Aantal analoge ingangen": 0,
      "Aantal analoge uitgangen": 0,
      "Aantal digitale ingangen": 0,
      "Aantal digitale uitgangen": 0,
      "Aantal safe digitale ingangen": 0,
      "Aantal safe digitale uitgangen": 4,
      "Aantal safe analoge uitgangen": 0
    }
  },
  {
    "code": "6ES7193-6BP20-0BA0",
    "category": "IO-unit voetje",
    "brand": "Siemens",
    "name": "6ES7193-6BP20-0BA0",
    "modelFile": "Onderdelen/6ES7193-6BP20-0BA0/component.gltf",
    "price": 22.2,
    "deliveryDays": 1,
    "properties": {}
  },
  {
    "code": "6ES7193-6BP20-0DA0",
    "category": "IO-unit voetje",
    "brand": "Siemens",
    "name": "6ES7193-6BP20-0DA0",
    "modelFile": "Onderdelen/6ES7193-6BP20-0DA0/component.gltf",
    "price": 34.89,
    "deliveryDays": 1,
    "properties": {}
  },
  {
    "code": "A2C2.5",
    "category": "Klem",
    "brand": "Weidmuller",
    "name": "A2C2.5",
    "modelFile": "Onderdelen/A2C2.5/component.gltf",
    "price": 1,
    "deliveryDays": 0,
    "properties": {}
  },
  {
    "code": "AEB35SC1",
    "category": "Klem",
    "brand": "Weidmuller",
    "name": "AEB35SC1",
    "modelFile": "Onderdelen/AEB35SC1/component.gltf",
    "price": 1,
    "deliveryDays": null,
    "properties": {}
  },
  {
    "code": "PROTOP1480W24V20A",
    "category": "Voeding",
    "brand": "Weidmuller",
    "name": "PROTOP1480W24V20A",
    "modelFile": "Onderdelen/PROTOP1480W24V20A/component.gltf",
    "price": 400.99,
    "deliveryDays": 5,
    "properties": {
      "Ingangsspanning (V)": 230,
      "Uitgangsspanning (V)": 24,
      "Maximale Stroom (A)": 20
    }
  },
  {
    "code": "QUINT4-PS1AC24DC20",
    "category": "Voeding",
    "brand": "Phoenix Contact",
    "name": "QUINT4-PS1AC24DC20",
    "modelFile": "Onderdelen/QUINT4-PS1AC24DC20/component.gltf",
    "price": null,
    "deliveryDays": null,
    "properties": {
      "Ingangsspanning (V)": 230,
      "Uitgangsspanning (V)": 24,
      "Maximale Stroom (A)": 20
    }
  },
  {
    "code": "PRODUCTIE-BASE",
    "category": "productie",
    "brand": "Hoppenbrouwers",
    "name": "Productie-base",
    "modelFile": "",
    "price": 500,
    "deliveryDays": 7,
    "properties": {}
  },
  {
    "code": "PRODUCTIE-PER-COMPONENT",
    "category": "productie",
    "brand": "Hoppenbrouwers",
    "name": "Productie per component",
    "modelFile": "",
    "price": 3,
    "deliveryDays": null,
    "properties": {}
  }
];
