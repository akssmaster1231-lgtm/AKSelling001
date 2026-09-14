import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Check,
  RotateCcw,
  Search,
  Grid,
  Layers,
  Palette,
} from 'lucide-react';
import type { Category } from '@/types';
import { getAllCategories, categories as defaultCategories } from '@/data';
import {
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  subscribeCategories,
  getDeletedCategoryIds,
} from '@/firebase';
import CategoryIcon, {
  POPULAR_CATEGORY_ICONS,
  CATEGORY_PRESET_COLORS,
} from '@/components/CategoryIcon';

interface AdminCategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCategoryManagementModal({
  isOpen,
  onClose,
}: AdminCategoryManagementModalProps) {
  const [categoriesList, setCategoriesList] = useState<Category[]>(() => getAllCategories());
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Form states
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Shirt');
  const [catColor, setCatColor] = useState('#2874F0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Real-time synchronization
  useEffect(() => {
    if (!isOpen) return;
    setCategoriesList(getAllCategories());

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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingCatId(null);
    setCatName('');
    setCatIcon('Shirt');
    setCatColor('#2874F0');
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditing(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatIcon(cat.icon || 'Shirt');
    setCatColor(cat.color || '#2874F0');
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditing(true);
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${cat.name}"? It will be removed from home category icons and product menus.`)) {
      return;
    }
    try {
      await deleteCategoryFromFirestore(cat.id);
      setCategoriesList(getAllCategories());
      setSuccessMsg(`Deleted category "${cat.name}" successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Delete category error:', err);
      setErrorMsg('Failed to delete category.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = catName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter a category name');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const catId = editingCatId || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await saveCategoryToFirestore({
        id: catId,
        name: cleanName,
        icon: catIcon,
        color: catColor,
      });

      setCategoriesList(getAllCategories());
      setIsEditing(false);
      setSuccessMsg(editingCatId ? `Category "${cleanName}" updated!` : `New category "${cleanName}" created!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Save category error:', err);
      setErrorMsg('Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset all categories back to default marketplace presets? Custom deletions and edits will be restored.')) {
      localStorage.removeItem('akselling_deleted_categories');
      localStorage.removeItem('akselling_custom_categories');
      window.dispatchEvent(new CustomEvent('akselling_categories_updated'));
      setCategoriesList(getAllCategories());
      setSuccessMsg('Restored standard default marketplace categories.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const filteredCategories = categoriesList.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-scale-up">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-flipkart-600 via-flipkart-700 to-indigo-700 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Grid size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">Admin Category Management</h2>
              <p className="text-[11px] text-blue-100">
                Manage home screen circular category icons, labels & product classification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Banners */}
        {successMsg && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
            <X size={16} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* Top Controls: Add Button, Search & Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-100">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-flipkart-500"
              />
              <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-flipkart-600 hover:bg-flipkart-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>+ Add Category</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                title="Restore default categories"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Add / Edit Form Panel */}
          {isEditing && (
            <form onSubmit={handleSave} className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-blue-900 flex items-center gap-1.5">
                  <Sparkles size={15} className="text-flipkart-600" />
                  <span>{editingCatId ? 'Edit Category' : 'Create Custom Category'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category Title *</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    placeholder="e.g., Oversized Hoodies, Gym Wear"
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-flipkart-500 focus:outline-none"
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Shown beneath the circular icon on the home feed</p>
                </div>

                {/* Live Circular Icon Preview */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: catColor + '20' }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: catColor }}
                      >
                        <CategoryIcon name={catIcon} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Home Feed Preview</span>
                    <span className="text-xs font-bold text-gray-900 line-clamp-1">{catName || 'Category Name'}</span>
                    <span className="text-[10px] text-gray-500 font-mono block">Icon: {catIcon}</span>
                  </div>
                </div>
              </div>

              {/* Circular Color Palette */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Palette size={13} className="text-gray-500" />
                  <span>Circular Icon Accent Color</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {CATEGORY_PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCatColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        catColor.toLowerCase() === color.toLowerCase()
                          ? 'scale-115 ring-2 ring-offset-2 ring-gray-800'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {catColor.toLowerCase() === color.toLowerCase() && (
                        <Check size={13} className="text-white" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={catColor}
                    onChange={e => setCatColor(e.target.value)}
                    className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
                    title="Custom hex color"
                  />
                </div>
              </div>

              {/* Icon Selector Grid */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Icon Symbol</label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1.5 bg-white rounded-xl border border-gray-200">
                  {POPULAR_CATEGORY_ICONS.map(iconName => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setCatIcon(iconName)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                        catIcon === iconName
                          ? 'bg-flipkart-500 text-white shadow-xs font-bold'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <CategoryIcon name={iconName} />
                      <span className="text-[9px] mt-1 truncate max-w-[42px]">{iconName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save / Cancel buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-flipkart-600 hover:bg-flipkart-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{editingCatId ? 'Save Changes' : 'Create Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Current Active Categories Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 px-1">
              <span>Active Marketplace Categories ({filteredCategories.length})</span>
              <span className="text-[11px] font-normal text-gray-500">Instant real-time sync with Homepage</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredCategories.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.color + '18' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{cat.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono truncate">ID: {cat.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-flipkart-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCategories.length === 0 && (
              <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <Grid size={28} className="mx-auto text-gray-400 mb-1.5" />
                <p className="text-xs font-bold text-gray-600">No categories matching "{searchQuery}"</p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="mt-2 text-xs font-bold text-flipkart-600 hover:underline"
                >
                  Create "{searchQuery}" as a new category
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-gray-500 text-[11px]">
            ⚡ Changes reflect immediately across Buyer App & Seller Hub
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
