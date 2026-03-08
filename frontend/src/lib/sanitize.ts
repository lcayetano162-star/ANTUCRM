/**
 * HTML Sanitization Utilities
 * 
 * Previene ataques XSS al renderizar contenido HTML externo
 * (emails de clientes, contenido de IA, etc.)
 */

// Simple sanitizer sin dependencias externas
// En producción, instalar: npm install dompurify

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'blockquote'
];

const ALLOWED_ATTRS = ['href', 'title', 'target', 'class', 'style'];

/**
 * Sanitiza HTML para prevenir XSS
 * Elimina scripts y atributos peligrosos
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  
  // Crear un elemento temporal para parsear
  const parser = new DOMParser();
  const doc = parser.parseFromString(dirty, 'text/html');
  
  // Función recursiva para limpiar nodos
  const cleanNode = (node: Element): Element | null => {
    // Eliminar scripts e iframes completamente
    if (['script', 'iframe', 'object', 'embed', 'form'].includes(node.tagName.toLowerCase())) {
      return null;
    }
    
    // Verificar si el tag está permitido
    if (!ALLOWED_TAGS.includes(node.tagName.toLowerCase())) {
      // Si no está permitido, reemplazar con su contenido de texto
      const span = document.createElement('span');
      span.textContent = node.textContent || '';
      return span;
    }
    
    // Limpiar atributos
    const attrsToRemove: string[] = [];
    for (const attr of Array.from(node.attributes)) {
      const attrName = attr.name.toLowerCase();
      
      // Eliminar event handlers (onclick, onload, etc.)
      if (attrName.startsWith('on')) {
        attrsToRemove.push(attr.name);
        continue;
      }
      
      // Eliminar atributos no permitidos
      if (!ALLOWED_ATTRS.includes(attrName)) {
        attrsToRemove.push(attr.name);
        continue;
      }
      
      // Sanitizar href (evitar javascript:)
      if (attrName === 'href') {
        const value = attr.value.toLowerCase().trim();
        if (value.startsWith('javascript:') || value.startsWith('data:')) {
          node.setAttribute(attr.name, '#');
        }
      }
    }
    
    attrsToRemove.forEach(attr => node.removeAttribute(attr));
    
    // Recursivamente limpiar hijos
    const children = Array.from(node.children);
    for (const child of children) {
      const cleaned = cleanNode(child);
      if (!cleaned) {
        child.remove();
      } else if (cleaned !== child) {
        node.replaceChild(cleaned, child);
      }
    }
    
    return node;
  };
  
  // Limpiar body
  const body = doc.body;
  const children = Array.from(body.children);
  for (const child of children) {
    cleanNode(child);
  }
  
  return body.innerHTML;
}

/**
 * Escapa HTML para mostrar como texto plano
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Verifica si el HTML contiene scripts potencialmente peligrosos
 */
export function containsDangerousContent(html: string): boolean {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(html));
}
