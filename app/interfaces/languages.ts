export enum Languages {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
}

export const languageExtensions: { [key: string]: string } = {
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
  java: '.java',
  csharp: '.cs',
  html: '.html',
  css: '.css',
  json: '.json',
  markdown: '.md',
}

export const languageOptions: { label: string; value: Languages }[] = [
  { label: 'JavaScript', value: Languages.JAVASCRIPT },
  { label: 'TypeScript', value: Languages.TYPESCRIPT },
  { label: 'Python', value: Languages.PYTHON },
]
