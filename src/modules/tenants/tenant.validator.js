export class tenantValidator {

    static validateTenantData(req, res, next) {
        const { name, slug, country, timezone, currency } = req.body;
        if (!name || !slug || !country || !timezone || !currency) {
            return res.status(400).json({ error: 'All tenant fields are required' });
        }
        next();
    }

    static validateTenantUpdateData(req, res, next) {
        const { name, slug, country, timezone, currency } = req.body;
        if (!name && !slug && !country && !timezone && !currency) {
            return res.status(400).json({ error: 'At least one field is required for update' });
        }
        next();
    }

    static validateAddUserToTenant(req, res, next) {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        next();
    }
}