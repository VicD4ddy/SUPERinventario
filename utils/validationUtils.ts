import { ImportedProduct } from "./import"

export interface ValidationIssue {
    row: number
    field: string
    message: string
    severity: 'error' | 'warning'
}

export interface ValidationResult {
    isValid: boolean
    errors: ValidationIssue[]
    warnings: ValidationIssue[]
}

/**
 * Validates imported product data
 * Errors: Block the import
 * Warnings: Alert the user but don't block
 */
export function validateImportedProducts(
    products: ImportedProduct[],
    existingSkus: Set<string>
): ValidationResult {
    const errors: ValidationIssue[] = []
    const warnings: ValidationIssue[] = []

    products.forEach((product, index) => {
        const rowNum = index + 2 // +2 because row 1 is header, data starts at row 2

        // === ERRORS (Block Import) ===

        // Missing product name
        if (!product.name || product.name.trim() === '') {
            errors.push({
                row: rowNum,
                field: 'Nombre',
                message: 'El nombre del producto es obligatorio',
                severity: 'error'
            })
        }

        // Negative stock
        if (product.stock < 0) {
            errors.push({
                row: rowNum,
                field: 'Stock',
                message: `Stock no puede ser negativo (${product.stock})`,
                severity: 'error'
            })
        }

        // Negative cost
        if (product.cost < 0) {
            errors.push({
                row: rowNum,
                field: 'Costo',
                message: `Costo no puede ser negativo (${product.cost})`,
                severity: 'error'
            })
        }

        // Negative price
        if (product.price < 0) {
            errors.push({
                row: rowNum,
                field: 'Precio',
                message: `Precio no puede ser negativo (${product.price})`,
                severity: 'error'
            })
        }

        // === WARNINGS (Non-blocking) ===

        // Price less than cost (potential loss)
        if (product.price > 0 && product.cost > 0 && product.price < product.cost) {
            warnings.push({
                row: rowNum,
                field: 'Precio/Costo',
                message: `Precio ($${product.price}) menor que costo ($${product.cost}) - pérdida potencial`,
                severity: 'warning'
            })
        }

        // Zero stock warning
        if (product.stock === 0) {
            warnings.push({
                row: rowNum,
                field: 'Stock',
                message: 'Stock en cero - producto agotado',
                severity: 'warning'
            })
        }

        // Missing or generic category
        if (!product.category || product.category.trim() === '' || product.category.toLowerCase() === 'general') {
            warnings.push({
                row: rowNum,
                field: 'Categoría',
                message: 'Categoría vacía o genérica - considera especificar',
                severity: 'warning'
            })
        }

        // Very long category name
        if (product.category && product.category.length > 30) {
            warnings.push({
                row: rowNum,
                field: 'Categoría',
                message: 'Nombre de categoría muy largo (>30 caracteres)',
                severity: 'warning'
            })
        }

        // Missing SKU (could be intentional for new products)
        if (!product.sku || product.sku.trim() === '') {
            warnings.push({
                row: rowNum,
                field: 'SKU',
                message: 'SKU vacío - se creará como producto nuevo',
                severity: 'warning'
            })
        }

        // Unusually high stock (possible typo)
        if (product.stock > 10000) {
            warnings.push({
                row: rowNum,
                field: 'Stock',
                message: `Stock muy alto (${product.stock}) - verifica si es correcto`,
                severity: 'warning'
            })
        }

        // Unusually high price (possible typo)
        if (product.price > 100000) {
            warnings.push({
                row: rowNum,
                field: 'Precio',
                message: `Precio muy alto ($${product.price}) - verifica si es correcto`,
                severity: 'warning'
            })
        }
    })

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Helper to format validation message for display
 */
export function formatValidationMessage(issue: ValidationIssue): string {
    return `Fila ${issue.row} - ${issue.field}: ${issue.message}`
}
