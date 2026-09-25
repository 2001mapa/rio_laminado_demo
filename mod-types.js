const fs = require('fs');
let code = fs.readFileSync('src/lib/types.ts', 'utf8');

code = code.replace(
  /export type OrderItem = \{/,
  `export type SizeDetail = {
  size: string;
  quantity: number;
};

export type OrderItem = {`
);

code = code.replace(
  /materialGroupId\?: string \| null;/,
  `materialGroupId?: string | null;
  sizeDetails?: SizeDetail[] | null;`
);

fs.writeFileSync('src/lib/types.ts', code);
