/**
 * Template rendering strategy interface
 * Allows for different template engines (Handlebars, Mustache, etc.)
 */
export interface ITemplateRenderer {
  render(template: string, params: Record<string, any>): string;
}

/**
 * Handlebars-based template renderer
 * Uses double curly braces: {{variableName}}
 */
export class HandlebarsRenderer implements ITemplateRenderer {
  render(template: string, params: Record<string, any>): string {
    let rendered = template;

    // Replace all {{variable}} placeholders
    Object.keys(params).forEach((key) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      rendered = rendered.replace(regex, String(params[key] ?? ""));
    });

    return rendered;
  }

  /**
   * Extract required parameters from template
   */
  extractParams(template: string): string[] {
    const regex = /{{\\s*([a-zA-Z0-9_]+)\\s*}}/g;
    const params = new Set<string>();
    let match;

    while ((match = regex.exec(template)) !== null) {
      params.add(match[1]);
    }

    return Array.from(params);
  }
}
