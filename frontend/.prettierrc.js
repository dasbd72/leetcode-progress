module.exports = {
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,

  importOrder: ['^@angular', '^rxjs', '', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],

  // Set parser to typescript explicitly
  overrides: [
    {
      files: ['*.ts'],
      options: {
        parser: 'typescript',
      },
    },
  ],

  // Declare plugins manually if needed
  plugins: ['@trivago/prettier-plugin-sort-imports'],
};
