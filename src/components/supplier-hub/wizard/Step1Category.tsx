import React, { useState, useEffect } from 'react';
import {
  Check,
  Edit2,
  Trash2,
  ArrowRight,
  FolderPlus,
  X,
  Palette,
} from 'lucide-react';
import type { Category } from '@/types';
import { getAllCategories } from '@/data';
import {
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  subscribeCategories,
} from '@/firebase';
import CategoryIcon, {
  POPULAR_CATEGORY_ICONS,
  CATEGORY_PRESET_COLORS,
} from '@/components/CategoryIcon';
import type { WizardStepProps } from './types';

export default function Step1Category({
  formData,
  setFormData,
  onNext,
}: WizardStepProps) {
  const [categoriesList, setCategoriesList] = useState<Category[]>(() => getAllCategories());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Form fields for adding/editing a category
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Shirt');
  const [catColor, setCatColor] = useState('#2874F0');
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Subscribe to real-time category updates
  useEffect(() => {
    const unsub = subscribeCategories(() => {
      setCategoriesList(getAllCategories());
    });
    const handleLocalUpdate = () => {
      setCategoriesList(getAllCategories());
    };
    window.addEventListener('akselling_categories_updated', handleLocalUpdate);
    return () => {
      unsub();
      window.removeEventListener('akselling_categories_updated', handleLocalUpdate);
    };
  }, []);

  const handleSelectCategory = (cat: Category) => {
    setFormData(prev => ({
      ...prev,
      category: cat.id,
      categoryName: cat.name,
    }));
  };

  const handleOpenAdd = () => {
    setEditingCategoryId(null);
    setCatName('');
    setCatIcon('Shirt');
    setCatColor('#2874F0');
    setErrorMsg('');
    setIsAddingNew(true);
  };

  const handleOpenEdit = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatIcon(cat.icon || 'Shirt');
    setCatColor(cat.color || '#2874F0');
    setErrorMsg('');
    setIsAddingNew(true);
  };

  const handleDeleteCategory = async (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to remove the category "${cat.name}"? Existing products will remain safe.`
      )
    ) {
      try {
        await deleteCategoryFromFirestore(cat.id);
        if (formData.category === cat.id) {
          const remaining = categoriesList.filter(c => c.id !== cat.id);
          if (remaining.length > 0) {
            setFormData(prev => ({
              ...prev,
              category: remaining[0].id,
              categoryName: remaining[0].name,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to delete category:', err);
      }
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = catName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter a category name');
      return;
    }

    setIsSavingCat(true);
    try {
      const catId = editingCategoryId || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const categoryData = {
        id: catId,
        name: cleanName,
        icon: catIcon,
        color: catColor,
      };

      await saveCategoryToFirestore(categoryData);

      // Auto select this category
      setFormData(prev => ({
        ...prev,
        category: catId,
        categoryName: cleanName,
      }));

      setIsAddingNew(false);
      setEditingCategoryId(null);
      setCatName('');
    } catch (err) {
      console.error('Error saving category:', err);
      setErrorMsg('Failed to save category. Please try again.');
    } finally {
      setIsSavingCat(false);
    }
  };

  const selectedCategory = categoriesList.find(c => c.id === formData.category) || categoriesList[0];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full mb-1">
            Step 1 of 5 • Catalog Hierarchy
          </span>
          <h2 className="text-lg font-extrabold text-gray-900">
            Category Management & Selection
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Select an existing category or dynamically create & edit custom categories with circular home icons.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-flipkart-600 hover:bg-flipkart-700 active:scale-95 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer self-start sm:self-auto"
          id="btn-add-new-category"
        >
          <FolderPlus size={16} />
          <span>+ Add Custom Category</span>
        </button>
      </div>

      {/* Add / Edit Category Expandable Panel */}
      {isAddingNew && (
        <div className="bg-white border-2 border-flipkart-400/80 rounded-2xl p-5 shadow-lg space-y-4 animate-scale-up">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: catColor }}
              >
                <CategoryIcon name={catIcon} />
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                {editingCategoryId ? 'Edit Category' : 'Create New Live Category'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSaveCategory} className="space-y-4">
            {errorMsg && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            {/* Category Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Category Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="e.g., Oversized T-Shirts, Activewear, Ethnic Wear"
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-flipkart-500 font-medium"
                required
              />
            </div>

            {/* Circular Icon Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Select Circular Icon (Home & Storefront App Bar)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-44 overflow-y-auto p-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                {POPULAR_CATEGORY_ICONS.map(item => {
                  const isSelected = catIcon === item.iconName;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCatIcon(item.iconName)}
                      className={`flex flex-col items-center p-2 rounded-xl text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-100/80 ring-2 ring-flipkart-500 scale-105'
                          : 'bg-white hover:bg-gray-100 border border-gray-200/60'
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white mb-1 shadow-xs text-base"
                        style={{ backgroundColor: isSelected ? catColor : '#64748b' }}
                      >
                        <CategoryIcon name={item.iconName} />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-700 truncate w-full leading-tight">
                        {item.iconName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Accent Color */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                <Palette size={14} className="text-gray-500" />
                <span>Category Accent Color</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCatColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                      catColor.toUpperCase() === color.toUpperCase()
                        ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="flex items-center gap-1 ml-2">
                  <input
                    type="color"
                    value={catColor}
                    onChange={e => setCatColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <span className="text-[11px] font-mono text-gray-500">{catColor}</span>
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingCat}
                className="px-5 py-2 text-xs font-bold text-white bg-flipkart-600 hover:bg-flipkart-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isSavingCat ? (
                  <span>Saving to Firestore...</span>
                ) : (
                  <>
                    <Check size={15} />
                    <span>{editingCategoryId ? 'Update Category' : 'Save & Publish Category'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-700">
            Choose Category for this Product ({categoriesList.length} Available)
          </p>
          <span className="text-[11px] text-gray-500">Click card to select</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categoriesList.map(cat => {
            const isSelected = formData.category === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
                className={`relative group p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                  isSelected
                    ? 'border-flipkart-500 bg-blue-50/50 shadow-md ring-2 ring-flipkart-400/30'
                    : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50/60'
                }`}
              >
                {/* Active Checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-flipkart-500 text-white rounded-full p-0.5 shadow-xs">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}

                {/* Circular Icon Preview */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white mb-2 shadow-xs transition-transform group-hover:scale-105"
                  style={{ backgroundColor: cat.color || '#2874F0' }}
                >
                  <CategoryIcon name={cat.icon} size={24} />
                </div>

                <p className="text-xs font-bold text-gray-900 line-clamp-1">{cat.name}</p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {cat.id}</p>

                {/* Quick Edit/Delete Actions for custom or managed categories */}
                <div className="mt-2.5 pt-2 border-t border-gray-100 w-full flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={e => handleOpenEdit(cat, e)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 size={13} />
                  </button>
                  {cat.id !== 'fashion' && cat.id !== 'mobiles' && (
                    <button
                      type="button"
                      onClick={e => handleDeleteCategory(cat, e)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Category Summary & Next Navigation */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: selectedCategory?.color || '#2874F0' }}
          >
            <CategoryIcon name={selectedCategory?.icon || 'Shirt'} size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">
              Selected Category: <span className="text-flipkart-600">{selectedCategory?.name || 'Fashion'}</span>
            </p>
            <p className="text-[11px] text-gray-500">
              Product will be filed under this category with circular home badges.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-extrabold text-white bg-flipkart-600 hover:bg-flipkart-700 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer"
          id="step1-next-btn"
        >
          <span>Next: Media Gallery</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
