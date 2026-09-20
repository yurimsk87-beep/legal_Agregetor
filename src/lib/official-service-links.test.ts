import assert from "node:assert/strict";
import { getOfficialServiceForField, OFFICIAL_SERVICE_LINKS } from "@/data/official-service-links";

assert.equal(OFFICIAL_SERVICE_LINKS.court.url, "https://sudrf.ru/index.php?id=300");
assert.match(OFFICIAL_SERVICE_LINKS.notary.url ?? "", /^https:\/\/data\.notariat\.ru\//);
assert.match(OFFICIAL_SERVICE_LINKS.fssp.url ?? "", /^https:\/\/fssp\.gov\.ru\//);
assert.match(OFFICIAL_SERVICE_LINKS.zags.url ?? "", /^https:\/\/www\.gosuslugi\.ru\//);
assert.equal(OFFICIAL_SERVICE_LINKS.guardianship.url, null);
assert.match(OFFICIAL_SERVICE_LINKS.guardianship.description, /Единого подтверждённого федерального справочника нет/);
assert.equal(getOfficialServiceForField("courtSource"), "court");
assert.equal(getOfficialServiceForField("notaryRegion"), "notary");
assert.equal(getOfficialServiceForField("bailiffOffice"), "fssp");
assert.equal(getOfficialServiceForField("zagsOffice"), "zags");
assert.equal(getOfficialServiceForField("authorityName"), "guardianship");

console.log("official service link tests passed");

