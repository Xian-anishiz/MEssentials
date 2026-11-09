import { INITIAL_PRODUCTS, type Product } from '$mocks/products';

const STORAGE_KEY = 'messentials.mockup.v1.store.products';

export interface CartItem {
  product: Product;
  quantity: number;
}

export function createStoreState() {
  let products = $state<Product[]>(INITIAL_PRODUCTS);
  let cart = $state<Map<string, number>>(new Map());

  // Load from browser storage if available
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          products = parsed;
        }
      } catch (e) {
        console.error('Failed to load mockup store products', e);
      }
    }
  }

  function saveProducts() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }
  }

  const cartItems = $derived.by(() => {
    const items: CartItem[] = [];
    cart.forEach((qty, id) => {
      const prod = products.find(p => p.id === id);
      if (prod && qty > 0) {
        items.push({ product: prod, quantity: qty });
      }
    });
    return items;
  });

  const cartTotal = $derived.by(() => {
    let total = 0;
    cartItems.forEach(item => {
      total += item.product.price * item.quantity;
    });
    return total;
  });

  const cartItemCount = $derived.by(() => {
    let count = 0;
    cart.forEach(qty => count += qty);
    return count;
  });

  return {
    get products() { return products; },
    get cartItems() { return cartItems; },
    get cartTotal() { return cartTotal; },
    get cartItemCount() { return cartItemCount; },
    updateQuantity(productId: string, delta: number) {
      const current = cart.get(productId) || 0;
      const next = Math.max(0, current + delta);
      const newCart = new Map(cart);
      if (next === 0) {
        newCart.delete(productId);
      } else {
        newCart.set(productId, next);
      }
      cart = newCart;
    },
    setQuantity(productId: string, qty: number) {
      const newCart = new Map(cart);
      if (qty <= 0) {
        newCart.delete(productId);
      } else {
        newCart.set(productId, qty);
      }
      cart = newCart;
    },
    clearCart() {
      cart = new Map();
    },
    addProduct(newProd: Omit<Product, 'id'>) {
      const id = 'p_' + Math.random().toString(36).substr(2, 9);
      products = [...products, { id, ...newProd }];
      saveProducts();
    },
    updateProduct(id: string, updated: Partial<Product>) {
      products = products.map(p => p.id === id ? { ...p, ...updated } : p);
      saveProducts();
    }
  };
}

export const storeState = createStoreState();
