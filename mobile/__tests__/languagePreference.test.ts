jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("expo-localization", () => ({ getLocales: () => [] }));

import { languageFromLocales } from "../src/lib/languagePreference";

describe("mobile language preference", () => {
  test.each([
    [[{ languageCode: "es", languageTag: "es-CR" }], "es"],
    [[{ languageCode: "es", languageTag: "es" }], "es"],
    [[{ languageCode: "en", languageTag: "en-US" }], "en"],
    [[{ languageCode: "fr", languageTag: "fr-FR" }], "en"],
    [[], "en"],
  ])("maps the primary phone locale %# to a supported language", (locales, expected) => {
    expect(languageFromLocales(locales)).toBe(expected);
  });
});
