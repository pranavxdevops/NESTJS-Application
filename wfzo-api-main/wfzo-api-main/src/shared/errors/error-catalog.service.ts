import fs from "node:fs";
import path from "node:path";
import PropertiesReader from "properties-reader";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ErrorCatalogService {
  private readonly messages: Map<string, string> = new Map();
  private readonly validation: Map<string, string> = new Map();

  constructor() {
    const errorsPath = path.resolve(process.cwd(), "config", "errors.properties");
    const validationPath = path.resolve(process.cwd(), "config", "validation.properties");

    if (fs.existsSync(errorsPath)) {
      const props = PropertiesReader(errorsPath);
      Object.entries(props.getAllProperties()).forEach(([k, v]) => {
        this.messages.set(k, String(v));
      });
    }

    if (fs.existsSync(validationPath)) {
      const props = PropertiesReader(validationPath);
      Object.entries(props.getAllProperties()).forEach(([k, v]) => {
        this.validation.set(k, String(v));
      });
    }
  }

  getMessage(code: string, params?: Record<string, string | number>): string | undefined {
    const template = this.messages.get(code);
    if (!template) return undefined;
    return this.apply(template, params);
  }

  getValidationMessage(key: string, params?: Record<string, string | number>): string | undefined {
    const template = this.validation.get(key);
    if (!template) return undefined;
    return this.apply(template, params);
  }

  private apply(template: string, params?: Record<string, string | number>): string {
    if (!params) return template;
    return Object.entries(params).reduce(
      (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
      template,
    );
  }
}
