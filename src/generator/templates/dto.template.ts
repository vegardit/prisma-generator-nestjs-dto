import type { DMMF } from "@prisma/generator-helper";
import { inspect } from "util";
import { filterModelFieldsForClass } from "../helpers";
import { scalarToTS, makeHelpers, echo } from "../template-helpers";

interface CreateDtoTemplateParam {
  model: DMMF.Model;
  includeRelationFields: boolean;
  includeRelationFromFields: boolean;
  transformCase?: (input: string) => string;
  dtoPrefix: string;
  enumPrefix: string;
  dtoSuffix: string;
  enumSuffix: string;
}

export function createDtoTemplate({
  model,
  includeRelationFields,
  includeRelationFromFields,
  transformCase = echo,
  ...preAndSuffixes
}: CreateDtoTemplateParam) {
  const t = makeHelpers({
    transformCase,
    ...preAndSuffixes,
  });

  const importPrisma = model.fields
    .filter(({ kind }) => kind === "scalar")
    .some(({ type }) => scalarToTS(type).includes("Prisma"));

  const dtosToImport = includeRelationFields
    ? Array.from(
        new Set(
          model.fields
            .filter(({ kind }) => kind === "object")
            // removes fields representing a [self-relation](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#self-relations)
            .filter(({ type }) => type !== model.name)
            .map(({ type }) => type)
        )
      )
    : [];

  const enumsToImport = Array.from(
    new Set(
      model.fields.filter(({ kind }) => kind === "enum").map(({ type }) => type)
    )
  );

  const fieldsToInclude = filterModelFieldsForClass({
    fields: model.fields,
    includeRelationFields,
    includeRelationFromFields,
  });

  const template = `
${t.if(importPrisma, "import { Prisma } from '@prisma/client';")}
${t.if(
  includeRelationFields,
  "import { ApiExtraModels } from '@nestjs/swagger';"
)}

${t.importDtos(dtosToImport)}
${t.importEnums(enumsToImport)}

${t.if(includeRelationFields, t.apiExtraModels(dtosToImport))}
export class ${t.dtoName(model.name)} {
  ${t.fieldsToClassProps(fieldsToInclude)}
}

const fields = [${model.fields.map((field) => inspect(field))}];
`;

  return template;
}
