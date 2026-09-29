const fs = require('fs');
let code = fs.readFileSync('src/components/CreateProductModal.tsx', 'utf8');

code = code.replace(
  "onComplete: () => void;",
  "onComplete: (product?: any) => void;"
);

// We need to pass the updated/created product at the end.
// We can capture it.
code = code.replace(
  "const updateRes = await updateProductAction(initialData.id, productData);",
  "let finalProduct = null;\n          const updateRes = await updateProductAction(initialData.id, productData);\n          if (updateRes.success) finalProduct = updateRes.product;"
);

// And for create:
code = code.replace(
  "const createRes = await createSingleProduct({",
  "const createRes = await createSingleProduct({\n"
);
// wait, easier to just replace `onComplete();` with `onComplete(finalProduct);`
// and ensure `finalProduct` is scoped outside the `if (initialData)` block.

code = code.replace(
  "const handleSubmit = async (e: React.FormEvent) => {",
  "const handleSubmit = async (e: React.FormEvent) => {\n      let finalProduct: any = null;"
);

code = code.replace(
  "const updateRes = await updateProductAction(initialData.id, productData);",
  "const updateRes = await updateProductAction(initialData.id, productData);\n           if (updateRes.success) finalProduct = updateRes.product || updateRes.data;" // in case the field is named data
);

code = code.replace(
  "const createRes = await createSingleProduct({\n            ...productData,\n            locationCode: productData.locationCode || undefined\n          });",
  "const createRes = await createSingleProduct({\n            ...productData,\n            locationCode: productData.locationCode || undefined\n          });\n          if (createRes.success) finalProduct = createRes.product || createRes.data;"
);

// Replace onComplete() with onComplete(finalProduct)
// There might be multiple onComplete calls?
code = code.replace(
  "onComplete();",
  "onComplete(finalProduct);"
);

fs.writeFileSync('src/components/CreateProductModal.tsx', code);
console.log('Fixed CreateProductModal onComplete');
