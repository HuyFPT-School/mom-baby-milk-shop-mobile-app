import { categoryApi } from './api';
import type { Category, HierarchicalCategory } from '../types';

/**
 * Fetch all categories and build a hierarchical parent → children structure.
 */
export async function getHierarchicalCategories(): Promise<HierarchicalCategory[]> {
    const response = await categoryApi.getAll();
    const categories: Category[] = response.data.data ?? (response.data as unknown as Category[]);

    const roots = categories.filter((c) => !c.parentCategory);
    const children = categories.filter((c) => c.parentCategory);

    return roots.map((parent) => ({
        _id: parent._id,
        name: parent.name,
        description: parent.description,
        brands: parent.brands ?? [],
        subcategories: children
            .filter((child) => {
                const parentRef = child.parentCategory;
                if (!parentRef) return false;
                const parentId = typeof parentRef === 'object' ? parentRef._id : parentRef;
                return parentId === parent._id;
            })
            .map((child) => ({
                _id: child._id,
                name: child.name,
                description: child.description,
                brands: child.brands ?? [],
            })),
    }));
}
