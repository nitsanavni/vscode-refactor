// Another test file that's not currently open
class DataProcessor {
  private items: any[];

  constructor() {
    this.items = [];
  }

  addItem(item: any): void {
    this.items.push(item);
  }

  processData(): any[] {
    return this.items.map(item => ({ ...item, processed: true }));
  }
}

const processor = new DataProcessor();
processor.addItem({ name: "test" });
const result = processor.processData();

export { DataProcessor };