import { mergeUniqueById } from "../src/lib/search";

describe("mergeUniqueById", () => {
  test("appends new results without duplicating existing vendors", () => {
    const result = mergeUniqueById(
      [{ id: "a", name: "Alpha" }],
      [{ id: "a", name: "Alpha updated" }, { id: "b", name: "Beta" }],
    );

    expect(result).toEqual([
      { id: "a", name: "Alpha updated" },
      { id: "b", name: "Beta" },
    ]);
  });
});
