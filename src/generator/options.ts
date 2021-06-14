export interface GenerateCodeOptions {
  output: string;
  filenameCase?: "camel" | "snake" | "kebab";
  dtoSuffix?: string;
  classPrefix?: string;
}
