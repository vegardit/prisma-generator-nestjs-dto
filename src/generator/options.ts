export interface GenerateCodeOptions {
  outputDirPath: string;
  relativePrismaOutputPath: string;
  absolutePrismaOutputPath?: string;
  filenameCase?: "camel" | "snake" | "kebab";
  dtoSuffix?: string;
  classPrefix?: string;
}
