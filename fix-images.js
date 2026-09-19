const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace .image (but not .imageUrl)
  content = content.replace(/\.image(?![a-zA-Z])/g, '.imageUrl');
  // Replace .hoverImage (but not .hoverImageUrl)
  content = content.replace(/\.hoverImage(?![a-zA-Z])/g, '.hoverImageUrl');
  
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
    changedCount++;
  }
});

console.log(`Done. Changed ${changedCount} files.`);
