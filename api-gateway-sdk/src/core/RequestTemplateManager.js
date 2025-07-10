const fs = require('fs');
const path = require('path');

class RequestTemplateManager {
  constructor(appId = 'app2') {
    this.templates = new Map();
    this.manifestTemplates = new Map();
    this.appId = appId;
    this.loadRequestTemplates();
  }

  loadRequestTemplates() {
    // Load master request templates from gateway's config/requests.json
    const requestsPath = path.join(process.cwd(), 'config', 'requests.json');
    if (fs.existsSync(requestsPath)) {
      try {
        const requestsData = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
        for (const [templateName, templateConfig] of Object.entries(requestsData)) {
          this.templates.set(templateName, templateConfig);
        }
        console.log(`✅ Loaded ${this.templates.size} request templates from gateway config/requests.json`);
      } catch (error) {
        console.error('❌ Error loading request templates:', error.message);
      }
    } else {
      console.log('⚠️  No request templates found at gateway config/requests.json');
    }

    // Load app-specific manifest templates from app's manifest.json for permission validation
    const manifestPath = path.join(process.cwd(), '..', this.appId, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        this.loadManifestTemplates(manifestData);
        console.log(`✅ Loaded manifest permissions for ${Object.keys(manifestData.product || {}).length} products from ${this.appId}/manifest.json`);
      } catch (error) {
        console.error('❌ Error loading manifest templates:', error.message);
      }
    } else {
      console.log(`⚠️  No manifest.json found at ${this.appId}/manifest.json`);
    }
  }

  loadManifestTemplates(manifestData) {
    // Extract request templates from manifest.json product configurations
    if (manifestData.product) {
      for (const [productName, productConfig] of Object.entries(manifestData.product)) {
        if (productConfig.requests) {
          for (const templateName of Object.keys(productConfig.requests)) {
            this.manifestTemplates.set(templateName, {
              product: productName,
              declared: true
            });
          }
        }
      }
    }
  }

  getTemplate(templateName) {
    return this.templates.get(templateName);
  }

  isTemplateDeclared(templateName) {
    return this.manifestTemplates.has(templateName);
  }

  validateTemplate(templateName) {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found in request templates`);
    }

    if (!this.isTemplateDeclared(templateName)) {
      throw new Error(`Template "${templateName}" not declared in manifest.json`);
    }

    // Validate required fields
    if (!template.method) {
      throw new Error(`Template "${templateName}" missing required field: method`);
    }
    
    if (!template.host) {
      throw new Error(`Template "${templateName}" missing required field: host`);
    }

    return template;
  }

  processTemplate(templateName, context = {}, body = null) {
    const template = this.validateTemplate(templateName);
    
    // Clone template to avoid mutations
    const processedTemplate = JSON.parse(JSON.stringify(template));
    
    // Process template variables using context
    processedTemplate.path = this.processTemplateString(template.path || '', context);
    
    // Process query parameters if they exist
    if (template.query) {
      processedTemplate.query = {};
      for (const [key, value] of Object.entries(template.query)) {
        processedTemplate.query[key] = this.processTemplateString(value, context);
      }
    }
    
    // Process headers
    if (template.headers) {
      processedTemplate.headers = {};
      for (const [key, value] of Object.entries(template.headers)) {
        processedTemplate.headers[key] = this.processTemplateString(value, context);
      }
    }

    // Add body if provided
    if (body) {
      processedTemplate.body = body;
    }

    return processedTemplate;
  }

  processTemplateString(templateString, context) {
    if (typeof templateString !== 'string') {
      return templateString;
    }

    // Process template variables like <%= iparam.apikey %>
    return templateString.replace(/<%=\s*([^%]+)\s*%>/g, (match, variable) => {
      const keys = variable.trim().split('.');
      let value = context;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          console.warn(`⚠️  Template variable "${variable}" not found in context`);
          return match; // Return original if not found
        }
      }
      
      return value;
    });
  }

  listTemplates() {
    return {
      configured: Array.from(this.templates.keys()),
      declared: Array.from(this.manifestTemplates.keys()),
      valid: Array.from(this.templates.keys()).filter(name => this.manifestTemplates.has(name))
    };
  }
}

module.exports = RequestTemplateManager; 