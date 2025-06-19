// Test file for symbol renaming functionality

class Calculator {
  private value: number;

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  add(number: number): Calculator {
    this.value += number;
    return this;
  }

  subtract(number: number): Calculator {
    this.value -= number;
    return this;
  }

  multiply(factor: number): Calculator {
    this.value *= factor;
    return this;
  }

  divide(divisor: number): Calculator {
    if (divisor === 0) {
      throw new Error("Cannot divide by zero");
    }
    this.value /= divisor;
    return this;
  }

  getValue(): number {
    return this.value;
  }

  reset(): void {
    this.value = 0;
  }
}

function createCalculator(startValue?: number): Calculator {
  return new Calculator(startValue);
}

const myCalculator = createCalculator(10);
const result = myCalculator
  .add(5)
  .multiply(2)
  .subtract(3)
  .getValue();

console.log("Result:", result);

// Example usage with variables to rename
const userName = "John Doe";
const userAge = 30;

function greetUser(name: string, age: number): string {
  return `Hello ${name}, you are ${age} years old!`;
}

const greeting = greetUser(userName, userAge);
console.log(greeting);

export { Calculator, createCalculator, greetUser };