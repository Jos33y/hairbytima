// ==========================================================================
// API: Dynamic Product Sitemap - /api/sitemap/products
// ==========================================================================
// Generates sitemap XML for all products dynamically
// ==========================================================================

import { supabase } from './../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all active products
    const { data: products, error } = await supabase
      .from('products')
      .select('slug, updated_at, images')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    const baseUrl = 'https://hairbytimablaq.com';
    const today = new Date().toISOString().split('T')[0];

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    for (const product of products) {
      const lastmod = product.updated_at 
        ? new Date(product.updated_at).toISOString().split('T')[0]
        : today;
      
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/product/${product.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';

      // Add product images
      if (product.images && Array.isArray(product.images)) {
        for (const image of product.images.slice(0, 5)) { // Max 5 images per product
          if (image) {
            xml += '    <image:image>\n';
            xml += `      <image:loc>${image}</image:loc>\n`;
            xml += '    </image:image>\n';
          }
        }
      }

      xml += '  </url>\n';
    }

    xml += '</urlset>';

    // Set headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache for 1 hour
    
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}