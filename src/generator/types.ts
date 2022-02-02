import { DMMF } from '@prisma/generator-helper';

export interface Model extends DMMF.Model {
  output: {
    dto: string;
    entity: string;
  };
}

export interface ParsedField {
  kind: DMMF.FieldKind | 'relation-input';
  name: string;
  type: string;
  documentation?: string;
  isRequired: boolean;
  isList: boolean;
  /**
   * used when rendering Entity templates - fields that are optional in Prisma Schema
   * are returned as `null` values (if not filled) when fetched from PrismaClient.
   * **must not be `true` when `isRequired` is `true`**
   */
  isNullable?: boolean;
}

export interface ExtraModel {
  originalName: string;
  preAndPostfixedName: string;
  isLocal?: boolean;
}

export interface ImportStatementParams {
  from: string;
  /**
   * imports default export from `from`.
   * use `string` to just get the default export and `{'*': localName`} for all exports (e.g. `import * as localName from 'baz'`)
   */
  default?: string | { '*': string };
  /**
   * imports named exports from `from`.
   * use `string` to keep exported name and `{exportedName: localName}` for renaming (e.g. `import { foo as bar } from 'baz'`)
   *
   * @example `foo`
   * @example `{exportedName: localName}`
   */
  destruct?: (string | Record<string, string>)[];
}

export interface DtoParams {
  model: DMMF.Model;
  fields: ParsedField[];
  // should include all Enums, ExtraModels, ConnectDTOs and CreateDTOs for related models
  imports: ImportStatementParams[];
}

export type ConnectDtoParams = Omit<DtoParams, 'imports'>;

export interface CreateDtoParams extends DtoParams {
  extraClasses: string[];
  apiExtraModels: string[];
}

export interface UpdateDtoParams extends DtoParams {
  extraClasses: string[];
  apiExtraModels: string[];
}

export interface EntityParams extends DtoParams {
  apiExtraModels: string[];
}

export interface ModelParams {
  connect: ConnectDtoParams;
  create: CreateDtoParams;
  update: UpdateDtoParams;
  entity: EntityParams;
}

export type WriteableFileSpecs = {
  fileName: string;
  content: string;
};

export type NamingStyle = 'snake' | 'camel' | 'pascal' | 'kebab';
