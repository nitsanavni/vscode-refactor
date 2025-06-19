// Test file for symbol renaming functionality

class MathCalculator {
  private value: number;

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  add(number: number): MathCalculator {
    this.value += number;
    return this;
  }

  subtract(number: number): MathCalculator {
    this.value -= number;
    return this;
  }

  multiply(factor: number): MathCalculator {
    this.value *= factor;
    return this;
  }

  divide(divisor: number): MathCalculator {
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

function createCalculator(startValue?: number): MathCalculator {
  return new MathCalculator(startValue);
}

const myCalculator = createCalculator(10);
const result = myCalculator
  .add(5)
  .multiply(2)
  .subtract(3)
  .getValue();

console.log("Result:", result);

// Example usage with variables to rename
const personName = "John Doe";
const userAge = 30;

function greetUser(name: string, age: number): string {
  return `Hello ${name}, you are ${age} years old!`;
}

const greeting = greetUser(personName, userAge);
console.log(greeting);

export { MathCalculator as Calculator, createCalculator, greetUser };