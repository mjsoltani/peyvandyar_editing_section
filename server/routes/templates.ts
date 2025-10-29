import express from 'express';
import { Pool } from 'pg';
import { TemplateService } from '../services/TemplateService';
import { AuthService } from '../services/AuthService';
import { authenticateToken } from '../middleware/auth';
import { COPYABLE_FIELDS, FIELD_DISPLAY_NAMES } from '../models/Template';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Initialize services (will be injected by the main app)
let templateService: TemplateService;
let authService: AuthService;

export const initializeTemplateRoutes = (db: Pool) => {
  templateService = new TemplateService(db);
  authService = new AuthService();
};

// Get available fields for template creation
router.get('/fields', (req, res) => {
  res.json({
    success: true,
    data: {
      fields: COPYABLE_FIELDS,
      field_names: FIELD_DISPLAY_NAMES
    }
  });
});

// Get user's templates
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;
    
    const options = {
      limit,
      offset,
      favorites_only: req.query.favorites_only === 'true',
      search: req.query.search as string
    };

    const result = await templateService.getUserTemplates(userId, options);

    res.json({
      success: true,
      data: {
        templates: result.templates,
        total: result.total,
        page,
        per_page: limit,
        total_pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      error: 'خطا در دریافت الگوها'
    });
  }
});

// Get popular templates
router.get('/popular', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    const templates = await templateService.getPopularTemplates(userId, limit);

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching popular templates:', error);
    res.status(500).json({
      error: 'خطا در دریافت الگوهای محبوب'
    });
  }
});

// Get single template
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const templateId = parseInt(req.params.id);
    if (!templateId) {
      return res.status(400).json({ error: 'شناسه الگو نامعتبر است' });
    }

    const template = await templateService.getTemplateById(templateId, userId);
    if (!template) {
      return res.status(404).json({ error: 'الگو یافت نشد' });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      error: 'خطا در دریافت الگو'
    });
  }
});

// Get template preview
router.get('/:id/preview', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const templateId = parseInt(req.params.id);
    if (!templateId) {
      return res.status(400).json({ error: 'شناسه الگو نامعتبر است' });
    }

    const preview = await templateService.getTemplatePreview(templateId, userId);
    if (!preview) {
      return res.status(404).json({ error: 'الگو یافت نشد' });
    }

    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Error fetching template preview:', error);
    res.status(500).json({
      error: 'خطا در دریافت پیش‌نمایش الگو'
    });
  }
});

// Create template from product
router.post('/from-product', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const { product_id, name, fields, description } = req.body;

    if (!product_id || !name || !fields || !Array.isArray(fields)) {
      return res.status(400).json({ 
        error: 'شناسه محصول، نام الگو و فیلدهای انتخابی الزامی است' 
      });
    }

    // Validate fields
    const invalidFields = fields.filter(field => !COPYABLE_FIELDS.includes(field));
    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: `فیلدهای نامعتبر: ${invalidFields.join(', ')}`
      });
    }

    // Get user's access token
    const user = await authService.getUserById(userId);
    if (!user || !user.access_token) {
      return res.status(401).json({ error: 'توکن دسترسی یافت نشد' });
    }

    const template = await templateService.createTemplateFromProduct(
      userId,
      product_id,
      name,
      fields,
      user.access_token,
      description
    );

    res.status(201).json({
      success: true,
      data: template,
      message: 'الگو با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Error creating template from product:', error);
    res.status(500).json({
      error: 'خطا در ایجاد الگو از محصول'
    });
  }
});

// Create template manually
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const { name, description, source_product_id, template_data, fields_to_copy, is_favorite } = req.body;

    if (!name || !source_product_id || !template_data || !fields_to_copy) {
      return res.status(400).json({ 
        error: 'نام، شناسه محصول مبدا، داده‌های الگو و فیلدهای کپی الزامی است' 
      });
    }

    const template = await templateService.createTemplate({
      user_id: userId,
      name,
      description,
      source_product_id,
      template_data,
      fields_to_copy,
      is_favorite
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'الگو با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      error: 'خطا در ایجاد الگو'
    });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const templateId = parseInt(req.params.id);
    if (!templateId) {
      return res.status(400).json({ error: 'شناسه الگو نامعتبر است' });
    }

    const updateData = req.body;
    const template = await templateService.updateTemplate(templateId, userId, updateData);

    if (!template) {
      return res.status(404).json({ error: 'الگو یافت نشد یا داده‌ای برای به‌روزرسانی ارسال نشده' });
    }

    res.json({
      success: true,
      data: template,
      message: 'الگو با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      error: 'خطا در به‌روزرسانی الگو'
    });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const templateId = parseInt(req.params.id);
    if (!templateId) {
      return res.status(400).json({ error: 'شناسه الگو نامعتبر است' });
    }

    const deleted = await templateService.deleteTemplate(templateId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'الگو یافت نشد' });
    }

    res.json({
      success: true,
      message: 'الگو با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      error: 'خطا در حذف الگو'
    });
  }
});

// Apply template to products
router.post('/:id/apply', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const templateId = parseInt(req.params.id);
    if (!templateId) {
      return res.status(400).json({ error: 'شناسه الگو نامعتبر است' });
    }

    const { product_ids, fields } = req.body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ error: 'لیست محصولات الزامی است' });
    }

    // Get user's access token
    const user = await authService.getUserById(userId);
    if (!user || !user.access_token) {
      return res.status(401).json({ error: 'توکن دسترسی یافت نشد' });
    }

    const result = await templateService.applyTemplateToProducts(
      templateId,
      userId,
      product_ids,
      user.access_token,
      fields
    );

    res.json({
      success: true,
      data: result,
      message: `الگو به ${result.success} محصول اعمال شد`
    });
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({
      error: 'خطا در اعمال الگو'
    });
  }
});

export default router;