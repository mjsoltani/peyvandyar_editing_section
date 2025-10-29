import { Pool } from 'pg';
import { Template, CreateTemplateData, UpdateTemplateData, COPYABLE_FIELDS } from '../models/Template';
import { BasalamService } from './BasalamService';

export class TemplateService {
    private db: Pool;
    private basalamService: BasalamService;

    constructor(db: Pool) {
        this.db = db;
        this.basalamService = BasalamService.getInstance();
    }

    /**
     * Create a new template from a product
     */
    async createTemplate(templateData: CreateTemplateData): Promise<Template> {
        const query = `
      INSERT INTO templates (
        user_id, name, description, source_product_id, 
        template_data, fields_to_copy, is_favorite
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

        const values = [
            templateData.user_id,
            templateData.name,
            templateData.description || null,
            templateData.source_product_id,
            JSON.stringify(templateData.template_data),
            templateData.fields_to_copy,
            templateData.is_favorite || false
        ];

        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    /**
     * Get templates for a user
     */
    async getUserTemplates(
        userId: number,
        options: {
            limit?: number;
            offset?: number;
            favorites_only?: boolean;
            search?: string;
        } = {}
    ): Promise<{ templates: Template[]; total: number }> {
        let whereClause = 'WHERE user_id = $1';
        const values: any[] = [userId];
        let paramIndex = 2;

        if (options.favorites_only) {
            whereClause += ` AND is_favorite = true`;
        }

        if (options.search) {
            whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            values.push(`%${options.search}%`);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM templates ${whereClause}`;
        const countResult = await this.db.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count);

        // Get templates with pagination
        let query = `
      SELECT * FROM templates 
      ${whereClause}
      ORDER BY is_favorite DESC, usage_count DESC, created_at DESC
    `;

        if (options.limit) {
            query += ` LIMIT $${paramIndex}`;
            values.push(options.limit);
            paramIndex++;
        }

        if (options.offset) {
            query += ` OFFSET $${paramIndex}`;
            values.push(options.offset);
        }

        const result = await this.db.query(query, values);

        return {
            templates: result.rows,
            total
        };
    }

    /**
     * Get a specific template by ID
     */
    async getTemplateById(templateId: number, userId: number): Promise<Template | null> {
        const query = 'SELECT * FROM templates WHERE id = $1 AND user_id = $2';
        const result = await this.db.query(query, [templateId, userId]);

        return result.rows[0] || null;
    }

    /**
     * Update a template
     */
    async updateTemplate(
        templateId: number,
        userId: number,
        updateData: UpdateTemplateData
    ): Promise<Template | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updateData.name !== undefined) {
            fields.push(`name = $${paramIndex}`);
            values.push(updateData.name);
            paramIndex++;
        }

        if (updateData.description !== undefined) {
            fields.push(`description = $${paramIndex}`);
            values.push(updateData.description);
            paramIndex++;
        }

        if (updateData.template_data !== undefined) {
            fields.push(`template_data = $${paramIndex}`);
            values.push(JSON.stringify(updateData.template_data));
            paramIndex++;
        }

        if (updateData.fields_to_copy !== undefined) {
            fields.push(`fields_to_copy = $${paramIndex}`);
            values.push(updateData.fields_to_copy);
            paramIndex++;
        }

        if (updateData.is_favorite !== undefined) {
            fields.push(`is_favorite = $${paramIndex}`);
            values.push(updateData.is_favorite);
            paramIndex++;
        }

        if (fields.length === 0) {
            return null;
        }

        fields.push(`updated_at = NOW()`);
        values.push(templateId, userId);

        const query = `
      UPDATE templates 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;

        const result = await this.db.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Delete a template
     */
    async deleteTemplate(templateId: number, userId: number): Promise<boolean> {
        const query = 'DELETE FROM templates WHERE id = $1 AND user_id = $2';
        const result = await this.db.query(query, [templateId, userId]);

        return result.rowCount > 0;
    }

    /**
     * Increment usage count for a template
     */
    async incrementUsageCount(templateId: number, userId: number): Promise<void> {
        const query = `
      UPDATE templates 
      SET usage_count = usage_count + 1, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
    `;

        await this.db.query(query, [templateId, userId]);
    }

    /**
     * Create template from product data
     */
    async createTemplateFromProduct(
        userId: number,
        productId: string,
        templateName: string,
        fieldsToInclude: string[],
        accessToken: string,
        description?: string
    ): Promise<Template> {
        // Get product details from Basalam
        const productData = await this.basalamService.getProductDetails(
            productId,
            accessToken,
            false // Don't use cache for template creation
        );

        // Extract only the specified fields
        const templateData: any = {};

        for (const field of fieldsToInclude) {
            if (COPYABLE_FIELDS.includes(field as any) && productData[field] !== undefined) {
                templateData[field] = productData[field];
            }
        }

        // Create the template
        const template = await this.createTemplate({
            user_id: userId,
            name: templateName,
            description,
            source_product_id: productId,
            template_data: templateData,
            fields_to_copy: fieldsToInclude
        });

        return template;
    }

    /**
     * Apply template to products
     */
    async applyTemplateToProducts(
        templateId: number,
        userId: number,
        productIds: string[],
        accessToken: string,
        fieldsToApply?: string[]
    ): Promise<{
        success: number;
        failed: number;
        errors: Array<{ productId: string; error: string }>;
    }> {
        // Get the template
        const template = await this.getTemplateById(templateId, userId);
        if (!template) {
            throw new Error('الگو یافت نشد');
        }

        // Determine which fields to apply
        const fieldsToUse = fieldsToApply || template.fields_to_copy;

        // Prepare update data
        const updateData: any = {};
        for (const field of fieldsToUse) {
            if (template.template_data[field] !== undefined) {
                updateData[field] = template.template_data[field];
            }
        }

        // Apply to each product
        const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ productId: string; error: string }>
        };

        for (const productId of productIds) {
            try {
                await this.basalamService.updateProduct(productId, updateData, accessToken);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    productId,
                    error: error instanceof Error ? error.message : 'خطای ناشناخته'
                });
            }
        }

        // Increment usage count
        await this.incrementUsageCount(templateId, userId);

        return results;
    }

    /**
     * Get template preview data
     */
    async getTemplatePreview(
        templateId: number,
        userId: number
    ): Promise<{
        template: Template;
        preview_data: any;
        field_count: number;
    } | null> {
        const template = await this.getTemplateById(templateId, userId);
        if (!template) {
            return null;
        }

        return {
            template,
            preview_data: template.template_data,
            field_count: template.fields_to_copy.length
        };
    }

    /**
     * Get popular templates (most used)
     */
    async getPopularTemplates(
        userId: number,
        limit: number = 10
    ): Promise<Template[]> {
        const query = `
      SELECT * FROM templates 
      WHERE user_id = $1 AND usage_count > 0
      ORDER BY usage_count DESC, created_at DESC
      LIMIT $2
    `;

        const result = await this.db.query(query, [userId, limit]);
        return result.rows;
    }
}