declare module "properties-reader" {
  interface PropertiesReaderInstance {
    get: (key: string) => unknown;
    getAllProperties: () => Record<string, string>;
  }
  function PropertiesReader(path?: string): PropertiesReaderInstance;
  export default PropertiesReader;
}

declare module "yamljs" {
  const YAML: { load: (path: string) => unknown };
  export default YAML;
}
