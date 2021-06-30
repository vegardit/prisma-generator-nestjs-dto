import path from 'path';
import {
  isAnnotatedWith,
  isId,
  isRelation,
  isUnique,
} from './field-classifiers';
import { scalarToTS } from './template-helpers';
import { DTO_RELATION_REQUIRED } from './annotations';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from './template-helpers';
import type { ImportStatementParams, Model, ParsedField } from './types';

export const uniq = <T = any>(input: T[]): T[] => Array.from(new Set(input));
export const concatIntoArray = <T = any>(source: T[], target: T[]) =>
  source.forEach((item) => target.push(item));

export const makeImportsFromPrismaClient = (
  model: DMMF.Model,
): ImportStatementParams | null => {
  const enumsToImport = uniq(
    model.fields.filter(({ kind }) => kind === 'enum').map(({ type }) => type),
  );
  const importPrisma = model.fields
    .filter(({ kind }) => kind === 'scalar')
    .some(({ type }) => scalarToTS(type).includes('Prisma'));

  if (!enumsToImport.length || importPrisma) {
    return null;
  }

  return {
    from: '@prisma/client',
    destruct: importPrisma ? ['Prisma', ...enumsToImport] : enumsToImport,
  };
};

export const mapDMMFToParsedField = (
  field: DMMF.Field,
  overrides: Partial<DMMF.Field> = {},
): ParsedField => ({
  ...field,
  ...overrides,
});

export const getRelationScalars = (
  fields: DMMF.Field[],
): Record<string, string[]> => {
  const scalars = fields.flatMap(
    ({ relationFromFields = [] }) => relationFromFields,
  );

  return scalars.reduce(
    (result, scalar) => ({
      ...result,
      [scalar]: fields
        .filter(({ relationFromFields = [] }) =>
          relationFromFields.includes(scalar),
        )
        .map(({ name }) => name),
    }),
    {} as Record<string, string[]>,
  );
};

interface GetRelationConnectInputFieldsParam {
  field: DMMF.Field;
  allModels: DMMF.Model[];
}
export const getRelationConnectInputFields = ({
  field,
  allModels,
}: GetRelationConnectInputFieldsParam): Set<DMMF.Field> => {
  const { name, type, relationToFields = [] } = field;

  if (!isRelation(field)) {
    throw new Error(
      `Can not resolve RelationConnectInputFields for field '${name}'. Not a relation field.`,
    );
  }

  const relatedModel = allModels.find(
    ({ name: modelName }) => modelName === type,
  );

  if (!relatedModel) {
    throw new Error(
      `Can not resolve RelationConnectInputFields for field '${name}'. Related model '${type}' unknown.`,
    );
  }

  if (!relationToFields.length) {
    throw new Error(
      `Can not resolve RelationConnectInputFields for field '${name}'. Foreign keys are unknown.`,
    );
  }

  const foreignKeyFields = relationToFields.map((relationToFieldName) => {
    const relatedField = relatedModel.fields.find(
      (relatedModelField) => relatedModelField.name === relationToFieldName,
    );

    if (!relatedField)
      throw new Error(
        `Can not find foreign key field '${relationToFieldName}' on model '${relatedModel.name}'`,
      );

    return relatedField;
  });

  const idFields = relatedModel.fields.filter((relatedModelField) =>
    isId(relatedModelField),
  );

  const uniqueFields = relatedModel.fields.filter((relatedModelField) =>
    isUnique(relatedModelField),
  );

  const foreignFields = new Set<DMMF.Field>([
    ...foreignKeyFields,
    ...idFields,
    ...uniqueFields,
  ]);

  return foreignFields;
};

interface GenerateRelationInputParam {
  field: DMMF.Field;
  model: Model;
  allModels: Model[];
  templateHelpers: TemplateHelpers;
  preAndSuffixClassName:
    | TemplateHelpers['createDtoName']
    | TemplateHelpers['updateDtoName'];
  canCreateAnnotation: RegExp;
  canConnectAnnotation: RegExp;
}
export const generateRelationInput = ({
  field,
  model,
  allModels,
  templateHelpers: t,
  preAndSuffixClassName,
  canCreateAnnotation,
  canConnectAnnotation,
}: GenerateRelationInputParam) => {
  const relationInputClassProps: Array<
    Pick<ParsedField, 'name' | 'type'> &
      Partial<Pick<ParsedField, 'isRequired'>>
  > = [];

  const imports: ImportStatementParams[] = [];
  const apiExtraModels: string[] = [];
  const generatedClasses: string[] = [];

  if (isAnnotatedWith(field, canCreateAnnotation)) {
    const preAndPostfixedName = t.createDtoName(field.type);
    apiExtraModels.push(preAndPostfixedName);

    const modelToImportFrom = allModels.find(({ name }) => name === field.type);

    if (!modelToImportFrom)
      throw new Error(
        `related model '${field.type}' for '${model.name}.${field.name}' not found`,
      );

    imports.push({
      from: path.relative(
        model.output.dto,
        path.join(
          modelToImportFrom.output.dto,
          `${t.createDtoFilename(field.type)}`,
        ),
      ),
      destruct: [preAndPostfixedName],
    });

    relationInputClassProps.push({
      name: 'create',
      type: preAndPostfixedName,
    });
  }

  if (isAnnotatedWith(field, canConnectAnnotation)) {
    const preAndPostfixedName = t.connectDtoName(field.type);
    apiExtraModels.push(preAndPostfixedName);
    const modelToImportFrom = allModels.find(({ name }) => name === field.type);

    if (!modelToImportFrom)
      throw new Error(
        `related model '${field.type}' for '${model.name}.${field.name}' not found`,
      );

    imports.push({
      from: path.relative(
        model.output.dto,
        path.join(
          modelToImportFrom.output.dto,
          `${t.connectDtoFilename(field.type)}`,
        ),
      ),
      destruct: [preAndPostfixedName],
    });

    relationInputClassProps.push({
      name: 'connect',
      type: preAndPostfixedName,
      isRequired:
        field.isRequired || isAnnotatedWith(field, DTO_RELATION_REQUIRED),
    });
  }

  const originalInputClassName = `${t.transformClassNameCase(
    model.name,
  )}${t.transformClassNameCase(field.name)}RelationInput`;

  const preAndPostfixedInputClassName = preAndSuffixClassName(
    originalInputClassName,
  );
  generatedClasses.push(`class ${preAndPostfixedInputClassName} {
    ${t.fieldsToDtoProps(
      relationInputClassProps.map((inputField) => ({
        ...inputField,
        kind: 'relation-input',
        isRequired:
          relationInputClassProps.length > 1
            ? false
            : inputField.isRequired || false,
        isList: field.isList,
      })),
      true,
    )}
  }`);

  apiExtraModels.push(preAndPostfixedInputClassName);

  return {
    type: preAndPostfixedInputClassName,
    imports,
    generatedClasses,
    apiExtraModels,
  };
};
