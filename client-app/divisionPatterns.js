const fs = require('fs-extra');
const glob = require('glob');

const divisionPatterns = [
  // Convert simple division to math.div()
  {
    pattern: /(\$[a-zA-Z0-9_-]+)\s*\/\s*(\d+)/g,
    replacement: 'math.div($1, $2)'
  },
  // Convert division with variables to math.div()
  {
    pattern: /(\$[a-zA-Z0-9_-]+)\s*\/\s*(\$[a-zA-Z0-9_-]+)/g,
    replacement: 'math.div($1, $2)'
  }
];

// Process files to fix division warnings
try {
  const files = glob.sync('./src/**/*.scss');
  let filesUpdated = 0;

  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;

      // Check if file uses division that needs math module
      const usesDivision = /\$[a-zA-Z0-9_-]+\s*\/\s*[\d$]/.test(content);
      
      if (usesDivision) {
        // Add @use "sass:math" if not already present and division is found
        if (!content.includes('@use "sass:math"') && content.includes('/')) {
          content = content.replace(/^/, '@use "sass:math";\n');
        }

        // Apply division replacements
        divisionPatterns.forEach(({ pattern, replacement }) => {
          content = content.replace(pattern, replacement);
        });

        if (content !== originalContent) {
          fs.writeFileSync(file, content, 'utf8');
          filesUpdated++;
          console.log(`✔ Updated ${file}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });

  console.log(`\nDivision fix completed! Updated ${filesUpdated} files.`);
  console.log('\nAll division operations have been converted to use math.div():');
  console.log('• $var / 2 → math.div($var, 2)');
  console.log('• $var1 / $var2 → math.div($var1, $var2)');
  
} catch (error) {
  console.error('❌ Division fix failed:', error.message);
  process.exit(1);
}