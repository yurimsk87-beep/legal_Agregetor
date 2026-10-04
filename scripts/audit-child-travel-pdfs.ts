import assert from "node:assert/strict";
import { buildChildTravelPdfText, createChildTravelPdfBlob } from "../src/lib/child-travel-pdf";
import { validateChildTravel } from "../src/lib/child-travel-validator";

async function run() {
  const decision = validateChildTravel("disagreement", { applicantData: "Иванова Анна", childData: "Иванов Пётр", objectorData: "Иванов Иван", disagreementScope: "Все государства до 01.01.2027", desiredTrip: "Беларусь, октябрь 2026", childInterests: "Семейная поездка", evidence: "Билеты и бронь", region: "region-moscow", withdrawalPossible: "no" });
  assert.equal(decision.filingReady, false);
  assert.match(buildChildTravelPdfText(decision), /Готово к подаче: нет/);
  assert.match(buildChildTravelPdfText(decision), /ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
  const pdf = await createChildTravelPdfBlob(decision);
  assert.equal(pdf.size > 1000, true);
  console.log(`Child-travel document audit passed: PDF ${pdf.size}.`);
}
void run();
