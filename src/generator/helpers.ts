import {
  isAnnotatedWith,
  isId,
  isRelation,
  isUnique,
} from './field-classifiers';

import type { DMMF } from '@prisma/generator-helper';
import type { TemplateHelpers } from './template-helpers';
import type { ExtraModel, ParsedField } from './types';

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
  model: DMMF.Model;
  allModels: DMMF.Model[];
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
  const relationInputClassProps: Array<Pick<ParsedField, 'name' | 'type'>> = [];

  const extraModels: ExtraModel[] = [];
  const generatedClasses: string[] = [];

  if (isAnnotatedWith(field, canCreateAnnotation)) {
    const originalName = field.type;
    const preAndPostfixedName = t.createDtoName(originalName);
    relationInputClassProps.push({
      name: 'create',
      type: preAndPostfixedName,
    });
    extraModels.push({ originalName, preAndPostfixedName });
  }

  if (isAnnotatedWith(field, canConnectAnnotation)) {
    const connectInputFields = getRelationConnectInputFields({
      field,
      allModels,
    });

    const originalName = `${t.transformClassNameCase(
      model.name,
    )}${t.transformClassNameCase(field.name)}RelationConnectInput`;

    const preAndPostfixedName = preAndSuffixClassName(originalName);

    relationInputClassProps.push({
      name: 'connect',
      type: preAndPostfixedName,
    });

    generatedClasses.push(`class ${preAndPostfixedName} {
      ${t.fieldsToDtoProps(
        Array.from(connectInputFields).map((inputField) =>
          mapDMMFToParsedField(inputField),
        ),
        true,
      )}
    }`);

    extraModels.push({ originalName, preAndPostfixedName, isLocal: true });
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
        isRequired: false,
        isList: field.isList,
      })),
      true,
      true,
    )}
  }`);

  extraModels.push({
    originalName: originalInputClassName,
    preAndPostfixedName: preAndPostfixedInputClassName,
    isLocal: true,
  });

  return { type: preAndPostfixedInputClassName, extraModels, generatedClasses };
};
