import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Upload, 
  Check, 
  Image as ImageIcon,
  Layers,
  AlertCircle,
  Eye,
  EyeOff,
  Star,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { productsAPI, categoriesAPI } from '../../services/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Quick Inline Price Editing State
  const [quickEditId, setQuickEditId] = useState(null);
  const [quickPrice, setQuickPrice] = useState('');
  const [quickDiscount, setQuickDiscount] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    sku: '',
    price: '',
    discount_price: '',
    stock: '',
    material: '',
    weight: '',
    featured: false,
    status: 'active'
  });

  // Dynamic Unlimited Variants state
  const [variants, setVariants] = useState([]);

  // Image Upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productsAPI.getProducts({ all: 'true', limit: 100 }),
        categoriesAPI.getCategories({ all: 'true' })
      ]);

      if (prodRes.success) setProducts(prodRes.products || []);
      if (catRes.success) setCategories(catRes.categories || []);
    } catch (err) {
      console.error('Failed to load products/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick Inline Price Adjuster
  const handleStartQuickPrice = (product) => {
    setQuickEditId(product.id);
    setQuickPrice(product.price || '0');
    setQuickDiscount(product.discount_price || '');
  };

  const handleCancelQuickPrice = () => {
    setQuickEditId(null);
  };

  const handleStepPrice = (delta, isDiscount = false) => {
    if (isDiscount) {
      const cur = parseFloat(quickDiscount || quickPrice || '0') || 0;
      setQuickDiscount(Math.max(0, cur + delta).toString());
    } else {
      const cur = parseFloat(quickPrice || '0') || 0;
      setQuickPrice(Math.max(0, cur + delta).toString());
    }
  };

  const handleSaveQuickPrice = async (productId) => {
    try {
      setQuickSaving(true);
      const res = await productsAPI.quickUpdateProduct(productId, {
        price: parseFloat(quickPrice) || 0,
        discount_price: quickDiscount === '' ? null : (parseFloat(quickDiscount) || 0)
      });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, price: parseFloat(quickPrice) || 0, discount_price: quickDiscount === '' ? null : (parseFloat(quickDiscount) || 0) }
              : p
          )
        );
        setQuickEditId(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to update price.');
    } finally {
      setQuickSaving(false);
    }
  };

  // Quick Toggle Publish Status
  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === 'active' ? 'draft' : 'active';
    try {
      setTogglingStatusId(product.id);
      const res = await productsAPI.quickUpdateProduct(product.id, {
        status: nextStatus
      });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to update publish status.');
    } finally {
      setTogglingStatusId(null);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      description: '',
      sku: `VE-${Date.now().toString().slice(-6)}`,
      price: '',
      discount_price: '',
      stock: '100',
      material: '100% Biodegradable Eco Paper',
      weight: 'Standard',
      featured: false,
      status: 'active'
    });
    setVariants([]);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setExistingImages([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id || '',
      description: product.description || '',
      sku: product.sku || '',
      price: product.price || '',
      discount_price: product.discount_price || '',
      stock: product.stock || '',
      material: product.material || '',
      weight: product.weight || '',
      featured: !!product.featured,
      status: product.status || 'active'
    });

    setVariants(
      product.variants && product.variants.length > 0
        ? product.variants.map((v) => ({
            id: v.id,
            size: v.size,
            price: v.price,
            stock: v.stock,
            sku: v.sku || '',
            weight: v.weight || ''
          }))
        : []
    );

    setSelectedFiles([]);
    setPreviewUrls([]);
    setExistingImages(product.images || []);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      { size: '', price: formData.discount_price || formData.price || '', stock: '25', sku: '', weight: '' }
    ]);
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this product photo?')) return;
    try {
      await productsAPI.deleteImage(imageId);
      setExistingImages(existingImages.filter((img) => img.id !== imageId));
      loadData();
    } catch (err) {
      alert(err.message || 'Could not delete image.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Product name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('name', formData.name);
      data.append('category_id', formData.category_id);
      data.append('description', formData.description);
      data.append('sku', formData.sku);
      data.append('price', formData.price);
      data.append('discount_price', formData.discount_price || '');
      data.append('stock', formData.stock);
      data.append('material', formData.material);
      data.append('weight', formData.weight);
      data.append('featured', formData.featured);
      data.append('status', formData.status);
      data.append('variants', JSON.stringify(variants));

      // Append multiple images
      selectedFiles.forEach((file) => {
        data.append('images', file);
      });

      if (editingProduct) {
        await productsAPI.updateProduct(editingProduct.id, data);
      } else {
        await productsAPI.createProduct(data);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}"? If it has past customer orders, it will be safely deactivated/archived.`)) {
      return;
    }

    try {
      const res = await productsAPI.deleteProduct(id);
      alert(res.message || 'Product removed.');
      loadData();
    } catch (err) {
      alert(err.message || 'Could not delete product.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.category_name && p.category_name.toLowerCase().includes(term))
    );
  });

  // Calculate live preview in modal
  const modalBasePrice = parseFloat(formData.price) || 0;
  const modalDiscountPrice = parseFloat(formData.discount_price) || 0;
  const modalFinalPrice = modalDiscountPrice > 0 ? modalDiscountPrice : modalBasePrice;
  const modalSavings = modalDiscountPrice > 0 && modalBasePrice > modalDiscountPrice ? modalBasePrice - modalDiscountPrice : 0;
  const modalPercentOff = modalSavings > 0 && modalBasePrice > 0 ? Math.round((modalSavings / modalBasePrice) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Product & Pricing Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Exclusive Admin Control: Upload products, adjust live selling prices up/down, and toggle published status
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-forest hover:bg-forest-light text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload & Publish Product</span>
        </button>
      </div>

      {/* Admin Price Authority Notice */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-forest shrink-0" />
        <div className="text-xs text-forest-dark">
          <strong>Admin-Exclusive Pricing Authority:</strong> Only you (the administrator) can set, increase, or reduce product prices. Any price you set here is locked and published directly to all customers across the website.
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs font-semibold text-gray-500">
          Total Products in Catalog: <strong className="text-gray-900">{products.length}</strong>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Layers className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-800 text-base">
              {searchTerm ? 'No matching products' : 'Catalog is Currently Empty'}
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {searchTerm
                ? 'No products matched your search term.'
                : 'Upload your first eco-friendly product to publish it to the VELLANKI ENTERPRISES storefront.'}
            </p>
            {!searchTerm && (
              <button
                onClick={openAddModal}
                className="mt-2 px-5 py-2.5 bg-forest text-white text-xs font-bold rounded-xl shadow"
              >
                + Upload First Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Image</th>
                  <th className="py-3.5 px-4 font-semibold">Product Name & SKU</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Live Selling Price (Admin Control)</th>
                  <th className="py-3.5 px-4 font-semibold">Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Sizes / Variants</th>
                  <th className="py-3.5 px-4 font-semibold">Publish Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isQuickEditing = quickEditId === p.id;
                  const hasDiscount = p.discount_price && Number(p.discount_price) > 0;
                  const effectivePrice = hasDiscount ? p.discount_price : p.price;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-sm">{p.name}</span>
                          {p.featured === 1 && (
                            <span title="Featured Product"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /></span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-gray-400 block">SKU: {p.sku}</span>
                      </td>

                      <td className="py-3 px-4 font-medium text-gray-600">
                        {p.category_name || <span className="text-gray-400 italic">Uncategorized</span>}
                      </td>

                      {/* Live Selling Price Cell with Quick Price Editor */}
                      <td className="py-3 px-4">
                        {isQuickEditing ? (
                          <div className="bg-white p-2.5 rounded-xl border-2 border-forest shadow-md space-y-2 min-w-[220px]">
                            <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                              <span>Adjust Price (₹)</span>
                              <button
                                type="button"
                                onClick={handleCancelQuickPrice}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              <div>
                                <span className="text-[10px] text-gray-500 block">Selling / Discount Price:</span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="1"
                                    value={quickDiscount}
                                    placeholder={quickPrice}
                                    onChange={(e) => setQuickDiscount(e.target.value)}
                                    className="w-20 px-2 py-1 text-xs border border-gray-200 rounded font-bold text-forest focus:outline-none focus:border-forest"
                                  />
                                  <div className="flex gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleStepPrice(10, true)}
                                      className="px-1.5 py-1 bg-gray-100 hover:bg-gray-200 text-[10px] font-bold rounded"
                                      title="Increase price by ₹10"
                                    >
                                      +10
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStepPrice(-10, true)}
                                      className="px-1.5 py-1 bg-gray-100 hover:bg-gray-200 text-[10px] font-bold rounded"
                                      title="Reduce price by ₹10"
                                    >
                                      -10
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStepPrice(50, true)}
                                      className="px-1.5 py-1 bg-gray-100 hover:bg-gray-200 text-[10px] font-bold rounded"
                                      title="Increase price by ₹50"
                                    >
                                      +50
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] text-gray-500 block">Base Regular MRP (₹):</span>
                                <input
                                  type="number"
                                  step="1"
                                  value={quickPrice}
                                  onChange={(e) => setQuickPrice(e.target.value)}
                                  className="w-24 px-2 py-1 text-xs border border-gray-200 rounded font-semibold text-gray-700"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={handleCancelQuickPrice}
                                className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={quickSaving}
                                onClick={() => handleSaveQuickPrice(p.id)}
                                className="px-3 py-1 bg-forest hover:bg-forest-light text-white font-bold text-[11px] rounded shadow-xs disabled:opacity-50"
                              >
                                {quickSaving ? 'Saving...' : 'Save Price'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group relative">
                            <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                              <span>₹{effectivePrice}</span>
                              {hasDiscount && Number(p.price) > Number(p.discount_price) && (
                                <span className="text-[10px] text-gray-400 line-through">₹{p.price}</span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleStartQuickPrice(p)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-forest hover:bg-emerald-50 rounded transition-opacity"
                                title="Quick change or increase/reduce price"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                            {p.variants && p.variants.length > 0 && (
                              <span className="text-[10px] text-emerald-600 block">
                                {p.variants.length} {p.variants.length === 1 ? 'size' : 'sizes'} (from ₹{Math.min(...p.variants.map((v) => Number(v.price)))})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          p.stock <= 0
                            ? 'bg-red-100 text-red-700'
                            : p.stock <= 10
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.stock} units
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-500 font-medium">
                        {p.variants?.length > 0 ? (
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] text-gray-700 font-semibold">
                            {p.variants.length} sizes ({p.variants.map((v) => v.size).join(', ')})
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Single size</span>
                        )}
                      </td>

                      {/* Quick Publish / Unpublish Toggle */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          disabled={togglingStatusId === p.id}
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            p.status === 'active'
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
                          }`}
                          title={`Click to ${p.status === 'active' ? 'Unpublish (Hide from customer web page)' : 'Publish (Make live on store)'}`}
                        >
                          {p.status === 'active' ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-700" />
                              <span>Live (Published)</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-gray-500" />
                              <span>Draft (Hidden)</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-gray-500 hover:text-forest hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Full Product Editor"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete / Archive Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-forest">
                  {editingProduct ? 'Edit Catalog Product' : 'Upload & Publish Product'}
                </span>
                <h3 className="font-extrabold text-lg text-gray-900">
                  {editingProduct ? editingProduct.name : 'New Eco-Friendly Tableware Product'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10 inch Round Biodegradable Paper Plates (Pack of 50)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Product SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest font-mono"
                  />
                </div>

                {/* PRICING SECTION - ADMIN CONTROL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Regular MRP Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 500.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                  />
                  <span className="text-[10px] text-gray-400">Regular printed catalogue price</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Discounted Selling Price (₹ Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 399.00"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-emerald-300 rounded-xl focus:outline-none focus:border-forest font-bold text-forest bg-emerald-50/30"
                  />
                  <span className="text-[10px] text-emerald-700 font-medium">Exact price customer pays on checkout</span>
                </div>

                {/* LIVE PRICE PREVIEW BOX */}
                <div className="sm:col-span-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-600 block">Customer Storefront Price:</span>
                    <strong className="text-base font-black text-forest">₹{modalFinalPrice || 0}</strong>
                    {modalSavings > 0 && (
                      <span className="ml-2 text-xs text-gray-500 line-through">₹{modalBasePrice}</span>
                    )}
                  </div>
                  {modalSavings > 0 && (
                    <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs">
                      {modalPercentOff}% OFF (Save ₹{modalSavings})
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Material</label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Eco-Friendly Plant Fiber"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  placeholder="Detail the eco benefits, build quality, and best use cases..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              {/* DYNAMIC VARIANTS BUILDER */}
              <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Product Sizes & Dynamic Variant Prices
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Add different sizes (e.g. 6 inch, 8 inch, 10 inch, 12 inch, 250ml) with admin-controlled pricing and stock.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 bg-forest text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Size Variant</span>
                  </button>
                </div>

                {variants.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No variants added. This product will be sold as a single default size.</p>
                ) : (
                  <div className="space-y-2.5">
                    {variants.map((v, idx) => (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200 text-xs">
                        <input
                          type="text"
                          required
                          placeholder="Size (e.g. 6 inch)"
                          value={v.size}
                          onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-lg flex-1"
                        />
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Price ₹"
                          value={v.price}
                          onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                          className="w-24 px-2.5 py-1.5 border border-gray-200 rounded-lg font-bold text-forest"
                        />
                        <input
                          type="number"
                          required
                          placeholder="Stock"
                          value={v.stock}
                          onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                          className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Remove variant"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* IMAGE UPLOADS */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-700">Product Images</label>
                
                {/* Existing uploaded images */}
                {existingImages.length > 0 && (
                  <div className="flex flex-wrap gap-3 pb-2">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative w-16 h-16 rounded-xl border overflow-hidden group">
                        <img src={img.image_url} alt="Uploaded" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-gray-700">Select images from your device</p>
                  <p className="text-[10px] text-gray-400">JPEG, PNG, WEBP (Max 5MB each)</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-2 text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-forest"
                  />
                </div>

                {previewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {previewUrls.map((url, i) => (
                      <img key={i} src={url} alt="Preview" className="w-14 h-14 object-cover rounded-lg border" />
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-forest rounded"
                  />
                  <span>Mark as Featured Product (Highlights on Home Page)</span>
                </label>

                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 ml-auto">
                  <span>Status:</span>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
                  >
                    <option value="active">Active (Published to Store)</option>
                    <option value="draft">Draft (Hidden from Store)</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold bg-forest hover:bg-forest-light text-white rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Publish Product to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
