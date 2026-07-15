-- AlterTable
ALTER TABLE "City" ADD COLUMN     "namePrepositional" TEXT,
ADD COLUMN     "federalDistrict" TEXT;

-- Backfill current seeded cities
UPDATE "City" SET "namePrepositional" = 'Москве', "federalDistrict" = 'Центральный федеральный округ' WHERE "slug" = 'moskva';
UPDATE "City" SET "namePrepositional" = 'Санкт-Петербурге', "federalDistrict" = 'Северо-Западный федеральный округ' WHERE "slug" = 'sankt-peterburg';
UPDATE "City" SET "namePrepositional" = 'Краснодаре', "federalDistrict" = 'Южный федеральный округ' WHERE "slug" = 'krasnodar';
UPDATE "City" SET "namePrepositional" = 'Новосибирске', "federalDistrict" = 'Сибирский федеральный округ' WHERE "slug" = 'novosibirsk';
UPDATE "City" SET "namePrepositional" = 'Екатеринбурге', "federalDistrict" = 'Уральский федеральный округ' WHERE "slug" = 'ekaterinburg';
UPDATE "City" SET "namePrepositional" = 'Казани', "federalDistrict" = 'Приволжский федеральный округ' WHERE "slug" = 'kazan';
UPDATE "City" SET "namePrepositional" = 'Нижнем Новгороде', "federalDistrict" = 'Приволжский федеральный округ' WHERE "slug" = 'nizhnij-novgorod';
UPDATE "City" SET "namePrepositional" = 'Ростове-на-Дону', "federalDistrict" = 'Южный федеральный округ' WHERE "slug" = 'rostov-na-donu';
UPDATE "City" SET "namePrepositional" = 'Самаре', "federalDistrict" = 'Приволжский федеральный округ' WHERE "slug" = 'samara';
UPDATE "City" SET "namePrepositional" = 'Воронеже', "federalDistrict" = 'Центральный федеральный округ' WHERE "slug" = 'voronezh';
