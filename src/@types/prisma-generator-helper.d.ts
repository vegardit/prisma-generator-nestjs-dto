declare module '@prisma/generator-helper' {
  // dmmf.d.ts
  export namespace DMMF {
    interface Document {
      datamodel: Datamodel;
      schema: Schema;
      mappings: Mappings;
    }
    interface Mappings {
      modelOperations: ModelMapping[];
      otherOperations: {
        read: string[];
        write: string[];
      };
    }
    interface OtherOperationMappings {
      read: string[];
      write: string[];
    }
    interface DatamodelEnum {
      name: string;
      values: EnumValue[];
      dbName?: string | null;
      documentation?: string;
    }
    interface SchemaEnum {
      name: string;
      values: string[];
    }
    interface EnumValue {
      name: string;
      dbName: string | null;
    }
    interface Datamodel {
      models: Model[];
      enums: DatamodelEnum[];
    }
    interface uniqueIndex {
      name: string;
      fields: string[];
    }
    interface Model {
      name: string;
      isEmbedded: boolean;
      dbName: string | null;
      fields: Field[];
      fieldMap?: Record<string, Field>;
      uniqueFields: string[][];
      uniqueIndexes: uniqueIndex[];
      documentation?: string;
      idFields: string[];
      [key: string]: any;
    }
    type FieldKind = 'scalar' | 'object' | 'enum' | 'unsupported';
    type FieldNamespace = 'model' | 'prisma';
    type FieldLocation =
      | 'scalar'
      | 'inputObjectTypes'
      | 'outputObjectTypes'
      | 'enumTypes';
    interface Field {
      kind: FieldKind;
      name: string;
      isRequired: boolean;
      isList: boolean;
      isUnique: boolean;
      isId: boolean;
      isReadOnly: boolean;
      isGenerated: boolean;
      isUpdatedAt: boolean;
      type: string;
      dbNames?: string[] | null;
      hasDefaultValue: boolean;
      default?: FieldDefault | string | boolean | number;
      relationFromFields?: string[];
      relationToFields?: string[];
      relationOnDelete?: string;
      relationName?: string;
      documentation?: string;
      [key: string]: any;
    }
    interface FieldDefault {
      name: string;
      args: any[];
    }
    interface Schema {
      rootQueryType?: string;
      rootMutationType?: string;
      inputObjectTypes: {
        model?: InputType[];
        prisma: InputType[];
      };
      outputObjectTypes: {
        model: OutputType[];
        prisma: OutputType[];
      };
      enumTypes: {
        model?: SchemaEnum[];
        prisma: SchemaEnum[];
      };
    }
    interface Query {
      name: string;
      args: SchemaArg[];
      output: QueryOutput;
    }
    interface QueryOutput {
      name: string;
      isRequired: boolean;
      isList: boolean;
    }
    type ArgType = string | InputType | SchemaEnum;
    interface SchemaArgInputType {
      isList: boolean;
      type: ArgType;
      location: FieldLocation;
      namespace?: FieldNamespace;
    }
    interface SchemaArg {
      name: string;
      comment?: string;
      isNullable: boolean;
      isRequired: boolean;
      inputTypes: SchemaArgInputType[];
      deprecation?: Deprecation;
    }
    interface OutputType {
      name: string;
      fields: SchemaField[];
      fieldMap?: Record<string, SchemaField>;
      isEmbedded?: boolean;
    }
    interface SchemaField {
      name: string;
      isNullable?: boolean;
      outputType: {
        type: string | OutputType | SchemaEnum;
        isList: boolean;
        location: FieldLocation;
        namespace?: FieldNamespace;
      };
      args: SchemaArg[];
      deprecation?: Deprecation;
    }
    interface Deprecation {
      sinceVersion: string;
      reason: string;
      plannedRemovalVersion?: string;
    }
    interface InputType {
      name: string;
      constraints: {
        maxNumFields: number | null;
        minNumFields: number | null;
      };
      fields: SchemaArg[];
      fieldMap?: Record<string, SchemaArg>;
    }
    interface ModelMapping {
      model: string;
      plural: string;
      findUnique?: string | null;
      findFirst?: string | null;
      findMany?: string | null;
      create?: string | null;
      createMany?: string | null;
      update?: string | null;
      updateMany?: string | null;
      upsert?: string | null;
      delete?: string | null;
      deleteMany?: string | null;
      aggregate?: string | null;
      groupBy?: string | null;
      count?: string | null;
    }
    enum ModelAction {
      findUnique = 'findUnique',
      findFirst = 'findFirst',
      findMany = 'findMany',
      create = 'create',
      createMany = 'createMany',
      update = 'update',
      updateMany = 'updateMany',
      upsert = 'upsert',
      delete = 'delete',
      deleteMany = 'deleteMany',
      groupBy = 'groupBy',
      count = 'count',
      aggregate = 'aggregate',
    }
  }

  // types.d.ts
  export namespace JsonRPC {
    type Request = {
      jsonrpc: '2.0';
      method: string;
      params?: any;
      id: number;
    };
    type Response = SuccessResponse | ErrorResponse;
    type SuccessResponse = {
      jsonrpc: '2.0';
      result: any;
      id: number;
    };
    type ErrorResponse = {
      jsonrpc: '2.0';
      error: {
        code: number;
        message: string;
        data: any;
      };
      id: number;
    };
  }
  export type Dictionary<T> = {
    [key: string]: T;
  };
  export interface GeneratorConfig {
    name: string;
    output: EnvValue | null;
    isCustomOutput?: boolean;
    provider: EnvValue;
    config: Dictionary<string>;
    binaryTargets: BinaryTargetsEnvValue[];
    previewFeatures: string[];
  }
  export interface EnvValue {
    fromEnvVar: null | string;
    value: string;
  }
  export interface BinaryTargetsEnvValue {
    fromEnvVar: null | string;
    value: string;
  }
  export type ConnectorType =
    | 'mysql'
    | 'mongodb'
    | 'sqlite'
    | 'postgresql'
    | 'sqlserver';
  export interface DataSource {
    name: string;
    activeProvider: ConnectorType;
    provider: ConnectorType;
    url: EnvValue;
    config: {
      [key: string]: string;
    };
  }
  export type BinaryPaths = {
    migrationEngine?: {
      [binaryTarget: string]: string;
    };
    queryEngine?: {
      [binaryTarget: string]: string;
    };
    libqueryEngine?: {
      [binaryTarget: string]: string;
    };
    introspectionEngine?: {
      [binaryTarget: string]: string;
    };
    prismaFmt?: {
      [binaryTarget: string]: string;
    };
  };
  export type GeneratorOptions = {
    generator: GeneratorConfig;
    otherGenerators: GeneratorConfig[];
    schemaPath: string;
    dmmf: DMMF.Document;
    datasources: DataSource[];
    datamodel: string;
    binaryPaths?: BinaryPaths;
    version: string;
  };
  export type EngineType =
    | 'queryEngine'
    | 'libqueryEngine'
    | 'migrationEngine'
    | 'introspectionEngine'
    | 'prismaFmt';
  export type GeneratorManifest = {
    prettyName?: string;
    defaultOutput?: string;
    denylists?: {
      models?: string[];
      fields?: string[];
    };
    requiresGenerators?: string[];
    requiresEngines?: EngineType[];
    version?: string;
    requiresEngineVersion?: string;
  };

  // generatorHandler.d.ts
  export interface Handler {
    onGenerate(options: GeneratorOptions): Promise<any>;
    onManifest?(config: GeneratorConfig): GeneratorManifest;
  }
  export function generatorHandler(handler: Handler): void;

  // GeneratorProcess.d.ts
  import { ChildProcessByStdio } from 'child_process';
  export class GeneratorError extends Error {
    code: number;
    data?: any;
    constructor(message: string, code: number, data?: any);
  }
  export class GeneratorProcess {
    private executablePath;
    private isNode?;
    child?: ChildProcessByStdio<any, any, any>;
    listeners: {
      [key: string]: (result: any, err?: Error) => void;
    };
    private exitCode;
    private stderrLogs;
    private initPromise?;
    private lastError?;
    private currentGenerateDeferred?;
    constructor(executablePath: string, isNode?: boolean | undefined);
    init(): Promise<void>;
    initSingleton(): Promise<void>;
    private handleResponse;
    private registerListener;
    private sendMessage;
    private getMessageId;
    stop(): void;
    getManifest(config: GeneratorConfig): Promise<GeneratorManifest | null>;
    generate(options: GeneratorOptions): Promise<any>;
  }
}
