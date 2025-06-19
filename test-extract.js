function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total + calculateTax(total);
}

function calculateTax(amount) {
  return amount * 0.08;
}

const items = [
  { price: 10, quantity: 2 },
  { price: 5, quantity: 3 },
];

const result = calculateTotal(items);
console.log("Total:", result);
