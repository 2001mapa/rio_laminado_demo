const { updateProductAction } = require('./src/app/actions/inventory');

async function test() {
  console.log("Starting test...");
  try {
    const res = await updateProductAction('some-id', {
      sku: 'X0397',
      physicalStock: 9
    });
    console.log("Result:", res);
  } catch (err) {
    console.error("Caught error:", err);
  }
  console.log("Test finished.");
}

test();
