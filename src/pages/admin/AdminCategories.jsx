// ==========================================================================
// Admin Categories Page - Connected to Real API
// ==========================================================================

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  X,
  GripVertical,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { AdminLayout, ImageUpload } from '@components/admin';
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AdminCategories.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';
const API_URL = `${API_BASE}/api`; 

const AdminCategories = () => {
  const { getAuthHeaders } = useAuthStore();
  
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    images: [],
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/admin/categories`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      setCategories(data.categories || []);
      setFilteredCategories(data.categories || []);
    } catch (err) {
      console.error('Fetch categories error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search
  useEffect(() => {
    let result = categories;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (cat) =>
          cat.name.toLowerCase().includes(query) ||
          cat.slug.toLowerCase().includes(query)
      );
    }

    setFilteredCategories(result);
  }, [categories, searchQuery]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleOpenModal = (category = null) => {
    setFormError(null);
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        images: category.image ? [{ url: category.image, path: null }] : [],
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        images: [],
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name),
    }));
  };

  const handleImagesChange = (images) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image: formData.images[0]?.url || null,
        is_active: formData.is_active,
      };

      if (editingCategory) {
        payload.id = editingCategory.id;
      }

      const response = await fetch(`${API_URL}/admin/categories`, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category');
      }

      // Refresh categories list
      await fetchCategories();
      handleCloseModal();
    } catch (err) {
      console.error('Save category error:', err);
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);

    if (category.product_count > 0) {
      alert(
        `Cannot delete "${category.name}" - it has ${category.product_count} products. Please move or delete the products first.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/categories?id=${categoryId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }

      // Refresh categories list
      await fetchCategories();
    } catch (err) {
      console.error('Delete category error:', err);
      alert(err.message);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const response = await fetch(`${API_URL}/admin/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id: category.id,
          is_active: !category.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update category');
      }

      // Update local state
      setCategories(
        categories.map((c) =>
          c.id === category.id ? { ...c, is_active: !c.is_active } : c
        )
      );
    } catch (err) {
      console.error('Toggle active error:', err);
      alert(err.message);
    }
  };

  return (
    <AdminLayout title="Categories" isLoading={isLoading}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Categories</h1>
            <p className={styles.subtitle}>{categories.length} total categories</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.primaryBtn} onClick={() => handleOpenModal()}>
              <Plus size={18} strokeWidth={1.5} />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={18} strokeWidth={1.5} />
            <span>{error}</span>
            <button onClick={fetchCategories}>Retry</button>
          </div>
        )}

        {/* Search */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search size={18} strokeWidth={1.5} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Categories List */}
        <div className={styles.categoriesList}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.categoryCardSkeleton}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle} />
                  <div className={styles.skeletonText} />
                </div>
              </div>
            ))
          ) : filteredCategories.length === 0 ? (
            <div className={styles.empty}>
              <FolderOpen size={48} strokeWidth={1} />
              <p>{searchQuery ? 'No categories found' : 'No categories yet'}</p>
              {!searchQuery && (
                <button
                  className={styles.emptyBtn}
                  onClick={() => handleOpenModal()}
                >
                  Create your first category
                </button>
              )}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={category.id}
                className={`${styles.categoryCard} ${!category.is_active ? styles.inactive : ''}`}
              >
                <div className={styles.dragHandle}>
                  <GripVertical size={20} strokeWidth={1.5} />
                </div>

                <div className={styles.categoryImage}>
                  {category.image ? (
                    <img src={category.image} alt={category.name} />
                  ) : (
                    <div className={styles.noImage}>
                      <ImageIcon size={24} strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <div className={styles.categoryInfo}>
                  <div className={styles.categoryHeader}>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                    {!category.is_active && (
                      <span className={styles.inactiveBadge}>Inactive</span>
                    )}
                  </div>
                  <p className={styles.categorySlug}>/{category.slug}</p>
                  {category.description && (
                    <p className={styles.categoryDescription}>
                      {category.description}
                    </p>
                  )}
                  <span className={styles.productCount}>
                    {category.product_count} product{category.product_count !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className={styles.categoryActions}>
                  <button
                    className={styles.toggleBtn}
                    onClick={() => handleToggleActive(category)}
                  >
                    {category.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleOpenModal(category)}
                  >
                    <Edit2 size={16} strokeWidth={1.5} />
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(category.id)}
                    disabled={category.product_count > 0}
                    title={
                      category.product_count > 0
                        ? 'Cannot delete category with products'
                        : 'Delete category'
                    }
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Category Modal */}
        {showModal && (
          <>
            <div className={styles.modalBackdrop} onClick={handleCloseModal} />
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
                <button className={styles.modalClose} onClick={handleCloseModal}>
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.modalBody}>
                {/* Form Error */}
                {formError && (
                  <div className={styles.formError}>
                    <AlertCircle size={16} strokeWidth={1.5} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Image Upload */}
                <ImageUpload
                  images={formData.images}
                  onChange={handleImagesChange}
                  maxImages={1}
                  folder="categories"
                  label="Category Image"
                  helpText="Upload a category image. JPG, PNG, WebP or GIF. Max 5MB."
                />

                {/* Name */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    className={styles.formInput}
                    placeholder="e.g., Bundles"
                    required
                  />
                </div>

                {/* Slug */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    placeholder="e.g., bundles"
                    required
                  />
                  <p className={styles.formHint}>
                    URL: /shop/{formData.slug || 'category-slug'}
                  </p>
                </div>

                {/* Description */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={styles.formTextarea}
                    placeholder="Brief description of this category..."
                    rows={3}
                  />
                </div>

                {/* Active Status */}
                <div className={styles.formGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <span className={styles.checkboxMark} />
                    <span>Active (visible in store)</span>
                  </label>
                </div>

                {/* Actions */}
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={handleCloseModal}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? 'Saving...'
                      : editingCategory
                      ? 'Save Changes'
                      : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;