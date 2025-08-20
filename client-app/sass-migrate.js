const fs = require('fs-extra');
const glob = require('glob');

const replacementPatterns = [
  // darken() conversions
  {
    pattern: /darken\s*\(\s*([^,]+)\s*,\s*([\d.]+)%\s*\)/g,
    replacement: 'color.adjust($1, $lightness: -$2%)'
  },
  // lighten() conversions
  {
    pattern: /lighten\s*\(\s*([^,]+)\s*,\s*([\d.]+)%\s*\)/g,
    replacement: 'color.adjust($1, $lightness: $2%)'
  },
  // transparentize() conversions
  {
    pattern: /transparentize\s*\(\s*([^,]+)\s*,\s*([\d.]+)\s*\)/g,
    replacement: (_, color, alpha) => `color.adjust(${color}, $alpha: -${alpha})`
  },
  // fade-out() conversions
  {
    pattern: /fade-out\s*\(\s*([^,]+)\s*,\s*([\d.]+)\s*\)/g,
    replacement: 'color.adjust($1, $alpha: -$2)'
  },
  // fade-in() conversions
  {
    pattern: /fade-in\s*\(\s*([^,]+)\s*,\s*([\d.]+)\s*\)/g,
    replacement: 'color.adjust($1, $alpha: $2)'
  },
  // Convert global adjust-color() to color.adjust()
  {
    pattern: /adjust-color\s*\(\s*([^)]+)\)/g,
    replacement: 'color.adjust($1)'
  },
  // Convert global scale-color() to color.scale()
  {
    pattern: /scale-color\s*\(\s*([^)]+)\)/g,
    replacement: 'color.scale($1)'
  }
];

// Process files with better error handling
try {
  const files = glob.sync('./src/**/*.scss');
  let filesUpdated = 0;

  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;

      // Check if file uses color functions that need the color module
      const usesColorFunctions = /color\.adjust|color\.scale|adjust-color|scale-color|darken|lighten|transparentize|fade-in|fade-out/.test(content);
      
      if (usesColorFunctions) {
        // Add @use "sass:color" if not already present
        if (!content.includes('@use "sass:color"')) {
          content = content.replace(/^/, '@use "sass:color";\n');
        }

        // Apply all replacements to convert to module functions
        replacementPatterns.forEach(({ pattern, replacement }) => {
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

  console.log(`\nMigration completed! Updated ${filesUpdated} files.`);
  console.log('\nAll color functions have been converted to use the color module:');
  console.log('• adjust-color() → color.adjust()');
  console.log('• scale-color() → color.scale()');
  console.log('• darken() → color.adjust()');
  console.log('• lighten() → color.adjust()');
  console.log('• transparentize() → color.adjust()');
  console.log('• fade-in() → color.adjust()');
  console.log('• fade-out() → color.adjust()');
  console.log('\nAdditional steps:');
  console.log('1. Run your build to verify all changes');
  console.log('2. Check for any remaining Sass warnings');
  console.log('3. Commit changes after testing');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}