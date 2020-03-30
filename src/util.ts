import ejs from 'ejs';

export interface TemplateData {
  modelName: string;
  modelNameLower: string;
  modelNamePlural: string;
  modelNameLowerPlural: string;
}

function render(content: string, data: TemplateData): string {
  return ejs.render(content, data);
}

export default render;
