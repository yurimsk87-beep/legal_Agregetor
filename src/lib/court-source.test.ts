import assert from "node:assert/strict";
import { isOfficialCourtSource } from "./court-source";

assert.equal(isOfficialCourtSource("https://sudrf.ru/index.php?id=300"), true);
assert.equal(isOfficialCourtSource("https://example.sudrf.ru/"), true);
assert.equal(isOfficialCourtSource("https://1.msudrf.ru/"), true);
assert.equal(isOfficialCourtSource("https://mos-gorsud.ru/"), true);
assert.equal(isOfficialCourtSource("https://sudrf.ru.example.com/"), false);
assert.equal(isOfficialCourtSource("https://example.com/?court=sudrf.ru"), false);
assert.equal(isOfficialCourtSource("javascript:alert(1)"), false);

console.log("court source tests passed");
