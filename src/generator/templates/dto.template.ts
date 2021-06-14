import type { DMMF } from "@prisma/generator-helper";
import { scalarToTS, makeHelpers } from "../template-helpers";

interface CreateDtoTemplateParam {
  model: DMMF.Model;
  dtoSuffix: string;
  classPrefix: string;
  caseFn: (input: string) => string;
}

export function createDtoTemplate({
  model,
  dtoSuffix,
  classPrefix,
  caseFn,
}: CreateDtoTemplateParam) {
  const th = makeHelpers({
    transformCase: caseFn,
    dtoPrefix: classPrefix,
    dtoSuffix,
  });
  const mustImportPrisma = model.fields
    .filter(({ kind }) => kind === "scalar")
    .some(({ type }) => scalarToTS(type).includes("Prisma"));

  const dtosToImport = Array.from(
    new Set(
      model.fields
        .filter(({ kind }) => kind === "object")
        // removes fields representing a [self-relation](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#self-relations)
        .filter(({ type }) => type !== model.name)
        .map(({ type }) => type)
    )
  );

  const enumsToImport = Array.from(
    new Set(
      model.fields.filter(({ kind }) => kind === "enum").map(({ type }) => type)
    )
  );

  const template = `
  ${th.when(mustImportPrisma, "import { Prisma } from '@prisma/client';")}

  ${th.importDtos(dtosToImport)}

  ${th.importEnums(enumsToImport)}

  export class ${classPrefix}${model.name}${dtoSuffix} {
    ${th.fieldsToClassProps(model.fields)}
  }
  `;

  return template;
}
