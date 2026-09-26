const fs = require('fs');

let code = fs.readFileSync('src/app/actions/queries.ts', 'utf8');

// Replace the query part in getPagedCatalog
const newPaginationLogic = `
      const maxLimit = Math.min(limit, 100);
      let finalItems = [];
      let currentCursor = cursor;
      let hasMore = true;
      let loops = 0;

      while (finalItems.length < maxLimit && hasMore && loops < 10) {
        loops++;
        const items = await prisma.product.findMany({
          where,
          take: maxLimit * 2, // Fetch double to reduce loops
          cursor: currentCursor ? { id: currentCursor } : undefined,
          skip: currentCursor ? 1 : 0,
          orderBy: [
            { category: 'asc' },
            { createdAt: 'desc' },
            { id: 'asc' }
          ]
        });

        if (items.length === 0) {
          hasMore = false;
          break;
        }

        for (const p of items) {
          if (role === 'admin' || (p.physicalStock - p.reservedStock > 0)) {
            finalItems.push(p);
          }
        }

        if (items.length < maxLimit * 2) {
          hasMore = false;
        } else {
          currentCursor = items[items.length - 1].id;
        }
      }

      let nextCursor = undefined;
      if (finalItems.length > maxLimit) {
        hasMore = true;
        finalItems = finalItems.slice(0, maxLimit);
        nextCursor = finalItems[finalItems.length - 1].id;
      } else if (hasMore) {
        // We might have more items in the DB, set cursor to the last valid item we found
        // or the last item we processed if we found 0 valid items (to avoid infinite loops)
        nextCursor = finalItems.length > 0 ? finalItems[finalItems.length - 1].id : currentCursor;
      }

      return {
        success: true,
        products: finalItems,
        hasMore,
        nextCursor
      };
`;

code = code.replace(/const items = await prisma\.product\.findMany\(\{[\s\S]*?nextCursor\n      \};\n/m, newPaginationLogic);

fs.writeFileSync('src/app/actions/queries.ts', code);
console.log("Updated pagination logic in queries.ts");
