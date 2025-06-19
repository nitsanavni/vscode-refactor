// Fresh test file for save functionality testing
class DocumentManager {
  private docs: string[];

  constructor() {
    this.docs = [];
  }

  addDocument(doc: string): void {
    this.docs.push(doc);
  }

  getDocuments(): string[] {
    return this.docs;
  }
}

const manager = new DocumentManager();
manager.addDocument("test.txt");
const allDocs = manager.getDocuments();

export { DocumentManager };