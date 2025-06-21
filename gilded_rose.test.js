import { describe, test, expect } from "bun:test";

// Import using require since gilded_rose.js uses CommonJS
const { Item, Shop } = require("./gilded_rose.js");

describe("Gilded Rose", () => {
  describe("Item", () => {
    test("should create item with name, sellIn, and quality", () => {
      const item = new Item("foo", 0, 0);
      expect(item.name).toBe("foo");
      expect(item.sellIn).toBe(0);
      expect(item.quality).toBe(0);
    });
  });

  describe("Shop", () => {
    test("should create shop with empty items array by default", () => {
      const shop = new Shop();
      expect(shop.items).toEqual([]);
    });

    test("should create shop with provided items", () => {
      const items = [new Item("foo", 0, 0)];
      const shop = new Shop(items);
      expect(shop.items).toBe(items);
    });
  });

  describe("Regular Items", () => {
    test("should decrease sellIn and quality by 1 for regular items", () => {
      const items = [new Item("foo", 5, 10)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(4);
      expect(items[0].quality).toBe(9);
    });

    test("should decrease quality by 2 when sellIn date has passed", () => {
      const items = [new Item("foo", 0, 10)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-1);
      expect(items[0].quality).toBe(8);
    });

    test("should not decrease quality below 0", () => {
      const items = [new Item("foo", 5, 0)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(4);
      expect(items[0].quality).toBe(0);
    });

    test("should not decrease quality below 0 when sellIn date has passed", () => {
      const items = [new Item("foo", 0, 1)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-1);
      expect(items[0].quality).toBe(0);
    });

    test("should handle quality of 0 when sellIn date has passed", () => {
      const items = [new Item("foo", 0, 0)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-1);
      expect(items[0].quality).toBe(0);
    });
  });

  describe("Aged Brie", () => {
    test("should increase quality as it ages", () => {
      const items = [new Item("Aged Brie", 2, 0)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(1);
      expect(items[0].quality).toBe(1);
    });

    test("should increase quality by 2 when sellIn date has passed", () => {
      const items = [new Item("Aged Brie", 0, 0)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-1);
      expect(items[0].quality).toBe(2);
    });

    test("should not increase quality above 50", () => {
      const items = [new Item("Aged Brie", 2, 50)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(1);
      expect(items[0].quality).toBe(50);
    });

    test("should not increase quality above 50 when sellIn date has passed", () => {
      const items = [new Item("Aged Brie", 0, 49)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-1);
      expect(items[0].quality).toBe(50);
    });

    test("should handle quality at 49 when sellIn date has passed", () => {
      const items = [new Item("Aged Brie", 0, 48)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-1);
      expect(items[0].quality).toBe(50);
    });
  });

  describe("Sulfuras, Hand of Ragnaros", () => {
    test("should never change sellIn or quality", () => {
      const items = [new Item("Sulfuras, Hand of Ragnaros", 0, 80)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(0);
      expect(items[0].quality).toBe(80);
    });

    test("should never change sellIn or quality even with negative sellIn", () => {
      const items = [new Item("Sulfuras, Hand of Ragnaros", -1, 80)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-1);
      expect(items[0].quality).toBe(80);
    });

    test("should never change quality even when quality is 0", () => {
      const items = [new Item("Sulfuras, Hand of Ragnaros", 5, 0)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(5);
      expect(items[0].quality).toBe(0);
    });
  });

  describe("Backstage passes to a TAFKAL80ETC concert", () => {
    test("should increase quality by 1 when more than 10 days left", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 15, 20)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(14);
      expect(items[0].quality).toBe(21);
    });

    test("should increase quality by 2 when 10 days or less", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 10, 20)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(9);
      expect(items[0].quality).toBe(22);
    });

    test("should increase quality by 2 when 6-10 days left", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 6, 20)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(5);
      expect(items[0].quality).toBe(22);
    });

    test("should increase quality by 3 when 5 days or less", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 5, 20)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(4);
      expect(items[0].quality).toBe(23);
    });

    test("should increase quality by 3 when 1 day left", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 1, 20)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(0);
      expect(items[0].quality).toBe(23);
    });

    test("should drop quality to 0 after concert", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 0, 20)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-1);
      expect(items[0].quality).toBe(0);
    });

    test("should not increase quality above 50", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 15, 50)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(14);
      expect(items[0].quality).toBe(50);
    });

    test("should not increase quality above 50 when 10 days left", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 10, 49)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(9);
      expect(items[0].quality).toBe(50);
    });

    test("should not increase quality above 50 when 5 days left", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 5, 48)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(4);
      expect(items[0].quality).toBe(50);
    });

    test("should handle quality at 49 when 10 days left", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 10, 48)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(9);
      expect(items[0].quality).toBe(50);
    });

    test("should handle quality at 48 when 5 days left", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 5, 47)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(4);
      expect(items[0].quality).toBe(50);
    });
  });

  describe("Multiple Items", () => {
    test("should handle multiple different items", () => {
      const items = [
        new Item("foo", 5, 10),
        new Item("Aged Brie", 3, 5),
        new Item("Sulfuras, Hand of Ragnaros", 0, 80),
        new Item("Backstage passes to a TAFKAL80ETC concert", 15, 20)
      ];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(4);
      expect(items[0].quality).toBe(9);
      expect(items[1].sellIn).toBe(2);
      expect(items[1].quality).toBe(6);
      expect(items[2].sellIn).toBe(0);
      expect(items[2].quality).toBe(80);
      expect(items[3].sellIn).toBe(14);
      expect(items[3].quality).toBe(21);
    });

    test("should return updated items array", () => {
      const items = [new Item("foo", 5, 10)];
      const shop = new Shop(items);
      
      const result = shop.updateQuality();
      
      expect(result).toBe(items);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty shop", () => {
      const shop = new Shop([]);
      
      const result = shop.updateQuality();
      
      expect(result).toEqual([]);
    });

    test("should handle negative sellIn values for regular items", () => {
      const items = [new Item("foo", -5, 10)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-6);
      expect(items[0].quality).toBe(8);
    });

    test("should handle negative sellIn values for Aged Brie", () => {
      const items = [new Item("Aged Brie", -5, 10)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-6);
      expect(items[0].quality).toBe(12);
    });

    test("should handle negative sellIn values for Backstage passes", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", -5, 10)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-6);
      expect(items[0].quality).toBe(0);
    });
  });

  describe("Boundary Conditions", () => {
    test("should handle backstage passes at exactly 11 days", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 11, 20)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(10);
      expect(items[0].quality).toBe(21);
    });

    test("should handle backstage passes at exactly 6 days", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 6, 20)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(5);
      expect(items[0].quality).toBe(22);
    });

    test("should handle backstage passes at exactly 0 days", () => {
      const items = [new Item("Backstage passes to a TAFKAL80ETC concert", 0, 20)];
      const shop = new Shop(items);
      
      shop.updateQuality();
      
      expect(items[0].sellIn).toBe(-1);
      expect(items[0].quality).toBe(0);
    });
  });
});