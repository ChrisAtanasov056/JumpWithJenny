const fs = require('fs-extra');
const glob = require('glob');

const replacementPatterns = [
  // Add @use "sass:color" at the top of files needing color functions
  {
    pattern: /^(@use [^;]+;)?\s*(?!@use "sass:color")/,
    test: /color\.adjust|color\.scale|darken|lighten|transparentize|fade-in|fade-out/,
    replacement: (match, existingImports) => 
      (existingImports ? `${existingImports}\n` : '') + '@use "sass:color";\n'
  },
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

      // First check if we need color functions
      const needsColorModule = replacementPatterns.some(
        ({ test }) => test && test.test(content)
      );

      if (needsColorModule) {
        // Apply all replacements
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
  console.log('\nAdditional steps:');
  console.log('1. Run your build to verify all changes');
  console.log('2. Check for any remaining Sass warnings');
  console.log('3. Commit changes after testing');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}