export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  image?: string;
}

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Cloud 9 Chocolate Bar', category: 'Candy', price: 15, cost: 10, stock: 45 },
  { id: 'p2', name: 'San Mig Coffee 3-in-1', category: 'Coffee', price: 12, cost: 8, stock: 30 },
  { id: 'p3', name: 'Sky Flakes Crackers', category: 'Biscuits', price: 8, cost: 5, stock: 60 },
  { id: 'p4', name: 'Piattos Cheese Flavor', category: 'Chips', price: 25, cost: 18, stock: 20 },
  { id: 'p5', name: 'Boy Bawang Cornick', category: 'Chips', price: 15, cost: 10, stock: 50 },
  { id: 'p6', name: 'Funchai Noodle Soup', category: 'Stationery', price: 20, cost: 14, stock: 15 },
  { id: 'p7', name: 'Flexpen Ballpoint Black', category: 'Stationery', price: 12, cost: 7, stock: 40 },
  { id: 'p8', name: 'Binder Notebook 80 leaves', category: 'Stationery', price: 45, cost: 32, stock: 12 },
  { id: 'p9', name: 'Nissin Cup Noodles', category: 'Biscuits', price: 35, cost: 26, stock: 25 },
  { id: 'p10', name: 'Nescafe Creamy White', category: 'Coffee', price: 15, cost: 10, stock: 35 },
  { id: 'p11', name: 'Nova Multigrain Snacks', category: 'Chips', price: 28, cost: 20, stock: 18 },
  { id: 'p12', name: 'Choco Mallow Bar', category: 'Candy', price: 10, cost: 6, stock: 55 }
];
