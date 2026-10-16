import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Truck, 
  X, 
  Save,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Send,
  AlertCircle
} from 'lucide-react';
import { ordersAPI } from '../../services/api';

const ALL_STATUSES = [
  'Order Placed',
  'Payment Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

const AdminOrders = () => {
  const [searchParams] = useSearchParams();
  const urlOrderParam = searchParams.get('order') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState(urlOrderParam);

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalPaymentStatus, setModalPaymentStatus] = useState('');
  const [modalTrackingId, setModalTrackingId] = useState('');
  const [modalCourierName, setModalCourierName] = useState('India Post (Speed Post)');
  const [modalTrackingUrl, setModalTrackingUrl] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100
      };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await ordersAPI.getAllOrdersAdmin(params);
      if (res.success) {
        setOrders(res.orders || []);

        // If URL requested a specific order, auto-open modal
        if (urlOrderParam) {
          const match = res.orders?.find((o) => o.order_number === urlOrderParam);
          if (match) openOrderDetails(match.order_number);
        }
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetails = async (orderIdOrNumber) => {
    try {
      const res = await ordersAPI.getOrderDetails(orderIdOrNumber);
      if (res.success && res.order) {
        setSelectedOrder(res.order);
        setModalStatus(res.order.order_status);
        setModalNotes(res.order.notes || '');
        setModalPaymentStatus(res.order.payment_status);
        setModalTrackingId(res.order.tracking_id || '');
        setModalCourierName(res.order.courier_name || 'India Post (Speed Post)');
        setModalTrackingUrl(res.order.tracking_url || 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx');
      }
    } catch (e) {
      alert('Could not fetch order details');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      setUpdating(true);
      const res = await ordersAPI.updateOrderStatusAdmin(selectedOrder.id, {
        status: modalStatus,
        notes: modalNotes,
        paymentStatus: modalPaymentStatus,
        tracking_id: modalTrackingId,
        courier_name: modalCourierName,
        tracking_url: modalTrackingUrl
      });

      if (res.success && res.order) {
        alert(res.message);
        setSelectedOrder({
          ...selectedOrder,
          order_status: modalStatus,
          notes: modalNotes,
          payment_status: modalPaymentStatus,
          tracking_id: modalTrackingId,
          courier_name: modalCourierName,
          tracking_url: modalTrackingUrl
        });
        loadOrders();
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const term = searchTerm.toLowerCase();
    return (
      ord.order_number.toLowerCase().includes(term) ||
      (ord.customer_name && ord.customer_name.toLowerCase().includes(term)) ||
      (ord.customer_phone && ord.customer_phone.includes(term)) ||
      (ord.tracking_id && ord.tracking_id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Order & Delivery Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Allocate India Post tracking numbers, track delivery destinations, and advance fulfillment statuses
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by order #, tracking ID, customer, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['all', 'Order Placed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-forest text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {st === 'all' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="font-bold text-gray-800 text-sm">No orders found</h3>
            <p className="text-xs text-gray-400">
              {statusFilter !== 'all' ? `No orders currently in "${statusFilter}" status.` : 'No customer orders have been received yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Order # & Tracking</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Items</th>
                  <th className="py-3.5 px-4 font-semibold">Total</th>
                  <th className="py-3.5 px-4 font-semibold">Payment</th>
                  <th className="py-3.5 px-4 font-semibold">Fulfillment Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold font-mono text-gray-900 block text-xs">
                        #{ord.order_number}
                      </span>
                      {ord.tracking_id ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded font-mono border border-amber-200">
                            <span>🇮🇳 {ord.tracking_id}</span>
                          </span>
                        </div>
                      ) : ['Shipped', 'Out for Delivery'].includes(ord.order_status) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          <span>Allocate India Post ID</span>
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900">{ord.customer_name || 'Guest Customer'}</p>
                      <p className="text-[11px] text-gray-400">{ord.customer_phone || ord.customer_email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(ord.created_at).toLocaleDateString('en-IN', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-600">
                      {ord.item_count || 1} items
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-gray-900 text-sm">
                      ₹{ord.total_amount}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ord.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        ord.order_status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.order_status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : ord.order_status === 'Shipped' || ord.order_status === 'Out for Delivery'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.order_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openOrderDetails(ord.order_number)}
                        className="px-3 py-1.5 bg-forest/10 hover:bg-forest hover:text-white text-forest text-xs font-bold rounded-lg transition-all"
                      >
                        Manage & Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORDER DETAILS & DELIVERY STATUS UPDATE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-forest">Order Fulfillment & Delivery Console</span>
                <h3 className="font-extrabold text-lg text-gray-900 font-mono">
                  #{selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              
              {/* Delivery Address & Customer Phone */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                <span className="font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-forest" />
                  Delivery Destination & Customer Info
                </span>
                {selectedOrder.delivery_address && (
                  <div className="text-gray-600 space-y-0.5 leading-relaxed">
                    <p className="font-bold text-gray-900 text-sm">{selectedOrder.delivery_address.name}</p>
                    <p className="flex items-center gap-1 text-forest font-bold">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedOrder.delivery_address.phone}
                    </p>
                    <p>
                      {selectedOrder.delivery_address.house_building}, {selectedOrder.delivery_address.street}
                    </p>
                    <p>
                      {selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.district}, {selectedOrder.delivery_address.state} - <strong>{selectedOrder.delivery_address.pincode}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider">Ordered Products</h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl p-3 bg-white">
                  {selectedOrder.items?.map((it) => (
                    <div key={it.id} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{it.product_name}</p>
                        <p className="text-[11px] text-gray-400">
                          {it.variant_size ? `Size: ${it.variant_size} • ` : ''}Qty: {it.quantity} × ₹{it.price}
                        </p>
                      </div>
                      <span className="font-extrabold text-gray-900 text-sm">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* INDIA POST DELIVERY & TRACKING CONSIGNMENT ALLOCATION */}
              <div className="bg-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇮🇳</span>
                    <div>
                      <h4 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider">
                        India Post Consignment & Tracking Allocation
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        Allocate the official India Post Article / Consignment ID. The customer will be able to track their parcel in real-time.
                      </p>
                    </div>
                  </div>
                  {modalTrackingId && (
                    <a
                      href={modalTrackingUrl || "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs"
                      title="Open official India Post tracking portal"
                    >
                      <span>India Post Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      Courier / Service Provider:
                    </label>
                    <select
                      value={modalCourierName}
                      onChange={(e) => setModalCourierName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-white font-semibold text-gray-900"
                    >
                      <option value="India Post (Speed Post)">India Post (Speed Post)</option>
                      <option value="India Post (Registered Parcel)">India Post (Registered Parcel)</option>
                      <option value="India Post (Business Parcel)">India Post (Business Parcel)</option>
                      <option value="India Post (Standard)">India Post (Standard)</option>
                      <option value="Other Courier">Other Courier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      India Post Consignment Number (Tracking ID):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. EN123456789IN or CP987654321IN"
                        value={modalTrackingId}
                        onChange={(e) => setModalTrackingId(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white font-mono font-bold text-gray-900 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      {modalTrackingId && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(modalTrackingId);
                            setCopiedTracking(true);
                            setTimeout(() => setCopiedTracking(false), 2000);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-amber-700 hover:text-amber-900"
                          title="Copy Consignment ID"
                        >
                          {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-amber-700 mt-1">
                      13-digit alphanumeric consignment number provided at the post office counter.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Update Dropdown */}
              <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 space-y-4">
                <h4 className="font-bold text-forest text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  Update Order & Delivery Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Fulfillment Status:
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold text-gray-900"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Payment Status:
                    </label>
                    <select
                      value={modalPaymentStatus}
                      onChange={(e) => setModalPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold text-gray-900"
                    >
                      <option value="paid">Paid (Razorpay)</option>
                      <option value="pending">Payment Pending</option>
                      <option value="failed">Failed / Refunded</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Delivery Note / Message to Customer:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Dispatched via India Post Speed Post. Delivery expected within 3-4 working days."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="px-6 py-2 text-xs font-bold bg-forest hover:bg-forest-light text-white rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{updating ? 'Updating...' : 'Save & Allocate Tracking ID'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
