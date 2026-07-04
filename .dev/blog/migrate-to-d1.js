/**
 * Migration Script: JSON to SQL (Cloudflare D1)
 * Reads blog/contenido-completo.json and generates a seed.sql file.
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'contenido-completo.json');
const outputPath = path.join(__dirname, 'seed.sql');

try {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  let sql = '-- Seed data for Cero Studio Blog\n\n';
  
  data.forEach(post => {
    const columns = [
      'title', 'slug', 'category', 'status', 'meta_title', 
      'meta_description', 'featured_image_alt', 'excerpt', 
      'content', 'published_at'
    ];
    
    const values = columns.map(col => {
      let val = post[col] || '';
      // Escape single quotes for SQL
      return `'${val.replace(/'/g, "''")}'`;
    });
    
    sql += `INSERT INTO posts (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  });
  
  fs.writeFileSync(outputPath, sql);
  console.log(`Successfully generated ${outputPath} with ${data.length} posts.`);
  
} catch (error) {
  console.error('Error during migration:', error);
}
